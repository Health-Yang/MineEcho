import { Router } from "express";
import { loadApps, saveApps, genAppId, type AiApp, type AiAppType } from "../ai-apps/store.js";
import { invokeApp } from "../ai-apps/adapters.js";
import { mkdir, writeFile, rm, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { loadSkillTriggersFromDisk } from "../triggers/skill-loader.js";

export const aiAppsRouter = Router();

// 桌面版检测
const isDesktop = process.env.CONSOLE_DIST?.includes('.app/Contents');

// 开发环境检测：非桌面版且非容器（/app 不存在）
const isDev = !isDesktop && !existsSync('/app');

// AI 应用保存到技能扩展目录（与 L2 下发技能同一路径）- 使用用户数据目录
function getExtensionsDir(): string {
  if (process.env.OPENCLAW_EXTENSIONS_DIR) {
    return process.env.OPENCLAW_EXTENSIONS_DIR;
  }
  if (isDesktop) {
    return join(process.env.OPENCLAW_HOME || join(process.env.HOME || '', 'Library', 'Application Support', 'MineEcho'), '.openclaw', 'workspace', 'skills');
  }
  if (isDev) {
    return join(process.cwd(), '.openclaw', 'workspace', 'skills');
  }
  return '/app/.openclaw/workspace/skills';
}

const EXTENSIONS_DIR = getExtensionsDir();
const DEFAULT_AI_APP_MAX_TOKENS = 65536;
const MIN_AI_APP_MAX_TOKENS = 512;
const MAX_AI_APP_MAX_TOKENS = 131072;
const DEFAULT_AI_APP_TIMEOUT_MS = 120000;
const MIN_AI_APP_TIMEOUT_MS = 5000;
const MAX_AI_APP_TIMEOUT_MS = 600000;

function normalizeAiAppMaxTokens(value: unknown): number | undefined {
  const configured = Number(value);
  if (!Number.isFinite(configured) || configured < MIN_AI_APP_MAX_TOKENS) return undefined;
  return Math.min(Math.floor(configured), MAX_AI_APP_MAX_TOKENS);
}

function getAiAppTimeoutMs(): number {
  const configured = Number(process.env.MINEECHO_AI_APP_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured >= MIN_AI_APP_TIMEOUT_MS) return Math.min(Math.floor(configured), MAX_AI_APP_TIMEOUT_MS);
  return DEFAULT_AI_APP_TIMEOUT_MS;
}

/**
 * 为 AI 应用生成 Gateway skill 目录
 * 包含：SKILL.md + scripts/call.js
 */
async function syncAiAppToGatewaySkill(app: AiApp): Promise<void> {
  const skillDir = join(EXTENSIONS_DIR, app.id);
  const scriptsDir = join(skillDir, "scripts");

  // 创建目录
  await mkdir(scriptsDir, { recursive: true });

  // 从描述中提取关键词作为 triggers
  const triggers = extractTriggersFromDescription(`${app.name} ${app.description}`);

  // 生成 SKILL.md
  const skillMd = `---
name: ${app.name}
description: ${app.description}
triggers:
${triggers.map((t) => `  - ${t}`).join("\n")}
---

# ${app.name}

${app.description}

## 触发方式

当用户询问与以下关键词相关的问题时，**必须调用此技能**，不要联网搜索：
${triggers.filter(t => t !== "AI应用").map((t) => `- ${t}`).join("\n")}

## 重要说明

- 此技能已接入专业知识库，能提供准确的产品信息
- 遇到上述关键词相关的问题时，请优先调用本技能，而非使用 web_search 或 web_fetch
`;

  await writeFile(join(skillDir, "SKILL.md"), skillMd, "utf8");

  // 生成 call.js
  const callScript = generateCallJs(app);
  const callJsPath = join(scriptsDir, "call.js");
  await writeFile(callJsPath, callScript, "utf8");
  // 添加执行权限（Gateway 技能脚本需要可执行）
  await chmod(callJsPath, 0o755);
}

/**
 * 从描述中提取触发关键词
 */
function extractTriggersFromDescription(description: string): string[] {
  const triggers = new Set<string>();

  // 提取描述中的关键词（长度 >= 2 的中文词，或长度 >= 2 的英文/数字词）
  // 先替换常见分隔符为空格，然后分词
  const normalized = description
    .replace(/[，。！？、,;.!?\s]+/g, " ")
    .replace(/([a-zA-Z])([一-龥])/g, "$1 $2") // 英文后接中文
    .replace(/([一-龥])([a-zA-Z])/g, "$1 $2"); // 中文后接英文

  const words = normalized.split(/\s+/);
  for (const word of words) {
    const trimmed = word.trim();
    if (!trimmed) continue;

    // 中文词：长度 2~8（超过8字符的通常是句子而非关键词，过滤掉）
    if (/[一-龥]/.test(trimmed) && trimmed.length >= 2 && trimmed.length <= 8) {
      triggers.add(trimmed);
    }
    // 英文/数字词：长度 >= 2（技术缩写如 AICP、VGPU 等）
    else if (/^[a-zA-Z0-9]+$/.test(trimmed) && trimmed.length >= 2) {
      triggers.add(trimmed);
      // 同时添加小写版本以提高匹配率
      if (/^[A-Z0-9]+$/.test(trimmed)) {
        triggers.add(trimmed.toLowerCase());
      }
    }
  }

  // 添加通用触发词
  triggers.add("AI应用");

  return Array.from(triggers).slice(0, 15); // 最多 15 个触发词
}

/**
 * 规范化 API endpoint：
 * FastGPT base URL 形如 {host}/api，完整调用路径为 {host}/api/v1/chat/completions
 * 若用户只填了 base URL（以 /api 结尾），自动补全路径
 */
function normalizeApiEndpoint(endpoint: string): string {
  if (!endpoint) return endpoint;
  const url = endpoint.replace(/\/+$/, ""); // 去掉末尾斜杠
  if (url.endsWith("/api")) {
    return url + "/v1/chat/completions";
  }
  return url;
}

/**
 * 生成 RAG 应用 call.js（单步调用）
 */
function generateRagScript(apiUrl: string, apiKey: string, method: string, requestStyle: string, queryKey: string, maxTokens: number): string {
  return `#!/usr/bin/env node
import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
import { URL } from "url";

const CONFIG = {
  apiUrl: ${JSON.stringify(apiUrl)},
  apiKey: ${JSON.stringify(apiKey)},
  method: ${JSON.stringify(method)},
  requestStyle: ${JSON.stringify(requestStyle)},
  queryKey: ${JSON.stringify(queryKey)},
  maxTokens: ${JSON.stringify(maxTokens)},
  timeoutMs: ${JSON.stringify(getAiAppTimeoutMs())}
};

function writeError(error) {
  process.stderr.write(JSON.stringify({ error: redactSecrets(error.message || String(error)) }));
}

function redactSecrets(value) {
  let text = String(value);
  if (CONFIG.apiKey) text = text.split(CONFIG.apiKey).join("[REDACTED]");
  return text
    .replace(/([?&](?:api[_-]?key|token|access_token|secret)=)[^&\\s]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[REDACTED]");
}

async function callAiApp(message) {
  if (!CONFIG.apiUrl) {
    writeError(new Error("AI 应用未配置 API URL"));
    process.exit(1);
  }

  const url = new URL(CONFIG.apiUrl);
  const clientRequest = url.protocol === "https:" ? httpsRequest : httpRequest;

  let postData;
  if (CONFIG.requestStyle === "messages") {
    postData = JSON.stringify({ messages: [{ role: "user", content: message }], stream: false, max_tokens: CONFIG.maxTokens || ${DEFAULT_AI_APP_MAX_TOKENS} });
  } else {
    const body = {};
    body[CONFIG.queryKey] = message;
    postData = JSON.stringify(body);
  }

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname + url.search,
    method: CONFIG.method,
    headers: { "Content-Type": "application/json" }
  };
  if (CONFIG.apiKey) options.headers["Authorization"] = "Bearer " + CONFIG.apiKey;

  return new Promise((resolve, reject) => {
    const req = clientRequest(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          const content = result.choices?.[0]?.message?.content
            || result.data?.answer || result.answer || result.response
            || result.content || result.text || JSON.stringify(result);
          resolve(content);
        } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.setTimeout(CONFIG.timeoutMs, () => req.destroy(new Error("请求超时")));
    req.write(postData);
    req.end();
  });
}

const message = process.argv[2] || process.env.USER_MESSAGE || "";
if (message) {
  callAiApp(message).then(
    result => process.stdout.write(String(result)),
    err => { writeError(err); process.exit(1); }
  );
}

export { callAiApp };
`;
}

/**
 * 生成 Workflow 应用 call.js（单步调用，与 RAG 相同）
 * Workflow 作为外部部署应用，通过标准 API 接入
 */
function generateWorkflowScript(apiUrl: string, apiKey: string, method: string, requestStyle: string, queryKey: string, maxTokens: number): string {
  return `#!/usr/bin/env node
import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
import { URL } from "url";

const CONFIG = {
  apiUrl: ${JSON.stringify(apiUrl)},
  apiKey: ${JSON.stringify(apiKey)},
  method: ${JSON.stringify(method)},
  requestStyle: ${JSON.stringify(requestStyle)},
  queryKey: ${JSON.stringify(queryKey)},
  maxTokens: ${JSON.stringify(maxTokens)},
  timeoutMs: ${JSON.stringify(getAiAppTimeoutMs())}
};

function writeError(error) {
  process.stderr.write(JSON.stringify({ error: redactSecrets(error.message || String(error)) }));
}

function redactSecrets(value) {
  let text = String(value);
  if (CONFIG.apiKey) text = text.split(CONFIG.apiKey).join("[REDACTED]");
  return text
    .replace(/([?&](?:api[_-]?key|token|access_token|secret)=)[^&\\s]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[REDACTED]");
}

async function callAiApp(message) {
  if (!CONFIG.apiUrl) {
    writeError(new Error("AI 应用未配置 API URL"));
    process.exit(1);
  }

  const url = new URL(CONFIG.apiUrl);
  const clientRequest = url.protocol === "https:" ? httpsRequest : httpRequest;

  let postData;
  if (CONFIG.requestStyle === "messages") {
    postData = JSON.stringify({ messages: [{ role: "user", content: message }], stream: false, max_tokens: CONFIG.maxTokens || ${DEFAULT_AI_APP_MAX_TOKENS} });
  } else {
    const body = {};
    body[CONFIG.queryKey] = message;
    postData = JSON.stringify(body);
  }

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname + url.search,
    method: CONFIG.method,
    headers: { "Content-Type": "application/json" }
  };
  if (CONFIG.apiKey) options.headers["Authorization"] = "Bearer " + CONFIG.apiKey;

  return new Promise((resolve, reject) => {
    const req = clientRequest(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          const content = result.choices?.[0]?.message?.content
            || result.data?.answer || result.answer || result.response
            || result.content || result.text || JSON.stringify(result);
          resolve(content);
        } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.setTimeout(CONFIG.timeoutMs, () => req.destroy(new Error("请求超时")));
    req.write(postData);
    req.end();
  });
}

const message = process.argv[2] || process.env.USER_MESSAGE || "";
if (message) {
  callAiApp(message).then(
    result => process.stdout.write(String(result)),
    err => { writeError(err); process.exit(1); }
  );
}

export { callAiApp };
`;
}

/**
 * 生成 call.js 脚本（RAG / Workflow 均通过外部 API 调用）
 */
function generateCallJs(app: AiApp): string {
  const config = app.config;
  const apiUrl = normalizeApiEndpoint(config.endpoint);
  const apiKey = config.apiKey || "";
  const method = config.method || "POST";
  const requestStyle = config.requestStyle || "messages";
  const queryKey = config.queryKey || "query";
  const maxTokens = normalizeAiAppMaxTokens(config.maxTokens) ?? normalizeAiAppMaxTokens(process.env.MINEECHO_AI_APP_MAX_TOKENS) ?? DEFAULT_AI_APP_MAX_TOKENS;

  if (app.type === "workflow") {
    return generateWorkflowScript(apiUrl, apiKey, method, requestStyle, queryKey, maxTokens);
  }
  return generateRagScript(apiUrl, apiKey, method, requestStyle, queryKey, maxTokens);
}

/**
 * 同步所有已启用的 AI 应用到 Gateway Skill 目录
 * 在启动时调用，确保容器重启后 Extensions 目录完整
 */
export async function syncAllEnabledAiApps(): Promise<{ synced: number; skipped: number; failed: number }> {
  const apps = await loadApps();
  const enabledApps = apps.filter(a => a.enabled);
  let synced = 0, skipped = 0, failed = 0;

  for (const app of enabledApps) {
    try {
      await syncAiAppToGatewaySkill(app);
      synced++;
      logger.info(`[AiAppsSync] 已同步 AI 应用到 Gateway`, { id: app.id, name: app.name });
    } catch (e) {
      failed++;
      logger.error(`[AiAppsSync] 同步 AI 应用失败`, { id: app.id, error: e });
    }
  }

  // 清理已删除或禁用应用对应的 Gateway skill（只处理 app- 开头的目录）
  try {
    const { readdir } = await import("node:fs/promises");
    const enabledIds = new Set(enabledApps.map(a => a.id));
    const entries = await readdir(EXTENSIONS_DIR, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("app-") && !enabledIds.has(entry.name)) {
        await removeAiAppFromGatewaySkill(entry.name);
        logger.info(`[AiAppsSync] 已清理失效的 AI 应用 Gateway skill`, { name: entry.name });
      }
    }
  } catch {}

  // AI 应用同步完成后刷新触发词索引
  try {
    await loadSkillTriggersFromDisk();
    logger.info("[AiAppsSync] 同步完成后已刷新触发词索引");
  } catch (e) {
    logger.warn("[AiAppsSync] 同步后刷新触发词索引失败:", { error: (e as Error).message });
  }

  return { synced, skipped, failed };
}

