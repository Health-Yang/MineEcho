/**
 * Memory Tree Database Layer
 * SQLite-backed storage for hierarchical memory tree
 */

import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { logger } from "../../utils/logger.js";
import {
  type L0Chunk,
  type L1Summary,
  type L2Summary,
  type L3Summary,
  type MemoryEntity,
  type MemoryRelation,
  type MemorySource,
  type EntityKind,
  getDateString,
  getWeekStart,
  getMonth,
} from "./types.js";
import { getWorkspaceRoot } from "../../routes/workspace.js";

// Lazy-loaded sqlite module
let sqliteModule: typeof import("node:sqlite") | null = null;
try {
  sqliteModule = await import("node:sqlite");
} catch {
  sqliteModule = null;
}

function getDbPath(): string {
  const workspaceRoot = getWorkspaceRoot();
  const dbDir = join(workspaceRoot, "memory", "tree");
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "memory-tree.db");
}

function initDb(database: import("node:sqlite").DatabaseSync): void {
  database.exec(`
    -- L0 Buffer: New content chunks
    CREATE TABLE IF NOT EXISTS mt_l0_buffer (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      embedded_at INTEGER,
      entity_tags TEXT,
      source_ref TEXT,
      importance REAL DEFAULT 0.5,
      archived INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_mt_l0_user_created ON mt_l0_buffer(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_mt_l0_source ON mt_l0_buffer(user_id, source);
    CREATE INDEX IF NOT EXISTS idx_mt_l0_archived ON mt_l0_buffer(user_id, archived);

    -- L1 Daily Summaries
    CREATE TABLE IF NOT EXISTS mt_l1_summaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      child_ids TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      embedding BLOB
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mt_l1_user_date ON mt_l1_summaries(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_mt_l1_created ON mt_l1_summaries(created_at);

    -- L2 Weekly Summaries
    CREATE TABLE IF NOT EXISTS mt_l2_summaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      summary TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      child_ids TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      embedding BLOB
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mt_l2_user_week ON mt_l2_summaries(user_id, week_start);
    CREATE INDEX IF NOT EXISTS idx_mt_l2_created ON mt_l2_summaries(created_at);

    -- L3 Monthly Summaries
    CREATE TABLE IF NOT EXISTS mt_l3_summaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      month TEXT NOT NULL,
      summary TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      child_ids TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      embedding BLOB
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mt_l3_user_month ON mt_l3_summaries(user_id, month);
    CREATE INDEX IF NOT EXISTS idx_mt_l3_created ON mt_l3_summaries(created_at);

    -- Memory Entities
    CREATE TABLE IF NOT EXISTS mt_entities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      mentions INTEGER DEFAULT 1,
      last_seen INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mt_entity_user ON mt_entities(user_id);
    CREATE INDEX IF NOT EXISTS idx_mt_entity_kind ON mt_entities(user_id, kind);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mt_entity_user_name ON mt_entities(user_id, name, kind);

    -- Memory Relations
    CREATE TABLE IF NOT EXISTS mt_relations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      predicate TEXT NOT NULL,
      object_id TEXT NOT NULL,
      evidence TEXT,
      strength REAL DEFAULT 0.5,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mt_relation_user ON mt_relations(user_id);
    CREATE INDEX IF NOT EXISTS idx_mt_relation_subject ON mt_relations(subject_id);
    CREATE INDEX IF NOT EXISTS idx_mt_relation_object ON mt_relations(object_id);
  `);
}

function getDb(): import("node:sqlite").DatabaseSync | null {
  if (!sqliteModule) {
    logger.warn("[MemoryTreeDb] node:sqlite not available");
    return null;
  }
  try {
    const db = new sqliteModule.DatabaseSync(getDbPath());
    initDb(db);
    return db;
  } catch (err) {
    logger.error("[MemoryTreeDb] Failed to open SQLite DB:", err);
    return null;
  }
}

let dbInstance: import("node:sqlite").DatabaseSync | null = null;

function db(): import("node:sqlite").DatabaseSync | null {
  if (!dbInstance) {
    dbInstance = getDb();
  }
  return dbInstance;
}

export function closeMemoryTreeDb(): void {
  if (dbInstance) {
    try {
      dbInstance.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      dbInstance.close();
      dbInstance = null;
    } catch (err) {
      logger.error("[MemoryTreeDb] Failed to close database:", err);
    }
  }
}

// ============================================================================
// L0 Chunk Operations
// ============================================================================

