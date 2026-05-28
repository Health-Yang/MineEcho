import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { spawn } from "node:child_process";
import { valid as validSemver } from "semver";
import https from "https";
import { Router } from "express";
import { logger } from "../utils/logger.js";

// OpenCLAW versions
const OPENCLAW_NPM_PACKAGE = "openclaw";
const GATEWAY_DIR = process.env.GATEWAY_DIR || join(process.cwd(), "electron", "gateway");

// MineEcho 版本管理 - 从 L1 获取
const L1_URL = process.env.L1_URL || "http://127.0.0.1:3081";

interface VersionInfo {
  current: string | null;
  latest: string | null;
  upgradeAvailable: boolean;
  gatewayDir: string;
}

interface MineEchoVersionInfo {
  versions?: Array<{
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    forceUpgrade: boolean;
    publishedAt: number;
    publishedBy: string;
  }>;
  latest: string | null;
  current?: string | null;
  upgradeAvailable?: boolean;
  releaseNotes?: string;
  downloadUrl?: string;
  forceUpgrade?: boolean;
}

// 获取本地 MineEcho 版本（从 package.json）
function getLocalMineEchoVersion(): string | null {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return pkg.version || null;
    }
  } catch (e) {
    logger.error("[Version] Failed to get local MineEcho version:", e);
  }
  return null;
}

// 从 L1 获取最新版本信息
async function getLatestMineEchoVersionFromL1(): Promise<MineEchoVersionInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${L1_URL}/api/terminal/versions`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) {
    // 桌面模式下 L1 服务不可用，静默处理（不打印 error）
    if (process.env.MINECHO_DESKTOP !== 'true') {
      logger.error("[Version] Failed to get MineEcho version from L1:", (e as Error).message);
    }
    return null;
  }
}

interface UpgradeResult {
  success: boolean;
  message: string;
  newVersion?: string;
  requiresRestart?: boolean;
}

// Get current installed version from gateway node_modules
function getInstalledOpenclawVersion(): string | null {
  try {
    const gatewayPkgPath = join(GATEWAY_DIR, "node_modules", OPENCLAW_NPM_PACKAGE, "package.json");
    if (existsSync(gatewayPkgPath)) {
      const pkg = JSON.parse(readFileSync(gatewayPkgPath, "utf-8"));
      return pkg.version || null;
    }
  } catch (e) {
    logger.error("[Version] Failed to get installed version:", e);
  }
  return null;
}

// Fetch latest version from npm registry
function getLatestVersionFromNpm(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(`https://registry.npmjs.org/${OPENCLAW_NPM_PACKAGE}/latest`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const pkg = JSON.parse(data);
          resolve(pkg.version || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

// Download and install new version to gateway directory
function upgradeOpenclaw(targetVersion: string): Promise<UpgradeResult> {
  return new Promise((resolve) => {
    try {
      logger.info(`[Version] Upgrading OpenCLAW to ${targetVersion}...`);

      // Remove old version
      const oldPath = join(GATEWAY_DIR, "node_modules", OPENCLAW_NPM_PACKAGE);
      if (existsSync(oldPath)) {
        rmSync(oldPath, { recursive: true, force: true });
      }

      // Validate version format
      if (!validSemver(targetVersion)) {
        resolve({ success: false, message: 'Invalid version format' });
        return;
      }

      // Install new version using npm with spawn (safe from injection)
      logger.info(`[Version] Running: npm install ${OPENCLAW_NPM_PACKAGE}@${targetVersion}`);
      const proc = spawn('npm', ['install', `${OPENCLAW_NPM_PACKAGE}@${targetVersion}`, '--omit=dev'], {
        cwd: GATEWAY_DIR,
      });

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (data) => { stdout += data; });
      proc.stderr.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          logger.error("[Version] Upgrade failed:", stderr || stdout);
          resolve({ success: false, message: `安装失败: ${stderr || stdout}` });
          return;
        }

        logger.info("[Version] Upgrade completed:", stdout);
        resolve({
          success: true,
          message: `已更新到 ${targetVersion}`,
          newVersion: targetVersion,
          requiresRestart: true
        });
      });

      proc.on('error', (error) => {
        logger.error("[Version] Upgrade failed:", error.message);
        resolve({ success: false, message: `安装失败: ${error.message}` });
      });
    } catch (e) {
      const err = e as Error;
      logger.error("[Version] Upgrade error:", err);
      resolve({ success: false, message: `升级出错: ${err.message}` });
    }
  });
}

export const versionRouter = Router();

// GET /api/version/check - Check current and latest version
versionRouter.get("/check", async (_req, res) => {
  try {
    const currentVersion = getInstalledOpenclawVersion();
    const latestVersion = await getLatestVersionFromNpm();

    let upgradeAvailable = false;
    if (currentVersion && latestVersion) {
      upgradeAvailable = currentVersion !== latestVersion;
    }

    const info: VersionInfo = {
      current: currentVersion,
      latest: latestVersion,
      upgradeAvailable,
      gatewayDir: GATEWAY_DIR
    };

    res.json(info);
  } catch (e) {
    const err = e as Error;
    logger.error("[Version] Check error:", err);
    res.status(500).json({ error: `版本检查失败: ${err.message}` });
  }
});

// POST /api/version/upgrade - Trigger upgrade
versionRouter.post("/upgrade", async (req, res) => {
  try {
    const { version } = req.body;

    // Get latest version if not specified
    const targetVersion = version || await getLatestVersionFromNpm();
    if (!targetVersion) {
      res.status(400).json({ error: "无法获取最新版本，请稍后重试" });
      return;
    }

    const currentVersion = getInstalledOpenclawVersion();
    if (currentVersion === targetVersion) {
      res.json({
        success: true,
        message: "当前已是最新版本",
        newVersion: targetVersion,
        requiresRestart: false
      });
      return;
    }

    const result = await upgradeOpenclaw(targetVersion);
    res.json(result);
  } catch (e) {
    const err = e as Error;
    logger.error("[Version] Upgrade error:", err);
    res.status(500).json({ success: false, message: `升级失败: ${err.message}` });
  }
});

// GET /api/version/status - Get upgrade status
versionRouter.get("/status", (_req, res) => {
  const currentVersion = getInstalledOpenclawVersion();
  res.json({
    current: currentVersion,
    gatewayDir: GATEWAY_DIR
  });
});

// GET /api/version/mineecho - 检查 MineEcho 是否有新版本（从 L1 获取）
versionRouter.get("/mineecho", async (_req, res) => {
  try {
    const currentVersion = getLocalMineEchoVersion();
    const latestInfo = await getLatestMineEchoVersionFromL1();

    if (!latestInfo || !latestInfo.latest) {
      res.json({
        current: currentVersion,
        latest: null,
        upgradeAvailable: false,
        error: "无法连接到 L1 获取版本信息"
      });
      return;
    }

    const upgradeAvailable = currentVersion !== latestInfo.latest;

    res.json({
      current: currentVersion,
      latest: latestInfo.latest,
      upgradeAvailable,
      releaseNotes: latestInfo.versions?.[0]?.releaseNotes,
      downloadUrl: latestInfo.versions?.[0]?.downloadUrl,
      forceUpgrade: latestInfo.versions?.[0]?.forceUpgrade,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({ error: `获取版本失败: ${err.message}` });
  }
});
