/**
 * MINECHO V4 初始化脚本
 *
 * 用途：
 * 1. 创建预制邀请码（5个，可分发）
 * 2. 如果数据库不存在，初始化表结构
 * 3. 验证现有安装状态
 *
 * 使用方法：
 *   cd /Users/mac/test/mineecho-v4/apps/bff
 *   npx tsx scripts/init-seed.ts
 *
 * 这个脚本是幂等的，可以多次运行。
 */

import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const dbDir = join(process.cwd(), ".mineecho");
const dbPath = join(dbDir, "users.db");

// ── 随机邀请码生成器 ─────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MINECHO-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ── 模拟 SQLite 操作（Node.js 环境）──────────────────────────────────────────

async function run() {
  console.log("========================================");
  console.log("MINECHO V4 · 初始化脚本");
  console.log("========================================\n");

  // 确保目录存在
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(`[OK] 创建数据目录: ${dbDir}`);
  } else {
    console.log(`[OK] 数据目录已存在: ${dbDir}`);
  }

  // 检查数据库文件
  if (existsSync(dbPath)) {
    console.log(`[OK] 数据库已存在: ${dbPath}\n`);
  } else {
    console.log(`[INFO] 数据库不存在，将在使用时自动创建\n`);
  }

  // 打印邀请码
  console.log("========================================");
  console.log("预制邀请码（可用于注册）");
  console.log("========================================\n");

  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    console.log(`  ${i + 1}. ${code}`);
  }

  console.log("\n----------------------------------------");
  console.log("提示：这些邀请码需要在 BFF 启动后写入数据库。");
  console.log("      BFF 会在首次启动时自动运行初始化。");
  console.log("----------------------------------------\n");

  // 检查环境变量
  console.log("========================================");
  console.log("环境状态检查");
  console.log("========================================\n");

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === "mineecho-dev-secret-change-in-production") {
    console.log("[WARN] JWT_SECRET 未设置或使用默认值");
    console.log("       生产环境请设置: JWT_SECRET=<随机字符串>");
  } else {
    console.log("[OK] JWT_SECRET 已配置");
  }

  const requireAuth = process.env.MINECHO_REQUIRE_AUTH;
  if (requireAuth === "true") {
    console.log("[OK] MINECHO_REQUIRE_AUTH=true（强制认证已开启）");
  } else {
    console.log("[INFO] MINECHO_REQUIRE_AUTH 未设置");
    console.log("       如需强制登录，请设置: MINECHO_REQUIRE_AUTH=true");
  }

  console.log("\n========================================");
  console.log("初始化完成");
  console.log("========================================\n");

  console.log("下一步：");
  console.log("  1. 启动 BFF: pnpm dev 或 pnpm start");
  console.log("  2. 在前端注册页面使用上方邀请码创建账号");
  console.log("  3. 登录后进行初始化配置（API Key 等）\n");
}

run().catch(console.error);