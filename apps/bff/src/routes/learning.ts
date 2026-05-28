import { Router } from "express";
import {
  aggregateSkillPerformance,
  generateSkillImprovementSuggestions,
  getUserSkillInsights,
} from "../learning/skill-analytics.js";
import { generateWeeklyInsight } from "../learning/weekly-insight.js";
import { logger } from "../utils/logger.js";

export const learningRouter = Router();

learningRouter.get("/skill-performance/:skillId", (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const report = aggregateSkillPerformance(req.params.skillId, days);
  if (!report) return res.status(404).json({ error: "No data" });
  res.json(report);
});

learningRouter.get("/skill-suggestions/:skillId", (req, res) => {
  const suggestions = generateSkillImprovementSuggestions(req.params.skillId);
  res.json({ skillId: req.params.skillId, suggestions });
});

learningRouter.get("/user-insights", async (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || "default-user";
  const insights = await getUserSkillInsights(userId);
  res.json(insights);
});

learningRouter.get("/weekly-insight", async (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || "default-user";
  try {
    const insight = await generateWeeklyInsight(userId);
    res.json(insight);
  } catch (error) {
    logger.error("[WeeklyInsight] Failed to generate:", error);
    res.status(500).json({ error: "生成失败" });
  }
});
