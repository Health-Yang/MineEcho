import { Router } from "express";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadCustomModels, saveCustomModels, genCustomModelId, type CustomModel } from "../config/custom-models.js";
import { loadTranscriptionConfig, saveTranscriptionConfig } from "../config/transcription.js";
import { credentialManager } from "../utils/credential-manager.js";
import { getMineEchoHome } from "../utils/config-path.js";

export const configRouter = Router();

function getOpenclawHome(): string {
  if (process.env.OPENCLAW_HOME) return process.env.OPENCLAW_HOME;
  return join(process.cwd(), ".openclaw");
}

function getOpenclawJsonPath(): string {
  return join(getOpenclawHome(), "openclaw.json");
}

function getEnvPath(): string {
  return join(getMineEchoHome(), ".env");
}

function getEncryptedKeysPath(): string {
  return join(getMineEchoHome(), "encrypted-keys.json");
}

async function readEncryptedKeys(): Promise<Record<string, string>> {
  const path = getEncryptedKeysPath();
  if (!existsSync(path)) return {};
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeEncryptedKeys(keys: Record<string, string>): Promise<void> {
  const path = getEncryptedKeysPath();
  await mkdir(getMineEchoHome(), { recursive: true });
  await writeFile(path, JSON.stringify(keys, null, 2), "utf8");
}

/** provider id -> 加密存储中的变量名 */
const PROVIDER_ENV: Record<string, string> = {
  minimax: "MINIMAX_API_KEY",
  dashscope: "DASHSCOPE_API_KEY",
  zhipu: "ZHIPU_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
};

const PROVIDER_NAMES: Record<string, string> = {
  minimax: "MiniMax",
  dashscope: "通义千问（阿里云 DashScope）",
  zhipu: "智谱 GLM（Zhipu）",
  deepseek: "DeepSeek",
};

/** 应用层 provider ID → Gateway provider 默认 baseUrl */
const PROVIDER_DEFAULT_BASEURL: Record<string, string> = {
  minimax: "https://api.minimax.io/anthropic",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  deepseek: "https://api.deepseek.com/v1",
};

/** 应用层 provider ID → Gateway API 类型（决定请求格式） */
const PROVIDER_API_TYPE: Record<string, string> = {
  minimax: "anthropic-messages",
  dashscope: "openai-completions",
  zhipu: "openai-completions",
  deepseek: "openai-completions",
};

/** 允许的模型 id 列表（OpenClaw agent.model 取值）及展示名 */
const MODEL_OPTIONS: { id: string; label: string; provider: string }[] = [
  { id: "MiniMax-M2.7", label: "MiniMax M2.7", provider: "minimax-cn" },
  { id: "MiniMax-M2.7-highspeed", label: "MiniMax M2.7 High-Speed", provider: "minimax-cn" },
  { id: "MiniMax-M2.5", label: "MiniMax M2.5", provider: "minimax-cn" },
  { id: "MiniMax-M2.5-highspeed", label: "MiniMax M2.5 High-Speed（Coding Plan）", provider: "minimax-cn" },
  { id: "minimax-01", label: "Minimax 01", provider: "minimax-cn" },
  { id: "minimax-2.5", label: "Minimax 2.5", provider: "minimax-cn" },
  { id: "qwen-plus", label: "通义千问 Plus", provider: "aliyun" },
  { id: "qwen-turbo", label: "通义千问 Turbo", provider: "aliyun" },
  { id: "glm-4", label: "智谱 GLM-4", provider: "zhipu" },
  { id: "deepseek-chat", label: "DeepSeek Chat", provider: "deepseek" },
];

const DEFAULT_MODEL_ID = "minimax-cn/MiniMax-M2.5";

/** Gateway provider ID → 应用层 provider ID（用于 PROVIDER_ENV 查找） */
const GATEWAY_TO_APP_PROVIDER: Record<string, string> = {
  "minimax-cn": "minimax",
  aliyun: "dashscope",
  zhipu: "zhipu",
  deepseek: "deepseek",
};

export function getEnvKeyForModelProvider(providerId: string): string | undefined {
  const appProvider = GATEWAY_TO_APP_PROVIDER[providerId] || providerId;
  return PROVIDER_ENV[appProvider];
}

/** 将短模型 id 转为 OpenClaw 的 provider/id 格式，避免被识别为 anthropic/xxx 导致 Unknown model */
function toOpenClawModelId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "minimax-cn/MiniMax-M2.5";
  // 已包含 provider 前缀（支持字母、数字、连字符）
  if (/^[a-z0-9-]+\//.test(trimmed)) {
    // 防御：清理重复前缀如 minimax-cn/minimax-cn/MiniMax-M2.5 → minimax-cn/MiniMax-M2.5
    const parts = trimmed.split("/");
    if (parts.length >= 3 && parts[0] === parts[1]) {
      return parts.slice(1).join("/");
    }
    return trimmed;
  }
  const opt = MODEL_OPTIONS.find((m) => m.id === trimmed);
  return opt ? `${opt.provider}/${opt.id}` : trimmed;
}

