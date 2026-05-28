/**
 * User SQLite Database Layer
 *
 * Persistent SQLite-backed storage for users, accounts, invitations, and usage records.
 */

import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import { getMineEchoHome } from "../utils/config-path.js";

// Lazy-loaded sqlite module
let sqliteModule: typeof import("node:sqlite") | null = null;
try {
  sqliteModule = await import("node:sqlite");
} catch {
  sqliteModule = null;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: "personal" | "team" | "enterprise";
  quota: number;          // Total quota in tokens
  usedQuota: number;      // Used quota in tokens
  monthlyQuota: number;   // Monthly reset quota
  monthlyUsedQuota: number;
  monthlyResetAt: number; // Timestamp when quota was last reset
  status: "active" | "suspended" | "deleted";
  createdAt: number;
  updatedAt: number;
}

export interface Invitation {
  id: string;
  code: string;
  createdBy: string;       // User ID who created the invitation
  usedBy: string | null;  // User ID who used the invitation (first user)
  type: "trial" | "subscription" | "admin";
  quota: number;          // Quota granted by this invitation
  status: "pending" | "used" | "expired" | "revoked";
  expiresAt: number;       // Expiration timestamp
  createdAt: number;
  usedAt: number | null;
  maxUses: number;        // Maximum number of uses
  useCount: number;       // Current use count
}

export interface UsageRecord {
  id: string;
  accountId: string;
  type: "chat" | "transcription" | "summary" | "skill" | "other";
  tokens: number;
  metadata: string | null; // JSON string for additional data
  createdAt: number;
}

// ── Database Path ────────────────────────────────────────────────────────────

function getDbPath(): string {
  const dbDir = getMineEchoHome();
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "users.db");
}

// ── Database Initialization ───────────────────────────────────────────────────

