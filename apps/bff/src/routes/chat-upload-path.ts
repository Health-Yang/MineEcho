import { resolve } from "node:path";

export function getChatUploadDir(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): string {
  if (env.MINECHO_UPLOAD_DIR) return resolve(env.MINECHO_UPLOAD_DIR);
  if (env.MINEECHO_CONFIG_HOME) return resolve(env.MINEECHO_CONFIG_HOME, "uploads");
  if (env.MINECHO_CONFIG_HOME) return resolve(env.MINECHO_CONFIG_HOME, "uploads");
  return resolve(cwd, ".mineecho", "uploads");
}
