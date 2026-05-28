import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { getKbBasePath } from "./paths.js";
import { logger } from "../utils/logger.js";
import { getLoadablePath } from "sqlite-vec";

export interface VectorRecord {
  id: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  metadata: object;
  embedding: number[];
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: object;
}

export interface VectorStore {
  add(record: VectorRecord): Promise<void>;
  addBatch(records: VectorRecord[]): Promise<void>;
  search(queryEmbedding: number[], topK: number): Promise<VectorSearchResult[]>;
  deleteByFilePath(filePath: string): Promise<void>;
  getStats(): Promise<{ total: number; providers: string[] }>;
}

// Provider config: name -> dimensions
const PROVIDER_CONFIG: Record<string, number> = {
  minimax: 1536,
  aliyun: 1024,
  zhipu: 2048,
};

// Lazy-loaded sqlite module
let sqliteModule: typeof import("node:sqlite") | null = null;

try {
  sqliteModule = await import("node:sqlite");
} catch {
  sqliteModule = null;
}

function getDbPath(): string {
  const kbBase = getKbBasePath();
  const dbDir = dirname(kbBase);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "kb-vectors.db");
}

function getProviderTable(provider: string): string {
  return `kb_vectors_${provider}`;
}

function getProviderVecTable(provider: string): string {
  return `kb_vectors_${provider}_v2`;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function serializeEmbedding(emb: number[]): string {
  // sqlite-vec accepts JSON array string
  return JSON.stringify(emb);
}

class NodeSqliteVectorStore implements VectorStore {
  private db: import("node:sqlite").DatabaseSync;
  private provider: string;
  private dimensions: number;
  private table: string;
  private vecTable: string;
  private initialized = false;
  private vecExtensionLoaded = false;

  constructor(provider: string, dimensions: number) {
    if (!sqliteModule) {
      throw new Error("node:sqlite is not available");
    }
    this.provider = provider;
    this.dimensions = dimensions;
    this.table = getProviderTable(provider);
    this.vecTable = getProviderVecTable(provider);
    this.db = new sqliteModule.DatabaseSync(getDbPath(), { allowExtension: true });
    try {
      this.db.loadExtension(getLoadablePath());
      this.vecExtensionLoaded = true;
      logger.info(`[VectorStore][${this.provider}] sqlite-vec extension loaded`);
    } catch (err) {
      this.vecExtensionLoaded = false;
      logger.warn(`[VectorStore][${this.provider}] Failed to load sqlite-vec extension, will use manual cosine fallback:`, err);
    }
    this.initTables();
  }

  private initTables(): void {
    if (this.initialized) return;

    // Main metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        chunk_index INTEGER,
        content TEXT NOT NULL,
        metadata TEXT,
        embedding TEXT,
        created_at INTEGER
      )
    `);

    // Create index on file_path for fast deletion
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${this.table}_filepath ON ${this.table}(file_path)
    `);

    // Virtual table for vectors using sqlite-vec if available, otherwise fallback handled at search time
    // chunk_id is a metadata column for JOINing back to the metadata table.
    try {
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS ${this.vecTable} USING vec0(
          chunk_id TEXT,
          embedding float[${this.dimensions}] distance_metric=cosine
        )
      `);
    } catch (err) {
      logger.warn(
        `[VectorStore][${this.provider}] sqlite-vec extension not available, will use manual cosine fallback. Error:`,
        err
      );
    }

    this.initialized = true;
  }

  private isVecTableAvailable(): boolean {
    if (!this.vecExtensionLoaded) {
      return false;
    }
    try {
      const stmt = this.db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      );
      const row = stmt.get(this.vecTable) as { name: string } | undefined;
      if (row?.name !== this.vecTable) {
        return false;
      }
      // Verify the virtual table is actually queryable by running a lightweight MATCH.
      // PRAGMA table_info does not list the dynamic "distance" column for vec0 tables,
      // so we test with a real query instead.
      const testStmt = this.db.prepare(
        `SELECT 1 FROM ${this.vecTable} WHERE embedding MATCH ? AND k = 1`
      );
      testStmt.all(JSON.stringify(new Array(this.dimensions).fill(0)));
      return true;
    } catch {
      return false;
    }
  }

  async add(record: VectorRecord): Promise<void> {
    const insertMeta = this.db.prepare(`
      INSERT OR REPLACE INTO ${this.table} (id, file_path, chunk_index, content, metadata, embedding, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertMeta.run(
      record.id,
      record.filePath,
      record.chunkIndex,
      record.content,
      JSON.stringify(record.metadata),
      serializeEmbedding(record.embedding),
      Date.now()
    );

    if (this.isVecTableAvailable()) {
      try {
        const insertVec = this.db.prepare(`
          INSERT OR REPLACE INTO ${this.vecTable} (chunk_id, embedding)
          VALUES (?, ?)
        `);
        insertVec.run(record.id, serializeEmbedding(record.embedding));
      } catch (err) {
        logger.warn(`[VectorStore][${this.provider}] vec insert failed:`, err);
      }
    }
  }

  async addBatch(records: VectorRecord[]): Promise<void> {
    // Use explicit transaction for batch atomicity
    this.db.exec("BEGIN TRANSACTION");
    try {
      const insertMeta = this.db.prepare(`
        INSERT OR REPLACE INTO ${this.table} (id, file_path, chunk_index, content, metadata, embedding, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const insertVec = this.isVecTableAvailable()
        ? this.db.prepare(`
            INSERT OR REPLACE INTO ${this.vecTable} (chunk_id, embedding)
            VALUES (?, ?)
          `)
        : null;

      for (const record of records) {
        insertMeta.run(
          record.id,
          record.filePath,
          record.chunkIndex,
          record.content,
          JSON.stringify(record.metadata),
          serializeEmbedding(record.embedding),
          Date.now()
        );
        if (insertVec) {
          insertVec.run(record.id, serializeEmbedding(record.embedding));
        }
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  async search(queryEmbedding: number[], topK: number): Promise<VectorSearchResult[]> {
    if (this.isVecTableAvailable()) {
      try {
        const stmt = this.db.prepare(`
          SELECT
            v.chunk_id as id,
            v.distance as distance,
            m.content,
            m.metadata
          FROM ${this.vecTable} v
          JOIN ${this.table} m ON v.chunk_id = m.id
          WHERE v.embedding MATCH ? AND k = ?
          ORDER BY v.distance
        `);
        // sqlite-vec KNN query syntax: k = ? is required
        const rows = stmt.all(serializeEmbedding(queryEmbedding), topK) as Array<{
          id: string;
          distance: number;
          content: string;
          metadata: string;
        }>;

        if (rows.length > 0) {
          logger.debug(`[VectorStore][${this.provider}] vec search returned ${rows.length} results`);
        }

        return rows.map((r) => ({
          id: r.id,
          score: 1 - r.distance, // convert cosine distance to similarity
          content: r.content,
          metadata: safeParseJson(r.metadata),
        }));
      } catch (err) {
        logger.warn(`[VectorStore][${this.provider}] vec search failed, falling back to manual cosine:`, err);
      }
    } else {
      logger.warn(`[VectorStore][${this.provider}] sqlite-vec not available, using manual cosine fallback (O(n) scan). Consider checking extension installation.`);
    }

    // Fallback: manual cosine similarity over all rows using stored embeddings
    const stmt = this.db.prepare(`
      SELECT id, content, metadata, embedding FROM ${this.table}
    `);
    const rows = stmt.all() as Array<{
      id: string;
      content: string;
      metadata: string;
      embedding: string;
    }>;

    const scored: Array<{ id: string; score: number; content: string; metadata: object }> = [];
    for (const row of rows) {
      try {
        const emb = JSON.parse(row.embedding) as number[];
        if (Array.isArray(emb) && emb.length === this.dimensions) {
          const score = cosineSimilarity(queryEmbedding, emb);
          scored.push({
            id: row.id,
            score,
            content: row.content,
            metadata: safeParseJson(row.metadata),
          });
        }
      } catch {
        // Skip rows with invalid embeddings
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async deleteByFilePath(filePath: string): Promise<void> {
    // Get IDs first
    const selectStmt = this.db.prepare(`SELECT id FROM ${this.table} WHERE file_path = ?`);
    const rows = selectStmt.all(filePath) as Array<{ id: string }>;

    this.db.exec("BEGIN TRANSACTION");
    try {
      const deleteMeta = this.db.prepare(`DELETE FROM ${this.table} WHERE file_path = ?`);
      deleteMeta.run(filePath);

      if (this.isVecTableAvailable()) {
        const deleteVec = this.db.prepare(`DELETE FROM ${this.vecTable} WHERE chunk_id = ?`);
        for (const row of rows) {
          try {
            deleteVec.run(row.id);
          } catch (err) {
            logger.warn(`[VectorStore][${this.provider}] vec delete failed for ${row.id}:`, err);
          }
        }
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  async getStats(): Promise<{ total: number; providers: string[] }> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM ${this.table}`);
    const row = stmt.get() as { cnt: number } | undefined;
    return { total: row?.cnt ?? 0, providers: [this.provider] };
  }

  close(): void {
    if (this.db) {
      try {
        this.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
        this.db.close();
        logger.info(`[VectorStore][${this.provider}] Database closed`);
      } catch (err) {
        logger.error(`[VectorStore][${this.provider}] Failed to close database:`, err);
      }
    }
  }
}

// Fallback store that keeps embeddings in-memory + SQLite metadata for environments
// where node:sqlite is unavailable (should be rare on Node 21+)
class InMemoryVectorStore implements VectorStore {
  private provider: string;
  private records: Map<string, VectorRecord> = new Map();

  constructor(provider: string) {
    this.provider = provider;
  }

  async add(record: VectorRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async addBatch(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      this.records.set(r.id, r);
    }
  }

  async search(queryEmbedding: number[], topK: number): Promise<VectorSearchResult[]> {
    const scored: Array<{ record: VectorRecord; score: number }> = [];
    for (const record of this.records.values()) {
      const score = cosineSimilarity(queryEmbedding, record.embedding);
      scored.push({ record, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => ({
      id: s.record.id,
      score: s.score,
      content: s.record.content,
      metadata: s.record.metadata,
    }));
  }

  async deleteByFilePath(filePath: string): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.filePath === filePath) {
        this.records.delete(id);
      }
    }
  }

  async getStats(): Promise<{ total: number; providers: string[] }> {
    return { total: this.records.size, providers: [this.provider] };
  }
}

function safeParseJson(str: string): object {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

// Store registry per provider
const storeRegistry = new Map<string, VectorStore>();

export function getVectorStore(provider: string): VectorStore {
  if (storeRegistry.has(provider)) {
    return storeRegistry.get(provider)!;
  }

  const dimensions = PROVIDER_CONFIG[provider];
  if (!dimensions) {
    throw new Error(`Unknown embedding provider: ${provider}`);
  }

  let store: VectorStore;
  if (sqliteModule) {
    try {
      store = new NodeSqliteVectorStore(provider, dimensions);
    } catch (err) {
      logger.warn(`[VectorStore] Failed to create NodeSqliteVectorStore, falling back to InMemory:`, err);
      store = new InMemoryVectorStore(provider);
    }
  } else {
    logger.warn(`[VectorStore] node:sqlite unavailable, using InMemoryVectorStore for ${provider}`);
    store = new InMemoryVectorStore(provider);
  }

  storeRegistry.set(provider, store);
  return store;
}

export function listProviderTables(): string[] {
  return Object.keys(PROVIDER_CONFIG);
}
