import { Router } from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { redactSecrets } from "../utils/redact.js";
import { getMineEchoHome, ENTERPRISE_CONFIG_FILE } from "../utils/config-path.js";
import { clearEnterpriseConfigCache } from "../account/client.js";
import { invalidateCache } from "../utils/cache.js";
import { syncSkillsFromEnterprise } from "../skills/sync.js";
import { logger } from "../utils/logger.js";
import { restartEmbeddedGateway } from "../gateway/embedded.js";
import { getOrCreateUserId } from "../utils/user-id.js";
import { credentialManager } from "../utils/credential-manager.js";

export const initRouter = Router();

function getOpenclawHome(): string {
  // 桌面版：使用用户数据目录
  if (process.env.OPENCLAW_HOME) {
    // Gateway 在 OPENCLAW_HOME 下创建 .openclaw 子目录作为工作目录
    // 所以实际配置文件在 OPENCLAW_HOME/.openclaw/
    return join(process.env.OPENCLAW_HOME, '.openclaw');
  }
  // 检测桌面版
  if (process.env.MINECHO_DESKTOP === 'true') {
    // 桌面版使用 Electron app.getPath('userData') 对应的目录
    // 即 ~/Library/Application Support/MineEcho
    // 需要从配置目录推断（去掉 /.mineecho）
    if (process.env.MINEECHO_CONFIG_HOME || process.env.MINECHO_CONFIG_HOME) {
      const base = getMineEchoHome().replace(/\.mineecho$/, '');
      return join(base, '.openclaw');
    }
    // fallback: 使用常见的 MineEcho 目录
    return join(process.env.HOME || '', 'Library', 'Application Support', 'MineEcho', '.openclaw');
  }
  return join(process.cwd(), ".openclaw");
}

let MINECHO_HOME = getMineEchoHome();
let OPENCLAW_HOME = getOpenclawHome();
let OPENCLAW_JSON = join(OPENCLAW_HOME, "openclaw.json");
let ENV_FILE = join(MINECHO_HOME, ".env");

export interface InitProviderDefault {
  baseUrl: string;
  models: Array<{ id: string; name: string }>;
  api: string;
  authHeader?: boolean;
}

export function getInitProviderDefaults(): Record<string, InitProviderDefault> {
  return {
    "minimax-cn": {
      baseUrl: "https://api.minimax.io/anthropic",
      models: [
        { id: "MiniMax-M2.7", name: "MiniMax M2.7" },
        { id: "MiniMax-M2.7-highspeed", name: "MiniMax M2.7 High-Speed" },
        { id: "MiniMax-M2.5", name: "MiniMax M2.5" },
        { id: "MiniMax-M2.5-highspeed", name: "MiniMax M2.5 High-Speed" },
      ],
      api: "anthropic-messages",
      authHeader: true,
    },
    aliyun: {
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      models: [{ id: "qwen-plus", name: "Qwen Plus" }],
      api: "openai-completions",
    },
    zhipu: {
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      models: [{ id: "glm-4", name: "GLM-4" }],
      api: "openai-completions",
    },
    deepseek: {
      baseUrl: "https://api.deepseek.com/v1",
      models: [{ id: "deepseek-chat", name: "DeepSeek Chat" }],
      api: "openai-completions",
    },
  };
}

async function readEnterpriseConfig(): Promise<{ storeUrl?: string; userId?: string; userToken?: string }> {
  const home = getMineEchoHome();
  const path = join(home, ENTERPRISE_CONFIG_FILE);
  if (!existsSync(path)) return {};
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as { storeUrl?: string; userId?: string; userToken?: string };
    return { storeUrl: data.storeUrl, userId: data.userId, userToken: data.userToken };
  } catch {
    return {};
  }
}

