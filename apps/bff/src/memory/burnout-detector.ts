/**
 * Burnout Detection Service
 * 工作过载检测与关怀提醒服务
 *
 * 功能：
 * 1. 实时检测用户工作强度指标
 * 2. 计算 burnout 风险分数
 * 3. 触发关怀提醒
 * 4. 默认开启，可通过 DISABLE_BURNOUT_DETECTION=true 关闭
 */

import type {
  Interaction,
  ShortTermMemory,
  DailyBurnoutMetrics,
  BurnoutHistory,
} from "./types.js";
import { shortTermMemoryManager } from "./short-term-memory.js";
import { longTermMemoryManager } from "./long-term-memory.js";
import { logger } from "../utils/logger.js";

// ============================================================================
// Configuration
// ============================================================================

/** Feature flag - 默认关闭 */
const ENABLE_BURNOUT_DETECTION = process.env.ENABLE_BURNOUT_DETECTION !== "false";

/** Risk level thresholds */
const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 50,
  HIGH: 70,
  CRITICAL: 85,
};

/** Scoring weights */
const WEIGHTS = {
  /** 每日交互时长权重 (分钟) */
  ACTIVE_MINUTES: 0.5,
  /** 夜间工作权重 */
  NIGHT_WORK: 10,
  /** 周末工作权重 */
  WEEKEND_WORK: 8,
  /** 紧急内容权重 */
  URGENT_CONTENT: 5,
  /** 连续工作天数权重 */
  CONSECUTIVE_DAYS: 15,
  /** 压力关键词权重 */
  STRESS_KEYWORDS: 3,
};

/** Night hours: 22:00 - 06:00 */
const NIGHT_HOURS = { start: 22, end: 6 };

/** Stress indicators in Chinese and English */
const STRESS_KEYWORDS = [
  // 故障/错误类
  "故障", "报错", "错误", "exception", "error", "crash", "failed",
  "bug", "broken", "not working", "出问题", "挂了", "崩了",
  // 紧急类
  "紧急", "urgent", "asap", "immediately", "马上", "立刻", "critical",
  "严重", "blocker", "blocking", "deadline", "截止",
  // 压力类
  "加班", "熬夜", "通宵", "好累", "压力", "stress", "overwhelmed",
  "exhausted", "tired", "burned out", "burnout", "撑不住",
  // 负面情绪
  "烦", "郁闷", "焦虑", "anxious", "worried", "frustrated", "annoyed",
];

/** Urgency keywords */
const URGENCY_KEYWORDS = [
  "紧急", "urgent", "asap", "immediately", "critical", "严重",
  "故障", "production", "线上", "live", "urgent", "立刻", "马上",
];

// ============================================================================
// Types
// ============================================================================

export interface BurnoutRiskAssessment {
  userId: string;
  date: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: string[];
  metrics: DailyBurnoutMetrics;
  suggestions: string[];
}

export interface CareMessage {
  type: "gentle" | "supportive" | "urgent";
  title: string;
  content: string;
  actions: string[];
}

// ============================================================================
// Core Detection Logic
// ============================================================================

/**
 * Calculate burnout metrics from daily interactions
 * 从当日交互中计算 burnout 指标
 */
