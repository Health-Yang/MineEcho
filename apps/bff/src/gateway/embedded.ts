import path, { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { logger } from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveRepoRootCandidates(): string[] {
  return [
    process.env.MINEECHO_REPO_ROOT,
    process.cwd(),
    join(process.cwd(), "..", ".."),
    join(__dirname, "..", "..", "..", ".."),
    join(__dirname, "..", "..", "..", "..", ".."),
  ].filter(Boolean) as string[];
}

async function firstExistingFile(candidates: string[]): Promise<string | null> {
  const fs = await import("node:fs");
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate);
      return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

/** 为 Gateway 子进程找到应该使用的 openclaw.json 路径，避免 BFF 和 Gateway 读到不同配置 */
function resolveOpenclawConfigPath(): string | undefined {
  // 1. 若已有环境变量，直接使用
  if (process.env.OPENCLAW_CONFIG_PATH && existsSync(process.env.OPENCLAW_CONFIG_PATH)) {
    return process.env.OPENCLAW_CONFIG_PATH;
  }
  // 2. 按优先级查找
  const candidates = [
    process.env.OPENCLAW_HOME ? join(process.env.OPENCLAW_HOME, ".openclaw", "openclaw.json") : null,
    join(process.cwd(), ".openclaw", "openclaw.json"),
    join(process.cwd(), "..", ".openclaw", "openclaw.json"),
    join(homedir(), ".openclaw", "openclaw.json"),
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

let gatewayProcess: ChildProcess | null = null;

async function resolveGatewayLibEntry(): Promise<string | null> {
  // 1. Vendored runtime in the MineEcho repository. This lets local users run
  // Gateway without separately installing OpenClaw as a global or app dependency.
  for (const root of resolveRepoRootCandidates()) {
    const vendored = await firstExistingFile([
      join(root, "vendor/openclaw-gateway/dist/index.js"),
      join(root, "vendor/openclaw-gateway/openclaw.mjs"),
    ]);
    if (vendored) {
      return vendored;
    }
  }

  // 2. Container path: /app/node_modules/openclaw/dist/index.js (library entry)
  const containerLib = await firstExistingFile(["/app/node_modules/openclaw/dist/index.js"]);
  if (containerLib) return containerLib;

  // 3. Dev path: node_modules/openclaw/dist/index.js
  const devLib = await firstExistingFile([join(process.cwd(), "node_modules/openclaw/dist/index.js")]);
  if (devLib) return devLib;

  // 4. Monorepo dev path: from BFF source/dist up to apps/electron/gateway
  const monorepoLib = await firstExistingFile([join(__dirname, "../../../electron/gateway/node_modules/openclaw/dist/index.js")]);
  if (monorepoLib) return monorepoLib;

  // 5. Desktop packaged (asar) path: from bff/dist up to Contents/node_modules
  //    __dirname = Contents/bff/dist/ → ../../.. = Contents/
  const desktopLib = await firstExistingFile([join(__dirname, "../../../node_modules/openclaw/dist/index.js")]);
  if (desktopLib) return desktopLib;

  // 6. Desktop packaged (asar) path: from bff/dist up to Contents/gateway/node_modules
  const desktopGatewayLib = await firstExistingFile([join(__dirname, "../../../gateway/node_modules/openclaw/dist/index.js")]);
  if (desktopGatewayLib) return desktopGatewayLib;

  // 5b. Desktop packaged with pnpm: symlink points to .pnpm/ directory
  const desktopGatewayPnpmLib = join(__dirname, "../../../gateway/node_modules/.pnpm/openclaw@*/node_modules/openclaw/dist/index.js");
  try {
    const fs = await import("node:fs");
    const pnpmDir = join(__dirname, "../../../gateway/node_modules/.pnpm");
    if (fs.existsSync(pnpmDir)) {
      const entries = fs.readdirSync(pnpmDir);
      for (const entry of entries) {
        if (entry.startsWith("openclaw@")) {
          const candidate = join(pnpmDir, entry, "node_modules/openclaw/dist/index.js");
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 8. BFF bundle root: when BFF is bundled as extraResources for Electron desktop build,
  //    the bundle root contains node_modules/ with openclaw inside.
  //    Electron main.ts sets cwd to the bundle root and NODE_PATH to its node_modules.
  //    __dirname = resources/bff/dist/ → ../.. = resources/bff/ (bundle root)
  const bffBundleRoot = join(__dirname, "../..");
  for (const subPath of ["node_modules/openclaw/dist/index.js", "node_modules/openclaw/openclaw.mjs"]) {
    const candidate = join(bffBundleRoot, subPath);
    try {
      await import("node:fs").then((fs) => fs.accessSync(candidate));
      return candidate;
    } catch {
      // ignore
    }
  }

  // 9. NODE_PATH lookup (Electron sets this for desktop builds)
  if (process.env.NODE_PATH) {
    const nodePaths = process.env.NODE_PATH.split(path.delimiter);
    for (const np of nodePaths) {
      const candidate = join(np.trim(), "openclaw/dist/index.js");
      try {
        await import("node:fs").then((fs) => fs.accessSync(candidate));
        return candidate;
      } catch {
        // ignore
      }
    }
  }

  return null;
}

function resolveGatewayCliPath(libEntry: string): string | null {
  const pkgDir = join(libEntry, "../..");

  // 1. Check package.json "bin" field
  const pkgJsonPath = join(pkgDir, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as { bin?: Record<string, string> | string };
      const binEntry = typeof pkg.bin === "object" ? pkg.bin.openclaw : pkg.bin;
      if (binEntry) {
        const binPath = join(pkgDir, binEntry);
        if (existsSync(binPath)) return binPath;
      }
    } catch {
      // ignore
    }
  }

  // 2. Fallback to known CLI entry names
  const fallbacks = ["openclaw.mjs", "bin/openclaw.js", "bin/openclaw.mjs", "openclaw.js"];
  for (const name of fallbacks) {
    const p = join(pkgDir, name);
    if (existsSync(p)) return p;
  }

  return null;
}

/**
 * Start the OpenClaw Gateway as a child process.
 */
export async function startEmbeddedGateway(port = 18789): Promise<void> {
  // 如果端口已有健康服务监听，跳过启动（适用于 Docker 等外部已启动 Gateway 的场景）
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      logger.info(`[EmbeddedGateway] Gateway already running on port ${port}, skipping spawn`);
      return;
    }
  } catch {
    // ignore — no listener yet, proceed to spawn
  }

  const entry = await resolveGatewayLibEntry();
  if (!entry) {
    logger.error("[EmbeddedGateway] Could not find openclaw library entry point");
    throw new Error("OpenClaw library entry point not found");
  }

  const openclawCliPath = resolveGatewayCliPath(entry);
  if (!openclawCliPath) {
    logger.error("[EmbeddedGateway] Could not find openclaw CLI script");
    throw new Error("OpenClaw CLI script not found");
  }

  logger.info(`[EmbeddedGateway] Spawning openclaw gateway from ${openclawCliPath} on port ${port}`);

  const configPath = resolveOpenclawConfigPath();
  const childEnv: NodeJS.ProcessEnv = { ...process.env };
  if (configPath) {
    childEnv.OPENCLAW_CONFIG_PATH = configPath;
    logger.info(`[EmbeddedGateway] Set OPENCLAW_CONFIG_PATH=${configPath}`);
  }

  // Use process.execPath to ensure we use the same Node.js that runs BFF
  // (avoids "spawn node ENOENT" when the packaged app doesn't have node in PATH)
  const nodeExecutable = process.execPath || "node";

  // Check Node.js version (OpenClaw CLI requires >= 22.12.0)
  try {
    const { execSync } = await import("node:child_process");
    const versionOutput = execSync(`"${nodeExecutable}" --version`, { encoding: "utf8", timeout: 5000 }).trim();
    const match = versionOutput.match(/^v(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const patch = parseInt(match[3], 10);
      const ok = major > 22 || (major === 22 && minor > 12) || (major === 22 && minor === 12 && patch >= 0);
      if (!ok) {
        const errMsg = `[EmbeddedGateway] Node.js version ${versionOutput} is too old. OpenClaw CLI requires >= 22.12.0`;
        logger.error(errMsg);
        throw new Error(errMsg);
      }
      logger.info(`[EmbeddedGateway] Node.js version check passed: ${versionOutput}`);
    }
  } catch (e: any) {
    if (e.message?.includes("too old")) throw e;
    logger.warn(`[EmbeddedGateway] Could not verify Node.js version: ${e.message}`);
  }

  logger.info(`[EmbeddedGateway] Using Node.js: ${nodeExecutable}`);

  const proc = spawn(nodeExecutable, [openclawCliPath, "gateway", "--port", String(port), "--force", "--allow-unconfigured"], {
    env: childEnv,
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  gatewayProcess = proc;

  // Drain stdout/stderr with backpressure-safe handlers to prevent SIGPIPE
  proc.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n").filter(Boolean);
    for (const line of lines) {
      logger.info(`[Gateway stdout] ${line}`);
    }
  });

  proc.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n").filter(Boolean);
    for (const line of lines) {
      logger.warn(`[Gateway stderr] ${line}`);
    }
  });

  proc.on("error", (err) => {
    logger.error("[EmbeddedGateway] Child process error:", { error: err.message });
  });

  proc.on("exit", (code, signal) => {
    logger.info(`[EmbeddedGateway] Child process exited: code=${code}, signal=${signal}`);
    if (gatewayProcess === proc) {
      gatewayProcess = null;
    }
  });

  // Wait for Gateway health endpoint (up to 30 seconds)
  logger.info(`[EmbeddedGateway] Waiting for Gateway health on port ${port}...`);
  let connected = false;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (gatewayProcess !== proc) {
      // Process was stopped or replaced
      break;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        connected = true;
        break;
      }
    } catch {
      // ignore and retry
    }
  }

  if (!connected) {
    stopEmbeddedGateway();
    throw new Error("Gateway failed to start: port did not open within 30 seconds");
  }

  logger.info(`[EmbeddedGateway] Gateway is listening on port ${port}`);
}

/**
 * Stop the embedded Gateway child process.
 */
export async function stopEmbeddedGateway(): Promise<void> {
  if (!gatewayProcess) {
    return;
  }
  logger.info("[EmbeddedGateway] Stopping gateway process...");
  const proc = gatewayProcess;
  let exited = false;
  proc.on("exit", () => {
    exited = true;
  });

  proc.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  if (!exited && !proc.killed) {
    logger.warn("[EmbeddedGateway] Gateway did not exit gracefully, sending SIGKILL");
    proc.kill("SIGKILL");
  }

  gatewayProcess = null;
}

/**
 * Restart the embedded Gateway.
 */
export async function restartEmbeddedGateway(port = 18789): Promise<void> {
  logger.info("[EmbeddedGateway] Restarting gateway...");
  await stopEmbeddedGateway();
  await startEmbeddedGateway(port);
}