/** GET /api/init/status — 是否已有配置、是否需要初始化；含企业配置（来自 enterprise.json） */
initRouter.get("/status", async (_req, res) => {
  try {
    MINECHO_HOME = getMineEchoHome();
    OPENCLAW_HOME = getOpenclawHome();
    OPENCLAW_JSON = join(OPENCLAW_HOME, "openclaw.json");
    ENV_FILE = join(MINECHO_HOME, ".env");
    const hasOpenclawJson = existsSync(OPENCLAW_JSON);
    let hasMinimaxKey = false;
    const encryptedKeysPath = join(MINECHO_HOME, ENCRYPTED_KEYS_FILE);
    if (existsSync(encryptedKeysPath)) {
      try {
        const raw = await readFile(encryptedKeysPath, "utf8");
        const keys = JSON.parse(raw) as Record<string, string>;
        hasMinimaxKey = !!keys.MINIMAX_API_KEY;
      } catch {
        hasMinimaxKey = false;
      }
    }
    // 兼容旧版：若 encrypted-keys.json 不存在但 .env 中有 API Key，视为已配置
    if (!hasMinimaxKey && existsSync(ENV_FILE)) {
      const content = await readFile(ENV_FILE, "utf8").catch(() => "");
      hasMinimaxKey = /MINIMAX_API_KEY\s*=\s*\S+/.test(content);
    }
    const userId = await getOrCreateUserId();
    res.json({
      configDir: OPENCLAW_HOME,
      envDir: MINECHO_HOME,
      hasOpenclawJson,
      hasMinimaxKey,
      needsInit: !hasOpenclawJson || !hasMinimaxKey,
      userId,
      requiresAuth: process.env.MINECHO_REQUIRE_AUTH === 'true',
    });
  } catch (e) {
    res.status(500).json({ error: redactSecrets((e as Error).message) });
  }
});

const ENV_KEYS = ["MINIMAX_API_KEY", "DASHSCOPE_API_KEY", "ZHIPU_API_KEY", "DEEPSEEK_API_KEY"];

const ENCRYPTED_KEYS_FILE = "encrypted-keys.json";

function getEncryptedKeysPath(): string {
  return join(MINECHO_HOME, ENCRYPTED_KEYS_FILE);
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
  await mkdir(MINECHO_HOME, { recursive: true });
  await writeFile(path, JSON.stringify(keys, null, 2), "utf8");
}

/** 可写的配置目录：优先 ~，若无权限则用项目下 .mineecho / .openclaw */
async function ensureWritableDirs(): Promise<{ openclawHome: string; mineechoHome: string }> {
  const cwd = process.cwd();
  const tryDir = async (dir: string): Promise<boolean> => {
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, ".write-test"), "", "utf8");
      return true;
    } catch {
      return false;
    }
  };

  let mineechoHome = getMineEchoHome();
  if (!(await tryDir(mineechoHome))) {
    const fallback = join(cwd, ".mineecho");
    if (await tryDir(fallback)) {
      mineechoHome = fallback;
      process.env.MINEECHO_CONFIG_HOME = fallback;
      logger.warn("[init] 使用项目目录存放配置:", { fallback });
    } else {
      throw new Error("无法写入 ~/.mineecho 或项目目录 .mineecho，请设置环境变量 MINEECHO_CONFIG_HOME 为可写路径");
    }
  }

  let openclawHome = getOpenclawHome();
  if (!(await tryDir(openclawHome))) {
    const fallback = join(cwd, ".openclaw");
    if (await tryDir(fallback)) {
      openclawHome = fallback;
      logger.warn("[init] 使用项目目录存放 openclaw 配置:", { fallback });
    } else {
      throw new Error("无法写入 ~/.openclaw 或项目目录 .openclaw，请检查目录权限");
    }
  }

  return { openclawHome, mineechoHome };
}

