/**
 * Meeting SQLite Database Layer
 *
 * Persistent SQLite-backed storage for meetings and commitments.
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

export interface Meeting {
  id: string;
  title: string | null;
  participants: string | null;  // Comma-separated list of participant names
  location: string | null;      // Meeting location/address
  startedAt: number;
  endedAt: number | null;
  durationSec: number | null;
  audioPath: string | null;
  transcript: string | null;
  cleanedTranscript: string | null;  // AI-cleaned version of transcript
  summary: string | null;
  status: "recording" | "transcribing" | "cleaning" | "extracting" | "summarizing" | "completed";
  createdAt: number;
}

export interface CreateMeetingOptions {
  title?: string;
  participants?: string;
  location?: string;
}

export interface Commitment {
  id: string;
  meetingId: string;
  who: string;
  what: string;
  deadline: string | null;
  confidence: number;
  status: "pending" | "done" | "overdue";
  createdAt: number;
}

function getDbPath(): string {
  const dbDir = getMineEchoHome();
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "meetings.db");
}

function initDb(database: import("node:sqlite").DatabaseSync): void {
  // Migration: Add missing columns to existing tables
  const meetingsColumns = database.prepare("PRAGMA table_info(meetings)").all() as { name: string }[];
  const existingColumns = new Set(meetingsColumns.map((c) => c.name));

  const requiredMeetingColumns = [
    { name: "participants", sql: "ALTER TABLE meetings ADD COLUMN participants TEXT" },
    { name: "location", sql: "ALTER TABLE meetings ADD COLUMN location TEXT" },
    { name: "cleaned_transcript", sql: "ALTER TABLE meetings ADD COLUMN cleaned_transcript TEXT" },
  ];

  for (const col of requiredMeetingColumns) {
    if (!existingColumns.has(col.name)) {
      try {
        database.exec(col.sql);
        logger.info(`[MeetingDb] Migration added column: ${col.name}`);
      } catch (err) {
        logger.warn(`[MeetingDb] Migration failed for column ${col.name}:`, err);
      }
    }
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT,
      participants TEXT,
      location TEXT,
      started_at INTEGER,
      ended_at INTEGER,
      duration_sec INTEGER,
      audio_path TEXT,
      transcript TEXT,
      cleaned_transcript TEXT,
      summary TEXT,
      status TEXT,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_meetings_started_at ON meetings(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
    CREATE INDEX IF NOT EXISTS idx_meetings_title ON meetings(title);

    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      meeting_id TEXT,
      who TEXT,
      what TEXT,
      deadline TEXT,
      confidence REAL,
      status TEXT,
      created_at INTEGER,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );
    CREATE INDEX IF NOT EXISTS idx_commitments_meeting_id ON commitments(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
  `);
}

function getDb(): import("node:sqlite").DatabaseSync | null {
  if (!sqliteModule) {
    logger.warn("[MeetingDb] node:sqlite not available, using in-memory fallback");
    return null;
  }
  try {
    const db = new sqliteModule.DatabaseSync(getDbPath());
    initDb(db);
    return db;
  } catch (err) {
    logger.error("[MeetingDb] Failed to open SQLite DB:", err);
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

const memMeetings = new Map<string, Meeting>();
const memCommitments = new Map<string, Commitment[]>(); // key: meetingId

function getMemCommitments(meetingId?: string): Commitment[] {
  if (meetingId) {
    return memCommitments.get(meetingId) || [];
  }
  const all: Commitment[] = [];
  for (const list of memCommitments.values()) {
    all.push(...list);
  }
  return all;
}

// ── Row Mappers ─────────────────────────────────────────────────────────────

function mapMeetingRow(row: any): Meeting {
  return {
    id: row.id,
    title: row.title || null,
    participants: row.participants || null,
    location: row.location || null,
    startedAt: row.started_at,
    endedAt: row.ended_at || null,
    durationSec: row.duration_sec || null,
    audioPath: row.audio_path || null,
    transcript: row.transcript || null,
    cleanedTranscript: row.cleaned_transcript || null,
    summary: row.summary || null,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapCommitmentRow(row: any): Commitment {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    who: row.who,
    what: row.what,
    deadline: row.deadline || null,
    confidence: row.confidence ?? 0.5,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ── Public Interface ────────────────────────────────────────────────────────

export function createMeeting(options?: CreateMeetingOptions): Meeting {
  const now = Date.now();
  const id = `mtg-${now}-${Math.random().toString(36).slice(2, 9)}`;
  const meeting: Meeting = {
    id,
    title: options?.title || null,
    participants: options?.participants || null,
    location: options?.location || null,
    startedAt: now,
    endedAt: null,
    durationSec: null,
    audioPath: null,
    transcript: null,
    cleanedTranscript: null,
    summary: null,
    status: "recording",
    createdAt: now,
  };

  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO meetings (id, title, participants, location, started_at, ended_at, duration_sec, audio_path, transcript, cleaned_transcript, summary, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        meeting.id,
        meeting.title,
        meeting.participants,
        meeting.location,
        meeting.startedAt,
        meeting.endedAt,
        meeting.durationSec,
        meeting.audioPath,
        meeting.transcript,
        meeting.cleanedTranscript,
        meeting.summary,
        meeting.status,
        meeting.createdAt
      );
      return meeting;
    } catch (err) {
      logger.error("[MeetingDb] createMeeting failed:", err);
    }
  }

  memMeetings.set(id, meeting);
  return meeting;
}

export function updateMeeting(id: string, partial: Partial<Omit<Meeting, "id" | "createdAt">>): void {
  const database = db();
  if (database) {
    try {
      const sets: string[] = [];
      const values: any[] = [];
      if (partial.title !== undefined) { sets.push("title = ?"); values.push(partial.title); }
      if (partial.participants !== undefined) { sets.push("participants = ?"); values.push(partial.participants); }
      if (partial.location !== undefined) { sets.push("location = ?"); values.push(partial.location); }
      if (partial.startedAt !== undefined) { sets.push("started_at = ?"); values.push(partial.startedAt); }
      if (partial.endedAt !== undefined) { sets.push("ended_at = ?"); values.push(partial.endedAt); }
      if (partial.durationSec !== undefined) { sets.push("duration_sec = ?"); values.push(partial.durationSec); }
      if (partial.audioPath !== undefined) { sets.push("audio_path = ?"); values.push(partial.audioPath); }
      if (partial.transcript !== undefined) { sets.push("transcript = ?"); values.push(partial.transcript); }
      if (partial.cleanedTranscript !== undefined) { sets.push("cleaned_transcript = ?"); values.push(partial.cleanedTranscript); }
      if (partial.summary !== undefined) { sets.push("summary = ?"); values.push(partial.summary); }
      if (partial.status !== undefined) { sets.push("status = ?"); values.push(partial.status); }
      if (sets.length === 0) return;
      values.push(id);
      database.prepare(`UPDATE meetings SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return;
    } catch (err) {
      logger.error("[MeetingDb] updateMeeting failed:", err);
    }
  }

  const existing = memMeetings.get(id);
  if (existing) {
    memMeetings.set(id, { ...existing, ...partial });
  }
}

export function getMeeting(id: string): Meeting | null {
  const database = db();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM meetings WHERE id = ?`).get(id) as any;
      return row ? mapMeetingRow(row) : null;
    } catch (err) {
      logger.error("[MeetingDb] getMeeting failed:", err);
    }
  }
  return memMeetings.get(id) || null;
}

export function listMeetings(): Meeting[] {
  const database = db();
  if (database) {
    try {
      const rows = database.prepare(`SELECT * FROM meetings ORDER BY started_at DESC`).all() as any[];
      return rows.map(mapMeetingRow);
    } catch (err) {
      logger.error("[MeetingDb] listMeetings failed:", err);
    }
  }
  return Array.from(memMeetings.values()).sort((a, b) => b.startedAt - a.startedAt);
}

export function deleteMeeting(id: string): void {
  const database = db();
  if (database) {
    try {
      database.prepare(`DELETE FROM commitments WHERE meeting_id = ?`).run(id);
      database.prepare(`DELETE FROM meetings WHERE id = ?`).run(id);
      return;
    } catch (err) {
      logger.error("[MeetingDb] deleteMeeting failed:", err);
    }
  }
  memMeetings.delete(id);
  memCommitments.delete(id);
}

export function createCommitment(meetingId: string, data: Omit<Commitment, "id" | "meetingId" | "createdAt">): Commitment {
  const now = Date.now();
  const id = `cmt-${now}-${Math.random().toString(36).slice(2, 9)}`;
  const commitment: Commitment = {
    id,
    meetingId,
    who: data.who,
    what: data.what,
    deadline: data.deadline || null,
    confidence: data.confidence ?? 0.5,
    status: data.status || "pending",
    createdAt: now,
  };

  const database = db();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO commitments (id, meeting_id, who, what, deadline, confidence, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        commitment.id,
        commitment.meetingId,
        commitment.who,
        commitment.what,
        commitment.deadline,
        commitment.confidence,
        commitment.status,
        commitment.createdAt
      );
      return commitment;
    } catch (err) {
      logger.error("[MeetingDb] createCommitment failed:", err);
    }
  }

  const list = memCommitments.get(meetingId) || [];
  list.push(commitment);
  memCommitments.set(meetingId, list);
  return commitment;
}

export function listCommitments(meetingId?: string): Commitment[] {
  const database = db();
  if (database) {
    try {
      if (meetingId) {
        const rows = database.prepare(`SELECT * FROM commitments WHERE meeting_id = ? ORDER BY created_at DESC`).all(meetingId) as any[];
        return rows.map(mapCommitmentRow);
      }
      const rows = database.prepare(`SELECT * FROM commitments ORDER BY created_at DESC`).all() as any[];
      return rows.map(mapCommitmentRow);
    } catch (err) {
      logger.error("[MeetingDb] listCommitments failed:", err);
    }
  }
  return getMemCommitments(meetingId);
}

export function updateCommitment(id: string, partial: Partial<Omit<Commitment, "id" | "meetingId" | "createdAt">>): void {
  const database = db();
  if (database) {
    try {
      const sets: string[] = [];
      const values: any[] = [];
      if (partial.who !== undefined) { sets.push("who = ?"); values.push(partial.who); }
      if (partial.what !== undefined) { sets.push("what = ?"); values.push(partial.what); }
      if (partial.deadline !== undefined) { sets.push("deadline = ?"); values.push(partial.deadline); }
      if (partial.confidence !== undefined) { sets.push("confidence = ?"); values.push(partial.confidence); }
      if (partial.status !== undefined) { sets.push("status = ?"); values.push(partial.status); }
      if (sets.length === 0) return;
      values.push(id);
      database.prepare(`UPDATE commitments SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return;
    } catch (err) {
      logger.error("[MeetingDb] updateCommitment failed:", err);
    }
  }

  for (const [meetingId, list] of memCommitments.entries()) {
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...partial };
      memCommitments.set(meetingId, list);
      return;
    }
  }
}