function initDb(database: import("node:sqlite").DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'personal',
      quota INTEGER NOT NULL DEFAULT 100000,
      used_quota INTEGER NOT NULL DEFAULT 0,
      monthly_quota INTEGER NOT NULL DEFAULT 100000,
      monthly_used_quota INTEGER NOT NULL DEFAULT 0,
      monthly_reset_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      created_by TEXT NOT NULL,
      used_by TEXT,
      type TEXT NOT NULL DEFAULT 'trial',
      quota INTEGER NOT NULL DEFAULT 10000,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      used_at INTEGER,
      max_uses INTEGER NOT NULL DEFAULT 1,
      use_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
    CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      tokens INTEGER NOT NULL DEFAULT 0,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
    CREATE INDEX IF NOT EXISTS idx_usage_records_account_id ON usage_records(account_id);
    CREATE INDEX IF NOT EXISTS idx_usage_records_type ON usage_records(type);
    CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);
  `);

  // Migration: Add max_uses and use_count columns if they don't exist
  try {
    const columns = database.prepare("PRAGMA table_info(invitations)").all() as { name: string }[];
    const columnNames = columns.map(c => c.name);
    if (!columnNames.includes('max_uses')) {
      database.exec("ALTER TABLE invitations ADD COLUMN max_uses INTEGER NOT NULL DEFAULT 1");
    }
    if (!columnNames.includes('use_count')) {
      database.exec("ALTER TABLE invitations ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0");
    }
  } catch (err) {
    logger.warn("[UserDb] Migration for invitations columns failed:", err);
  }
}

function getDb(): import("node:sqlite").DatabaseSync | null {
  if (!sqliteModule) {
    logger.warn("[UserDb] node:sqlite not available, using in-memory fallback");
    return null;
  }
  try {
    const db = new sqliteModule.DatabaseSync(getDbPath());
    initDb(db);
    return db;
  } catch (err) {
    logger.error("[UserDb] Failed to open SQLite DB:", err);
    return null;
  }
}

let dbInstance: import("node:sqlite").DatabaseSync | null = null;

export function getUserDb(): import("node:sqlite").DatabaseSync | null {
  if (!dbInstance) {
    dbInstance = getDb();
  }
  return dbInstance;
}

// ── In-Memory Fallback ───────────────────────────────────────────────────────

const memUsers = new Map<string, User>();
const memAccounts = new Map<string, Account>();
const memInvitations = new Map<string, Invitation>();
const memUsageRecords: UsageRecord[] = [];

// ── Row Mappers ──────────────────────────────────────────────────────────────

function mapUserRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAccountRow(row: any): Account {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    quota: row.quota,
    usedQuota: row.used_quota,
    monthlyQuota: row.monthly_quota,
    monthlyUsedQuota: row.monthly_used_quota,
    monthlyResetAt: row.monthly_reset_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvitationRow(row: any): Invitation {
  return {
    id: row.id,
    code: row.code,
    createdBy: row.created_by,
    usedBy: row.used_by || null,
    type: row.type,
    quota: row.quota,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    usedAt: row.used_at || null,
    maxUses: row.max_uses || 1,
    useCount: row.use_count || 0,
  };
}

function mapUsageRecordRow(row: any): UsageRecord {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    tokens: row.tokens,
    metadata: row.metadata || null,
    createdAt: row.created_at,
  };
}

// ── User Operations ───────────────────────────────────────────────────────────

export function createUser(data: { email: string; name: string; passwordHash: string }): User {
  const now = Date.now();
  const user: User = {
    id: randomUUID(),
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash: data.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const database = getUserDb();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(user.id, user.email, user.name, user.passwordHash, user.createdAt, user.updatedAt);
      return user;
    } catch (err) {
      logger.error("[UserDb] createUser failed:", err);
      throw err;
    }
  }

  memUsers.set(user.id, user);
  return user;
}

export function getUserByEmail(email: string): User | null {
  const database = getUserDb();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as any;
      return row ? mapUserRow(row) : null;
    } catch (err) {
      logger.error("[UserDb] getUserByEmail failed:", err);
      return null;
    }
  }

  for (const user of memUsers.values()) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  return null;
}

export function getUserById(id: string): User | null {
  const database = getUserDb();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any;
      return row ? mapUserRow(row) : null;
    } catch (err) {
      logger.error("[UserDb] getUserById failed:", err);
      return null;
    }
  }

  return memUsers.get(id) || null;
}

// ── Account Operations ───────────────────────────────────────────────────────

export function createAccount(data: {
  userId: string;
  name: string;
  type?: "personal" | "team" | "enterprise";
  quota?: number;
}): Account {
  const now = Date.now();
  const account: Account = {
    id: randomUUID(),
    userId: data.userId,
    name: data.name,
    type: data.type || "personal",
    quota: data.quota || 100000,
    usedQuota: 0,
    monthlyQuota: data.quota || 100000,
    monthlyUsedQuota: 0,
    monthlyResetAt: now,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const database = getUserDb();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO accounts (id, user_id, name, type, quota, used_quota, monthly_quota, monthly_used_quota, monthly_reset_at, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        account.id,
        account.userId,
        account.name,
        account.type,
        account.quota,
        account.usedQuota,
        account.monthlyQuota,
        account.monthlyUsedQuota,
        account.monthlyResetAt,
        account.status,
        account.createdAt,
        account.updatedAt
      );
      return account;
    } catch (err) {
      logger.error("[UserDb] createAccount failed:", err);
      throw err;
    }
  }

  memAccounts.set(account.id, account);
  return account;
}

export function getAccountsByUserId(userId: string): Account[] {
  const database = getUserDb();
  if (database) {
    try {
      const rows = database.prepare(`SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[];
      return rows.map(mapAccountRow);
    } catch (err) {
      logger.error("[UserDb] getAccountsByUserId failed:", err);
      return [];
    }
  }

  const accounts: Account[] = [];
  for (const account of memAccounts.values()) {
    if (account.userId === userId) {
      accounts.push(account);
    }
  }
  return accounts;
}

