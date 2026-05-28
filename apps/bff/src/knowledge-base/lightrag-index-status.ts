/**
 * LightRAG Index Status Tracking
 *
 * Persistent SQLite-backed queue for tracking file indexing state.
 * LightRAG Python is single-process, so concurrency is capped at 1.
 */

import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { getKbBasePath } from "./paths.js";
import { logger } from "../utils/logger.js";

export type IndexStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export interface IndexJob {
  id: number;
  docId: string;
  filePath: string;
  status: IndexStatus;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  totalChunks?: number;
  processedChunks?: number;
  note?: string | null;
}

// Lazy-loaded sqlite module (same pattern as vector-store.ts)
let sqliteModule: typeof import("node:sqlite") | null = null;
try {
  sqliteModule = await import("node:sqlite");
} catch {
  sqliteModule = null;
}

function getStatusDbPath(): string {
  const kbBase = getKbBasePath();
  const dbDir = dirname(kbBase);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "lightrag-index-status.db");
}

function migrateDb(database: import("node:sqlite").DatabaseSync): void {
  try {
    const cols = database.prepare(`PRAGMA table_info(kb_index_jobs)`).all() as any[];
    const colNames = cols.map((c) => c.name);
    if (!colNames.includes("total_chunks")) {
      database.exec(`ALTER TABLE kb_index_jobs ADD COLUMN total_chunks INTEGER DEFAULT 0`);
      logger.info("[LightRAGIndexStatus] Migrated: added total_chunks column");
    }
    if (!colNames.includes("processed_chunks")) {
      database.exec(`ALTER TABLE kb_index_jobs ADD COLUMN processed_chunks INTEGER DEFAULT 0`);
      logger.info("[LightRAGIndexStatus] Migrated: added processed_chunks column");
    }
    if (!colNames.includes("note")) {
      database.exec(`ALTER TABLE kb_index_jobs ADD COLUMN note TEXT`);
      logger.info("[LightRAGIndexStatus] Migrated: added note column");
    }

    const organizeCols = database.prepare(`PRAGMA table_info(kb_organize_status)`).all() as any[];
    const organizeColNames = organizeCols.map((c) => c.name);
    if (organizeCols.length > 0 && !organizeColNames.includes("error_message")) {
      database.exec(`ALTER TABLE kb_organize_status ADD COLUMN error_message TEXT`);
      logger.info("[LightRAGIndexStatus] Migrated: added organize error_message column");
    }
    if (organizeCols.length > 0 && !organizeColNames.includes("progress")) {
      database.exec(`ALTER TABLE kb_organize_status ADD COLUMN progress INTEGER DEFAULT 0`);
      logger.info("[LightRAGIndexStatus] Migrated: added organize progress column");
    }
  } catch (err) {
    logger.warn("[LightRAGIndexStatus] Migration failed:", err);
  }
}

function getDb(): import("node:sqlite").DatabaseSync | null {
  if (!sqliteModule) {
    logger.warn("[LightRAGIndexStatus] node:sqlite not available, using in-memory fallback");
    return null;
  }
  try {
    const db = new sqliteModule.DatabaseSync(getStatusDbPath());
    db.exec(`
      CREATE TABLE IF NOT EXISTS kb_index_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        total_chunks INTEGER DEFAULT 0,
        processed_chunks INTEGER DEFAULT 0,
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_doc_id ON kb_index_jobs(doc_id);
      CREATE INDEX IF NOT EXISTS idx_status ON kb_index_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_updated_at ON kb_index_jobs(updated_at);
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS kb_organize_status (
        raw_path TEXT PRIMARY KEY,
        wiki_paths TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        error_message TEXT,
        progress INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_organize_raw_path ON kb_organize_status(raw_path);
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS kb_graph_extraction_status (
        file_path TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'pending',
        node_count INTEGER DEFAULT 0,
        edge_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_graph_extraction_status ON kb_graph_extraction_status(status);
      CREATE INDEX IF NOT EXISTS idx_graph_extraction_updated_at ON kb_graph_extraction_status(updated_at);
    `);
    migrateDb(db);
    return db;
  } catch (err) {
    logger.error("[LightRAGIndexStatus] Failed to open SQLite DB:", err);
    return null;
  }
}

