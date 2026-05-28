/**
 * Local message store for chat history persistence.
 * Stores messages per session in JSON files so history survives Gateway restarts.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";
import { logger } from "../utils/logger.js";

export interface StoredMessage {
  id?: string;
  role: string;
  content: string;
  ts?: number;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

const MAX_MESSAGES_PER_SESSION = 500;
const MAX_SESSION_FILES = 100;

function getStoreDir(): string {
  const dir = join(getMineEchoHome(), "chat-history");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getSessionFile(sessionId: string): string {
  // Sanitize sessionId for filesystem safety
  const safeId = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(getStoreDir(), `${safeId}.json`);
}

function cleanupOldSessions(): void {
  try {
    const dir = getStoreDir();
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: join(dir, f),
        mtime: existsSync(join(dir, f))
          ? (require("node:fs").statSync(join(dir, f)).mtimeMs)
          : 0,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > MAX_SESSION_FILES) {
      for (const f of files.slice(MAX_SESSION_FILES)) {
        try {
          unlinkSync(f.path);
        } catch {}
      }
      logger.info(`[MessageStore] Cleaned up old sessions, kept ${MAX_SESSION_FILES}`);
    }
  } catch {
    // ignore cleanup errors
  }
}

export function loadMessages(sessionId: string): StoredMessage[] {
  try {
    const file = getSessionFile(sessionId);
    if (!existsSync(file)) return [];
    const raw = readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    logger.warn("[MessageStore] Failed to load messages:", { sessionId, error: (e as Error).message });
    return [];
  }
}

export function saveMessages(sessionId: string, messages: StoredMessage[]): void {
  try {
    const file = getSessionFile(sessionId);
    // Keep only last N messages
    const trimmed = messages.slice(-MAX_MESSAGES_PER_SESSION);
    writeFileSync(file, JSON.stringify(trimmed, null, 2), "utf-8");
    cleanupOldSessions();
  } catch (e) {
    logger.warn("[MessageStore] Failed to save messages:", { sessionId, error: (e as Error).message });
  }
}

export function appendMessage(sessionId: string, message: StoredMessage): void {
  const messages = loadMessages(sessionId);
  messages.push(message);
  saveMessages(sessionId, messages);
}

export function clearMessages(sessionId: string): void {
  try {
    const file = getSessionFile(sessionId);
    if (existsSync(file)) {
      unlinkSync(file);
    }
  } catch (e) {
    logger.warn("[MessageStore] Failed to clear messages:", { sessionId, error: (e as Error).message });
  }
}