export function storeL0Chunk(chunk: L0Chunk): void {
  const database = db();
  if (!database) return;

  try {
    database.prepare(`
      INSERT INTO mt_l0_buffer (id, user_id, source, content, token_count, created_at, embedded_at, entity_tags, source_ref, importance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chunk.id,
      chunk.userId,
      chunk.source,
      chunk.content,
      chunk.tokenCount,
      chunk.createdAt,
      chunk.embeddedAt || null,
      JSON.stringify(chunk.entityTags),
      chunk.sourceRef ? JSON.stringify(chunk.sourceRef) : null,
      chunk.importance
    );
  } catch (err) {
    logger.error("[MemoryTreeDb] storeL0Chunk failed:", err);
  }
}

export function getL0Chunks(
  userId: string,
  options?: {
    date?: string;
    source?: MemorySource;
    limit?: number;
    minImportance?: number;
    since?: number;
    includeArchived?: boolean;
  }
): L0Chunk[] {
  const database = db();
  if (!database) return [];

  try {
    let sql = "SELECT * FROM mt_l0_buffer WHERE user_id = ?";
    const params: any[] = [userId];

    // Exclude archived chunks by default
    if (!options?.includeArchived) {
      sql += " AND archived = 0";
    }

    if (options?.date) {
      // Date range for daily chunks
      const startOfDay = new Date(options.date).setHours(0, 0, 0, 0);
      const endOfDay = new Date(options.date).setHours(23, 59, 59, 999);
      sql += " AND created_at >= ? AND created_at <= ?";
      params.push(startOfDay, endOfDay);
    } else if (options?.since) {
      sql += " AND created_at >= ?";
      params.push(options.since);
    }

    if (options?.source) {
      sql += " AND source = ?";
      params.push(options.source);
    }

    if (options?.minImportance !== undefined) {
      sql += " AND importance >= ?";
      params.push(options.minImportance);
    }

    sql += " ORDER BY created_at ASC";

    if (options?.limit) {
      sql += " LIMIT ?";
      params.push(options.limit);
    }

    const stmt = database.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(mapL0Chunk);
  } catch (err) {
    logger.error("[MemoryTreeDb] getL0Chunks failed:", err);
    return [];
  }
}

export function getL0ChunksCount(userId: string, date?: string): number {
  const database = db();
  if (!database) return 0;

  try {
    let sql = "SELECT COUNT(*) as count FROM mt_l0_buffer WHERE user_id = ? AND archived = 0";
    const params: any[] = [userId];

    if (date) {
      const startOfDay = new Date(date).setHours(0, 0, 0, 0);
      const endOfDay = new Date(date).setHours(23, 59, 59, 999);
      sql += " AND created_at >= ? AND created_at <= ?";
      params.push(startOfDay, endOfDay);
    }

    const row = database.prepare(sql).get(...params) as any;
    return row?.count || 0;
  } catch (err) {
    logger.error("[MemoryTreeDb] getL0ChunksCount failed:", err);
    return 0;
  }
}

export function getL0TokensToday(userId: string): number {
  const database = db();
  if (!database) return 0;

  try {
    const today = getDateString();
    const startOfDay = new Date(today).setHours(0, 0, 0, 0);
    const endOfDay = new Date(today).setHours(23, 59, 59, 999);

    const row = database.prepare(`
      SELECT COALESCE(SUM(token_count), 0) as total FROM mt_l0_buffer
      WHERE user_id = ? AND created_at >= ? AND created_at <= ? AND archived = 0
    `).get(userId, startOfDay, endOfDay) as any;

    return row?.total || 0;
  } catch (err) {
    logger.error("[MemoryTreeDb] getL0TokensToday failed:", err);
    return 0;
  }
}

export function getL0TokensTotal(userId: string): number {
  const database = db();
  if (!database) return 0;

  try {
    const row = database.prepare(`
      SELECT COALESCE(SUM(token_count), 0) as total FROM mt_l0_buffer
      WHERE user_id = ? AND archived = 0
    `).get(userId) as any;

    return row?.total || 0;
  } catch (err) {
    logger.error("[MemoryTreeDb] getL0TokensTotal failed:", err);
    return 0;
  }
}

export function archiveL0Chunk(userId: string, chunkId: string): boolean {
  const database = db();
  if (!database) return false;

  try {
    const result = database.prepare(`
      UPDATE mt_l0_buffer SET archived = 1 WHERE id = ? AND user_id = ?
    `).run(chunkId, userId);
    return (result.changes ?? 0) > 0;
  } catch (err) {
    logger.error("[MemoryTreeDb] archiveL0Chunk failed:", err);
    return false;
  }
}

export function deleteL0Chunk(userId: string, chunkId: string): boolean {
  const database = db();
  if (!database) return false;

  try {
    const result = database.prepare("DELETE FROM mt_l0_buffer WHERE id = ? AND user_id = ?").run(chunkId, userId);
    return (result.changes ?? 0) > 0;
  } catch (err) {
    logger.error("[MemoryTreeDb] deleteL0Chunk failed:", err);
    return false;
  }
}

export function pruneOldL0Chunks(userId: string, keepDays: number = 30): number {
  const database = db();
  if (!database) return 0;

  try {
    const cutoff = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    const result = database.prepare("DELETE FROM mt_l0_buffer WHERE user_id = ? AND created_at < ?").run(userId, cutoff);
    return Number(result.changes ?? 0);
  } catch (err) {
    logger.error("[MemoryTreeDb] pruneOldL0Chunks failed:", err);
    return 0;
  }
}

// ============================================================================
// L1 Summary Operations
// ============================================================================

export function storeL1Summary(summary: L1Summary): void {
  const database = db();
  if (!database) return;

  try {
    database.prepare(`
      INSERT INTO mt_l1_summaries (id, user_id, date, summary, token_count, child_ids, created_at, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET summary = excluded.summary, token_count = excluded.token_count, child_ids = excluded.child_ids
    `).run(
      summary.id,
      summary.userId,
      summary.date,
      summary.summary,
      summary.tokenCount,
      JSON.stringify(summary.childIds),
      summary.createdAt,
      summary.embedding ? JSON.stringify(summary.embedding) : null
    );
  } catch (err) {
    logger.error("[MemoryTreeDb] storeL1Summary failed:", err);
  }
}

export function getL1Summary(userId: string, date: string): L1Summary | null {
  const database = db();
  if (!database) return null;

  try {
    const row = database.prepare("SELECT * FROM mt_l1_summaries WHERE user_id = ? AND date = ?").get(userId, date) as any;
    return row ? mapL1Summary(row) : null;
  } catch (err) {
    logger.error("[MemoryTreeDb] getL1Summary failed:", err);
    return null;
  }
}

export function getL1SummariesInRange(userId: string, startDate: string, endDate: string): L1Summary[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_l1_summaries
      WHERE user_id = ? AND date >= ? AND date <= ?
      ORDER BY date ASC
    `).all(userId, startDate, endDate) as any[];

    return rows.map(mapL1Summary);
  } catch (err) {
    logger.error("[MemoryTreeDb] getL1SummariesInRange failed:", err);
    return [];
  }
}

export function getRecentL1Summaries(userId: string, count: number = 7): L1Summary[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_l1_summaries
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT ?
    `).all(userId, count) as any[];

    return rows.map(mapL1Summary);
  } catch (err) {
    logger.error("[MemoryTreeDb] getRecentL1Summaries failed:", err);
    return [];
  }
}

// ============================================================================
// L2 Summary Operations
// ============================================================================

export function storeL2Summary(summary: L2Summary): void {
  const database = db();
  if (!database) return;

  try {
    database.prepare(`
      INSERT INTO mt_l2_summaries (id, user_id, week_start, summary, token_count, child_ids, created_at, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET summary = excluded.summary, token_count = excluded.token_count, child_ids = excluded.child_ids
    `).run(
      summary.id,
      summary.userId,
      summary.weekStart,
      summary.summary,
      summary.tokenCount,
      JSON.stringify(summary.childIds),
      summary.createdAt,
      summary.embedding ? JSON.stringify(summary.embedding) : null
    );
  } catch (err) {
    logger.error("[MemoryTreeDb] storeL2Summary failed:", err);
  }
}

export function getL2Summary(userId: string, weekStart: string): L2Summary | null {
  const database = db();
  if (!database) return null;

  try {
    const row = database.prepare("SELECT * FROM mt_l2_summaries WHERE user_id = ? AND week_start = ?").get(userId, weekStart) as any;
    return row ? mapL2Summary(row) : null;
  } catch (err) {
    logger.error("[MemoryTreeDb] getL2Summary failed:", err);
    return null;
  }
}

export function getL2SummariesInRange(userId: string, startWeek: string, endWeek: string): L2Summary[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_l2_summaries
      WHERE user_id = ? AND week_start >= ? AND week_start <= ?
      ORDER BY week_start ASC
    `).all(userId, startWeek, endWeek) as any[];

    return rows.map(mapL2Summary);
  } catch (err) {
    logger.error("[MemoryTreeDb] getL2SummariesInRange failed:", err);
    return [];
  }
}