let dbInstance: import("node:sqlite").DatabaseSync | null = null;

export function closeDb(): void {
  if (dbInstance) {
    try {
      dbInstance.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      dbInstance.close();
      logger.info("[LightRAGIndexStatus] Database closed");
      dbInstance = null;
    } catch (err) {
      logger.error("[LightRAGIndexStatus] Failed to close database:", err);
    }
  }
}

function db(): import("node:sqlite").DatabaseSync | null {
  if (!dbInstance) {
    dbInstance = getDb();
  }
  return dbInstance;
}

// In-memory fallback for when SQLite is unavailable
const memoryJobs = new Map<string, IndexJob>();

export function createIndexJob(docId: string, filePath: string): IndexJob {
  const now = Date.now();
  const job: IndexJob = {
    id: 0,
    docId,
    filePath,
    status: "pending",
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    totalChunks: 0,
    processedChunks: 0,
    note: null,
  };

  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO kb_index_jobs (doc_id, file_path, status, created_at, updated_at, total_chunks, processed_chunks, note)
        VALUES (?, ?, ?, ?, ?, 0, 0, NULL)
        ON CONFLICT(doc_id) DO UPDATE SET
          status = excluded.status,
          error_message = NULL,
          updated_at = excluded.updated_at,
          retry_count = 0,
          total_chunks = 0,
          processed_chunks = 0,
          note = NULL
      `);
      stmt.run(docId, filePath, "pending", now, now);

      const row = database.prepare(`SELECT * FROM kb_index_jobs WHERE doc_id = ?`).get(docId) as any;
      if (row) {
        job.id = row.id;
        job.status = row.status;
        job.errorMessage = row.error_message;
        job.createdAt = row.created_at;
        job.updatedAt = row.updated_at;
        job.retryCount = row.retry_count;
        job.totalChunks = row.total_chunks ?? 0;
        job.processedChunks = row.processed_chunks ?? 0;
        job.note = row.note ?? null;
      }
      logger.info(`[LightRAGIndexStatus] Created/reset job for ${docId}`);
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB insert failed:", err);
      memoryJobs.set(docId, job);
    }
  } else {
    // Upsert in memory
    const existing = memoryJobs.get(docId);
    if (existing) {
      existing.status = "pending";
      existing.errorMessage = null;
      existing.updatedAt = now;
      existing.retryCount = 0;
      existing.totalChunks = 0;
      existing.processedChunks = 0;
      existing.note = null;
      return existing;
    }
    memoryJobs.set(docId, job);
  }
  return job;
}

export function updateJobStatus(
  docId: string,
  status: IndexStatus,
  errorMessage?: string,
  note?: string
): void {
  const now = Date.now();
  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        UPDATE kb_index_jobs
        SET status = ?, error_message = ?, updated_at = ?,
            retry_count = CASE WHEN ? = 'failed' THEN retry_count + 1 ELSE retry_count END,
            note = COALESCE(?, note)
        WHERE doc_id = ?
      `);
      stmt.run(status, errorMessage || null, now, status, note ?? null, docId);
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB update failed:", err);
    }
  }
  const mem = memoryJobs.get(docId);
  if (mem) {
    mem.status = status;
    mem.errorMessage = errorMessage || null;
    mem.updatedAt = now;
    if (note !== undefined) mem.note = note || null;
    if (status === "failed") mem.retryCount++;
  }
}