/** 已知 provider ID 集合（这些在 MODEL_OPTIONS 中已有硬编码模型列表） */
const KNOWN_PROVIDER_IDS = new Set(MODEL_OPTIONS.map((m) => m.provider));

/** 合并已配置模型和硬编码模型列表：openclaw.json 中已配置的模型优先，未配置的已知 provider 用 MODEL_OPTIONS 补充 */
async function buildModelList(configuredKeys: Set<string>, customList: CustomModel[]): Promise<Array<{ id: string; label: string; provider: string; configured: boolean }>> {
  const configuredModels = await loadConfiguredModels();
  const modelMap = new Map<string, { id: string; label: string; provider: string; configured: boolean }>();

  // 1. 优先使用 openclaw.json 中已配置的模型
  for (const m of configuredModels) {
    modelMap.set(m.id, m);
  }

  // 2. 对于没有在 openclaw.json 中配置 models 的已知 provider，用 MODEL_OPTIONS 补充
  const configuredProviders = new Set(configuredModels.map((m) => m.provider));
  for (const m of MODEL_OPTIONS) {
    const fullId = `${m.provider}/${m.id}`;
    if (!modelMap.has(fullId) && !configuredProviders.has(m.provider)) {
      const envKey = getEnvKeyForModelProvider(m.provider);
      modelMap.set(fullId, {
        id: fullId,
        label: m.label,
        provider: m.provider,
        configured: !!envKey && configuredKeys.has(envKey),
      });
    }
  }

  // 3. 自定义模型
  const customModels = customList.map((m) => ({
    id: `${m.id}/${m.modelId}`,
    label: m.label,
    provider: "custom",
    configured: true,
  }));
  for (const m of customModels) {
    modelMap.set(m.id, m);
  }

  return Array.from(modelMap.values());
}

/** 从 openclaw.json 的 models.providers 加载所有已配置 provider 的模型列表 */
async function loadConfiguredModels(): Promise<Array<{ id: string; label: string; provider: string; configured: boolean }>> {
  const path = getOpenclawJsonPath();
  if (!existsSync(path)) return [];
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as {
      models?: {
        providers?: Record<
          string,
          { baseUrl?: string; apiKey?: string; models?: Array<{ id?: string; name?: string }> }
        >;
      };
    };
    const providers = data?.models?.providers || {};
    const models: Array<{ id: string; label: string; provider: string; configured: boolean }> = [];
    for (const [providerId, cfg] of Object.entries(providers)) {
      if (!cfg?.apiKey || !cfg?.baseUrl) continue;
      const providerModels = cfg.models || [];
      if (providerModels.length > 0) {
        for (const m of providerModels) {
          if (m.id) {
            // 防御：若 model id 已包含 provider 前缀，避免重复拼接
            const fullId = m.id.startsWith(`${providerId}/`) ? m.id : `${providerId}/${m.id}`;
            models.push({
              id: fullId,
              label: `${m.name || m.id} (${providerId})`,
              provider: providerId,
              configured: true,
            });
          }
        }
      } else {
        // provider 已配置但没有 models 列表，用 providerId 作为占位
        models.push({
          id: providerId,
          label: `${providerId} (已配置)`,
          provider: providerId,
          configured: true,
        });
      }
    }
    return models;
  } catch {
    return [];
  }
}

