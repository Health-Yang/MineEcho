import path, { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { logger } from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let lightragProcess: ChildProcess | null = null;

/**
 * Resolve the path to the LightRAG Python virtual-environment interpreter.
 * Prefers the venv inside apps/lightrag/venv; falls back to system python3.
 */
function resolvePythonPath(): string {
  const venvPython = join(__dirname, "../../../lightrag/venv/bin/python3");
  if (existsSync(venvPython)) {
    return venvPython;
  }
  // Windows fallback
  const venvPythonWin = join(__dirname, "../../../lightrag/venv/Scripts/python.exe");
  if (existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  return process.env.PYTHON_PATH || "python3";
}

/**
 * Resolve the path to LightRAG main.py.
 */
function resolveLightragMainPath(): string | null {
  const candidates = [
    join(__dirname, "../../../lightrag/main.py"),
    join(__dirname, "../../lightrag/main.py"),
    join(process.cwd(), "apps/lightrag/main.py"),
    join(process.cwd(), "lightrag/main.py"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Start the LightRAG Python service as a child process.
 */
export async function startEmbeddedLightRAG(port = 3090): Promise<void> {
  // If already healthy, skip
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      logger.info(`[EmbeddedLightRAG] LightRAG already running on port ${port}, skipping spawn`);
      return;
    }
  } catch {
    // ignore — no listener yet, proceed to spawn
  }

  const mainPath = resolveLightragMainPath();
  if (!mainPath) {
    logger.error("[EmbeddedLightRAG] Could not find LightRAG main.py");
    throw new Error("LightRAG main.py not found");
  }

  const pythonPath = resolvePythonPath();
  logger.info(`[EmbeddedLightRAG] Spawning LightRAG from ${mainPath} on port ${port}`);

  const childEnv: NodeJS.ProcessEnv = { ...process.env };

  const proc = spawn(pythonPath, [mainPath], {
    env: childEnv,
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  lightragProcess = proc;

  proc.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n").filter(Boolean);
    for (const line of lines) {
      logger.info(`[LightRAG stdout] ${line}`);
    }
  });

  proc.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n").filter(Boolean);
    for (const line of lines) {
      logger.warn(`[LightRAG stderr] ${line}`);
    }
  });

  proc.on("error", (err) => {
    logger.error("[EmbeddedLightRAG] Child process error:", { error: err.message });
  });

  proc.on("exit", (code, signal) => {
    logger.info(`[EmbeddedLightRAG] Child process exited: code=${code}, signal=${signal}`);
    if (lightragProcess === proc) {
      lightragProcess = null;
    }
  });

  // Wait for health endpoint (up to 60 seconds — LightRAG init can be slow)
  logger.info(`[EmbeddedLightRAG] Waiting for LightRAG health on port ${port}...`);
  let connected = false;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (lightragProcess !== proc) {
      break;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
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
    stopEmbeddedLightRAG();
    throw new Error("LightRAG failed to start: port did not open within 60 seconds");
  }

  logger.info(`[EmbeddedLightRAG] LightRAG is listening on port ${port}`);
}

/**
 * Stop the embedded LightRAG child process.
 */
export async function stopEmbeddedLightRAG(): Promise<void> {
  if (!lightragProcess) {
    return;
  }
  logger.info("[EmbeddedLightRAG] Stopping LightRAG process...");
  const proc = lightragProcess;
  let exited = false;
  proc.on("exit", () => {
    exited = true;
  });

  proc.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  if (!exited && !proc.killed) {
    logger.warn("[EmbeddedLightRAG] LightRAG did not exit gracefully, sending SIGKILL");
    proc.kill("SIGKILL");
  }

  lightragProcess = null;
}
