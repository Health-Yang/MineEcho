/**
 * Short-term Memory SQLite Database Layer
 *
 * Persistent SQLite-backed storage for short-term memory.
 * Falls back to in-memory Map when node:sqlite is unavailable.
 */

import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { getWorkspaceRoot } from "../routes/workspace.js";
import { logger } from "../utils/logger.js";
import type { Interaction, Preference, Task } from "./types.js";

// Lazy-loaded sqlite module
let sqliteModule: typeof import("node:sqlite") | null = null;
try {
  sqliteModule = await import("node:sqlite");
} catch {
  sqliteModule = null;
}

function getDbPath(): string {
  const workspaceRoot = getWorkspaceRoot();
  const dbDir = join(workspaceRoot, "memory");
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "short-term-memory.db");
}

function initDb(database: import("node:sqlite").DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS stm_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      skill_id TEXT,
      skill_name TEXT,
      outcome TEXT,
      user_feedback TEXT,
      importance REAL DEFAULT 0.5,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stm_i_user_date ON stm_interactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_stm_i_timestamp ON stm_interactions(timestamp);

    CREATE TABLE IF NOT EXISTS stm_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL DEFAULT 0.5,
      source TEXT NOT NULL DEFAULT 'inferred',
      context TEXT,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stm_p_user_date ON stm_preferences(user_id, date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_stm_p_user_date_cat_key ON stm_preferences(user_id, date, category, key);

    CREATE TABLE IF NOT EXISTS stm_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_at INTEGER,
      completed_at INTEGER,
      related_skill_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stm_t_user_status ON stm_tasks(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_stm_t_created ON stm_tasks(created_at);

    CREATE TABLE IF NOT EXISTS stm_daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_stm_ds_user_date ON stm_daily_summaries(user_id, date);
  `);
}

function getDb(): import("node:sqlite").DatabaseSync | null {
  if (!sqliteModule) {
    logger.warn("[ShortTermDb] node:sqlite not available, using in-memory fallback");
    return null;
  }
  try {
    const db = new sqliteModule.DatabaseSync(getDbPath());
    initDb(db);
    return db;
  } catch (err) {
    logger.error("[ShortTermDb] Failed to open SQLite DB:", err);
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

export function closeShortTermDb(): void {
  if (dbInstance) {
    try {
      dbInstance.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      dbInstance.close();
      logger.info("[ShortTermDb] Database closed");
      dbInstance = null;
    } catch (err) {
      logger.error("[ShortTermDb] Failed to close database:", err);
    }
  }
}

// ── In-Memory Fallback ──────────────────────────────────────────────────────

interface MemInteraction extends Interaction {}
interface MemPreference extends Preference {}
interface MemTask extends Task {}
interface MemDailySummary {
  userId: string;
  date: string;
  summary: string;
  timestamp: number;
}

const memInteractions = new Map<string, MemInteraction[]>(); // key: userId:date
const memPreferences = new Map<string, MemPreference[]>();   // key: userId:date
const memTasks = new Map<string, MemTask[]>();               // key: userId
const memSummaries = new Map<string, MemDailySummary>();     // key: userId:date

function getMemKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

function getMemInteractions(userId: string, date: string): MemInteraction[] {
  return memInteractions.get(getMemKey(userId, date)) || [];
}

function getMemPreferences(userId: string, date: string): MemPreference[] {
  return memPreferences.get(getMemKey(userId, date)) || [];
}

function getMemTasks(userId: string): MemTask[] {
  return memTasks.get(userId) || [];
}

// ── Row Mappers ─────────────────────────────────────────────────────────────

function mapInteractionRow(row: any): Interaction {
  return {
    id: String(row.id),
    timestamp: row.timestamp,
    type: row.type,
    content: row.content,
    skillId: row.skill_id || undefined,
    skillName: row.skill_name || undefined,
    outcome: row.outcome || undefined,
    userFeedback: row.user_feedback || undefined,
    importance: row.importance ?? 0.5,
  };
}

function mapPreferenceRow(row: any): Preference {
  return {
    id: String(row.id),
    category: row.category,
    key: row.key,
    value: JSON.parse(row.value),
    confidence: row.confidence,
    source: row.source,
    timestamp: row.timestamp,
    context: row.context || undefined,
  };
}

function mapTaskRow(row: any): Task {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || undefined,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    dueAt: row.due_at || undefined,
    completedAt: row.completed_at || undefined,
    relatedSkillId: row.related_skill_id || undefined,
  };
}

// ── Public Interface ────────────────────────────────────────────────────────

export interface ShortTermDb {
  // Interactions
  getInteractions(userId: string, date: string, options?: { sortBy?: 'time' | 'importance'; limit?: number }): Promise<Interaction[]>;
  addInteraction(userId: string, date: string, interaction: Omit<Interaction, "id" | "timestamp">): Promise<Interaction>;
  countInteractions(userId: string, date: string): Promise<number>;
  pruneInteractions(userId: string, date: string, keep: number): Promise<void>;

  // Preferences
  getPreferences(userId: string, date: string): Promise<Preference[]>;
  upsertPreference(userId: string, date: string, pref: Omit<Preference, "id" | "timestamp">): Promise<Preference>;

  // Tasks
  getTasks(userId: string, status?: string): Promise<Task[]>;
  addTask(userId: string, task: Omit<Task, "id" | "createdAt">): Promise<Task>;
  updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task | null>;
  deleteTask(userId: string, taskId: string): Promise<boolean>;

  // Daily summaries
  setDailySummary(userId: string, date: string, summary: string): Promise<void>;
  getDailySummary(userId: string, date: string): Promise<string | null>;

  // Cleanup
  clearDay(userId: string, date: string): Promise<void>;
  clearAllUserMemory(userId: string): Promise<void>;
  cleanupOldMemory(cutoffDate: string): Promise<void>;
}

class SqliteShortTermDb implements ShortTermDb {
  // Interactions
  async getInteractions(userId: string, date: string, options?: { sortBy?: 'time' | 'importance'; limit?: number }): Promise<Interaction[]> {
    const database = db();
    if (!database) return getMemInteractions(userId, date);
    try {
      const sortBy = options?.sortBy || 'time';
      const limit = options?.limit;
      const orderClause = sortBy === 'importance'
        ? 'ORDER BY importance DESC, timestamp DESC'
        : 'ORDER BY timestamp ASC';
      const sql = limit
        ? `SELECT * FROM stm_interactions WHERE user_id = ? AND date = ? ${orderClause} LIMIT ?`
        : `SELECT * FROM stm_interactions WHERE user_id = ? AND date = ? ${orderClause}`;
      const stmt = database.prepare(sql);
      const rows = limit
        ? (stmt.all(userId, date, limit) as any[])
        : (stmt.all(userId, date) as any[]);
      return rows.map(mapInteractionRow);
    } catch (err) {
      logger.error("[ShortTermDb] getInteractions failed:", err);
      return getMemInteractions(userId, date);
    }
  }

  async addInteraction(
    userId: string,
    date: string,
    interaction: Omit<Interaction, "id" | "timestamp">
  ): Promise<Interaction> {
    const now = Date.now();
    const database = db();
    if (database) {
      try {
        const stmt = database.prepare(`
          INSERT INTO stm_interactions
          (user_id, date, type, content, skill_id, skill_name, outcome, user_feedback, importance, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          userId,
          date,
          interaction.type,
          interaction.content,
          interaction.skillId || null,
          interaction.skillName || null,
          interaction.outcome || null,
          interaction.userFeedback || null,
          interaction.importance ?? 0.5,
          now
        );
        const row = database.prepare(`SELECT * FROM stm_interactions WHERE rowid = last_insert_rowid()`).get() as any;
        return mapInteractionRow(row);
      } catch (err) {
        logger.error("[ShortTermDb] addInteraction failed:", err);
      }
    }
    // Fallback
    const newInt: MemInteraction = {
      ...interaction,
      id: `int-${now}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: now,
    };
    const key = getMemKey(userId, date);
    const list = memInteractions.get(key) || [];
    list.push(newInt);
    memInteractions.set(key, list);
    return newInt;
  }

  async countInteractions(userId: string, date: string): Promise<number> {
    const database = db();
    if (!database) return getMemInteractions(userId, date).length;
    try {
      const row = database.prepare(`SELECT COUNT(*) as count FROM stm_interactions WHERE user_id = ? AND date = ?`).get(userId, date) as any;
      return row?.count || 0;
    } catch (err) {
      logger.error("[ShortTermDb] countInteractions failed:", err);
      return getMemInteractions(userId, date).length;
    }
  }

  async pruneInteractions(userId: string, date: string, keep: number): Promise<void> {
    const database = db();
    if (database) {
      try {
        database.prepare(`
          DELETE FROM stm_interactions
          WHERE id IN (
            SELECT id FROM stm_interactions
            WHERE user_id = ? AND date = ?
            ORDER BY timestamp ASC
            LIMIT (SELECT MAX(0, COUNT(*) - ?) FROM stm_interactions WHERE user_id = ? AND date = ?)
          )
        `).run(userId, date, keep, userId, date);
      } catch (err) {
        logger.error("[ShortTermDb] pruneInteractions failed:", err);
      }
      return;
    }
    // Fallback
    const key = getMemKey(userId, date);
    const list = memInteractions.get(key) || [];
    if (list.length > keep) {
      memInteractions.set(key, list.slice(-keep));
    }
  }

  // Preferences
  async getPreferences(userId: string, date: string): Promise<Preference[]> {
    const database = db();
    if (!database) return getMemPreferences(userId, date);
    try {
      const rows = database.prepare(`SELECT * FROM stm_preferences WHERE user_id = ? AND date = ? ORDER BY timestamp ASC`).all(userId, date) as any[];
      return rows.map(mapPreferenceRow);
    } catch (err) {
      logger.error("[ShortTermDb] getPreferences failed:", err);
      return getMemPreferences(userId, date);
    }
  }

  async upsertPreference(
    userId: string,
    date: string,
    pref: Omit<Preference, "id" | "timestamp">
  ): Promise<Preference> {
    const now = Date.now();
    const database = db();
    if (database) {
      try {
        // Check existing for confidence boost
        const existing = database.prepare(
          `SELECT * FROM stm_preferences WHERE user_id = ? AND date = ? AND category = ? AND key = ?`
        ).get(userId, date, pref.category, pref.key) as any;

        let confidence = pref.confidence;
        if (existing && existing.value === JSON.stringify(pref.value)) {
          confidence = Math.min(1, existing.confidence + 0.1);
        }

        const stmt = database.prepare(`
          INSERT INTO stm_preferences (user_id, date, category, key, value, confidence, source, context, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, date, category, key) DO UPDATE SET
            value = excluded.value,
            confidence = excluded.confidence,
            source = excluded.source,
            context = excluded.context,
            timestamp = excluded.timestamp
        `);
        stmt.run(userId, date, pref.category, pref.key, JSON.stringify(pref.value), confidence, pref.source, pref.context || null, now);

        const row = database.prepare(
          `SELECT * FROM stm_preferences WHERE user_id = ? AND date = ? AND category = ? AND key = ?`
        ).get(userId, date, pref.category, pref.key) as any;
        return mapPreferenceRow(row);
      } catch (err) {
        logger.error("[ShortTermDb] upsertPreference failed:", err);
      }
    }
    // Fallback
    const key = getMemKey(userId, date);
    const list = memPreferences.get(key) || [];
    const existingIndex = list.findIndex((p) => p.category === pref.category && p.key === pref.key);
    let confidence = pref.confidence;
    if (existingIndex >= 0) {
      if (list[existingIndex].value === pref.value) {
        confidence = Math.min(1, list[existingIndex].confidence + 0.1);
      }
      const newPref: MemPreference = {
        ...pref,
        id: list[existingIndex].id,
        timestamp: now,
        confidence,
      };
      list[existingIndex] = newPref;
      memPreferences.set(key, list);
      return newPref;
    }
    const newPref: MemPreference = {
      ...pref,
      id: `pref-${now}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: now,
      confidence,
    };
    list.push(newPref);
    memPreferences.set(key, list);
    return newPref;
  }

  // Tasks
  async getTasks(userId: string, status?: string): Promise<Task[]> {
    const database = db();
    if (!database) {
      const tasks = getMemTasks(userId);
      const filtered = status ? tasks.filter((t) => t.status === status) : tasks;
      return sortTasks(filtered);
    }
    try {
      const rows = status
        ? (database.prepare(`SELECT * FROM stm_tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC`).all(userId, status) as any[])
        : (database.prepare(`SELECT * FROM stm_tasks WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[]);
      return sortTasks(rows.map(mapTaskRow));
    } catch (err) {
      logger.error("[ShortTermDb] getTasks failed:", err);
      const tasks = getMemTasks(userId);
      return sortTasks(status ? tasks.filter((t) => t.status === status) : tasks);
    }
  }

  async addTask(userId: string, task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const now = Date.now();
    const database = db();
    if (database) {
      try {
        const stmt = database.prepare(`
          INSERT INTO stm_tasks (user_id, title, description, status, priority, due_at, completed_at, related_skill_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          userId,
          task.title,
          task.description || null,
          task.status,
          task.priority,
          task.dueAt || null,
          task.completedAt || null,
          task.relatedSkillId || null,
          now
        );
        const row = database.prepare(`SELECT * FROM stm_tasks WHERE rowid = last_insert_rowid()`).get() as any;
        return mapTaskRow(row);
      } catch (err) {
        logger.error("[ShortTermDb] addTask failed:", err);
      }
    }
    // Fallback
    const newTask: MemTask = {
      ...task,
      id: `task-${now}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: now,
    };
    const list = getMemTasks(userId);
    list.push(newTask);
    memTasks.set(userId, list);
    return newTask;
  }

  async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const database = db();
    if (database) {
      try {
        const sets: string[] = [];
        const values: any[] = [];
        if (updates.title !== undefined) { sets.push("title = ?"); values.push(updates.title); }
        if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description); }
        if (updates.status !== undefined) { sets.push("status = ?"); values.push(updates.status); }
        if (updates.priority !== undefined) { sets.push("priority = ?"); values.push(updates.priority); }
        if (updates.dueAt !== undefined) { sets.push("due_at = ?"); values.push(updates.dueAt ?? null); }
        if (updates.completedAt !== undefined) { sets.push("completed_at = ?"); values.push(updates.completedAt ?? null); }
        if (updates.relatedSkillId !== undefined) { sets.push("related_skill_id = ?"); values.push(updates.relatedSkillId); }
        if (sets.length === 0) {
          const row = database.prepare(`SELECT * FROM stm_tasks WHERE id = ? AND user_id = ?`).get(taskId, userId) as any;
          return row ? mapTaskRow(row) : null;
        }
        values.push(taskId, userId);
        database.prepare(`UPDATE stm_tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`).run(...values);
        const row = database.prepare(`SELECT * FROM stm_tasks WHERE id = ? AND user_id = ?`).get(taskId, userId) as any;
        return row ? mapTaskRow(row) : null;
      } catch (err) {
        logger.error("[ShortTermDb] updateTask failed:", err);
      }
    }
    // Fallback
    const list = getMemTasks(userId);
    const index = list.findIndex((t) => t.id === taskId);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    memTasks.set(userId, list);
    return list[index];
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    const database = db();
    if (database) {
      try {
        const result = database.prepare(`DELETE FROM stm_tasks WHERE id = ? AND user_id = ?`).run(taskId, userId);
        return (result.changes ?? 0) > 0;
      } catch (err) {
        logger.error("[ShortTermDb] deleteTask failed:", err);
      }
    }
    // Fallback
    const list = getMemTasks(userId);
    const newList = list.filter((t) => t.id !== taskId);
    memTasks.set(userId, newList);
    return newList.length < list.length;
  }

  // Daily summaries
  async setDailySummary(userId: string, date: string, summary: string): Promise<void> {
    const now = Date.now();
    const database = db();
    if (database) {
      try {
        database.prepare(`
          INSERT INTO stm_daily_summaries (user_id, date, summary, timestamp)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET
            summary = excluded.summary,
            timestamp = excluded.timestamp
        `).run(userId, date, summary, now);
      } catch (err) {
        logger.error("[ShortTermDb] setDailySummary failed:", err);
      }
      return;
    }
    memSummaries.set(getMemKey(userId, date), { userId, date, summary, timestamp: now });
  }

  async getDailySummary(userId: string, date: string): Promise<string | null> {
    const database = db();
    if (database) {
      try {
        const row = database.prepare(`SELECT summary FROM stm_daily_summaries WHERE user_id = ? AND date = ?`).get(userId, date) as any;
        return row?.summary || null;
      } catch (err) {
        logger.error("[ShortTermDb] getDailySummary failed:", err);
      }
    }
    return memSummaries.get(getMemKey(userId, date))?.summary || null;
  }

  // Cleanup
  async clearDay(userId: string, date: string): Promise<void> {
    const database = db();
    if (database) {
      try {
        database.prepare(`DELETE FROM stm_interactions WHERE user_id = ? AND date = ?`).run(userId, date);
        database.prepare(`DELETE FROM stm_preferences WHERE user_id = ? AND date = ?`).run(userId, date);
        database.prepare(`DELETE FROM stm_daily_summaries WHERE user_id = ? AND date = ?`).run(userId, date);
      } catch (err) {
        logger.error("[ShortTermDb] clearDay failed:", err);
      }
      return;
    }
    const key = getMemKey(userId, date);
    memInteractions.delete(key);
    memPreferences.delete(key);
    memSummaries.delete(key);
  }

  async clearAllUserMemory(userId: string): Promise<void> {
    const database = db();
    if (database) {
      try {
        database.prepare(`DELETE FROM stm_interactions WHERE user_id = ?`).run(userId);
        database.prepare(`DELETE FROM stm_preferences WHERE user_id = ?`).run(userId);
        database.prepare(`DELETE FROM stm_tasks WHERE user_id = ?`).run(userId);
        database.prepare(`DELETE FROM stm_daily_summaries WHERE user_id = ?`).run(userId);
      } catch (err) {
        logger.error("[ShortTermDb] clearAllUserMemory failed:", err);
      }
      return;
    }
    for (const key of memInteractions.keys()) {
      if (key.startsWith(`${userId}:`)) memInteractions.delete(key);
    }
    for (const key of memPreferences.keys()) {
      if (key.startsWith(`${userId}:`)) memPreferences.delete(key);
    }
    for (const key of memSummaries.keys()) {
      if (key.startsWith(`${userId}:`)) memSummaries.delete(key);
    }
    memTasks.delete(userId);
  }

  async cleanupOldMemory(cutoffDate: string): Promise<void> {
    const database = db();
    if (database) {
      try {
        database.prepare(`DELETE FROM stm_interactions WHERE date < ?`).run(cutoffDate);
        database.prepare(`DELETE FROM stm_preferences WHERE date < ?`).run(cutoffDate);
        database.prepare(`DELETE FROM stm_daily_summaries WHERE date < ?`).run(cutoffDate);
      } catch (err) {
        logger.error("[ShortTermDb] cleanupOldMemory failed:", err);
      }
      return;
    }
    for (const [key, value] of memInteractions.entries()) {
      if (key.split(":").slice(1).join(":") < cutoffDate) memInteractions.delete(key);
    }
    for (const [key, value] of memPreferences.entries()) {
      if (key.split(":").slice(1).join(":") < cutoffDate) memPreferences.delete(key);
    }
    for (const [key, value] of memSummaries.entries()) {
      if (key.split(":").slice(1).join(":") < cutoffDate) memSummaries.delete(key);
    }
  }
}

function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tasks.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createdAt - b.createdAt;
  });
}

// Singleton instance
let dbInstanceSingleton: ShortTermDb | null = null;

export function getShortTermDb(): ShortTermDb {
  if (!dbInstanceSingleton) {
    dbInstanceSingleton = new SqliteShortTermDb();
  }
  return dbInstanceSingleton;
}