/** Provider ID 别名映射 */
const PROVIDER_ALIASES: Record<string, string[]> = {
  aliyun: ["dashscope"],
  "minimax-cn": ["minimax"],
};

/** 检查某模型 ID 是否对应 openclaw.json 中已配置的 provider */
async function isDynamicModelConfigured(modelId: string): Promise<boolean> {
  const path = getOpenclawJsonPath();
  if (!existsSync(path)) return false;
  const slashIdx = modelId.indexOf("/");
  if (slashIdx < 0) return false;
  const providerId = modelId.slice(0, slashIdx);
  const idsToTry = [providerId, ...(PROVIDER_ALIASES[providerId] || [])];
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as {
      models?: {
        providers?: Record<string, { baseUrl?: string; apiKey?: string }>;
      };
    };
    for (const id of idsToTry) {
      const cfg = data?.models?.providers?.[id];
      if (cfg?.baseUrl && cfg?.apiKey) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** 读取加密存储，返回已配置的 key 集合（不返回具体值） */
async function getConfiguredEnvKeys(): Promise<Set<string>> {
  const configured = new Set<string>();
  // 优先读取 encrypted-keys.json
  const encryptedKeys = await readEncryptedKeys();
  for (const key of Object.keys(encryptedKeys)) {
    if (encryptedKeys[key]) configured.add(key);
  }
  // 兼容旧版：若 encrypted-keys.json 中没有，但 .env 中有，也视为已配置
  const envPath = getEnvPath();
  if (!existsSync(envPath)) return configured;
  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim().replace(/^["']|["']$/g, "");
        if (val) configured.add(key);
      }
    }
  } catch (_) {}
  return configured;
}

async function readOpenclawModel(): Promise<string> {
  const path = getOpenclawJsonPath();
  if (!existsSync(path)) return DEFAULT_MODEL_ID;
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as {
      agent?: { model?: string };
      agents?: { defaults?: { model?: { primary?: string } } };
    };
    const id =
      data?.agent?.model ??
      data?.agents?.defaults?.model?.primary;
    if (typeof id !== "string" || !id.trim()) return DEFAULT_MODEL_ID;
    const trimmed = id.trim();
    // 防御：清理重复前缀如 minimax-cn/minimax-cn/MiniMax-M2.5 → minimax-cn/MiniMax-M2.5
    const parts = trimmed.split("/");
    if (parts.length >= 3 && parts[0] === parts[1]) {
      return parts.slice(1).join("/");
    }
    return trimmed;
  } catch {
    return DEFAULT_MODEL_ID;
  }
}

/** 更新模型配置：写 agents.defaults.model.primary，同时同步 agents.list 中 main agent 的 model */
async function writeOpenclawModel(modelId: string): Promise<void> {
  const dir = getOpenclawHome();
  const path = getOpenclawJsonPath();
  const tmpPath = path + ".tmp." + Date.now();
  let data: Record<string, unknown> = {};
  if (existsSync(path)) {
    const raw = await readFile(path, "utf8");
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (_) {}
  }
  if (!data.agents) data.agents = {};
  const agents = data.agents as Record<string, unknown>;
  if (!agents.defaults) agents.defaults = {};
  const defaults = agents.defaults as Record<string, unknown>;
  if (!defaults.model) defaults.model = {};
  const resolvedId = toOpenClawModelId(modelId);
  (defaults.model as Record<string, unknown>).primary = resolvedId;
  // 同步 agents.list 中 main agent 的 model，避免 Gateway 使用旧模型
  const list = agents.list as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(list)) {
    const mainAgent = list.find((a) => a.id === "main");
    if (mainAgent) {
      mainAgent.model = resolvedId;
    }
  }
  await mkdir(dir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, path);
}

