/**
 * Calendar SQLite Database Layer
 *
 * Persistent SQLite-backed storage for calendar events.
 * Falls back to in-memory Map when node:sqlite is unavailable.
 */

import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { logger } from "../utils/logger.js";
import { getMineEchoHome } from "../utils/config-path.js";

// Lazy-loaded sqlite module
let sqliteModule: typeof import("node:sqlite") | null = null;
try {
  sqliteModule = await import("node:sqlite");
} catch {
  sqliteModule = null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: number;
  endAt: number | null;
  type: "meeting" | "commitment" | "personal";
  sourceId: string | null;
  description: string | null;
  createdAt: number;
}

function getDbPath(): string {
  const dbDir = getMineEchoHome();
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "calendar.db");
}

function initDb(database: import("node:sqlite").DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_at INTEGER NOT NULL,
      end_at INTEGER,
      type TEXT NOT NULL,
      source_id TEXT,
      description TEXT,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_calendar_start_at ON calendar_events(start_at);
    CREATE INDEX IF NOT EXISTS idx_calendar_type ON calendar_events(type);
    CREATE INDEX IF NOT EXISTS idx_calendar_source_id ON calendar_events(source_id);
  `);
}

function getDb(): import("node:sqlite").DatabaseSync | null {
  if (!sqliteModule) {
    logger.warn("[CalendarDb] node:sqlite not available, using in-memory fallback");
    return null;
  }
  try {
    const db = new sqliteModule.DatabaseSync(getDbPath());
    initDb(db);
    return db;
  } catch (err) {
    logger.error("[CalendarDb] Failed to open SQLite DB:", err);
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

// ── In-Memory Fallback ──────────────────────────────────────────────────────

const memEvents = new Map<string, CalendarEvent>();

// ── Row Mapper ──────────────────────────────────────────────────────────────

function mapEventRow(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at || null,
    type: row.type,
    sourceId: row.source_id || null,
    description: row.description || null,
    createdAt: row.created_at,
  };
}

// ── Public Interface ────────────────────────────────────────────────────────

export function createCalendarEvent(data: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent {
  const now = Date.now();
  const id = `cal-${now}-${Math.random().toString(36).slice(2, 9)}`;
  const event: CalendarEvent = {
    id,
    title: data.title,
    startAt: data.startAt,
    endAt: data.endAt || null,
    type: data.type,
    sourceId: data.sourceId || null,
    description: data.description || null,
    createdAt: now,
  };

  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO calendar_events (id, title, start_at, end_at, type, source_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        event.id,
        event.title,
        event.startAt,
        event.endAt,
        event.type,
        event.sourceId,
        event.description,
        event.createdAt
      );
      return event;
    } catch (err) {
      logger.error("[CalendarDb] createCalendarEvent failed:", err);
    }
  }

  memEvents.set(id, event);
  return event;
}

export function getCalendarEvent(id: string): CalendarEvent | null {
  const database = db();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM calendar_events WHERE id = ?`).get(id) as any;
      return row ? mapEventRow(row) : null;
    } catch (err) {
      logger.error("[CalendarDb] getCalendarEvent failed:", err);
    }
  }
  return memEvents.get(id) || null;
}

export function listCalendarEvents(options?: { start?: number; end?: number; type?: string }): CalendarEvent[] {
  const database = db();
  if (database) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      if (options?.start !== undefined) {
        conditions.push("start_at >= ?");
        values.push(options.start);
      }
      if (options?.end !== undefined) {
        conditions.push("start_at <= ?");
        values.push(options.end);
      }
      if (options?.type) {
        conditions.push("type = ?");
        values.push(options.type);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const rows = database.prepare(`SELECT * FROM calendar_events ${whereClause} ORDER BY start_at DESC`).all(...values) as any[];
      return rows.map(mapEventRow);
    } catch (err) {
      logger.error("[CalendarDb] listCalendarEvents failed:", err);
    }
  }
  let events = Array.from(memEvents.values());
  if (options?.start !== undefined) {
    events = events.filter((e) => e.startAt >= options.start!);
  }
  if (options?.end !== undefined) {
    events = events.filter((e) => e.startAt <= options.end!);
  }
  if (options?.type) {
    events = events.filter((e) => e.type === options.type);
  }
  return events.sort((a, b) => b.startAt - a.startAt);
}

export function updateCalendarEvent(id: string, partial: Partial<Omit<CalendarEvent, "id" | "createdAt">>): void {
  const database = db();
  if (database) {
    try {
      const sets: string[] = [];
      const values: any[] = [];
      if (partial.title !== undefined) { sets.push("title = ?"); values.push(partial.title); }
      if (partial.startAt !== undefined) { sets.push("start_at = ?"); values.push(partial.startAt); }
      if (partial.endAt !== undefined) { sets.push("end_at = ?"); values.push(partial.endAt); }
      if (partial.type !== undefined) { sets.push("type = ?"); values.push(partial.type); }
      if (partial.sourceId !== undefined) { sets.push("source_id = ?"); values.push(partial.sourceId); }
      if (partial.description !== undefined) { sets.push("description = ?"); values.push(partial.description); }
      if (sets.length === 0) return;
      values.push(id);
      database.prepare(`UPDATE calendar_events SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return;
    } catch (err) {
      logger.error("[CalendarDb] updateCalendarEvent failed:", err);
    }
  }

  const existing = memEvents.get(id);
  if (existing) {
    memEvents.set(id, { ...existing, ...partial });
  }
}

export function deleteCalendarEvent(id: string): void {
  const database = db();
  if (database) {
    try {
      database.prepare(`DELETE FROM calendar_events WHERE id = ?`).run(id);
      return;
    } catch (err) {
      logger.error("[CalendarDb] deleteCalendarEvent failed:", err);
    }
  }
  memEvents.delete(id);
}