export function getAccountById(id: string): Account | null {
  const database = getUserDb();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM accounts WHERE id = ?`).get(id) as any;
      return row ? mapAccountRow(row) : null;
    } catch (err) {
      logger.error("[UserDb] getAccountById failed:", err);
      return null;
    }
  }

  return memAccounts.get(id) || null;
}

export function updateAccount(id: string, partial: Partial<Omit<Account, "id" | "userId" | "createdAt">>): void {
  const database = getUserDb();
  if (database) {
    try {
      const sets: string[] = [];
      const values: any[] = [];
      if (partial.name !== undefined) { sets.push("name = ?"); values.push(partial.name); }
      if (partial.type !== undefined) { sets.push("type = ?"); values.push(partial.type); }
      if (partial.quota !== undefined) { sets.push("quota = ?"); values.push(partial.quota); }
      if (partial.usedQuota !== undefined) { sets.push("used_quota = ?"); values.push(partial.usedQuota); }
      if (partial.monthlyQuota !== undefined) { sets.push("monthly_quota = ?"); values.push(partial.monthlyQuota); }
      if (partial.monthlyUsedQuota !== undefined) { sets.push("monthly_used_quota = ?"); values.push(partial.monthlyUsedQuota); }
      if (partial.monthlyResetAt !== undefined) { sets.push("monthly_reset_at = ?"); values.push(partial.monthlyResetAt); }
      if (partial.status !== undefined) { sets.push("status = ?"); values.push(partial.status); }
      if (partial.updatedAt !== undefined) { sets.push("updated_at = ?"); values.push(partial.updatedAt); }
      if (sets.length === 0) return;
      values.push(id);
      database.prepare(`UPDATE accounts SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return;
    } catch (err) {
      logger.error("[UserDb] updateAccount failed:", err);
    }
  }

  const existing = memAccounts.get(id);
  if (existing) {
    memAccounts.set(id, { ...existing, ...partial, updatedAt: Date.now() });
  }
}

export function deleteAccount(id: string): void {
  const database = getUserDb();
  if (database) {
    try {
      database.prepare(`UPDATE accounts SET status = 'deleted' WHERE id = ?`).run(id);
      return;
    } catch (err) {
      logger.error("[UserDb] deleteAccount failed:", err);
    }
  }

  const existing = memAccounts.get(id);
  if (existing) {
    memAccounts.set(id, { ...existing, status: "deleted" });
  }
}

// ── Invitation Operations ────────────────────────────────────────────────────

export function createInvitation(data: {
  code: string;
  createdBy: string;
  type?: "trial" | "subscription" | "admin";
  quota?: number;
  expiresInDays?: number;
  maxUses?: number;
}): Invitation {
  const now = Date.now();
  const daysUntilExpiry = data.expiresInDays ?? 30;
  const maxUsesValue = data.maxUses ?? 1;
  const invitation: Invitation = {
    id: randomUUID(),
    code: data.code.toUpperCase(),
    createdBy: data.createdBy,
    usedBy: null,
    type: data.type || "trial",
    quota: data.quota || 10000,
    status: "pending",
    expiresAt: now + daysUntilExpiry * 24 * 60 * 60 * 1000,
    createdAt: now,
    usedAt: null,
    maxUses: maxUsesValue,
    useCount: 0,
  };

  const database = getUserDb();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO invitations (id, code, created_by, used_by, type, quota, status, expires_at, created_at, used_at, max_uses, use_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        invitation.id,
        invitation.code,
        invitation.createdBy,
        invitation.usedBy,
        invitation.type,
        invitation.quota,
        invitation.status,
        invitation.expiresAt,
        invitation.createdAt,
        invitation.usedAt,
        invitation.maxUses,
        invitation.useCount
      );
      return invitation;
    } catch (err) {
      logger.error("[UserDb] createInvitation failed:", err);
      throw err;
    }
  }

  memInvitations.set(invitation.id, invitation);
  return invitation;
}

export function getInvitationByCode(code: string): Invitation | null {
  const database = getUserDb();
  if (database) {
    try {
      const row = database.prepare(`SELECT * FROM invitations WHERE code = ?`).get(code.toUpperCase()) as any;
      return row ? mapInvitationRow(row) : null;
    } catch (err) {
      logger.error("[UserDb] getInvitationByCode failed:", err);
      return null;
    }
  }

  for (const invitation of memInvitations.values()) {
    if (invitation.code === code.toUpperCase()) {
      return invitation;
    }
  }
  return null;
}

export function getInvitationsByUserId(userId: string): Invitation[] {
  const database = getUserDb();
  if (database) {
    try {
      const rows = database.prepare(`SELECT * FROM invitations WHERE created_by = ? ORDER BY created_at DESC`).all(userId) as any[];
      return rows.map(mapInvitationRow);
    } catch (err) {
      logger.error("[UserDb] getInvitationsByUserId failed:", err);
      return [];
    }
  }

  const invitations: Invitation[] = [];
  for (const invitation of memInvitations.values()) {
    if (invitation.createdBy === userId) {
      invitations.push(invitation);
    }
  }
  return invitations;
}

