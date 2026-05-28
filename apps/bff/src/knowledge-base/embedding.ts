import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { logger } from "../utils/logger.js";
import { loadCustomModelsSync, type CustomModel } from "../config/custom-models.js";

export interface EmbeddingProvider {
  name: string;
  getEmbedding(text: string): Promise<number[] | null>;
  batchEmbeddings(texts: string[]): Promise<number[][] | null>;
  maxTokens: number;
  dimensions: number;
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

function truncateText(text: string, maxTokens: number): string {
  // 1 token ≈ 1 CJK char; leave 20% margin
  const maxChars = Math.floor(maxTokens * 0.8);
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 30000
): Promise<Response> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status < 500) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (i < retries - 1) {
      const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
      await sleep(delay);
    }
  }
  throw lastError ?? new Error("fetch failed after retries");
}

function createMiniMaxProvider(apiKey: string): EmbeddingProvider {
  const name = "minimax";
  const model = "embo-01";
  const maxTokens = 8192;
  const dimensions = 1536;

  /** MiniMax embedding API uses proprietary format:
   *  - body: { model, texts: string[], type: "db"|"query" }
   *  - resp: { vectors: number[][], base_resp: { status_code, status_msg } }
   */
  async function callMiniMaxEmbeddings(
    texts: string[],
    type: "db" | "query"
  ): Promise<number[][] | null> {
    try {
      const res = await fetchWithRetry("https://api.minimax.chat/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, texts, type }),
      });
      const rawText = await res.text();
      if (!res.ok) {
        logger.warn(`[Embedding][${name}] HTTP ${res.status}: ${rawText}`);
        return null;
      }
      const json = JSON.parse(rawText) as {
        vectors?: number[][];
        base_resp?: { status_code: number; status_msg: string };
      };
      if (json.base_resp && json.base_resp.status_code !== 0) {
        logger.warn(
          `[Embedding][${name}] API error ${json.base_resp.status_code}: ${json.base_resp.status_msg}`
        );
        return null;
      }
      const vectors = json.vectors;
      if (!Array.isArray(vectors) || vectors.length !== texts.length) {
        logger.warn(
          `[Embedding][${name}] unexpected response shape: vectors=${Array.isArray(vectors) ? vectors.length : "null"}, expected=${texts.length}`
        );
        return null;
      }
      for (const v of vectors) {
        if (!Array.isArray(v) || v.length !== dimensions) {
          logger.warn(`[Embedding][${name}] unexpected vector length: ${Array.isArray(v) ? v.length : "null"}`);
          return null;
        }
      }
      return vectors;
    } catch (err) {
      logger.warn(`[Embedding][${name}] error:`, err);
      return null;
    }
  }

  return {
    name,
    maxTokens,
    dimensions,

    async getEmbedding(text: string): Promise<number[] | null> {
      const truncated = truncateText(text, maxTokens);
      const vectors = await callMiniMaxEmbeddings([truncated], "query");
      return vectors?.[0] ?? null;
    },

    async batchEmbeddings(texts: string[]): Promise<number[][] | null> {
      // MiniMax supports batch texts in one request
      const truncated = texts.map((t) => truncateText(t, maxTokens));
      const vectors = await callMiniMaxEmbeddings(truncated, "db");
      return vectors;
    },
  };
}

function createAliyunProvider(apiKey: string): EmbeddingProvider {
  const name = "aliyun";
  const model = "text-embedding-v3";
  const maxTokens = 8192;
  const dimensions = 1024;

  return {
    name,
    maxTokens,
    dimensions,

    async getEmbedding(text: string): Promise<number[] | null> {
      const truncated = truncateText(text, maxTokens);
      try {
        const res = await fetchWithRetry(
          "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, input: { texts: [truncated] } }),
          }
        );
        if (!res.ok) {
          logger.warn(`[Embedding][${name}] HTTP ${res.status}: ${await res.text()}`);
          return null;
        }
        const json = (await res.json()) as {
          output?: { embeddings?: Array<{ embedding: number[] }> };
        };
        const emb = json.output?.embeddings?.[0]?.embedding;
        if (!Array.isArray(emb) || emb.length !== dimensions) {
          logger.warn(`[Embedding][${name}] unexpected response shape`);
          return null;
        }
        return emb;
      } catch (err) {
        logger.warn(`[Embedding][${name}] error:`, err);
        return null;
      }
    },

    async batchEmbeddings(texts: string[]): Promise<number[][] | null> {
      // Aliyun supports batch texts in one request
      const truncated = texts.map((t) => truncateText(t, maxTokens));
      try {
        const res = await fetchWithRetry(
          "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, input: { texts: truncated } }),
          }
        );
        if (!res.ok) {
          logger.warn(`[Embedding][${name}] HTTP ${res.status}: ${await res.text()}`);
          return null;
        }
        const json = (await res.json()) as {
          output?: { embeddings?: Array<{ embedding: number[] }> };
        };
        const items = json.output?.embeddings;
        if (!Array.isArray(items) || items.length !== texts.length) {
          logger.warn(`[Embedding][${name}] unexpected batch response shape`);
          return null;
        }
        return items.map((item) => item.embedding);
      } catch (err) {
        logger.warn(`[Embedding][${name}] batch error:`, err);
        return null;
      }
    },
  };
}

