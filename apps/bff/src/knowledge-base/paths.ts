import { dirname, join, normalize, sep } from "node:path";
import { cpSync, existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { getMineEchoHome } from "../utils/config-path.js";

function getDefaultUserDataPath(): string {
  const home = homedir();
  if (platform() === "darwin") {
    return join(home, "Library", "Application Support", "MineEcho");
  }
  if (platform() === "win32") {
    return join(process.env.APPDATA || home, "MineEcho");
  }
  return join(home, ".config", "MineEcho");
}

export function getKbBasePath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.MINECHO_KB_BASE_PATH) {
    return env.MINECHO_KB_BASE_PATH;
  }

  if (env.MINEECHO_CONFIG_HOME || env.MINECHO_CONFIG_HOME) {
    return join(dirname(getMineEchoHome(env)), "knowledge");
  }

  if (env.OPENCLAW_HOME) {
    return join(env.OPENCLAW_HOME, "knowledge");
  }

  return join(getDefaultUserDataPath(), "knowledge");
}

function isKnowledgeBaseEmptyOrScaffoldOnly(path: string): boolean {
  if (!existsSync(path)) return true;
  const ignoredFiles = new Set(["claude.md", "log.md", "index.md"]);

  function hasUserContent(dir: string): boolean {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (hasUserContent(fullPath)) return true;
      } else if (entry.isFile() && !ignoredFiles.has(entry.name)) {
        return true;
      }
    }
    return false;
  }

  try {
    return !hasUserContent(path);
  } catch {
    return false;
  }
}

export function prepareKbBasePath(env: NodeJS.ProcessEnv = process.env): string {
  const base = getKbBasePath(env);
  const legacyBase = join(dirname(base), "v35-knowledge");
  if (!existsSync(legacyBase) || !isKnowledgeBaseEmptyOrScaffoldOnly(base)) return base;

  cpSync(legacyBase, base, {
    recursive: true,
    errorOnExist: false,
    force: false,
  });
  return base;
}

export function resolveKbPath(relativePath: string): string {
  const base = getKbBasePath();
  if (!base) throw new Error("Knowledge base not initialized");

  const normalized = normalize(relativePath);
  if (normalized.startsWith(sep) || /^(?:[a-zA-Z]:)/.test(normalized)) {
    throw new Error("Absolute paths are not allowed");
  }
  if (normalized.startsWith(".." + sep) || normalized === "..") {
    throw new Error("Path traversal detected");
  }

  const resolved = join(base, normalized);
  // Final defense: ensure resolved path is still under base
  if (!resolved.startsWith(base)) {
    throw new Error("Path traversal detected");
  }

  return resolved;
}
