import { Router } from "express";
import {
  isEnterpriseMode, getEnterpriseConfig, resolveRoleFromStore, clearEnterpriseSkillsCache,
  fetchEnterpriseSkills, clearEnterpriseConfigCache
} from "../account/client.js";
import { syncSkillsFromEnterprise } from "../skills/sync.js";
import { invalidateCache } from "../utils/cache.js";
export const accountRouter = Router();

accountRouter.get("/status", async (_req, res) => {
  const enabled = isEnterpriseMode();
  const config = getEnterpriseConfig();
  res.json({
    enabled,
    storeUrl: enabled ? config.storeUrl : undefined,
    role: enabled ? config.role : undefined,
    userId: enabled ? config.userId : undefined,
    userToken: enabled ? (config.hasUserToken ? "configured" : undefined) : undefined,
  });
});

/** 用当前配置向商店解析 userId 对应岗位，供初始化页展示「匹配岗位」 */
accountRouter.get("/resolve-role", async (_req, res) => {
  try {
    const result = await resolveRoleFromStore();
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** 清除企业技能缓存，下次打开技能树或拉取列表时会向商店重新请求（管理员更换岗位后可用） */
accountRouter.post("/refresh", (_req, res) => {
  // 清除所有企业相关缓存
  clearEnterpriseSkillsCache();
  invalidateCache("skillsAll");
  invalidateCache("skillsTree");
  invalidateCache("skillsList");
  res.json({ ok: true });
});

/** 获取企业技能列表（from L2 enterprise store） */
accountRouter.get("/skills", async (_req, res) => {
  try {
    const result = await fetchEnterpriseSkills();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** 清除企业配置缓存（含 store URL、角色等） */
accountRouter.post("/config/refresh", (_req, res) => {
  clearEnterpriseConfigCache();
  res.json({ ok: true, message: "企业配置缓存已清除" });
});

/** 刷新企业技能到 OpenClaw 扩展目录 */
accountRouter.post("/skills/refresh", async (_req, res) => {
  const result = await syncSkillsFromEnterprise();
  if (typeof result === "string") {
    res.json({ ok: true, taskId: result, status: "started", message: "同步任务已启动" });
  } else {
    res.json({ ok: true, ...result });
  }
});