function createZhipuProvider(apiKey: string): EmbeddingProvider {
  const name = "zhipu";
  const model = "embedding-3";
  const maxTokens = 8192;
  const dimensions = 2048;

  return {
    name,
    maxTokens,
    dimensions,

    async getEmbedding(text: string): Promise<number[] | null> {
      const truncated = truncateText(text, maxTokens);
      try {
        const res = await fetchWithRetry("https://open.bigmodel.cn/api/paas/v4/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, input: truncated }),
        });
        if (!res.ok) {
          logger.warn(`[Embedding][${name}] HTTP ${res.status}: ${await res.text()}`);
          return null;
        }
        const json = (await res.json()) as EmbeddingResponse;
        const emb = json.data?.[0]?.embedding;
        if (!Array.isArray(emb) || emb.length !== dimensions) {
          logger.warn(`[Embedding][${name}] unexpected response shape`);
          return null;
        }
        return emb;
      } catch (err) {
        logger.warn(`[Embedding][${name}] error:`, err);
        return null;
      }
    },

    async batchEmbeddings(texts: string[]): Promise<number[][] | null> {
      // Zhipu supports array input for batch
      const truncated = texts.map((t) => truncateText(t, maxTokens));
      try {
        const res = await fetchWithRetry("https://open.bigmodel.cn/api/paas/v4/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, input: truncated }),
        });
        if (!res.ok) {
          logger.warn(`[Embedding][${name}] HTTP ${res.status}: ${await res.text()}`);
          return null;
        }
        const json = (await res.json()) as EmbeddingResponse;
        const items = json.data;
        if (!Array.isArray(items) || items.length !== texts.length) {
          logger.warn(`[Embedding][${name}] unexpected batch response shape`);
          return null;
        }
        return items.map((item) => item.embedding);
      } catch (err) {
        logger.warn(`[Embedding][${name}] batch error:`, err);
        return null;
      }
    },
  };
}

function normalizeOpenAiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}

export function createOpenAiCompatibleProvider(config: {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  dimensions: number;
  maxTokens?: number;
}): EmbeddingProvider {
  const name = config.name;
  const baseUrl = normalizeOpenAiBaseUrl(config.baseUrl);
  const model = config.model;
  const dimensions = config.dimensions;
  const maxTokens = config.maxTokens ?? 8192;

  async function callEmbeddings(texts: string[]): Promise<number[][] | null> {
    if (!baseUrl || !model || !dimensions) return null;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
      const res = await fetchWithRetry(`${baseUrl}/embeddings`, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, input: texts }),
      });
      if (!res.ok) {
        logger.warn(`[Embedding][${name}] HTTP ${res.status}: ${await res.text()}`);
        return null;
      }
      const json = (await res.json()) as EmbeddingResponse;
      const vectors = json.data?.map((item) => item.embedding);
      if (!Array.isArray(vectors) || vectors.length !== texts.length) {
        logger.warn(`[Embedding][${name}] unexpected OpenAI-compatible response shape`);
        return null;
      }
      if (vectors.some((vector) => !Array.isArray(vector) || vector.length !== dimensions)) {
        logger.warn(`[Embedding][${name}] unexpected vector dimensions`);
        return null;
      }
      return vectors;
    } catch (err) {
      logger.warn(`[Embedding][${name}] error:`, err);
      return null;
    }
  }

  return {
    name,
    maxTokens,
    dimensions,
    async getEmbedding(text: string): Promise<number[] | null> {
      const vectors = await callEmbeddings([truncateText(text, maxTokens)]);
      return vectors?.[0] ?? null;
    },
    async batchEmbeddings(texts: string[]): Promise<number[][] | null> {
      return callEmbeddings(texts.map((text) => truncateText(text, maxTokens)));
    },
  };
}

export function customModelToEmbeddingProviderConfig(model: CustomModel): {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  dimensions: number;
} | null {
  if (!model.embeddingModelId || !model.embeddingDimensions) return null;
  if (model.embeddingDimensions <= 0) return null;
  return {
    name: `custom:${model.id}`,
    baseUrl: model.baseUrl,
    apiKey: model.apiKey,
    model: model.embeddingModelId,
    dimensions: model.embeddingDimensions,
  };
}

/** 依次尝试的 openclaw 配置目录（与 gateway/client.ts 一致） */
function getOpenclawConfigPaths(): string[] {
  const cwd = process.cwd();
  const paths: string[] = [];
  if (process.env.OPENCLAW_HOME) paths.push(process.env.OPENCLAW_HOME);
  paths.push(join(cwd, ".openclaw"));
  paths.push(join(cwd, "..", ".openclaw"));
  paths.push(join(homedir(), ".openclaw"));
  return [...new Set(paths)];
}

