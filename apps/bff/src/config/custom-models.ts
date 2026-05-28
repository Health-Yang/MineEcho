import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";

export interface CustomModel {
  id: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
  modelId: string;
  embeddingModelId?: string;
  embeddingDimensions?: number;
}

function getPath(): string {
  return join(getMineEchoHome(), "custom-models.json");
}

export async function loadCustomModels(): Promise<CustomModel[]> {
  const path = getPath();
  return loadCustomModelsFromPath(path);
}

function normalizeCustomModels(raw: string): CustomModel[] {
  const data = JSON.parse(raw) as { models?: unknown[] };
  const list = Array.isArray(data.models) ? data.models : [];
  const result: CustomModel[] = [];
  for (const m of list) {
    if (!m || typeof m !== "object" || typeof (m as Record<string, unknown>).id !== "string" || typeof (m as Record<string, unknown>).baseUrl !== "string") continue;
    const row = m as Record<string, unknown>;
    result.push({
      id: row.id as string,
      label: typeof row.label === "string" ? row.label : (row.id as string),
      baseUrl: row.baseUrl as string,
      apiKey: typeof row.apiKey === "string" ? row.apiKey : undefined,
      modelId: typeof row.modelId === "string" ? row.modelId : "default",
      embeddingModelId: typeof row.embeddingModelId === "string" ? row.embeddingModelId : undefined,
      embeddingDimensions: typeof row.embeddingDimensions === "number" ? row.embeddingDimensions : undefined,
    });
  }
  return result;
}

async function loadCustomModelsFromPath(path: string): Promise<CustomModel[]> {
  if (!existsSync(path)) return [];
  try {
    const raw = await readFile(path, "utf8");
    return normalizeCustomModels(raw);
  } catch {
    return [];
  }
}

export function loadCustomModelsSync(): CustomModel[] {
  const path = getPath();
  if (!existsSync(path)) return [];
  try {
    return normalizeCustomModels(readFileSync(path, "utf8"));
  } catch {
    return [];
  }
}

export async function saveCustomModels(models: CustomModel[]): Promise<void> {
  const dir = getMineEchoHome();
  const path = getPath();
  const tmpPath = path + ".tmp." + Date.now();
  await mkdir(dir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify({ models }, null, 2), "utf8");
  await rename(tmpPath, path);
}

export function genCustomModelId(): string {
  return "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}