/** 将自定义模型列表同步到 openclaw.json 的 models.providers（OpenClaw 本地/自定义模型格式） */
export function normalizeCustomProviderConfig(m: CustomModel): {
  baseUrl: string;
  apiKey: string;
  api: string;
  models: Array<{ id: string; name: string }>;
} {
  let baseUrl = m.baseUrl.trim();
  if (baseUrl && !/\/v1\/?$/.test(baseUrl)) baseUrl = baseUrl.replace(/\/?$/, "") + "/v1";
  baseUrl = baseUrl.replace(/\/$/, "");
  const modelId = m.modelId?.trim() || "default";
  return {
    baseUrl: baseUrl || "http://127.0.0.1:11434/v1",
    apiKey: m.apiKey?.trim() || "ollama-local",
    api: "openai-completions",
    models: [{ id: modelId, name: m.label || modelId }],
  };
}

async function syncCustomProvidersToOpenclaw(): Promise<void> {
  const custom = await loadCustomModels();
  const path = getOpenclawJsonPath();
  const dir = getOpenclawHome();
  let data: Record<string, unknown> = {};
  if (existsSync(path)) {
    const raw = await readFile(path, "utf8");
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (_) {}
  }
  const models = (data.models as Record<string, unknown>) || {};
  if (!models.providers || typeof models.providers !== "object") models.providers = {};
  const providers = models.providers as Record<string, unknown>;
  for (const m of custom) {
    providers[m.id] = normalizeCustomProviderConfig(m);
  }
  data.models = { ...models, mode: "merge" };
  await mkdir(dir, { recursive: true });
  const tmpPath = path + ".tmp." + Date.now();
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, path);
}

