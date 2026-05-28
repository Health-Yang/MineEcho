/**
 * Graph Store - SQLite-backed knowledge graph storage
 * Replaces LightRAG's graph with a local, queryable graph database.
 */

import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { getKbBasePath } from "./paths.js";
import { logger } from "../utils/logger.js";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  sourceFile?: string;
  importance?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  strength?: number;
}

function normalizeSourcePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

export function isSourceFileWithinDeletedPath(sourceFile: string | undefined, deletedPath: string): boolean {
  if (!sourceFile) return false;
  const source = normalizeSourcePath(sourceFile);
  const target = normalizeSourcePath(deletedPath);
  if (!source || !target) return false;
  return source === target || source.startsWith(`${target}/`);
}

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
  return join(dbDir, "kb-graph.db");
}

class GraphStore {
  private db: import("node:sqlite").DatabaseSync | null = null;
  private initialized = false;

  constructor() {
    if (sqliteModule) {
      try {
        this.db = new sqliteModule.DatabaseSync(getDbPath());
        this.initTables();
      } catch (err) {
        logger.warn("[GraphStore] Failed to create DatabaseSync:", err);
      }
    }
  }

  private initTables(): void {
    if (this.initialized || !this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kb_graph_nodes (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        source_file TEXT,
        importance INTEGER DEFAULT 50,
        created_at INTEGER
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kb_graph_edges (
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        relation TEXT NOT NULL,
        strength INTEGER DEFAULT 1,
        created_at INTEGER,
        PRIMARY KEY (source, target, relation)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_edges_source ON kb_graph_edges(source)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_edges_target ON kb_graph_edges(target)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_nodes_source_file ON kb_graph_nodes(source_file)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_nodes_label ON kb_graph_nodes(label)
    `);

    this.initialized = true;
  }

  isAvailable(): boolean {
    return this.db !== null && this.initialized;
  }

  addNode(node: GraphNode): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO kb_graph_nodes (id, label, type, description, source_file, importance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      node.id,
      node.label,
      node.type,
      node.description || null,
      node.sourceFile || null,
      node.importance ?? 50,
      Date.now()
    );
  }

  addEdge(edge: GraphEdge): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO kb_graph_edges (source, target, relation, strength, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      edge.source,
      edge.target,
      edge.relation,
      edge.strength ?? 1,
      Date.now()
    );
  }

  addNodesBatch(nodes: GraphNode[]): void {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION");
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO kb_graph_nodes (id, label, type, description, source_file, importance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const node of nodes) {
        stmt.run(
          node.id,
          node.label,
          node.type,
          node.description || null,
          node.sourceFile || null,
          node.importance ?? 50,
          Date.now()
        );
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  addEdgesBatch(edges: GraphEdge[]): void {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION");
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO kb_graph_edges (source, target, relation, strength, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const edge of edges) {
        stmt.run(
          edge.source,
          edge.target,
          edge.relation,
          edge.strength ?? 1,
          Date.now()
        );
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  getNodeNeighbors(nodeId: string, depth = 1): { nodes: GraphNode[]; edges: GraphEdge[] } {
    if (!this.db) return { nodes: [], edges: [] };

    const nodeIds = new Set<string>([nodeId]);
    const allEdges: GraphEdge[] = [];

    // BFS expansion
    let currentDepth = 0;
    let frontier = new Set<string>([nodeId]);

    while (currentDepth < depth && frontier.size > 0) {
      const nextFrontier = new Set<string>();
      const placeholders = Array.from(frontier).map(() => "?").join(",");

      // Outgoing edges
      const outStmt = this.db.prepare(`
        SELECT source, target, relation, strength FROM kb_graph_edges
        WHERE source IN (${placeholders})
      `);
      const outRows = outStmt.all(...Array.from(frontier)) as Array<{
        source: string; target: string; relation: string; strength: number;
      }>;
      for (const row of outRows) {
        allEdges.push({ source: row.source, target: row.target, relation: row.relation, strength: row.strength });
        if (!nodeIds.has(row.target)) {
          nodeIds.add(row.target);
          nextFrontier.add(row.target);
        }
      }

      // Incoming edges
      const inStmt = this.db.prepare(`
        SELECT source, target, relation, strength FROM kb_graph_edges
        WHERE target IN (${placeholders})
      `);
      const inRows = inStmt.all(...Array.from(frontier)) as Array<{
        source: string; target: string; relation: string; strength: number;
      }>;
      for (const row of inRows) {
        allEdges.push({ source: row.source, target: row.target, relation: row.relation, strength: row.strength });
        if (!nodeIds.has(row.source)) {
          nodeIds.add(row.source);
          nextFrontier.add(row.source);
        }
      }

      frontier = nextFrontier;
      currentDepth++;
    }

    // Deduplicate edges
    const edgeSet = new Set<string>();
    const uniqueEdges: GraphEdge[] = [];
    for (const e of allEdges) {
      const key = `${e.source}|${e.target}|${e.relation}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        uniqueEdges.push(e);
      }
    }

    // Fetch nodes
    const nodes: GraphNode[] = [];
    if (nodeIds.size > 0) {
      const placeholders = Array.from(nodeIds).map(() => "?").join(",");
      const nodeStmt = this.db.prepare(`
        SELECT id, label, type, description, source_file, importance FROM kb_graph_nodes
        WHERE id IN (${placeholders})
      `);
      const nodeRows = nodeStmt.all(...Array.from(nodeIds)) as Array<{
        id: string; label: string; type: string; description: string | null;
        source_file: string | null; importance: number;
      }>;
      for (const row of nodeRows) {
        nodes.push({
          id: row.id,
          label: row.label,
          type: row.type,
          description: row.description || undefined,
          sourceFile: row.source_file || undefined,
          importance: row.importance,
        });
      }
    }

    return { nodes, edges: uniqueEdges };
  }

  findNodesByLabel(keyword: string, limit = 10): GraphNode[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT id, label, type, description, source_file, importance FROM kb_graph_nodes
      WHERE label LIKE ? OR description LIKE ?
      LIMIT ?
    `);
    const pattern = `%${keyword}%`;
    const rows = stmt.all(pattern, pattern, limit) as Array<{
      id: string; label: string; type: string; description: string | null;
      source_file: string | null; importance: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type,
      description: row.description || undefined,
      sourceFile: row.source_file || undefined,
      importance: row.importance,
    }));
  }

  deleteByFile(filePath: string): void {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION");
    try {
      // Delete edges connected to nodes from this file
      const edgeStmt = this.db.prepare(`
        DELETE FROM kb_graph_edges
        WHERE source IN (SELECT id FROM kb_graph_nodes WHERE source_file = ?)
        OR target IN (SELECT id FROM kb_graph_nodes WHERE source_file = ?)
      `);
      edgeStmt.run(filePath, filePath);

      // Delete nodes
      const nodeStmt = this.db.prepare(`
        DELETE FROM kb_graph_nodes WHERE source_file = ?
      `);
      nodeStmt.run(filePath);

      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  deleteBySourcePath(filePath: string): void {
    if (!this.db) return;
    const normalized = normalizeSourcePath(filePath);
    if (!normalized) return;

    this.db.exec("BEGIN TRANSACTION");
    try {
      const edgeStmt = this.db.prepare(`
        DELETE FROM kb_graph_edges
        WHERE source IN (
          SELECT id FROM kb_graph_nodes
          WHERE source_file = ? OR source_file GLOB ?
        )
        OR target IN (
          SELECT id FROM kb_graph_nodes
          WHERE source_file = ? OR source_file GLOB ?
        )
      `);
      const childPattern = `${normalized}/*`;
      edgeStmt.run(normalized, childPattern, normalized, childPattern);

      const nodeStmt = this.db.prepare(`
        DELETE FROM kb_graph_nodes
        WHERE source_file = ? OR source_file GLOB ?
      `);
      nodeStmt.run(normalized, childPattern);

      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  getAll(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    if (!this.db) return { nodes: [], edges: [] };

    const nodeStmt = this.db.prepare(`
      SELECT id, label, type, description, source_file, importance FROM kb_graph_nodes
    `);
    const nodeRows = nodeStmt.all() as Array<{
      id: string; label: string; type: string; description: string | null;
      source_file: string | null; importance: number;
    }>;
    const nodes = nodeRows.map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type,
      description: row.description || undefined,
      sourceFile: row.source_file || undefined,
      importance: row.importance,
    }));

    const edgeStmt = this.db.prepare(`
      SELECT source, target, relation, strength FROM kb_graph_edges
    `);
    const edgeRows = edgeStmt.all() as Array<{
      source: string; target: string; relation: string; strength: number;
    }>;
    const edges = edgeRows.map((row) => ({
      source: row.source,
      target: row.target,
      relation: row.relation,
      strength: row.strength,
    }));

    return { nodes, edges };
  }

  getStats(): { nodeCount: number; edgeCount: number } {
    if (!this.db) return { nodeCount: 0, edgeCount: 0 };
    const nodeStmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM kb_graph_nodes`);
    const edgeStmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM kb_graph_edges`);
    const nodeRow = nodeStmt.get() as { cnt: number } | undefined;
    const edgeRow = edgeStmt.get() as { cnt: number } | undefined;
    return {
      nodeCount: nodeRow?.cnt ?? 0,
      edgeCount: edgeRow?.cnt ?? 0,
    };
  }

  close(): void {
    if (this.db) {
      try {
        this.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
        this.db.close();
        logger.info("[GraphStore] Database closed");
      } catch (err) {
        logger.error("[GraphStore] Failed to close database:", err);
      }
    }
  }
}

// Singleton
let graphStoreInstance: GraphStore | null = null;

export function getGraphStore(): GraphStore {
  if (!graphStoreInstance) {
    graphStoreInstance = new GraphStore();
  }
  return graphStoreInstance;
}