export function updateInvitation(id: string, partial: Partial<Omit<Invitation, "id" | "code" | "createdBy" | "createdAt">>): void {
  const database = getUserDb();
  if (database) {
    try {
      const sets: string[] = [];
      const values: any[] = [];
      if (partial.usedBy !== undefined) { sets.push("used_by = ?"); values.push(partial.usedBy); }
      if (partial.type !== undefined) { sets.push("type = ?"); values.push(partial.type); }
      if (partial.quota !== undefined) { sets.push("quota = ?"); values.push(partial.quota); }
      if (partial.status !== undefined) { sets.push("status = ?"); values.push(partial.status); }
      if (partial.expiresAt !== undefined) { sets.push("expires_at = ?"); values.push(partial.expiresAt); }
      if (partial.usedAt !== undefined) { sets.push("used_at = ?"); values.push(partial.usedAt); }
      if (partial.useCount !== undefined) { sets.push("use_count = ?"); values.push(partial.useCount); }
      if (partial.maxUses !== undefined) { sets.push("max_uses = ?"); values.push(partial.maxUses); }
      if (sets.length === 0) return;
      values.push(id);
      database.prepare(`UPDATE invitations SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return;
    } catch (err) {
      logger.error("[UserDb] updateInvitation failed:", err);
    }
  }

  const existing = memInvitations.get(id);
  if (existing) {
    memInvitations.set(id, { ...existing, ...partial });
  }
}

// ── Usage Record Operations ──────────────────────────────────────────────────

export function recordUsage(data: {
  accountId: string;
  type: "chat" | "transcription" | "summary" | "skill" | "other";
  tokens: number;
  metadata?: Record<string, unknown>;
}): UsageRecord {
  const now = Date.now();
  const record: UsageRecord = {
    id: randomUUID(),
    accountId: data.accountId,
    type: data.type,
    tokens: data.tokens,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    createdAt: now,
  };

  const database = getUserDb();
  if (database) {
    try {
      const stmt = database.prepare(`
        INSERT INTO usage_records (id, account_id, type, tokens, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(record.id, record.accountId, record.type, record.tokens, record.metadata, record.createdAt);

      // Update account used quota
      database.prepare(`UPDATE accounts SET used_quota = used_quota + ?, monthly_used_quota = monthly_used_quota + ?, updated_at = ? WHERE id = ?`)
        .run(data.tokens, data.tokens, now, data.accountId);

      return record;
    } catch (err) {
      logger.error("[UserDb] recordUsage failed:", err);
      throw err;
    }
  }

  memUsageRecords.push(record);

  // Update in-memory account quota
  const account = memAccounts.get(data.accountId);
  if (account) {
    account.usedQuota += data.tokens;
    account.monthlyUsedQuota += data.tokens;
  }

  return record;
}

export function getUsageByAccountAndType(accountId: string, type: string, since?: number): UsageRecord[] {
  const database = getUserDb();
  if (database) {
    try {
      let query = `SELECT * FROM usage_records WHERE account_id = ? AND type = ?`;
      const params: any[] = [accountId, type];
      if (since) {
        query += ` AND created_at >= ?`;
        params.push(since);
      }
      query += ` ORDER BY created_at DESC`;
      const rows = database.prepare(query).all(...params) as any[];
      return rows.map(mapUsageRecordRow);
    } catch (err) {
      logger.error("[UserDb] getUsageByAccountAndType failed:", err);
      return [];
    }
  }

  return memUsageRecords.filter(r => r.accountId === accountId && r.type === type && (!since || r.createdAt >= since));
}

export function getUsageSumByAccountAndType(accountId: string, type: string, since?: number): number {
  const database = getUserDb();
  if (database) {
    try {
      let query = `SELECT COALESCE(SUM(tokens), 0) as total FROM usage_records WHERE account_id = ? AND type = ?`;
      const params: any[] = [accountId, type];
      if (since) {
        query += ` AND created_at >= ?`;
        params.push(since);
      }
      const row = database.prepare(query).get(...params) as any;
      return row?.total || 0;
    } catch (err) {
      logger.error("[UserDb] getUsageSumByAccountAndType failed:", err);
      return 0;
    }
  }

  return memUsageRecords
    .filter(r => r.accountId === accountId && r.type === type && (!since || r.createdAt >= since))
    .reduce((sum, r) => sum + r.tokens, 0);
}
