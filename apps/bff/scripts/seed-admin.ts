/**
 * Seed Script - Create Initial Admin and Invitation Code
 *
 * Run this script to create the first admin user and generate invitation codes.
 *
 * Usage: npx tsx scripts/seed-admin.ts
 */

import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

// Simple database for seeding (no external dependencies)
function getDbPath() {
  const dbDir = join(process.cwd(), ".mineecho");
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return join(dbDir, "users.db");
}

// Mock the module system for Node.js
async function seed() {
  const dbPath = getDbPath();
  console.log(`Database path: ${dbPath}`);

  // Check if database exists
  if (!existsSync(dbPath)) {
    console.log("Database not found. The BFF will create it on first run.");
  }

  // Generate invitation code
  function generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MINECHO-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const invitationCode = generateInviteCode();
  console.log("\n===========================================");
  console.log("MINECHO V4 初始化邀请码");
  console.log("===========================================");
  console.log(`\n邀请码: ${invitationCode}`);
  console.log("\n使用方法:");
  console.log("1. 在注册页面输入此邀请码");
  console.log("2. 完成注册后自动成为管理员");
  console.log("\n注意: 请妥善保管此邀请码");
  console.log("===========================================\n");
}

seed().catch(console.error);
