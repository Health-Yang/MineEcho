/**
 * Transcription configuration store
 *
 * Decoupled from LLM provider config. Stores API keys and settings
 * for speech-to-text services (DashScope, OpenAI Whisper, etc.)
 */

import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";

export interface TranscriptionConfig {
  provider: "dashscope" | "openai" | "none";
  apiKey: string;
  model: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: TranscriptionConfig = {
  provider: "dashscope",
  apiKey: "",
  model: "qwen3-asr-flash-filetrans",
  enabled: false,
};

function getConfigPath(): string {
  return join(getMineEchoHome(), "transcription.json");
}

export async function loadTranscriptionConfig(): Promise<TranscriptionConfig> {
  const path = getConfigPath();
  if (!existsSync(path)) return { ...DEFAULT_CONFIG };
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as Partial<TranscriptionConfig>;
    return {
      provider: data.provider || DEFAULT_CONFIG.provider,
      apiKey: typeof data.apiKey === "string" ? data.apiKey : DEFAULT_CONFIG.apiKey,
      model: data.model || DEFAULT_CONFIG.model,
      enabled: typeof data.enabled === "boolean" ? data.enabled : DEFAULT_CONFIG.enabled,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveTranscriptionConfig(config: TranscriptionConfig): Promise<void> {
  const home = getMineEchoHome();
  const path = getConfigPath();
  const tmpPath = path + ".tmp." + Date.now();
  await mkdir(home, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(config, null, 2), "utf8");
  await rename(tmpPath, path);
}