configRouter.get("/", async (_req, res) => {
  try {
    const [currentId, configuredKeys, customList] = await Promise.all([
      readOpenclawModel(),
      getConfiguredEnvKeys(),
      loadCustomModels(),
    ]);
    const models = await buildModelList(configuredKeys, customList);
    let current: { provider: string; model: string; label: string };
    const customMatch = customList.find((m) => `${m.id}/${m.modelId}` === currentId);
    if (customMatch) {
      current = { provider: "custom", model: currentId, label: customMatch.label };
    } else {
      const matched = models.find((m) => m.id === currentId);
      current = matched
        ? { provider: matched.provider, model: matched.id, label: matched.label }
        : { provider: currentId.includes("/") ? currentId.split("/")[0] : "openclaw", model: currentId, label: currentId };
    }
    res.json({
      model: current,
      models,
      providers: Object.keys(PROVIDER_ENV).map((id) => ({
        id,
        name: PROVIDER_NAMES[id] || id,
        envKey: PROVIDER_ENV[id],
        configured: configuredKeys.has(PROVIDER_ENV[id]),
      })),
      customModels: customList.map((m) => ({ id: m.id, label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, embeddingModelId: m.embeddingModelId, embeddingDimensions: m.embeddingDimensions })),
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

configRouter.patch("/", async (req, res) => {
  try {
    const body = req.body || {};
    const modelId = body.model?.model ?? body.model;
    if (typeof modelId !== "string" || !modelId.trim()) {
      return res.status(400).json({ error: "model 为必填（模型 id）" });
    }
    const id = modelId.trim();
    const customList = await loadCustomModels();
    const customMatch = customList.find((m) => `${m.id}/${m.modelId}` === id);
    if (customMatch) {
      await writeOpenclawModel(id);
      const configuredKeys = await getConfiguredEnvKeys();
      const models = await buildModelList(configuredKeys, customList);
      return res.json({
        model: { provider: "custom", model: id, label: customMatch.label },
        models,
        providers: Object.keys(PROVIDER_ENV).map((pid) => ({ id: pid, name: PROVIDER_NAMES[pid] || pid, envKey: PROVIDER_ENV[pid], configured: configuredKeys.has(PROVIDER_ENV[pid]) })),
        customModels: customList.map((m) => ({ id: m.id, label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, embeddingModelId: m.embeddingModelId, embeddingDimensions: m.embeddingDimensions })),
      });
    }
    const option = MODEL_OPTIONS.find((m) => m.id === id);
    if (option) {
      const configuredKeys = await getConfiguredEnvKeys();
      const envKey = getEnvKeyForModelProvider(option.provider);
      if (!envKey || !configuredKeys.has(envKey)) {
        return res.status(400).json({
          error: "请先在「模型配置」中为该模型所属服务商配置 API Key 后再切换",
          provider: option.provider,
        });
      }
      await writeOpenclawModel(id);
      const models = await buildModelList(configuredKeys, customList);
      const matched = models.find((m) => m.id === `${option.provider}/${option.id}`);
      res.json({
        model: matched
          ? { provider: matched.provider, model: matched.id, label: matched.label }
          : { provider: option.provider, model: option.id, label: option.label },
        models,
        providers: Object.keys(PROVIDER_ENV).map((pid) => ({
          id: pid,
          name: PROVIDER_NAMES[pid] || pid,
          envKey: PROVIDER_ENV[pid],
          configured: configuredKeys.has(PROVIDER_ENV[pid]),
        })),
        customModels: customList.map((m) => ({ id: m.id, label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, embeddingModelId: m.embeddingModelId, embeddingDimensions: m.embeddingDimensions })),
      });
      return;
    }
    // 支持任意 provider/model-id 格式的动态模型（只要 openclaw.json 中已配置对应 provider）
    if (/^[a-z0-9-]+\//.test(id) && (await isDynamicModelConfigured(id))) {
      await writeOpenclawModel(id);
      const configuredKeys = await getConfiguredEnvKeys();
      const models = await buildModelList(configuredKeys, customList);
      res.json({
        model: { provider: id.split("/")[0], model: id, label: id },
        models,
        providers: Object.keys(PROVIDER_ENV).map((pid) => ({
          id: pid,
          name: PROVIDER_NAMES[pid] || pid,
          envKey: PROVIDER_ENV[pid],
          configured: configuredKeys.has(PROVIDER_ENV[pid]),
        })),
        customModels: customList.map((m) => ({ id: m.id, label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, embeddingModelId: m.embeddingModelId, embeddingDimensions: m.embeddingDimensions })),
      });
      return;
    }
    return res.status(400).json({
      error: "不支持的模型 id",
      allowed: [...MODEL_OPTIONS.map((m) => m.id), ...customList.map((m) => `${m.id}/${m.modelId}`)],
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** GET 模型配置（各 provider 是否已配置，不返回 key 值） */
configRouter.get("/providers", async (_req, res) => {
  try {
    const configuredKeys = await getConfiguredEnvKeys();
    res.json({
      providers: Object.keys(PROVIDER_ENV).map((id) => ({
        id,
        name: PROVIDER_NAMES[id] || id,
        envKey: PROVIDER_ENV[id],
        configured: configuredKeys.has(PROVIDER_ENV[id]),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** PATCH 保存某 provider 的 API Key 到加密存储 */
configRouter.patch("/providers", async (req, res) => {
  try {
    const body = req.body || {};
    const providerId = body.provider ?? body.id;
    const apiKey = body.apiKey ?? body.api_key;
    if (typeof providerId !== "string" || !providerId.trim()) {
      return res.status(400).json({ error: "provider 为必填" });
    }
    const envKey = PROVIDER_ENV[providerId];
    if (!envKey) {
      return res.status(400).json({ error: "不支持的 provider", allowed: Object.keys(PROVIDER_ENV) });
    }

    // 加密存储 API Key
    const encryptedKeys = await readEncryptedKeys();
    if ("apiKey" in body) {
      if (typeof apiKey === "string" && apiKey.trim()) {
        encryptedKeys[envKey] = credentialManager.encrypt(apiKey.trim());
      } else {
        delete encryptedKeys[envKey];
      }
    }
    await writeEncryptedKeys(encryptedKeys);

    // 同步 API Key 到 openclaw.json models.providers，供 Embedding 复用
    if ("apiKey" in body && typeof apiKey === "string") {
      const openclawPath = getOpenclawJsonPath();
      let openclawData: Record<string, unknown> = {};
      if (existsSync(openclawPath)) {
        try {
          const raw = await readFile(openclawPath, "utf8");
          openclawData = JSON.parse(raw) as Record<string, unknown>;
        } catch (_) {}
      }
      if (!openclawData.models) openclawData.models = {};
      const models = openclawData.models as Record<string, unknown>;
      if (!models.providers || typeof models.providers !== "object") models.providers = {};
      const providers = models.providers as Record<string, unknown>;
      const openclawProviderId =
        providerId === "minimax" ? "minimax-cn" :
        providerId === "dashscope" ? "aliyun" :
        providerId;
      const existing = providers[openclawProviderId] as Record<string, unknown> | undefined;
      const defaultBaseUrl = PROVIDER_DEFAULT_BASEURL[providerId];
      // Gateway schema 要求 providers.{id}.models 为数组
      const defaultModels = (() => {
        const map: Record<string, Array<{ id: string; name: string }>> = {
          minimax: [
            { id: "MiniMax-M2.7", name: "MiniMax M2.7" },
            { id: "MiniMax-M2.7-highspeed", name: "MiniMax M2.7 High-Speed" },
            { id: "MiniMax-M2.5", name: "MiniMax M2.5" },
            { id: "MiniMax-M2.5-highspeed", name: "MiniMax M2.5 High-Speed" },
          ],
          dashscope: [{ id: "qwen-plus", name: "Qwen Plus" }],
          deepseek: [{ id: "deepseek-chat", name: "DeepSeek Chat" }],
          zhipu: [{ id: "glm-4", name: "GLM-4" }],
        };
        return map[providerId];
      })();
      const apiType = PROVIDER_API_TYPE[providerId];
      if (apiKey.trim()) {
        providers[openclawProviderId] = {
          ...(defaultBaseUrl ? { baseUrl: defaultBaseUrl } : {}),
          ...(defaultModels ? { models: defaultModels } : {}),
          ...(apiType ? { api: apiType } : {}),
          ...(providerId === "minimax" ? { authHeader: true } : {}),
          ...(existing || {}),
          apiKey: apiKey.trim(),
        };
      } else if (existing) {
        delete (existing as Record<string, unknown>).apiKey;
        providers[openclawProviderId] = existing;
      }
      openclawData.models = models;
      const oclawTmp = openclawPath + ".tmp." + Date.now();
      await writeFile(oclawTmp, JSON.stringify(openclawData, null, 2), "utf8");
      await rename(oclawTmp, openclawPath);
    }

    const configuredKeys = await getConfiguredEnvKeys();
    res.json({
      ok: true,
      providers: Object.keys(PROVIDER_ENV).map((id) => ({
        id,
        name: PROVIDER_NAMES[id] || id,
        configured: configuredKeys.has(PROVIDER_ENV[id]),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 自定义/本地模型：列表（不返回 apiKey） */
configRouter.get("/custom-models", async (_req, res) => {
  try {
    const list = await loadCustomModels();
    res.json({
      customModels: list.map((m) => ({ id: m.id, label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, embeddingModelId: m.embeddingModelId, embeddingDimensions: m.embeddingDimensions })),
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 新增自定义/本地模型，并同步到 openclaw.json */
configRouter.post("/custom-models", async (req, res) => {
  try {
    const body = req.body || {};
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
    const modelId = typeof body.modelId === "string" ? body.modelId.trim() : "default";
    if (!label || !baseUrl) {
      return res.status(400).json({ error: "label 与 baseUrl 为必填" });
    }
    const list = await loadCustomModels();
    const id = genCustomModelId();
    const embeddingDimensions = Number(body.embeddingDimensions);
    const entry: CustomModel = {
      id,
      label,
      baseUrl,
      apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : undefined,
      modelId: modelId || "default",
      embeddingModelId: typeof body.embeddingModelId === "string" && body.embeddingModelId.trim() ? body.embeddingModelId.trim() : undefined,
      embeddingDimensions: Number.isFinite(embeddingDimensions) && embeddingDimensions > 0 ? embeddingDimensions : undefined,
    };
    list.push(entry);
    await saveCustomModels(list);
    await syncCustomProvidersToOpenclaw();
    res.status(201).json({ id, label, baseUrl, modelId: entry.modelId, embeddingModelId: entry.embeddingModelId, embeddingDimensions: entry.embeddingDimensions });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 更新自定义模型 */
configRouter.patch("/custom-models/:id", async (req, res) => {
  try {
    const list = await loadCustomModels();
    const idx = list.findIndex((m) => m.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: "自定义模型不存在" });
    const body = req.body || {};
    if (typeof body.label === "string") list[idx].label = body.label.trim();
    if (typeof body.baseUrl === "string") list[idx].baseUrl = body.baseUrl.trim();
    if (typeof body.modelId === "string") list[idx].modelId = body.modelId.trim() || "default";
    if ("apiKey" in body) list[idx].apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
    if ("embeddingModelId" in body) list[idx].embeddingModelId = typeof body.embeddingModelId === "string" && body.embeddingModelId.trim() ? body.embeddingModelId.trim() : undefined;
    if ("embeddingDimensions" in body) {
      const embeddingDimensions = Number(body.embeddingDimensions);
      list[idx].embeddingDimensions = Number.isFinite(embeddingDimensions) && embeddingDimensions > 0 ? embeddingDimensions : undefined;
    }
    await saveCustomModels(list);
    await syncCustomProvidersToOpenclaw();
    res.json({
      id: list[idx].id,
      label: list[idx].label,
      baseUrl: list[idx].baseUrl,
      modelId: list[idx].modelId,
      embeddingModelId: list[idx].embeddingModelId,
      embeddingDimensions: list[idx].embeddingDimensions,
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 删除自定义模型 */
configRouter.delete("/custom-models/:id", async (req, res) => {
  try {
    const list = await loadCustomModels();
    const next = list.filter((m) => m.id !== req.params.id);
    if (next.length === list.length) return res.status(404).json({ error: "自定义模型不存在" });
    await saveCustomModels(next);
    await syncCustomProvidersToOpenclaw();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 获取语音转录配置 */
configRouter.get("/transcription", async (_req, res) => {
  try {
    const cfg = await loadTranscriptionConfig();
    res.json({
      provider: cfg.provider,
      apiKey: cfg.apiKey ? "***" : "",
      model: cfg.model,
      enabled: cfg.enabled,
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** 保存语音转录配置 */
configRouter.post("/transcription", async (req, res) => {
  try {
    const body = req.body || {};
    const current = await loadTranscriptionConfig();

    if (typeof body.provider === "string") current.provider = body.provider;
    if (typeof body.apiKey === "string") {
      current.apiKey = body.apiKey.trim();
      if (current.apiKey) current.enabled = true;
    }
    if (typeof body.model === "string") current.model = body.model;
    if (typeof body.enabled === "boolean") current.enabled = body.enabled;

    await saveTranscriptionConfig(current);
    res.json({
      provider: current.provider,
      apiKey: current.apiKey ? "***" : "",
      model: current.model,
      enabled: current.enabled,
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});