// ============================================================================
// L3 Summary Operations
// ============================================================================

export function storeL3Summary(summary: L3Summary): void {
  const database = db();
  if (!database) return;

  try {
    database.prepare(`
      INSERT INTO mt_l3_summaries (id, user_id, month, summary, token_count, child_ids, created_at, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET summary = excluded.summary, token_count = excluded.token_count, child_ids = excluded.child_ids
    `).run(
      summary.id,
      summary.userId,
      summary.month,
      summary.summary,
      summary.tokenCount,
      JSON.stringify(summary.childIds),
      summary.createdAt,
      summary.embedding ? JSON.stringify(summary.embedding) : null
    );
  } catch (err) {
    logger.error("[MemoryTreeDb] storeL3Summary failed:", err);
  }
}

export function getL3Summary(userId: string, month: string): L3Summary | null {
  const database = db();
  if (!database) return null;

  try {
    const row = database.prepare("SELECT * FROM mt_l3_summaries WHERE user_id = ? AND month = ?").get(userId, month) as any;
    return row ? mapL3Summary(row) : null;
  } catch (err) {
    logger.error("[MemoryTreeDb] getL3Summary failed:", err);
    return null;
  }
}

export function getL3SummariesInRange(userId: string, startMonth: string, endMonth: string): L3Summary[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_l3_summaries
      WHERE user_id = ? AND month >= ? AND month <= ?
      ORDER BY month ASC
    `).all(userId, startMonth, endMonth) as any[];

    return rows.map(mapL3Summary);
  } catch (err) {
    logger.error("[MemoryTreeDb] getL3SummariesInRange failed:", err);
    return [];
  }
}

// ============================================================================
// Entity Operations
// ============================================================================

export function upsertEntity(entity: MemoryEntity): void {
  const database = db();
  if (!database) return;

  try {
    database.prepare(`
      INSERT INTO mt_entities (id, user_id, name, kind, mentions, last_seen, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, name, kind) DO UPDATE SET
        mentions = mentions + 1,
        last_seen = excluded.last_seen
    `).run(
      entity.id,
      entity.userId,
      entity.name,
      entity.kind,
      entity.mentions,
      entity.lastSeen,
      entity.createdAt
    );
  } catch (err) {
    logger.error("[MemoryTreeDb] upsertEntity failed:", err);
  }
}

export function getEntities(userId: string, kind?: EntityKind): MemoryEntity[] {
  const database = db();
  if (!database) return [];

  try {
    let sql = "SELECT * FROM mt_entities WHERE user_id = ?";
    const params: any[] = [userId];

    if (kind) {
      sql += " AND kind = ?";
      params.push(kind);
    }

    sql += " ORDER BY mentions DESC";

    const rows = database.prepare(sql).all(...params) as any[];
    return rows.map(mapEntity);
  } catch (err) {
    logger.error("[MemoryTreeDb] getEntities failed:", err);
    return [];
  }
}

export function searchEntities(userId: string, query: string): MemoryEntity[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_entities
      WHERE user_id = ? AND name LIKE ?
      ORDER BY mentions DESC
      LIMIT 20
    `).all(userId, `%${query}%`) as any[];

    return rows.map(mapEntity);
  } catch (err) {
    logger.error("[MemoryTreeDb] searchEntities failed:", err);
    return [];
  }
}

