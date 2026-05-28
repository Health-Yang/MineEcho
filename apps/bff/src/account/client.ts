/**
 * 企业版终端 - 与企业商店对接
 * 配置来源（优先级）：初始化页写入的 .mineecho/enterprise.json > 环境变量
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome, ENTERPRISE_CONFIG_FILE } from "../utils/config-path.js";
import { logger } from "../utils/logger.js";

let fileConfigCache: { storeUrl?: string; userId?: string; userToken?: string; ts: number } | null = null;
const FILE_CACHE_MS = 10 * 1000;

/** 初始化页保存企业配置后调用，使下次拉取技能时读取最新 enterprise.json */
export function clearEnterpriseConfigCache(): void {
  fileConfigCache = null;
}

function getEnterpriseConfigFromFile(): { storeUrl?: string; userId?: string; userToken?: string } {
  const now = Date.now();
  if (fileConfigCache && now - fileConfigCache.ts < FILE_CACHE_MS) {
    return { storeUrl: fileConfigCache.storeUrl, userId: fileConfigCache.userId, userToken: fileConfigCache.userToken };
  }
  const path = join(getMineEchoHome(), ENTERPRISE_CONFIG_FILE);
  if (!existsSync(path)) {
    fileConfigCache = { ts: now };
    return {};
  }
  try {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw) as { storeUrl?: string; userId?: string; userToken?: string };
    fileConfigCache = { storeUrl: data.storeUrl, userId: data.userId, userToken: data.userToken, ts: now };
    return { storeUrl: data.storeUrl, userId: data.userId, userToken: data.userToken };
  } catch {
    fileConfigCache = { ts: now };
    return {};
  }
}

function getEffectiveConfig(): { storeUrl: string; role: string; userId: string; userToken: string } {
  const file = getEnterpriseConfigFromFile();
  return {
    storeUrl: file.storeUrl || process.env.MINECHO_ENTERPRISE_STORE_URL || "",
    role: process.env.MINECHO_ENTERPRISE_ROLE || "default",
    userId: file.userId || process.env.MINECHO_ENTERPRISE_USER_ID || "",
    userToken: file.userToken || process.env.MINECHO_ENTERPRISE_USER_TOKEN || "",
  };
}

export interface EnterpriseSkill {
  id: string;
  name: string;
  description?: string;
  version?: string;
  category?: string;
  roles?: string[];
  triggers?: string[];  // 新增：技能触发词列表
}

export interface EnterpriseSkillsResult {
  skills: EnterpriseSkill[];
  version: number;
  /** 拉取失败时的简要原因，供终端展示 */
  error?: string;
  /** 从L2返回的岗位角色 */
  role?: string;
}

let cache: { result: EnterpriseSkillsResult; ts: number; key?: string } | null = null;
const CACHE_MS = 60 * 1000; // 1 分钟，便于管理员更换岗位后终端较快看到更新

/** 强制下次拉取时向商店重新请求技能（管理员更换岗位后调用） */
export function clearEnterpriseSkillsCache(): void {
  cache = null;
}

export function isEnterpriseMode(): boolean {
  return Boolean(getEffectiveConfig().storeUrl);
}

