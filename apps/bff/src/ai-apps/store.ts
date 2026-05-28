import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";

export type AiAppType = "rag" | "workflow";

export interface AiAppConfig {
  endpoint: string;
  apiKey?: string;
  method?: string;
  /** 请求体格式：query=单字段 | messages=OpenAI/FastGPT 风格 */
  requestStyle?: "query" | "messages";
  queryKey?: string;
  responseContentPath?: string;
  /** OpenAI/FastGPT 风格 messages 请求的最大输出 token。留空时使用运行时默认值。 */
  maxTokens?: number;
}

export interface AiApp {
  id: string;
  name: string;
  description: string;
  type: AiAppType;
  enabled: boolean;
  config: AiAppConfig;
  createdAt?: number;
  updatedAt?: number;
}

function getAppsFilePath(): string {
  return join(getMineEchoHome(), "ai-apps.json");
}

export async function loadApps(): Promise<AiApp[]> {
  const path = getAppsFilePath();
  if (!existsSync(path)) return [];
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.apps) ? data.apps : [];
  } catch {
    return [];
  }
}

export async function saveApps(apps: AiApp[]): Promise<void> {
  const dir = getMineEchoHome();
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const path = getAppsFilePath();
  await writeFile(path, JSON.stringify({ apps, updatedAt: Date.now() }, null, 2), "utf8");
}

export function genAppId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