export function getEntityByName(userId: string, name: string, kind: EntityKind): MemoryEntity | null {
  const database = db();
  if (!database) return null;

  try {
    const row = database.prepare("SELECT * FROM mt_entities WHERE user_id = ? AND name = ? AND kind = ?").get(userId, name, kind) as any;
    return row ? mapEntity(row) : null;
  } catch (err) {
    logger.error("[MemoryTreeDb] getEntityByName failed:", err);
    return null;
  }
}

// ============================================================================
// Relation Operations
// ============================================================================

export function storeRelation(relation: MemoryRelation): void {
  const database = db();
  if (!database) return;

  try {
    // Check if relation exists and strengthen
    const existing = database.prepare(`
      SELECT id, strength FROM mt_relations
      WHERE user_id = ? AND subject_id = ? AND predicate = ? AND object_id = ?
    `).get(relation.userId, relation.subjectId, relation.predicate, relation.objectId) as any;

    if (existing) {
      // Strengthen existing relation
      const newStrength = Math.min(1, (existing.strength || 0.5) + 0.1);
      database.prepare(`
        UPDATE mt_relations SET strength = ?, evidence = ? || char(10) || ?
        WHERE id = ?
      `).run(newStrength, existing.evidence || "", relation.evidence, existing.id);
    } else {
      database.prepare(`
        INSERT INTO mt_relations (id, user_id, subject_id, predicate, object_id, evidence, strength, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        relation.id,
        relation.userId,
        relation.subjectId,
        relation.predicate,
        relation.objectId,
        relation.evidence,
        relation.strength,
        relation.createdAt
      );
    }
  } catch (err) {
    logger.error("[MemoryTreeDb] storeRelation failed:", err);
  }
}

export function getRelationsForEntity(userId: string, entityId: string): MemoryRelation[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_relations
      WHERE user_id = ? AND (subject_id = ? OR object_id = ?)
      ORDER BY strength DESC
    `).all(userId, entityId, entityId) as any[];

    return rows.map(mapRelation);
  } catch (err) {
    logger.error("[MemoryTreeDb] getRelationsForEntity failed:", err);
    return [];
  }
}

export function getAllRelations(userId: string): MemoryRelation[] {
  const database = db();
  if (!database) return [];

  try {
    const rows = database.prepare(`
      SELECT * FROM mt_relations WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    return rows.map(mapRelation);
  } catch (err) {
    logger.error("[MemoryTreeDb] getAllRelations failed:", err);
    return [];
  }
}

// ============================================================================
// Statistics
// ============================================================================

export function getTreeStats(userId: string): {
  l0Count: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  entityCount: number;
  relationCount: number;
} {
  const database = db();
  if (!database) {
    return { l0Count: 0, l1Count: 0, l2Count: 0, l3Count: 0, entityCount: 0, relationCount: 0 };
  }

  try {
    const l0Row = database.prepare("SELECT COUNT(*) as count FROM mt_l0_buffer WHERE user_id = ?").get(userId) as any;
    const l1Row = database.prepare("SELECT COUNT(*) as count FROM mt_l1_summaries WHERE user_id = ?").get(userId) as any;
    const l2Row = database.prepare("SELECT COUNT(*) as count FROM mt_l2_summaries WHERE user_id = ?").get(userId) as any;
    const l3Row = database.prepare("SELECT COUNT(*) as count FROM mt_l3_summaries WHERE user_id = ?").get(userId) as any;
    const entityRow = database.prepare("SELECT COUNT(*) as count FROM mt_entities WHERE user_id = ?").get(userId) as any;
    const relationRow = database.prepare("SELECT COUNT(*) as count FROM mt_relations WHERE user_id = ?").get(userId) as any;

    return {
      l0Count: l0Row?.count || 0,
      l1Count: l1Row?.count || 0,
      l2Count: l2Row?.count || 0,
      l3Count: l3Row?.count || 0,
      entityCount: entityRow?.count || 0,
      relationCount: relationRow?.count || 0,
    };
  } catch (err) {
    logger.error("[MemoryTreeDb] getTreeStats failed:", err);
    return { l0Count: 0, l1Count: 0, l2Count: 0, l3Count: 0, entityCount: 0, relationCount: 0 };
  }
}

// ============================================================================
// Row Mappers
// ============================================================================

function mapL0Chunk(row: any): L0Chunk {
  return {
    id: row.id,
    userId: row.user_id,
    source: row.source as MemorySource,
    content: row.content,
    tokenCount: row.token_count,
    createdAt: row.created_at,
    embeddedAt: row.embedded_at || undefined,
    entityTags: row.entity_tags ? JSON.parse(row.entity_tags) : [],
    sourceRef: row.source_ref ? JSON.parse(row.source_ref) : undefined,
    importance: row.importance ?? 0.5,
  };
}

function mapL1Summary(row: any): L1Summary {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    summary: row.summary,
    tokenCount: row.token_count,
    childIds: JSON.parse(row.child_ids || "[]"),
    createdAt: row.created_at,
    embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
  };
}

function mapL2Summary(row: any): L2Summary {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    summary: row.summary,
    tokenCount: row.token_count,
    childIds: JSON.parse(row.child_ids || "[]"),
    createdAt: row.created_at,
    embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
  };
}

function mapL3Summary(row: any): L3Summary {
  return {
    id: row.id,
    userId: row.user_id,
    month: row.month,
    summary: row.summary,
    tokenCount: row.token_count,
    childIds: JSON.parse(row.child_ids || "[]"),
    createdAt: row.created_at,
    embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
  };
}

function mapEntity(row: any): MemoryEntity {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    kind: row.kind as EntityKind,
    mentions: row.mentions,
    lastSeen: row.last_seen,
    createdAt: row.created_at,
  };
}

function mapRelation(row: any): MemoryRelation {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    predicate: row.predicate,
    objectId: row.object_id,
    evidence: row.evidence || "",
    strength: row.strength ?? 0.5,
    createdAt: row.created_at,
  };
}