export async function fetchEnterpriseSkills(
  storeUrl?: string,
  role?: string,
  userId?: string | null
): Promise<EnterpriseSkillsResult> {
  const cfg = getEffectiveConfig();
  const effectiveStoreUrl = storeUrl ?? cfg.storeUrl;
  const effectiveRole = role ?? cfg.role;
  const effectiveUserId = userId ?? cfg.userId;
  if (!effectiveStoreUrl) return { skills: [], version: 0 };
  const cacheKey = `${effectiveRole}:${effectiveUserId}`;
  if (cache && cache.key === cacheKey && Date.now() - cache.ts < CACHE_MS) return cache.result;
  try {
    const params = new URLSearchParams();
    if (effectiveUserId) params.set("userId", effectiveUserId);
    else params.set("role", effectiveRole);
    const url = `${effectiveStoreUrl.replace(/\/$/, "")}/api/terminal/skills?${params}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (cfg.userToken) {
      headers["X-User-Token"] = cfg.userToken;
    }

    const res = await fetch(url, { headers });
    const data = (await res.json().catch(() => ({}))) as { skills?: EnterpriseSkill[]; version?: number; error?: string; role?: string };
    if (!res.ok) {
      const msg = data.error || res.statusText || "请求失败";
      const reason = res.status === 401 ? "用户凭证无效或已变更" : res.status === 403 ? "用户已停用" : msg;
      logger.warn("[enterprise] fetchEnterpriseSkills failed:", { reason });
      return { skills: [], version: 0, error: reason };
    }
    const result: EnterpriseSkillsResult = {
      skills: data.skills || [],
      version: data.version ?? Date.now(),
      role: data.role,
    };
    cache = { result, ts: Date.now(), key: cacheKey };

    // 注意：磁盘写入由 skills/sync.ts 的 syncSkillsFromEnterprise() 独占执行
    // 本函数只做列表查询，不写磁盘
    return result;
  } catch (e) {
    const msg = (e as Error)?.message || "无法连接企业商店";
    logger.warn("[enterprise] fetchEnterpriseSkills failed:", { message: msg });
    return { skills: [], version: 0, error: msg };
  }
}

export async function reportAudit(
  storeUrl?: string,
  payload?: { userId?: string; role?: string; skillId: string; action?: string }
): Promise<void> {
  const cfg = getEffectiveConfig();
  const base = storeUrl ?? cfg.storeUrl;
  if (!base || !payload?.skillId) return;
  try {
    const url = base.replace(/\/$/, "") + "/api/terminal/audit";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cfg.userToken) {
      headers["X-User-Token"] = cfg.userToken;
    }

    await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  } catch (e) {
    logger.warn("[enterprise] reportAudit failed:", { message: (e as Error)?.message });
  }
}

export function getEnterpriseConfig(): { storeUrl: string; role: string; userId?: string; hasUserToken: boolean } {
  // 优先使用L2返回的role，否则使用本地配置
  const l2Role = cache?.result?.role;
  const cfg = getEffectiveConfig();
  return {
    storeUrl: cfg.storeUrl,
    role: l2Role || cfg.role,
    userId: cfg.userId || undefined,
    hasUserToken: Boolean(cfg.userToken),
  };
}

/** 获取完整企业配置（用于技能同步等内部操作） */
export function fetchEnterpriseConfig(): { enabled: boolean; storeUrl: string; role: string; userId: string; userToken: string } {
  const l2Role = cache?.result?.role;
  const cfg = getEffectiveConfig();
  return {
    enabled: Boolean(cfg.storeUrl),
    storeUrl: cfg.storeUrl,
    role: l2Role || cfg.role,
    userId: cfg.userId,
    userToken: cfg.userToken,
  };
}

/** 向商店请求当前 userId 解析出的岗位，用于初始化页展示「匹配岗位」 */
export async function resolveRoleFromStore(): Promise<{ role?: string; error?: string }> {
  const cfg = getEffectiveConfig();
  if (!cfg.storeUrl) return { error: "未配置企业商店地址" };
  if (!cfg.userId) return { error: "未配置用户 ID" };
  try {
    const url = `${cfg.storeUrl.replace(/\/$/, "")}/api/terminal/skills?userId=${encodeURIComponent(cfg.userId)}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (cfg.userToken) {
      headers["X-User-Token"] = cfg.userToken;
    }

    const res = await fetch(url, { headers });
    if (res.status === 403) return { error: "用户已停用" };
    if (!res.ok) return { error: `商店返回 ${res.status}` };
    const data = (await res.json()) as { role?: string };
    return { role: data.role || "default" };
  } catch (e) {
    return { error: (e as Error).message || "无法连接企业商店" };
  }
}