export function calculateBurnoutMetrics(
  memory: ShortTermMemory
): DailyBurnoutMetrics {
  const interactions = memory.dailyInteractions;
  const date = new Date(memory.date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  let totalActiveMinutes = 0;
  let nightInteractions = 0;
  let weekendInteractions = isWeekend ? interactions.length : 0;
  let urgentContentCount = 0;
  const stressIndicators: string[] = [];

  // Calculate session durations and detect patterns
  let sessionStart: number | null = null;
  let lastTimestamp: number | null = null;

  for (const interaction of interactions) {
    const interactionDate = new Date(interaction.timestamp);
    const hour = interactionDate.getHours();
    const content = interaction.content.toLowerCase();

    // Detect night work (22:00 - 06:00)
    if (hour >= NIGHT_HOURS.start || hour < NIGHT_HOURS.end) {
      nightInteractions++;
    }

    // Detect urgent content
    if (URGENCY_KEYWORDS.some(kw => content.includes(kw.toLowerCase()))) {
      urgentContentCount++;
    }

    // Detect stress keywords
    for (const keyword of STRESS_KEYWORDS) {
      if (content.includes(keyword.toLowerCase()) && !stressIndicators.includes(keyword)) {
        stressIndicators.push(keyword);
      }
    }

    // Calculate active time (gap > 30min = new session)
    if (lastTimestamp !== null) {
      const gapMinutes = (interaction.timestamp - lastTimestamp) / (1000 * 60);
      if (gapMinutes > 30) {
        // End of previous session
        if (sessionStart !== null) {
          const sessionDuration = (lastTimestamp - sessionStart) / (1000 * 60);
          totalActiveMinutes += Math.min(sessionDuration, 120); // Cap at 2 hours per session
        }
        sessionStart = interaction.timestamp;
      }
    } else {
      sessionStart = interaction.timestamp;
    }
    lastTimestamp = interaction.timestamp;
  }

  // Add final session
  if (sessionStart !== null && lastTimestamp !== null) {
    const sessionDuration = (lastTimestamp - sessionStart) / (1000 * 60);
    totalActiveMinutes += Math.min(sessionDuration, 120);
  }

  // Minimum 1 minute per interaction if no session detected
  if (totalActiveMinutes === 0 && interactions.length > 0) {
    totalActiveMinutes = interactions.length * 2; // Estimate 2 min per interaction
  }

  return {
    totalActiveMinutes: Math.round(totalActiveMinutes),
    nightInteractions,
    weekendInteractions,
    urgentContentCount,
    stressIndicators: stressIndicators.slice(0, 10), // Limit to 10
    lastCalculated: Date.now(),
  };
}

/**
 * Calculate burnout risk score
 * 计算 burnout 风险分数 (0-100)
 */
export function calculateRiskScore(
  metrics: DailyBurnoutMetrics,
  consecutiveDays: number
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Active minutes score (max ~40 points for 8 hours)
  const activeScore = Math.min(
    metrics.totalActiveMinutes * WEIGHTS.ACTIVE_MINUTES,
    40
  );
  if (activeScore > 20) {
    score += activeScore;
    factors.push(`今日活跃 ${metrics.totalActiveMinutes} 分钟`);
  }

  // Night work penalty
  if (metrics.nightInteractions > 0) {
    const nightScore = Math.min(
      metrics.nightInteractions * WEIGHTS.NIGHT_WORK,
      20
    );
    score += nightScore;
    factors.push(`夜间工作 ${metrics.nightInteractions} 次`);
  }

  // Weekend work penalty
  if (metrics.weekendInteractions > 0) {
    const weekendScore = Math.min(
      metrics.weekendInteractions * WEIGHTS.WEEKEND_WORK,
      15
    );
    score += weekendScore;
    factors.push(`周末工作 ${metrics.weekendInteractions} 次`);
  }

  // Urgent content penalty
  if (metrics.urgentContentCount > 0) {
    const urgentScore = Math.min(
      metrics.urgentContentCount * WEIGHTS.URGENT_CONTENT,
      15
    );
    score += urgentScore;
    factors.push(`紧急事务 ${metrics.urgentContentCount} 次`);
  }

  // Stress keywords penalty
  if (metrics.stressIndicators.length > 0) {
    const stressScore = Math.min(
      metrics.stressIndicators.length * WEIGHTS.STRESS_KEYWORDS,
      15
    );
    score += stressScore;
    factors.push(`检测到压力关键词: ${metrics.stressIndicators.slice(0, 3).join(", ")}`);
  }

  // Consecutive days penalty
  if (consecutiveDays >= 5) {
    const daysScore = Math.min(
      (consecutiveDays - 4) * WEIGHTS.CONSECUTIVE_DAYS,
      30
    );
    score += daysScore;
    factors.push(`连续工作 ${consecutiveDays} 天`);
  }

  return {
    score: Math.min(Math.round(score), 100),
    factors,
  };
}

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= RISK_THRESHOLDS.CRITICAL) return "critical";
  if (score >= RISK_THRESHOLDS.HIGH) return "high";
  if (score >= RISK_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

/**
 * Generate care suggestions based on risk level
 */
export function generateCareSuggestions(
  level: "low" | "medium" | "high" | "critical",
  factors: string[]
): string[] {
  const suggestions: string[] = [];

  switch (level) {
    case "critical":
      suggestions.push("您的工作强度非常高，建议立即休息");
      suggestions.push("考虑推迟非紧急任务，优先保证睡眠");
      suggestions.push("如果感到身心不适，请及时寻求帮助");
      break;
    case "high":
      suggestions.push("您最近工作很辛苦，记得适当休息");
      suggestions.push("建议每隔 1-2 小时起身活动一下");
      suggestions.push("今晚尽量早点休息，恢复精力");
      break;
    case "medium":
      suggestions.push("注意劳逸结合，保持工作节奏");
      suggestions.push("如果感到疲劳，可以短暂休息一下");
      break;
    default:
      suggestions.push("保持良好的工作节奏");
  }

  // Add specific suggestions based on factors
  if (factors.some(f => f.includes("夜间"))) {
    suggestions.push("尽量避免熬夜，保证充足睡眠");
  }
  if (factors.some(f => f.includes("周末"))) {
    suggestions.push("周末也要给自己留出休息时间");
  }
  if (factors.some(f => f.includes("连续"))) {
    suggestions.push("长期连续工作会降低效率，建议安排休息日");
  }

  return suggestions;
}

/**
 * Generate care message based on risk level
 */
export function generateCareMessage(
  assessment: BurnoutRiskAssessment
): CareMessage {
  const { level, factors, suggestions } = assessment;

  switch (level) {
    case "critical":
      return {
        type: "urgent",
        title: "⚠️ 工作过载提醒",
        content: `检测到您的工作强度非常高：${factors.join("；")}。\n\n${suggestions[0]}`,
        actions: ["查看建议", "稍后提醒", "忽略本次"],
      };
    case "high":
      return {
        type: "supportive",
        title: "💙 工作关怀提醒",
        content: `您今天工作很努力：${factors.join("；")}。\n\n${suggestions[0]}`,
        actions: ["查看建议", "知道了"],
      };
    case "medium":
      return {
        type: "gentle",
        title: "☕ 温馨提示",
        content: suggestions[0],
        actions: ["知道了"],
      };
    default:
      return {
        type: "gentle",
        title: "今日工作状态",
        content: "您的工作节奏很健康，继续保持！",
        actions: [],
      };
  }
}

// ============================================================================
// Night Care Message Generator
// ============================================================================

const NIGHT_CARE_POOLS = {
  gentle: [
    { title: "夜深了", content: "时间已经不早了，今晚早点休息吧。好的睡眠是明天高效工作的基础。" },
    { title: "该休息了", content: "忙碌了一天，现在是放松身心的好时机。放下工作，给自己一个安稳的睡眠。" },
    { title: "晚安提醒", content: "夜色渐深，记得照顾好自己。今天的事就交给今天的你，明天会是新的开始。" },
    { title: "休息一下吧", content: "长时间工作容易疲劳，适当休息能让思路更清晰。今晚早点睡，明天效率会更高。" },
    { title: "夜深了", content: "不管今天过得怎样，都到了该休息的时候。好好睡一觉，明天又是元气满满的一天。" },
  ],
  thoughtful: [
    { title: "记得休息", content: "检测到您今天工作了很久。再忙也要记得：身体是第一位的，今晚早点休息吧。" },
    { title: "辛苦了", content: "今天的工作不容易吧？是时候让自己放松一下了。泡杯热茶，早点入睡，明天会更好。" },
    { title: "该充电了", content: "就像手机需要充电一样，人也需要休息来恢复能量。今晚给自己充足的睡眠时间吧。" },
  ],
};

/**
 * Generate a dynamic night care message for users with low burnout risk or no data.
 * Messages rotate daily so the user doesn't see the same text every night.
 */
export function generateNightCareMessage(
  userId: string,
  hour: number = new Date().getHours()
): { title: string; content: string; type: string } {
  // 深夜(0-3点)用更温柔的语气，晚上(22-23点)用提醒语气
  const pool = hour < 3 ? NIGHT_CARE_POOLS.gentle : NIGHT_CARE_POOLS.thoughtful;
  const index = (new Date().getDate() + userId.charCodeAt(0)) % pool.length;
  const msg = pool[index];
  return { title: msg.title, content: msg.content, type: "gentle" };
}

// ============================================================================
// Burnout Detector Class
// ============================================================================

class BurnoutDetector {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = ENABLE_BURNOUT_DETECTION;
    if (this.isEnabled) {
      logger.info("[BurnoutDetector] Burnout detection enabled");
    }
  }

  /**
   * Check if burnout detection is enabled
   */
  isDetectionEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable/disable detection at runtime
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`[BurnoutDetector] Detection ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Assess burnout risk for a user
   * Main entry point for risk assessment
   */
  async assessRisk(userId: string, date?: string): Promise<BurnoutRiskAssessment | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const targetDate = date || new Date().toISOString().split("T")[0];
      const memory = await shortTermMemoryManager.getMemoryForDate(userId, targetDate);

      // Skip if no interactions
      if (memory.dailyInteractions.length === 0) {
        return null;
      }

      // Calculate metrics
      const metrics = calculateBurnoutMetrics(memory);

      // Get consecutive work days
      const consecutiveDays = await this.calculateConsecutiveWorkDays(userId);

      // Calculate risk score
      const { score, factors } = calculateRiskScore(metrics, consecutiveDays);
      const level = getRiskLevel(score);

      // Generate suggestions
      const suggestions = generateCareSuggestions(level, factors);

      const assessment: BurnoutRiskAssessment = {
        userId,
        date: targetDate,
        score,
        level,
        factors,
        metrics,
        suggestions,
      };

      // Store metrics in short-term memory (optional field)
      memory.burnoutMetrics = metrics;

      // Update long-term history
      await this.updateBurnoutHistory(userId, assessment);

      logger.info(`[BurnoutDetector] Risk assessment for ${userId}: ${level} (${score})`);

      return assessment;
    } catch (error) {
      logger.error(`[BurnoutDetector] Failed to assess risk for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Calculate consecutive work days
   */
  async calculateConsecutiveWorkDays(userId: string): Promise<number> {
    let consecutiveDays = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toISOString().split("T")[0];

      const memory = await shortTermMemoryManager.exportMemory(userId, dateKey);
      if (memory && memory.dailyInteractions.length > 0) {
        consecutiveDays++;
      } else if (i > 0) {
        // Break on first day with no interactions (excluding today)
        break;
      }
    }

    return consecutiveDays;
  }

  /**
   * Update burnout history in long-term memory
   */
  private async updateBurnoutHistory(
    userId: string,
    assessment: BurnoutRiskAssessment
  ): Promise<void> {
    try {
      let history = await longTermMemoryManager.getBurnoutHistory(userId);

      if (!history) {
        history = {
          dailyScores: [],
          consecutiveHighRiskDays: 0,
          careFrequency: "daily",
          optedOut: false,
          lastUpdated: Date.now(),
        };
      }

      // Add today's score
      const existingIndex = history.dailyScores.findIndex(s => s.date === assessment.date);
      const scoreEntry = {
        date: assessment.date,
        score: assessment.score,
        level: assessment.level,
        factors: assessment.factors,
      };

      if (existingIndex >= 0) {
        history.dailyScores[existingIndex] = scoreEntry;
      } else {
        history.dailyScores.push(scoreEntry);
        // Keep only last 90 days
        if (history.dailyScores.length > 90) {
          history.dailyScores = history.dailyScores.slice(-90);
        }
      }

      // Update consecutive high risk days
      if (assessment.level === "high" || assessment.level === "critical") {
        history.consecutiveHighRiskDays++;
      } else {
        history.consecutiveHighRiskDays = 0;
      }

      history.lastUpdated = Date.now();

      await longTermMemoryManager.updateBurnoutHistory(userId, history);
    } catch (error) {
      logger.error(`[BurnoutDetector] Failed to update history for ${userId}:`, error);
    }
  }

  /**
   * Check if care message should be sent
   */
  async shouldSendCareMessage(userId: string, assessment: BurnoutRiskAssessment): Promise<boolean> {
    if (!this.isEnabled) return false;

    const history = await longTermMemoryManager.getBurnoutHistory(userId);
    if (!history || history.optedOut) return false;

    // Always send for critical
    if (assessment.level === "critical") return true;

    // Send for high if not sent today
    if (assessment.level === "high") {
      const lastCare = history.lastCareMessageAt || 0;
      const today = new Date().setHours(0, 0, 0, 0);
      return lastCare < today;
    }

    // For medium, respect user frequency preference
    if (assessment.level === "medium") {
      if (history.careFrequency === "only_critical") return false;

      const lastCare = history.lastCareMessageAt || 0;
      const today = new Date().setHours(0, 0, 0, 0);

      if (history.careFrequency === "daily") {
        return lastCare < today;
      }

      if (history.careFrequency === "weekly") {
        const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
        return lastCare < oneWeekAgo;
      }
    }

    return false;
  }

  /**
   * Record that care message was sent
   */
  async recordCareMessageSent(userId: string): Promise<void> {
    try {
      const history = await longTermMemoryManager.getBurnoutHistory(userId);
      if (history) {
        history.lastCareMessageAt = Date.now();
        await longTermMemoryManager.updateBurnoutHistory(userId, history);
      }
    } catch (error) {
      logger.error(`[BurnoutDetector] Failed to record care message for ${userId}:`, error);
    }
  }

  /**
   * Get user's burnout history summary
   */
  async getHistorySummary(userId: string): Promise<{
    recentScores: Array<{ date: string; score: number; level: string }>;
    averageScore: number;
    consecutiveHighRiskDays: number;
    trend: "improving" | "stable" | "worsening";
  } | null> {
    if (!this.isEnabled) return null;

    const history = await longTermMemoryManager.getBurnoutHistory(userId);
    if (!history || history.dailyScores.length === 0) return null;

    const recentScores = history.dailyScores.slice(-7).map(s => ({
      date: s.date,
      score: s.score,
      level: s.level,
    }));

    const averageScore = Math.round(
      history.dailyScores.slice(-7).reduce((sum, s) => sum + s.score, 0) /
        Math.min(history.dailyScores.length, 7)
    );

    // Calculate trend
    let trend: "improving" | "stable" | "worsening" = "stable";
    if (history.dailyScores.length >= 3) {
      const recent = history.dailyScores.slice(-3);
      const avgRecent = recent.reduce((sum, s) => sum + s.score, 0) / 3;
      const previous = history.dailyScores.slice(-6, -3);
      if (previous.length === 3) {
        const avgPrevious = previous.reduce((sum, s) => sum + s.score, 0) / 3;
        if (avgRecent < avgPrevious - 10) {
          trend = "improving";
        } else if (avgRecent > avgPrevious + 10) {
          trend = "worsening";
        }
      }
    }

    return {
      recentScores,
      averageScore,
      consecutiveHighRiskDays: history.consecutiveHighRiskDays,
      trend,
    };
  }

  /**
   * Opt out/in from burnout detection
   */
  async setOptOut(userId: string, optedOut: boolean): Promise<void> {
    try {
      let history = await longTermMemoryManager.getBurnoutHistory(userId);
      if (!history) {
        history = {
          dailyScores: [],
          consecutiveHighRiskDays: 0,
          careFrequency: "daily",
          optedOut,
          lastUpdated: Date.now(),
        };
      } else {
        history.optedOut = optedOut;
        history.lastUpdated = Date.now();
      }
      await longTermMemoryManager.updateBurnoutHistory(userId, history);
      logger.info(`[BurnoutDetector] User ${userId} opted ${optedOut ? "out" : "in"}`);
    } catch (error) {
      logger.error(`[BurnoutDetector] Failed to set opt-out for ${userId}:`, error);
    }
  }

  /**
   * Set care message frequency preference
   */
  async setCareFrequency(
    userId: string,
    frequency: "daily" | "weekly" | "only_critical"
  ): Promise<void> {
    try {
      let history = await longTermMemoryManager.getBurnoutHistory(userId);
      if (!history) {
        history = {
          dailyScores: [],
          consecutiveHighRiskDays: 0,
          careFrequency: frequency,
          optedOut: false,
          lastUpdated: Date.now(),
        };
      } else {
        history.careFrequency = frequency;
        history.lastUpdated = Date.now();
      }
      await longTermMemoryManager.updateBurnoutHistory(userId, history);
    } catch (error) {
      logger.error(`[BurnoutDetector] Failed to set frequency for ${userId}:`, error);
    }
  }
}

// Export singleton
export const burnoutDetector = new BurnoutDetector();

// Export class for testing
export { BurnoutDetector };