export function updateJobProgress(
  docId: string,
  totalChunks: number,
  processedChunks: number
): void {
  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        UPDATE kb_index_jobs
        SET total_chunks = ?, processed_chunks = ?, updated_at = ?
        WHERE doc_id = ?
      `);
      stmt.run(totalChunks, processedChunks, Date.now(), docId);
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB progress update failed:", err);
    }
  }
  const mem = memoryJobs.get(docId);
  if (mem) {
    mem.totalChunks = totalChunks;
    mem.processedChunks = processedChunks;
  }
}

export function getJobStatus(docId: string): IndexJob | null {
  const database = db();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM kb_index_jobs WHERE doc_id = ?`).get(docId) as any;
      if (row) {
        return {
          id: row.id,
          docId: row.doc_id,
          filePath: row.file_path,
          status: row.status,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          retryCount: row.retry_count,
          totalChunks: row.total_chunks ?? 0,
          processedChunks: row.processed_chunks ?? 0,
          note: row.note ?? null,
        };
      }
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB query failed:", err);
    }
  }
  return memoryJobs.get(docId) || null;
}

export function getPendingJobs(limit = 50): IndexJob[] {
  const database = db();
  if (database) {
    try {
      const rows = database.prepare(`
        SELECT * FROM kb_index_jobs
        WHERE status IN ('pending', 'failed')
          AND retry_count < 3
        ORDER BY created_at ASC
        LIMIT ?
      `).all(limit) as any[];
      return rows.map((r) => ({
        id: r.id,
        docId: r.doc_id,
        filePath: r.file_path,
        status: r.status,
        errorMessage: r.error_message,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        retryCount: r.retry_count,
        totalChunks: r.total_chunks ?? 0,
        processedChunks: r.processed_chunks ?? 0,
        note: r.note ?? null,
      }));
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB query failed:", err);
    }
  }
  return Array.from(memoryJobs.values())
    .filter((j) => (j.status === "pending" || j.status === "failed") && j.retryCount < 3)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getRecentJobs(limit = 100): IndexJob[] {
  const database = db();
  if (database) {
    try {
      const rows = database.prepare(`
        SELECT * FROM kb_index_jobs
        ORDER BY updated_at DESC
        LIMIT ?
      `).all(limit) as any[];
      return rows.map((r) => ({
        id: r.id,
        docId: r.doc_id,
        filePath: r.file_path,
        status: r.status,
        errorMessage: r.error_message,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        retryCount: r.retry_count,
        totalChunks: r.total_chunks ?? 0,
        processedChunks: r.processed_chunks ?? 0,
        note: r.note ?? null,
      }));
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB query failed:", err);
    }
  }
  return Array.from(memoryJobs.values()).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

export function deleteJob(docId: string): void {
  const database = db();
  if (database) {
    try {
      database.prepare(`DELETE FROM kb_index_jobs WHERE doc_id = ?`).run(docId);
    } catch (err) {
      logger.error("[LightRAGIndexStatus] DB delete failed:", err);
    }
  }
  memoryJobs.delete(docId);
}

// ── Organize Status ─────────────────────────────────────────────────────────

export interface OrganizeStatusRecord {
  rawPath: string;
  wikiPaths: string[];
  status: string;
  errorMessage?: string | null;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

// In-memory fallback
const memoryOrganize = new Map<string, OrganizeStatusRecord>();

export function setOrganizeStatus(
  rawPath: string,
  wikiPaths: string[],
  options: { status?: "processing" | "completed" | "failed"; errorMessage?: string | null; progress?: number } = {}
): void {
  const now = Date.now();
  const status = options.status || "completed";
  const existing = memoryOrganize.get(rawPath);
  const record: OrganizeStatusRecord = {
    rawPath,
    wikiPaths,
    status,
    errorMessage: options.errorMessage ?? null,
    progress: options.progress ?? (status === "completed" ? 100 : status === "failed" ? 0 : 50),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO kb_organize_status (raw_path, wiki_paths, status, error_message, progress, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(raw_path) DO UPDATE SET
          wiki_paths = excluded.wiki_paths,
          status = excluded.status,
          error_message = excluded.error_message,
          progress = excluded.progress,
          updated_at = excluded.updated_at
      `);
      stmt.run(rawPath, JSON.stringify(wikiPaths), status, record.errorMessage ?? null, record.progress ?? 0, record.createdAt, now);
    } catch (err) {
      logger.error("[LightRAGIndexStatus] Organize status DB write failed:", err);
      memoryOrganize.set(rawPath, record);
    }
  } else {
    memoryOrganize.set(rawPath, record);
  }
}

export function getOrganizeStatus(rawPath: string): OrganizeStatusRecord | null {
  const database = db();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM kb_organize_status WHERE raw_path = ?`).get(rawPath) as any;
      if (row) {
        return {
          rawPath: row.raw_path,
          wikiPaths: JSON.parse(row.wiki_paths || "[]"),
          status: row.status,
          errorMessage: row.error_message ?? null,
          progress: row.progress ?? (row.status === "completed" ? 100 : 0),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch (err) {
      logger.error("[LightRAGIndexStatus] Organize status DB query failed:", err);
    }
  }
  return memoryOrganize.get(rawPath) || null;
}

export function getAllOrganizeStatuses(): OrganizeStatusRecord[] {
  const database = db();
  if (database) {
    try {
      const rows = database.prepare(`SELECT * FROM kb_organize_status ORDER BY updated_at DESC`).all() as any[];
      return rows.map((r) => ({
        rawPath: r.raw_path,
        wikiPaths: JSON.parse(r.wiki_paths || "[]"),
        status: r.status,
        errorMessage: r.error_message ?? null,
        progress: r.progress ?? (r.status === "completed" ? 100 : 0),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err) {
      logger.error("[LightRAGIndexStatus] Organize status DB query failed:", err);
    }
  }
  return Array.from(memoryOrganize.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

// ── Graph Extraction Status ────────────────────────────────────────────────

export type GraphExtractionStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export interface GraphExtractionStatusRecord {
  filePath: string;
  status: GraphExtractionStatus;
  nodeCount: number;
  edgeCount: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

const memoryGraphExtraction = new Map<string, GraphExtractionStatusRecord>();

export function setGraphExtractionStatus(
  filePath: string,
  status: GraphExtractionStatus,
  options: { nodeCount?: number; edgeCount?: number; errorMessage?: string | null } = {}
): void {
  const now = Date.now();
  const existing = memoryGraphExtraction.get(filePath);
  const record: GraphExtractionStatusRecord = {
    filePath,
    status,
    nodeCount: options.nodeCount ?? existing?.nodeCount ?? 0,
    edgeCount: options.edgeCount ?? existing?.edgeCount ?? 0,
    errorMessage: options.errorMessage ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO kb_graph_extraction_status (file_path, status, node_count, edge_count, error_message, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
          status = excluded.status,
          node_count = excluded.node_count,
          edge_count = excluded.edge_count,
          error_message = excluded.error_message,
          updated_at = excluded.updated_at
      `);
      stmt.run(filePath, status, record.nodeCount, record.edgeCount, record.errorMessage, record.createdAt, record.updatedAt);
    } catch (err) {
      logger.error("[LightRAGIndexStatus] Graph extraction status DB write failed:", err);
      memoryGraphExtraction.set(filePath, record);
    }
  } else {
    memoryGraphExtraction.set(filePath, record);
  }
}

export function getAllGraphExtractionStatuses(limit = 100): GraphExtractionStatusRecord[] {
  const database = db();
  if (database) {
    try {
      const rows = database.prepare(`
        SELECT * FROM kb_graph_extraction_status
        ORDER BY updated_at DESC
        LIMIT ?
      `).all(limit) as any[];
      return rows.map((r) => ({
        filePath: r.file_path,
        status: r.status,
        nodeCount: r.node_count ?? 0,
        edgeCount: r.edge_count ?? 0,
        errorMessage: r.error_message ?? null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err) {
      logger.error("[LightRAGIndexStatus] Graph extraction status DB query failed:", err);
    }
  }
  return Array.from(memoryGraphExtraction.values()).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}
