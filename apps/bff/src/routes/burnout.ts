/**
 * Burnout Detection API Routes
 * 工作过载检测相关 API
 */

import { Router } from "express";
import { z } from "zod";
import {
  burnoutDetector,
  calculateBurnoutMetrics,
  calculateRiskScore,
  getRiskLevel,
  generateCareMessage,
} from "../memory/burnout-detector.js";
import { shortTermMemoryManager } from "../memory/short-term-memory.js";
import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { logger } from "../utils/logger.js";

export const burnoutRouter = Router();

// ============================================================================
// Schemas
// ============================================================================

const AssessRiskSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const SetPreferenceSchema = z.object({
  userId: z.string().min(1),
  careFrequency: z.enum(["daily", "weekly", "only_critical"]).optional(),
  optedOut: z.boolean().optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/burnout/status
 * Get burnout detection feature status
 */
burnoutRouter.get("/status", (_req, res) => {
  res.json({
    enabled: burnoutDetector.isDetectionEnabled(),
    envVar: process.env.ENABLE_BURNOUT_DETECTION || "not set (enabled by default)",
  });
});

/**
 * POST /api/burnout/assess
 * Assess burnout risk for a user
 */
burnoutRouter.post("/assess", async (req, res) => {
  try {
    const parseResult = AssessRiskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parseResult.error.issues,
      });
    }

    const { userId, date } = parseResult.data;

    if (!burnoutDetector.isDetectionEnabled()) {
      return res.status(503).json({
        error: "Burnout detection is not enabled",
        message: "Feature is enabled by default. Set ENABLE_BURNOUT_DETECTION=false to disable",
      });
    }

    const assessment = await burnoutDetector.assessRisk(userId, date);

    if (!assessment) {
      return res.status(404).json({
        error: "No data available",
        message: "No interactions found for the specified date",
      });
    }

    const careMessage = generateCareMessage(assessment);

    res.json({
      assessment: {
        userId: assessment.userId,
        date: assessment.date,
        score: assessment.score,
        level: assessment.level,
        factors: assessment.factors,
        suggestions: assessment.suggestions,
      },
      metrics: assessment.metrics,
      careMessage: {
        type: careMessage.type,
        title: careMessage.title,
        content: careMessage.content,
      },
    });
  } catch (error) {
    logger.error("[BurnoutAPI] Failed to assess risk:", error);
    res.status(500).json({
      error: "Failed to assess burnout risk",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/burnout/history/:userId
 * Get burnout history for a user
 */
burnoutRouter.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!burnoutDetector.isDetectionEnabled()) {
      return res.status(503).json({
        error: "Burnout detection is not enabled",
      });
    }

    const summary = await burnoutDetector.getHistorySummary(userId);

    if (!summary) {
      return res.json({
        userId,
        hasHistory: false,
        message: "No burnout history available",
      });
    }

    res.json({
      userId,
      hasHistory: true,
      recentScores: summary.recentScores,
      averageScore: summary.averageScore,
      consecutiveHighRiskDays: summary.consecutiveHighRiskDays,
      trend: summary.trend,
    });
  } catch (error) {
    logger.error("[BurnoutAPI] Failed to get history:", error);
    res.status(500).json({
      error: "Failed to get burnout history",
    });
  }
});

/**
 * POST /api/burnout/preferences
 * Update user preferences for burnout detection
 */
burnoutRouter.post("/preferences", async (req, res) => {
  try {
    const parseResult = SetPreferenceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parseResult.error.issues,
      });
    }

    const { userId, careFrequency, optedOut } = parseResult.data;

    if (careFrequency !== undefined) {
      await burnoutDetector.setCareFrequency(userId, careFrequency);
    }

    if (optedOut !== undefined) {
      await burnoutDetector.setOptOut(userId, optedOut);
    }

    res.json({
      success: true,
      userId,
      preferences: {
        careFrequency,
        optedOut,
      },
    });
  } catch (error) {
    logger.error("[BurnoutAPI] Failed to update preferences:", error);
    res.status(500).json({
      error: "Failed to update preferences",
    });
  }
});

/**
 * POST /api/burnout/calculate
 * Calculate burnout metrics for current day (real-time)
 */
burnoutRouter.post("/calculate", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parseResult.error.issues,
      });
    }

    const { userId } = parseResult.data;
    const today = new Date().toISOString().split("T")[0];
    const memory = await shortTermMemoryManager.getMemoryForDate(userId, today);

    // Calculate metrics
    const metrics = calculateBurnoutMetrics(memory);

    // Calculate consecutive days
    const consecutiveDays = await burnoutDetector.calculateConsecutiveWorkDays(userId);

    // Calculate risk score
    const { score, factors } = calculateRiskScore(metrics, consecutiveDays);
    const level = getRiskLevel(score);

    res.json({
      userId,
      date: today,
      metrics,
      consecutiveWorkDays: consecutiveDays,
      riskAssessment: {
        score,
        level,
        factors,
      },
    });
  } catch (error) {
    logger.error("[BurnoutAPI] Failed to calculate metrics:", error);
    res.status(500).json({
      error: "Failed to calculate burnout metrics",
    });
  }
});

/**
 * GET /api/burnout/health
 * Health check endpoint
 */
burnoutRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    feature: "burnout-detection",
    enabled: burnoutDetector.isDetectionEnabled(),
    timestamp: Date.now(),
  });
});

/**
 * GET /api/burnout/care-message
 * Get burnout care message for current time (night time only)
 * Returns null if not night time or no care needed
 */
burnoutRouter.get("/care-message", async (req, res) => {
  try {
    const userId = req.query.userId as string || "default-user";
    const hour = new Date().getHours();

    // Only provide care messages during night time (22:00 - 06:00)
    const isNightTime = hour >= 22 || hour < 6;
    if (!isNightTime) {
      return res.json({
        hasMessage: false,
        reason: "not_night_time",
      });
    }

    if (!burnoutDetector.isDetectionEnabled()) {
      return res.json({
        hasMessage: false,
        reason: "feature_disabled",
      });
    }

    // Check if care message was already sent today
    const history = await longTermMemoryManager.getBurnoutHistory(userId);
    const today = new Date().setHours(0, 0, 0, 0);
    const lastCare = history?.lastCareMessageAt || 0;
    if (lastCare >= today) {
      return res.json({
        hasMessage: false,
        reason: "already_sent",
      });
    }

    const assessment = await burnoutDetector.assessRisk(userId);

    let careMessage: { title: string; content: string; type: string };
    let score: number;
    let level: string;

    if (!assessment || assessment.level === "low") {
      // 低 burnout 风险或无数据：不强制发送关怀消息
      return res.json({
        hasMessage: false,
        reason: "low_risk",
        score: assessment?.score ?? 0,
        level: assessment?.level ?? "low",
      });
    }

    careMessage = generateCareMessage(assessment);
    score = assessment.score;
    level = assessment.level;

    await burnoutDetector.recordCareMessageSent(userId);

    res.json({
      hasMessage: true,
      title: careMessage.title,
      content: careMessage.content,
      type: careMessage.type,
      score,
      level,
    });
  } catch (error) {
    logger.error("[BurnoutAPI] Failed to get care message:", error);
    res.status(500).json({
      error: "Failed to get care message",
    });
  }
});
