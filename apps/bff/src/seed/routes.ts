/**
 * Seed Routes
 *
 * Initializes the database with default data (invitation codes and demo user).
 * This endpoint should be called once during first setup.
 */

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import { getUserDb } from "../db/user-db.js";

export const seedRouter = Router();

// Demo user configuration (for out-of-box experience)
const DEMO_USER = {
  email: "demo@mineecho.ai",
  name: "演示用户",
  // Password: Demo123456 (hashed with bcrypt)
  passwordHash: "$2b$10$DrgT5faqjBUpmC3ZF2VVIuGjrHBxItQktd9LM426m9W.TE99QshS6",
};

const INITIAL_INVITATION_CODES = [
  "MINECHO-88X2",
  "MINECHO-K9P4",
  "MINECHO-M3Q7",
  "MINECHO-R6T1",
  "MINECHO-W5Y8",
  "MINECHO-A1B2",
  "MINECHO-C3D4",
  "MINECHO-E5F6",
  "MINECHO-G7H8",
  "MINECHO-J9K0",
];

/**
 * Check if demo user exists
 */
function getDemoUser(): { id: string; email: string; name: string } | null {
  const db = getUserDb();
  if (!db) return null;

  try {
    const row = db.prepare("SELECT id, email, name FROM users WHERE email = ?").get(DEMO_USER.email) as any;
    return row || null;
  } catch {
    return null;
  }
}

/**
 * Create demo user if not exists
 */
function ensureDemoUser(): { created: boolean; user: { id: string; email: string; name: string } | null } {
  const db = getUserDb();
  if (!db) {
    return { created: false, user: null };
  }

  try {
    const existing = getDemoUser();
    if (existing) {
      return { created: false, user: existing };
    }

    const now = Date.now();
    const userId = randomUUID();

    // Create user
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, DEMO_USER.email, DEMO_USER.name, DEMO_USER.passwordHash, now, now);

    // Create default account for demo user
    db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, quota, used_quota, monthly_quota, monthly_used_quota, monthly_reset_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      userId,
      "默认工作区",
      "personal",
      1000000,  // 1M tokens quota
      0,
      1000000,
      0,
      now,
      "active",
      now,
      now
    );

    logger.info(`[Seed] Demo user created: ${DEMO_USER.email}`);

    return { created: true, user: { id: userId, email: DEMO_USER.email, name: DEMO_USER.name } };
  } catch (err) {
    logger.error("[Seed] Failed to create demo user:", err);
    return { created: false, user: null };
  }
}

/**
 * GET /api/seed/status
 * Check if seeding has been done
 */
seedRouter.get("/status", (_req, res) => {
  const db = getUserDb();
  if (!db) {
    return res.json({ seeded: false, error: "Database not available" });
  }

  try {
    const invitations = db
      .prepare("SELECT code FROM invitations")
      .all() as { code: string }[];

    const seededCodes = invitations.map((i) => i.code);
    const hasInitialCodes = INITIAL_INVITATION_CODES.every((c) =>
      seededCodes.includes(c)
    );

    res.json({
      seeded: hasInitialCodes,
      codes: hasInitialCodes ? INITIAL_INVITATION_CODES : seededCodes,
    });
  } catch (err) {
    logger.error("[Seed] Status check failed:", err);
    res.status(500).json({ seeded: false, error: "查询失败" });
  }
});

/**
 * POST /api/seed/init
 * Seed the database with initial invitation codes and demo user
 * This is idempotent - running multiple times is safe
 */
seedRouter.post("/init", (_req, res) => {
  const db = getUserDb();
  if (!db) {
    return res.status(503).json({
      success: false,
      error: "数据库不可用",
    });
  }

  try {
    // Ensure demo user exists
    const demoUserResult = ensureDemoUser();

    const existing = db
      .prepare("SELECT code FROM invitations")
      .all() as { code: string }[];

    const existingCodes = new Set(existing.map((r) => r.code));
    const alreadySeeded = INITIAL_INVITATION_CODES.every((c) =>
      existingCodes.has(c)
    );

    const newCodes: string[] = [];

    if (!alreadySeeded) {
      // Disable foreign keys for SYSTEM user (initial seed)
      db.exec("PRAGMA foreign_keys=OFF");

      for (const code of INITIAL_INVITATION_CODES) {
        if (!existingCodes.has(code)) {
          const stmt = db.prepare(`
            INSERT OR IGNORE INTO invitations
            (id, code, created_by, used_by, type, quota, status, expires_at, created_at, used_at, max_uses, use_count)
            VALUES (?, ?, 'SYSTEM', NULL, 'trial', 100000, 'pending', ?, ?, NULL, 10, 0)
          `);

          const now = Date.now();
          const expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 1 year expiry
          stmt.run(
            `seed-${code}`,
            code,
            expiresAt,
            now
          );
          newCodes.push(code);
        }
      }

      db.exec("PRAGMA foreign_keys=ON");
    }

    logger.info(
      `[Seed] Initial invitation codes ${
        newCodes.length > 0 ? `created: ${newCodes.join(", ")}` : "already exist"
      }`
    );

    res.json({
      success: true,
      seeded: true,
      codes: INITIAL_INVITATION_CODES,
      newCodes,
      demoUser: demoUserResult.created ? demoUserResult.user : null,
    });
  } catch (err) {
    logger.error("[Seed] Failed to seed:", err);
    res.status(500).json({ success: false, error: "初始化失败" });
  }
});