async function refreshSkillTriggerIndexAfterAiAppChange(): Promise<void> {
  try {
    await loadSkillTriggersFromDisk();
  } catch (e) {
    logger.warn("[AiApps] 刷新触发词索引失败:", { error: (e as Error).message });
  }
}

/**
 * 删除 Gateway skill
 */
async function removeAiAppFromGatewaySkill(appId: string): Promise<void> {
  const skillDir = join(EXTENSIONS_DIR, appId);
  try {
    await rm(skillDir, { recursive: true, force: true });
  } catch {
    // 忽略删除错误
  }
}

// ── CRUD Routes ──

aiAppsRouter.get("/", async (_req, res) => {
  try {
    const apps = await loadApps();
    res.json({ apps });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

aiAppsRouter.get("/:id", async (req, res) => {
  try {
    const apps = await loadApps();
    const app = apps.find((a) => a.id === req.params.id);
    if (!app) return res.status(404).json({ error: "App not found" });
    res.json(app);
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

aiAppsRouter.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const { name, description, type, enabled = true, config } = body;
    if (!name || typeof name !== "string" || !description || typeof description !== "string") {
      return res.status(400).json({ error: "name and description are required" });
    }
    if (!type || (type !== "rag" && type !== "workflow")) {
      return res.status(400).json({ error: "type must be rag or workflow" });
    }
    const conf = config && typeof config === "object" ? config : {};
    if (!conf.endpoint || typeof conf.endpoint !== "string") {
      return res.status(400).json({ error: "config.endpoint is required" });
    }
    const apps = await loadApps();
    const now = Date.now();
    const app: AiApp = {
      id: genAppId(),
      name: name.trim(),
      description: description.trim(),
      type: type as AiAppType,
      enabled: Boolean(enabled),
      config: {
        endpoint: conf.endpoint.trim(),
        apiKey: typeof conf.apiKey === "string" ? conf.apiKey.trim() : undefined,
        method: conf.method || "POST",
        requestStyle: conf.requestStyle === "messages" ? "messages" : "query",
        queryKey: conf.queryKey || "query",
        responseContentPath: conf.responseContentPath,
        maxTokens: normalizeAiAppMaxTokens(conf.maxTokens),
      },
      createdAt: now,
      updatedAt: now,
    };
    apps.push(app);
    await saveApps(apps);
    if (app.enabled) {
      try {
        await syncAiAppToGatewaySkill(app);
        await refreshSkillTriggerIndexAfterAiAppChange();
      } catch (e) {
        logger.error("Failed to sync AI app to Gateway skill:", { error: e });
      }
    }
    res.status(201).json(app);
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

aiAppsRouter.patch("/:id", async (req, res) => {
  try {
    const apps = await loadApps();
    const idx = apps.findIndex((a) => a.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: "App not found" });
    const body = req.body || {};
    const app = apps[idx];
    if (body.name != null) app.name = String(body.name).trim();
    if (body.description != null) app.description = String(body.description).trim();
    if (body.type === "rag" || body.type === "workflow") app.type = body.type;
    if (typeof body.enabled === "boolean") app.enabled = body.enabled;
    if (body.config && typeof body.config === "object") {
      if (body.config.endpoint != null) app.config.endpoint = String(body.config.endpoint).trim();
      if (body.config.apiKey !== undefined) app.config.apiKey = body.config.apiKey ? String(body.config.apiKey).trim() : undefined;
      if (body.config.method != null) app.config.method = body.config.method;
      if (body.config.requestStyle === "messages" || body.config.requestStyle === "query") app.config.requestStyle = body.config.requestStyle;
      if (body.config.queryKey != null) app.config.queryKey = body.config.queryKey;
      if (body.config.responseContentPath !== undefined) app.config.responseContentPath = body.config.responseContentPath;
      if (body.config.maxTokens !== undefined) app.config.maxTokens = normalizeAiAppMaxTokens(body.config.maxTokens);
    }
    app.updatedAt = Date.now();
    await saveApps(apps);
    // Sync to Gateway skill when enabled; remove when disabled
    try {
      if (app.enabled) {
        await syncAiAppToGatewaySkill(app);
      } else {
        await removeAiAppFromGatewaySkill(app.id);
      }
      await refreshSkillTriggerIndexAfterAiAppChange();
    } catch (e) {
      logger.error("Failed to sync AI app to Gateway skill:", { error: e });
    }
    res.json(app);
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

aiAppsRouter.delete("/:id", async (req, res) => {
  try {
    const apps = await loadApps();
    const next = apps.filter((a) => a.id !== req.params.id);
    if (next.length === apps.length) return res.status(404).json({ error: "App not found" });
    await saveApps(next);
    try {
      await removeAiAppFromGatewaySkill(req.params.id);
      await refreshSkillTriggerIndexAfterAiAppChange();
    } catch (e) {
      logger.error("Failed to remove AI app Gateway skill:", { error: e });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

// ── Test Route ──

/**
 * POST /api/ai-apps/:id/test
 * 测试 AI 应用连通性，发送一条测试消息并返回响应
 */
aiAppsRouter.post("/:id/test", async (req, res) => {
  try {
    const apps = await loadApps();
    const app = apps.find((a) => a.id === req.params.id);
    if (!app) return res.status(404).json({ error: "App not found" });

    const { message = "你好，请简单介绍一下自己" } = req.body || {};
    const result = await invokeApp(app, message);
    res.json(result);
  } catch (e) {
    logger.error("[AiAppsTest] Error:", { error: (e as Error).message, appId: req.params.id });
    res.status(500).json({ content: "", error: String((e as Error).message) });
  }
});