/**
 * 从 OpenClaw 配置（openclaw.json）中读取 provider 的 API Key，
 * 用于 Embedding 复用大模型配置的 Key。
 */
function loadApiKeysFromOpenclawConfig(): {
  minimax?: string;
  aliyun?: string;
  zhipu?: string;
} {
  try {
    for (const openclawHome of getOpenclawConfigPaths()) {
      const configPath = join(openclawHome, "openclaw.json");
      if (!existsSync(configPath)) continue;

      const raw = readFileSync(configPath, "utf8");
      const data = JSON.parse(raw) as {
        models?: {
          providers?: Record<
            string,
            { apiKey?: string }
          >;
        };
      };

      const providers = data?.models?.providers || {};
      const result: { minimax?: string; aliyun?: string; zhipu?: string } = {};
      let found = false;

      for (const [providerId, cfg] of Object.entries(providers)) {
        if (!cfg?.apiKey) continue;
        const lower = providerId.toLowerCase();
        if (lower.includes("minimax")) {
          result.minimax = cfg.apiKey;
          found = true;
        } else if (lower.includes("aliyun") || lower.includes("dashscope")) {
          result.aliyun = cfg.apiKey;
          found = true;
        } else if (lower.includes("zhipu")) {
          result.zhipu = cfg.apiKey;
          found = true;
        }
      }

      if (found) return result;
    }
    return {};
  } catch {
    return {};
  }
}

export interface EmbeddingApiKeys {
  minimax?: string;
  aliyun?: string;
  zhipu?: string;
}

export function resolveEmbeddingApiKeys(
  explicitKeys: EmbeddingApiKeys,
  sharedProviderKeys: EmbeddingApiKeys
): EmbeddingApiKeys {
  return {
    minimax: explicitKeys.minimax || sharedProviderKeys.minimax,
    aliyun: explicitKeys.aliyun || sharedProviderKeys.aliyun,
    zhipu: explicitKeys.zhipu || sharedProviderKeys.zhipu,
  };
}

function createDeepSeekProvider(): EmbeddingProvider {
  const name = "deepseek";
  return {
    name,
    maxTokens: 0,
    dimensions: 0,
    async getEmbedding(): Promise<null> {
      logger.info(`[Embedding][${name}] no embedding support; fallback to BM25`);
      return null;
    },
    async batchEmbeddings(): Promise<null> {
      return null;
    },
  };
}

// Provider registry
const providers: EmbeddingProvider[] = [];

function initProviders(): void {
  if (providers.length > 0) return;

  // Priority 1: explicit env vars
  let minimaxKey = process.env.MINIMAX_API_KEY;
  let aliyunKey = process.env.DASHSCOPE_API_KEY;
  let zhipuKey = process.env.ZHIPU_API_KEY;

  // Priority 2: reuse LLM API Key from openclaw.json per provider. This lets
  // one configured model key power chat + embedding without requiring extra env vars.
  const openclawKeys = loadApiKeysFromOpenclawConfig();
  const resolvedKeys = resolveEmbeddingApiKeys(
    { minimax: minimaxKey, aliyun: aliyunKey, zhipu: zhipuKey },
    openclawKeys
  );
  minimaxKey = resolvedKeys.minimax;
  aliyunKey = resolvedKeys.aliyun;
  zhipuKey = resolvedKeys.zhipu;
  if (openclawKeys.minimax || openclawKeys.aliyun || openclawKeys.zhipu) {
    const reused = [
      !process.env.MINIMAX_API_KEY && openclawKeys.minimax ? "minimax" : null,
      !process.env.DASHSCOPE_API_KEY && openclawKeys.aliyun ? "aliyun" : null,
      !process.env.ZHIPU_API_KEY && openclawKeys.zhipu ? "zhipu" : null,
    ].filter(Boolean);
    if (reused.length > 0) {
      logger.info(`[Embedding] Reusing LLM API Key from openclaw.json for embedding: ${reused.join(", ")}`);
    }
  }

  if (minimaxKey) providers.push(createMiniMaxProvider(minimaxKey));
  if (aliyunKey) providers.push(createAliyunProvider(aliyunKey));
  if (zhipuKey) providers.push(createZhipuProvider(zhipuKey));

  for (const model of loadCustomModelsSync()) {
    const config = customModelToEmbeddingProviderConfig(model);
    if (!config || providers.some((provider) => provider.name === config.name)) continue;
    providers.push(createOpenAiCompatibleProvider(config));
    logger.info(`[Embedding] Registered OpenAI-compatible embedding provider: ${config.name}`);
  }

  // DeepSeek is always registered as a sentinel for fallback awareness
  providers.push(createDeepSeekProvider());
}

export function getActiveProvider(): EmbeddingProvider | null {
  initProviders();
  // Return first non-DeepSeek provider
  return providers.find((p) => p.dimensions > 0) ?? null;
}

export function isEmbeddingAvailable(): boolean {
  return getActiveProvider() !== null;
}

export function getAllProviders(): EmbeddingProvider[] {
  initProviders();
  return providers.filter((p) => p.dimensions > 0);
}