/** POST /api/init/config — 保存初始化配置（模型、API Key） */
initRouter.post("/config", async (req, res) => {
  try {
    const { openclawHome, mineechoHome } = await ensureWritableDirs();
    OPENCLAW_HOME = openclawHome;
    MINECHO_HOME = mineechoHome;
    OPENCLAW_JSON = join(OPENCLAW_HOME, "openclaw.json");
    ENV_FILE = join(MINECHO_HOME, ".env");

    const { model, minimaxApiKey, dashscopeApiKey, zhipuApiKey, deepseekApiKey, enterpriseStoreUrl, enterpriseUserId, enterpriseUserToken, workspaceName } = req.body || {};

    // 标记是否需要重启Gateway（只有API Key变更时才需要）
    let needsGatewayRestart = false;

    await mkdir(OPENCLAW_HOME, { recursive: true });
    await mkdir(MINECHO_HOME, { recursive: true });

    let openclaw: Record<string, unknown> = {};
    if (existsSync(OPENCLAW_JSON)) {
      const raw = await readFile(OPENCLAW_JSON, "utf8").catch(() => "{}");
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        openclaw = { ...parsed };
      } catch (_) {}
    }
    if (!openclaw.agents) openclaw.agents = {};
    const agents = openclaw.agents as Record<string, unknown>;
    if (!agents.defaults) agents.defaults = {};
    const def = agents.defaults as Record<string, unknown>;
    const rawPrimary = (def.model as Record<string, unknown>)?.primary;
    let modelVal: string = (typeof model === "string" && model.trim()) ? model.trim() : (typeof rawPrimary === "string" && rawPrimary.trim() ? rawPrimary.trim() : "MiniMax-M2.5");
    if (modelVal && !/^[a-z]+\//.test(modelVal)) {
      const normalized = modelVal.replace(/\s+/g, "-").toLowerCase();
      // Auto-prefix known models with their provider
      if (normalized.startsWith("minimax") || normalized === "minimmax-m2.5") {
        modelVal = `minimax-cn/${modelVal}`;
      } else if (normalized.startsWith("qwen")) {
        modelVal = `aliyun/${modelVal}`;
      } else if (normalized.startsWith("deepseek")) {
        modelVal = `deepseek/${modelVal}`;
      } else if (normalized.startsWith("glm")) {
        modelVal = `zhipu/${modelVal}`;
      }
      // If still unprefixed, keep as-is (user may have provided a custom model id)
    }
    def.model = { primary: modelVal, fallbacks: (def.model as Record<string, unknown>)?.fallbacks ?? [] };
    if (!agents.list || !Array.isArray(agents.list)) agents.list = [];
    const list = agents.list as Record<string, unknown>[];
    const mainAgent = list.find((a) => a.id === "main") as Record<string, unknown> | undefined;
    if (!mainAgent) {
      // 检查是否有MineEcho专用身份配置
      const mineechoIdentityPath = join(process.cwd(), 'workspace', 'IDENTITY.md');
      let agentName = "MineEcho";  // 默认使用MineEcho名称

      if (existsSync(mineechoIdentityPath)) {
        try {
          const identityContent = await readFile(mineechoIdentityPath, 'utf8');
          const nameMatch = identityContent.match(/\*\*名字：\*\*\s*(.+)/);
          if (nameMatch) {
            agentName = nameMatch[1].trim();
          }
        } catch (error) {
          logger.warn("[init] 读取IDENTITY.md失败，使用默认MineEcho身份:", { error });
        }
      }

      list.unshift({ id: "main", default: true, model: modelVal, identity: { name: agentName } });
    } else {
      if (!mainAgent.identity) mainAgent.identity = {};
      // 优先使用MineEcho身份，而不是MineEcho
      (mainAgent.identity as Record<string, unknown>).name = (mainAgent.identity as Record<string, unknown>).name ?? "MineEcho";
      mainAgent.model = modelVal;
    }
    delete openclaw.agent;
    delete openclaw.model;
    delete openclaw.identity;
    // 保证 gateway 段含 remote.token 与 auth.mode，否则 Gateway 报 token_mismatch（与 .gateway-token / 现有 auth.token 一致）
    const gw = (openclaw.gateway as Record<string, unknown>) || {};
    let token: string | undefined =
      (gw.auth as Record<string, unknown>)?.token as string | undefined;
    if (OPENCLAW_HOME) {
      const tokenFile = join(OPENCLAW_HOME, ".gateway-token");
      if (existsSync(tokenFile)) {
        try {
          token = readFileSync(tokenFile, "utf8").trim() || token;
        } catch (_) {}
      }
    }
    // 若仍无 token（全新环境），生成一个并持久化到 .gateway-token 与 openclaw.json
    if (!token) {
      token = `hc-${randomBytes(16).toString("hex")}`;
      if (OPENCLAW_HOME) {
        try {
          await mkdir(OPENCLAW_HOME, { recursive: true });
          writeFileSync(join(OPENCLAW_HOME, ".gateway-token"), token, "utf8");
        } catch (_) {}
      }
    }
    if (token) {
      if (!gw.auth) gw.auth = {};
      (gw.auth as Record<string, unknown>).mode = "token";
      (gw.auth as Record<string, unknown>).token = token;
      if (!gw.remote) gw.remote = {};
      (gw.remote as Record<string, unknown>).token = token;
      // 容器内 BFF 以 token 连接、无 device 签名时，需 allowInsecureAuth 避免 Gateway 报 token_mismatch
      if (OPENCLAW_HOME) {
        const tokenFile = join(OPENCLAW_HOME, ".gateway-token");
        if (existsSync(tokenFile)) {
          if (!gw.controlUi) gw.controlUi = {};
          (gw.controlUi as Record<string, unknown>).allowInsecureAuth = true;
        }
      }
      // V3: 启用 Gateway 的 OpenAI-compatible HTTP 端点，使 BFF 可以通过 HTTP SSE 通信
      if (!gw.http) gw.http = {};
      const http = gw.http as Record<string, unknown>;
      if (!http.endpoints) http.endpoints = {};
      const endpoints = http.endpoints as Record<string, unknown>;
      if (!endpoints.chatCompletions) endpoints.chatCompletions = {};
      (endpoints.chatCompletions as Record<string, unknown>).enabled = true;
      openclaw.gateway = gw;
    }

    // 同步 API Key 到 openclaw.json models.providers，供 Embedding 复用
    const providerApiKeyMap: Record<string, string> = {};
    if (minimaxApiKey && typeof minimaxApiKey === "string" && minimaxApiKey.trim())
      providerApiKeyMap.minimax = minimaxApiKey.trim();
    if (dashscopeApiKey && typeof dashscopeApiKey === "string" && dashscopeApiKey.trim())
      providerApiKeyMap.aliyun = dashscopeApiKey.trim();
    if (zhipuApiKey && typeof zhipuApiKey === "string" && zhipuApiKey.trim())
      providerApiKeyMap.zhipu = zhipuApiKey.trim();
    if (deepseekApiKey && typeof deepseekApiKey === "string" && deepseekApiKey.trim())
      providerApiKeyMap.deepseek = deepseekApiKey.trim();

    // Provider 默认配置：baseUrl、api 和 models 是 Gateway 调用模型的关键字段
    const providerDefaults = getInitProviderDefaults();

    // 根据用户实际选择的模型动态更新对应 provider 的 models 列表
    const slashIdx = modelVal.indexOf("/");
    if (slashIdx > 0) {
      const selectedProvider = modelVal.slice(0, slashIdx);
      const selectedModelId = modelVal.slice(slashIdx + 1);
      const mappedId = selectedProvider === "minimax-cn" ? "minimax-cn" : selectedProvider;
      if (providerDefaults[mappedId]) {
        providerDefaults[mappedId].models = [{
          id: selectedModelId,
          name: selectedModelId,
        }];
      }
    }

    if (Object.keys(providerApiKeyMap).length > 0) {
      if (!openclaw.models) openclaw.models = {};
      const models = openclaw.models as Record<string, unknown>;
      if (!models.providers || typeof models.providers !== "object") models.providers = {};
      const providers = models.providers as Record<string, unknown>;
      for (const [key, apiKey] of Object.entries(providerApiKeyMap)) {
        const providerId = key === "minimax" ? "minimax-cn" : key;
        const existing = providers[providerId] as Record<string, unknown> | undefined;
        const defaults = providerDefaults[providerId];
        providers[providerId] = {
          ...(defaults || {}),
          ...(existing || {}),
          apiKey,
        };
      }
      openclaw.models = models;
    }

    await writeFile(OPENCLAW_JSON, JSON.stringify(openclaw, null, 2), "utf8").catch((e) => {
      logger.error("[init] writeFile openclaw.json failed:", { error: redactSecrets((e as Error).message) });
      throw e;
    });

    // 加密存储 API Keys 到 encrypted-keys.json，不再写入 .env 明文
    const sanitizeKey = (s: string) => s.replace(/[\r\n]+/g, "").trim();
    const encryptedKeys = await readEncryptedKeys();
    let apiKeyChanged = false;

    if ("minimaxApiKey" in (req.body || {})) {
      if (minimaxApiKey && typeof minimaxApiKey === "string" && minimaxApiKey.trim()) {
        encryptedKeys.MINIMAX_API_KEY = credentialManager.encrypt(sanitizeKey(minimaxApiKey));
        apiKeyChanged = true;
      } else if (minimaxApiKey === "") {
        delete encryptedKeys.MINIMAX_API_KEY;
        apiKeyChanged = true;
      }
    }
    if ("dashscopeApiKey" in (req.body || {})) {
      if (dashscopeApiKey && typeof dashscopeApiKey === "string" && dashscopeApiKey.trim()) {
        encryptedKeys.DASHSCOPE_API_KEY = credentialManager.encrypt(sanitizeKey(dashscopeApiKey));
        apiKeyChanged = true;
      } else if (dashscopeApiKey === "") {
        delete encryptedKeys.DASHSCOPE_API_KEY;
        apiKeyChanged = true;
      }
    }
    if ("zhipuApiKey" in (req.body || {})) {
      if (zhipuApiKey && typeof zhipuApiKey === "string" && zhipuApiKey.trim()) {
        encryptedKeys.ZHIPU_API_KEY = credentialManager.encrypt(sanitizeKey(zhipuApiKey));
        apiKeyChanged = true;
      } else if (zhipuApiKey === "") {
        delete encryptedKeys.ZHIPU_API_KEY;
        apiKeyChanged = true;
      }
    }
    if ("deepseekApiKey" in (req.body || {})) {
      if (deepseekApiKey && typeof deepseekApiKey === "string" && deepseekApiKey.trim()) {
        encryptedKeys.DEEPSEEK_API_KEY = credentialManager.encrypt(sanitizeKey(deepseekApiKey));
        apiKeyChanged = true;
      } else if (deepseekApiKey === "") {
        delete encryptedKeys.DEEPSEEK_API_KEY;
        apiKeyChanged = true;
      }
    }

    if (apiKeyChanged) {
      await writeEncryptedKeys(encryptedKeys);
      needsGatewayRestart = true;
    }

    // 始终同步 Gateway token 和配置路径到 .env，确保 BFF 和 Gateway 子进程读取一致
    const metaToValue: Record<string, string> = {};
    const effectiveToken = token || ((gw.auth as Record<string, unknown>)?.token as string | undefined) || "";
    if (effectiveToken) metaToValue.OPENCLAW_GATEWAY_TOKEN = effectiveToken;
    metaToValue.OPENCLAW_CONFIG_PATH = OPENCLAW_JSON;

    // 只有 token/config 变更时才读写 .env，避免保存企业/工作目录配置时误触发 Gateway 重启
    const metaChanges = Object.keys(metaToValue);
    if (metaChanges.length > 0) {
      let envContent = "";
      if (existsSync(ENV_FILE)) {
        envContent = await readFile(ENV_FILE, "utf8").catch(() => "");
      }
      // .env 中不再存储 API Keys，只保留 meta 配置
      const envLines: string[] = [];
      for (const line of envContent.split("\n")) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        if (m && !ENV_KEYS.includes(m[1]) && !metaChanges.includes(m[1])) envLines.push(line);
      }
      for (const [k, v] of Object.entries(metaToValue)) envLines.push(`${k}=${v}`);
      await writeFile(ENV_FILE, envLines.join("\n") + "\n", "utf8").catch((e) => {
        logger.error("[init] writeFile .env failed:", { file: ENV_FILE, error: redactSecrets((e as Error).message) });
        throw e;
      });
    }

    const storeUrl = typeof enterpriseStoreUrl === "string" ? enterpriseStoreUrl.trim() : "";
    const userId = typeof enterpriseUserId === "string" ? enterpriseUserId.trim() : "";
    const userToken = typeof enterpriseUserToken === "string" ? enterpriseUserToken.trim() : "";
    const enterprisePath = join(MINECHO_HOME, ENTERPRISE_CONFIG_FILE);
    if (storeUrl || userId || userToken) {
      let existing: Record<string, string> = {};
      if (existsSync(enterprisePath)) {
        try {
          const raw = await readFile(enterprisePath, "utf8");
          existing = JSON.parse(raw) as Record<string, string>;
        } catch {}
      }
      const enterprise: Record<string, string> = { ...existing };
      enterprise.storeUrl = storeUrl;
      enterprise.userId = userId;
      enterprise.userToken = userToken;
      // 彻底移除 apiKey 和 jwt 字段
      delete enterprise.apiKey;
      delete enterprise.jwt;
      await writeFile(enterprisePath, JSON.stringify(enterprise, null, 2), "utf8").catch((e) => {
        logger.error("[init] writeFile enterprise.json failed:", { error: redactSecrets((e as Error).message) });
      });
      clearEnterpriseConfigCache();
      // 清除技能缓存，确保用户切换后加载新数据
      invalidateCache("skillsAll");
      invalidateCache("skillsTree");
      invalidateCache("skillsList");
      // 保存企业配置成功后触发技能同步
      await syncSkillsFromEnterprise();
    } else if (existsSync(enterprisePath)) {
      await writeFile(enterprisePath, JSON.stringify({}, null, 2), "utf8").catch(() => {});
      clearEnterpriseConfigCache();
      // 清除技能缓存，确保用户切换后加载新数据
      invalidateCache("skillsAll");
      invalidateCache("skillsTree");
      invalidateCache("skillsList");
    }

    // 保存配置成功后，只有API Key变更才触发Gateway重启
    if (needsGatewayRestart) {
      const gatewayPort = parseInt(process.env.OPENCLAW_GATEWAY_PORT || "18789", 10);
      setTimeout(() => {
        restartEmbeddedGateway(gatewayPort).catch((err) => {
          logger.error("[init] 自动触发Gateway重启失败:", { error: err });
        });
      }, 1000);
    } else {
      logger.info("[init] 企业配置已保存，无需重启Gateway");
    }

    res.json({ ok: true, configDir: OPENCLAW_HOME, envDir: MINECHO_HOME });
  } catch (e) {
    const err = e as Error;
    logger.error("[init] POST /config error:", { error: redactSecrets(err.message) });
    res.status(500).json({
      ok: false,
      error: redactSecrets(err.message),
      code: (e as NodeJS.ErrnoException)?.code
    });
  }
});

/** POST /api/init/restart-gateway — 手动重启 Gateway（用于配置变更后） */
initRouter.post("/restart-gateway", async (_req, res) => {
  try {
    const gatewayPort = parseInt(process.env.OPENCLAW_GATEWAY_PORT || "18789", 10);
    logger.info("[init] 收到 Gateway 重启请求", { port: gatewayPort });
    await restartEmbeddedGateway(gatewayPort);
    logger.info("[init] Gateway 重启成功");
    res.json({ ok: true, message: "Gateway restarted" });
  } catch (e) {
    const err = e as Error;
    logger.error("[init] Gateway 重启失败:", { error: redactSecrets(err.message) });
    res.status(500).json({ ok: false, error: redactSecrets(err.message) });
  }
});
