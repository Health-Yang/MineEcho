/**
 * Growth Report API Routes
 * 成长报告系统 API 路由 - Phase 2 实现
 *
 * 提供以下端点:
 * - GET /api/growth-report/latest - 获取最新报告
 * - GET /api/growth-report/history - 获取历史报告
 * - POST /api/growth-report/generate - 手动生成报告
 * - GET /api/growth-report/milestones - 获取里程碑列表
 * - GET /api/growth-report/status - 获取功能状态
 */

import { Router } from "express";
import { z } from "zod";
import {
  growthReportGenerator,
  generateGrowthReport,
  GROWTH_REPORT_ENABLED,
  type ReportPeriod,
} from "../memory/growth-report.js";
import { logger } from "../utils/logger.js";

export const growthReportRouter = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const GenerateReportSchema = z.object({
  userId: z.string().min(1).optional(),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
});

const GetHistorySchema = z.object({
  userId: z.string().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
});

const GetMilestonesSchema = z.object({
  userId: z.string().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 从请求中获取用户ID
 * 优先从header获取，否则使用默认值
 */
function getUserId(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  const userId = req.headers["x-user-id"];
  return typeof userId === "string" ? userId : "default-user";
}

/**
 * 检查功能是否启用的中间件
 */
function checkEnabled(req: unknown, res: {
  status: (code: number) => { json: (data: unknown) => void };
}, next: () => void): void {
  if (!GROWTH_REPORT_ENABLED) {
    res.status(503).json({
      error: "Growth report feature is not enabled",
      message: "Feature is enabled by default. Set GROWTH_REPORT_ENABLED=false to disable",
      enabled: false,
    });
    return;
  }
  next();
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/growth-report/status
 * 获取成长报告功能状态
 */
growthReportRouter.get("/status", (_req, res) => {
  const status = growthReportGenerator.getStatus();
  res.json({
    enabled: status.enabled,
    envVar: status.envVar,
    cacheSize: status.cacheSize,
    timestamp: Date.now(),
  });
});

/**
 * GET /api/growth-report/latest
 * 获取最新成长报告
 */
growthReportRouter.get("/latest", checkEnabled, async (req, res) => {
  try {
    const userId = getUserId(req);

    const report = await growthReportGenerator.getLatestReport(userId);

    if (!report) {
      return res.status(404).json({
        error: "No report available",
        message: "Could not generate growth report. Please try again later.",
      });
    }

    res.json({
      success: true,
      report: {
        id: report.id,
        period: report.period,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        generatedAt: report.generatedAt,
        metrics: report.metrics,
        milestones: report.milestones,
        radarChart: report.radarChart,
        summary: report.summary,
        suggestions: report.suggestions,
      },
    });
  } catch (error) {
    logger.error("[GrowthReportAPI] Failed to get latest report:", error);
    res.status(500).json({
      error: "Failed to get growth report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/growth-report/history
 * 获取历史报告列表
 */
growthReportRouter.get("/history", checkEnabled, async (req, res) => {
  try {
    const parseResult = GetHistorySchema.safeParse({
      userId: req.query.userId,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request parameters",
        details: parseResult.error.issues,
      });
    }

    const userId = parseResult.data.userId || getUserId(req);
    const limit = parseResult.data.limit || 10;

    const history = growthReportGenerator.getReportHistory(userId);
    const limitedHistory = history.slice(0, limit);

    res.json({
      success: true,
      userId,
      total: history.length,
      reports: limitedHistory.map(report => ({
        id: report.id,
        period: report.period,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        generatedAt: report.generatedAt,
        metrics: {
          techStackGrowth: report.metrics.techStackGrowth,
          projectCount: report.metrics.projectCount,
          streakDays: report.metrics.streakDays,
          totalInteractions: report.metrics.totalInteractions,
        },
        milestoneCount: report.milestones.length,
        summary: report.summary,
      })),
    });
  } catch (error) {
    logger.error("[GrowthReportAPI] Failed to get history:", error);
    res.status(500).json({
      error: "Failed to get report history",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/growth-report/generate
 * 手动生成成长报告
 */
growthReportRouter.post("/generate", checkEnabled, async (req, res) => {
  try {
    const parseResult = GenerateReportSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parseResult.error.issues,
      });
    }

    const { userId: bodyUserId, period, startDate, endDate } = parseResult.data;
    const userId = bodyUserId || getUserId(req);

    logger.info(`[GrowthReportAPI] Manual report generation requested for ${userId}`, {
      period,
      startDate,
      endDate,
    });

    const report = await growthReportGenerator.forceRegenerate(userId, {
      period: period as ReportPeriod,
      startDate,
      endDate,
    });

    if (!report) {
      return res.status(500).json({
        error: "Failed to generate report",
        message: "Report generation failed. Please check server logs.",
      });
    }

    res.json({
      success: true,
      message: "Report generated successfully",
      report: {
        id: report.id,
        period: report.period,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        generatedAt: report.generatedAt,
        metrics: report.metrics,
        milestones: report.milestones,
        radarChart: report.radarChart,
        summary: report.summary,
        suggestions: report.suggestions,
      },
    });
  } catch (error) {
    logger.error("[GrowthReportAPI] Failed to generate report:", error);
    res.status(500).json({
      error: "Failed to generate report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/growth-report/milestones
 * 获取用户里程碑列表
 */
growthReportRouter.get("/milestones", checkEnabled, async (req, res) => {
  try {
    const parseResult = GetMilestonesSchema.safeParse({
      userId: req.query.userId,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request parameters",
        details: parseResult.error.issues,
      });
    }

    const userId = parseResult.data.userId || getUserId(req);
    const limit = parseResult.data.limit || 20;

    const milestones = await growthReportGenerator.getUserMilestones(userId, limit);

    // 按类型分组统计
    const byType = milestones.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      userId,
      total: milestones.length,
      byType,
      milestones: milestones.map(m => ({
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        achievedAt: m.achievedAt,
        metadata: m.metadata,
      })),
    });
  } catch (error) {
    logger.error("[GrowthReportAPI] Failed to get milestones:", error);
    res.status(500).json({
      error: "Failed to get milestones",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/growth-report/milestones/stats
 * 获取里程碑统计信息
 */
growthReportRouter.get("/milestones/stats", checkEnabled, async (req, res) => {
  try {
    const userId = getUserId(req);
    const milestones = await growthReportGenerator.getUserMilestones(userId, 100);

    // 统计信息
    const stats = {
      total: milestones.length,
      byType: {} as Record<string, number>,
      recentAchievements: milestones.slice(0, 5).map(m => ({
        title: m.title,
        type: m.type,
        achievedAt: m.achievedAt,
      })),
      streakMilestones: milestones.filter(m => m.type.startsWith("streak_")).length,
      skillMilestones: milestones.filter(m => m.type === "skill_mastered").length,
      projectMilestones: milestones.filter(m => m.type === "project_completed").length,
    };

    // 按类型统计
    for (const milestone of milestones) {
      stats.byType[milestone.type] = (stats.byType[milestone.type] || 0) + 1;
    }

    res.json({
      success: true,
      userId,
      stats,
    });
  } catch (error) {
    logger.error("[GrowthReportAPI] Failed to get milestone stats:", error);
    res.status(500).json({
      error: "Failed to get milestone statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/growth-report/clear-cache
 * 清除报告缓存（用于调试）
 */
growthReportRouter.post("/clear-cache", async (req, res) => {
  try {
    const userId = req.body.userId as string | undefined;
    growthReportGenerator.clearCache(userId);

    res.json({
      success: true,
      message: userId ? `Cache cleared for user ${userId}` : "All cache cleared",
    });
  } catch (error) {
    logger.error("[GrowthReportAPI] Failed to clear cache:", error);
    res.status(500).json({
      error: "Failed to clear cache",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/growth-report/health
 * 健康检查端点
 */
growthReportRouter.get("/health", (_req, res) => {
  const status = growthReportGenerator.getStatus();
  res.json({
    status: "ok",
    feature: "growth-report",
    enabled: status.enabled,
    cacheSize: status.cacheSize,
    timestamp: Date.now(),
  });
});
