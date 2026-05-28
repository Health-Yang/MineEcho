/**
 * 技能更新检查路由
 * 提供主动检查技能更新的 API
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import {
  checkSkillUpdates,
  getSkillUpdateDetails,
  markSkillSynced,
  startPeriodicUpdateCheck
} from "../skills/update-checker.js";
import { syncSkillsFromEnterprise } from "../skills/sync.js";
export const skillsUpdateRouter = Router();

// 存储更新检查结果（用于前端轮询）
let lastCheckResult: Awaited<ReturnType<typeof checkSkillUpdates>> | null = null;
let lastCheckTime = 0;

/**
 * GET /api/skills-update/check
 * 检查技能更新（带缓存）
 * Query: ?force=1 强制检查，忽略缓存
 */
skillsUpdateRouter.get("/check", async (req, res) => {
  try {
    const force = req.query.force === "1" || req.query.force === "true";
    const result = await checkSkillUpdates(force);

    lastCheckResult = result;
    lastCheckTime = Date.now();

    res.json(result);
  } catch (error) {
    logger.error("[SkillsUpdate] Check failed:", error);
    res.status(500).json({
      error: "检查更新失败",
      message: error instanceof Error ? error.message : "未知错误"
    });
  }
});

/**
 * GET /api/skills-update/status
 * 获取上次检查结果（轻量级，用于轮询）
 */
skillsUpdateRouter.get("/status", async (_req, res) => {
  // 如果缓存超过5分钟，建议重新检查
  const cacheExpired = Date.now() - lastCheckTime > 5 * 60 * 1000;

  res.json({
    hasUpdates: lastCheckResult?.hasUpdates || false,
    updatableSkills: lastCheckResult?.updatableSkills || 0,
    newSkills: lastCheckResult?.newSkills || 0,
    checkedAt: lastCheckTime,
    cacheExpired
  });
});

/**
 * GET /api/skills-update/details/:skillId
 * 获取指定技能的更新详情
 */
skillsUpdateRouter.get("/details/:skillId", async (req, res) => {
  try {
    const { skillId } = req.params;
    const details = await getSkillUpdateDetails(skillId);

    if (!details) {
      return res.status(404).json({ error: "技能未找到" });
    }

    res.json(details);
  } catch (error) {
    logger.error("[SkillsUpdate] Get details failed:", error);
    res.status(500).json({
      error: "获取更新详情失败",
      message: error instanceof Error ? error.message : "未知错误"
    });
  }
});

/**
 * POST /api/skills-update/sync
 * 同步可更新的技能
 * Body: { skillIds?: string[] } 如果不传则同步所有可更新技能
 */
skillsUpdateRouter.post("/sync", async (req, res) => {
  try {
    const { skillIds } = req.body || {};

    // 执行同步（传入 taskId 以同步执行）
    const syncResult = await syncSkillsFromEnterprise((progress) => {
      // 可以在这里发送进度事件（SSE）或存储进度
      logger.info("[SkillsUpdate] Sync progress:", progress);
    });

    // syncSkillsFromEnterprise 现在可能返回 taskId（字符串）或 SyncProgressResult
    if (typeof syncResult === "string") {
      // 异步模式返回了 taskId，需要等待任务完成
      return res.json({
        ok: true,
        taskId: syncResult,
        message: "同步任务已启动"
      });
    }

    const result = syncResult;

    // 标记已同步的技能
    if (result.success > 0 && result.skills) {
      for (const skill of result.skills) {
        if (skill.status === "success") {
          await markSkillSynced(skill.id);
        }
      }
    }

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    logger.error("[SkillsUpdate] Sync failed:", error);
    res.status(500).json({
      error: "同步失败",
      message: error instanceof Error ? error.message : "未知错误"
    });
  }
});

/**
 * POST /api/skills-update/mark-synced/:skillId
 * 标记技能已同步（内部使用）
 */
skillsUpdateRouter.post("/mark-synced/:skillId", async (req, res) => {
  try {
    const { skillId } = req.params;
    await markSkillSynced(skillId);
    res.json({ ok: true });
  } catch (error) {
    logger.error("[SkillsUpdate] Mark synced failed:", error);
    res.status(500).json({
      error: "标记失败",
      message: error instanceof Error ? error.message : "未知错误"
    });
  }
});

// 导出启动函数
export { startPeriodicUpdateCheck };
