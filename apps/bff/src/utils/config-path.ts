import { join } from "node:path";
import { cpSync, existsSync, readdirSync } from "node:fs";

export function getMineEchoHome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.MINEECHO_CONFIG_HOME) return env.MINEECHO_CONFIG_HOME;
  if (env.MINECHO_CONFIG_HOME) return env.MINECHO_CONFIG_HOME;
  return join(process.cwd(), ".mineecho");
}

function isEmptyDir(path: string): boolean {
  if (!existsSync(path)) return true;
  try {
    return readdirSync(path).length === 0;
  } catch {
    return false;
  }
}

export function prepareMineEchoHome(env: NodeJS.ProcessEnv = process.env): string {
  const home = getMineEchoHome(env);
  const legacyHome = env.MINECHO_CONFIG_HOME;
  if (!env.MINEECHO_CONFIG_HOME || !legacyHome || legacyHome === home) return home;
  if (!existsSync(legacyHome) || !isEmptyDir(home)) return home;

  cpSync(legacyHome, home, {
    recursive: true,
    errorOnExist: false,
    force: false,
  });
  return home;
}

export const ENTERPRISE_CONFIG_FILE = "enterprise.json";
