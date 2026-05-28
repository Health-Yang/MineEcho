/**
 * Risk Alert API Routes
 * 风险提醒配置管理 API
 */

import { Router } from "express";
import { z } from "zod";
import {
  getUserRiskProfile,
  updateRiskConfig,
  getUserRiskKnowledge,
  refreshRiskKnowledge,
  getRelevantRisks,
  getDetectionStats,
  resetSessionAlertCount,
  isRiskAlertEnabled,
} from "../risk/index.js";
import { logger } from "../utils/logger.js";

export const riskRouter = Router();

// Helper to get user ID from request
function getUserId(req: any): string {
  return (req.headers["x-user-id"] as string) || "default-user";
}

// 配置更新 Schema
const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxAlertsPerSession: z.number().min(1).max(10).optional(),
  categories: z.array(
    z.enum([
      "cutover",
      "data_migration",
      "core_change",
      "architecture",
      "security",
      "performance",
      "compatibility",
    ])
  ).optional(),
});

/**
 * GET /api/risk/config - 获取用户风险提醒配置
 */
riskRouter.get("/config", async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = await getUserRiskProfile(userId);

    res.json({
      success: true,
      enabled: isRiskAlertEnabled(),
      config: profile.config,
      stats: {
        totalRisksEncountered: profile.totalRisksEncountered,
        riskCategories: profile.riskCategories,
        alertCountToday: profile.alertCountToday,
      },
    });
  } catch (error) {
    logger.error("[RiskAPI] Failed to get config:", { error });
    res.status(500).json({
      success: false,
      error: "获取配置失败",
    });
  }
});

/**
 * PUT /api/risk/config - 更新用户风险提醒配置
 */
riskRouter.put("/config", async (req, res) => {
  try {
    const parseResult = updateConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: parseResult.error.format(),
      });
    }

    const userId = getUserId(req);
    const updatedConfig = await updateRiskConfig(userId, parseResult.data);

    res.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error) {
    logger.error("[RiskAPI] Failed to update config:", { error });
    res.status(500).json({
      success: false,
      error: "更新配置失败",
    });
  }
});

/**
 * GET /api/risk/knowledge - 获取用户风险知识库
 */
riskRouter.get("/knowledge", async (req, res) => {
  try {
    const userId = getUserId(req);
    const category = req.query.category as string | undefined;

    let knowledge;
    if (category) {
      knowledge = await getRelevantRisks(userId, category as any, 10);
    } else {
      knowledge = await getUserRiskKnowledge(userId);
    }

    res.json({
      success: true,
      knowledge,
      count: knowledge.length,
    });
  } catch (error) {
    logger.error("[RiskAPI] Failed to get knowledge:", { error });
    res.status(500).json({
      success: false,
      error: "获取风险知识库失败",
    });
  }
});

/**
 * POST /api/risk/refresh - 刷新风险知识库
 * 从用户历史项目记忆中重新提取风险知识
 */
riskRouter.post("/refresh", async (req, res) => {
  try {
    const userId = getUserId(req);
    const knowledge = await refreshRiskKnowledge(userId);

    res.json({
      success: true,
      message: `成功刷新风险知识库，共 ${knowledge.length} 条记录`,
      count: knowledge.length,
      knowledge: knowledge.slice(0, 5), // 只返回前5条作为预览
    });
  } catch (error) {
    logger.error("[RiskAPI] Failed to refresh knowledge:", { error });
    res.status(500).json({
      success: false,
      error: "刷新风险知识库失败",
    });
  }
});

/**
 * GET /api/risk/stats - 获取检测统计信息
 */
riskRouter.get("/stats", async (req, res) => {
  try {
    const stats = getDetectionStats();
    const userId = getUserId(req);
    const profile = await getUserRiskProfile(userId);

    res.json({
      success: true,
      globalStats: stats,
      userStats: {
        totalRisksEncountered: profile.totalRisksEncountered,
        riskCategories: profile.riskCategories,
        alertCountToday: profile.alertCountToday,
        lastAlertAt: profile.lastAlertAt,
      },
    });
  } catch (error) {
    logger.error("[RiskAPI] Failed to get stats:", { error });
    res.status(500).json({
      success: false,
      error: "获取统计信息失败",
    });
  }
});

/**
 * POST /api/risk/reset-session - 重置会话提醒计数
 */
riskRouter.post("/reset-session", async (req, res) => {
  try {
    const sessionId = req.body.sessionId || "main";
    resetSessionAlertCount(sessionId);

    res.json({
      success: true,
      message: `会话 ${sessionId} 的提醒计数已重置`,
    });
  } catch (error) {
    logger.error("[RiskAPI] Failed to reset session:", { error });
    res.status(500).json({
      success: false,
      error: "重置会话失败",
    });
  }
});

/**
 * GET /api/risk/test - 测试风险检测
 * 用于前端调试，检测给定文本中的风险
 */
riskRouter.post("/test", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "请提供 text 参数",
      });
    }

    const { detectRisk } = await import("../risk/detector.js");
    const result = detectRisk(text);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error("[RiskAPI] Test detection failed:", { error });
    res.status(500).json({
      success: false,
      error: "检测失败",
    });
  }
});
