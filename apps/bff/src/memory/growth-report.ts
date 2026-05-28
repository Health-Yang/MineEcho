/**
 * Growth Report System
 * 用户成长报告生成器 - Phase 2 实现
 *
 * 功能:
 * - 计算成长指标（技术栈扩展、项目交付、活跃度等）
 * - 检测里程碑事件
 * - 生成能力雷达图
 * - 提供成长建议
 */

import { logger } from "../utils/logger.js";
import { longTermMemoryManager } from "./long-term-memory.js";
import { shortTermMemoryManager } from "./short-term-memory.js";
import type {
  LongTermMemory,
  ShortTermMemory,
  SkillUsage,
  Project,
  Interaction,
  TechnicalStack,
} from "./types.js";

// ============================================================================
// Type Definitions
// ============================================================================

/** 成长报告周期类型 */
export type ReportPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

/** 里程碑类型 */
export type MilestoneType =
  | "first_project"           // 完成第一个项目
  | "tech_stack_expanded"     // 技术栈显著扩展
  | "streak_7_days"          // 连续使用7天
  | "streak_30_days"         // 连续使用30天
  | "streak_100_days"        // 连续使用100天
  | "skill_mastered"         // 掌握某个技能
  | "interaction_milestone"   // 交互次数里程碑
  | "project_completed";      // 完成项目里程碑

/** 里程碑定义 */
export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: number;
  metadata?: Record<string, unknown>;
}

/** 成长指标 */
export interface GrowthMetrics {
  /** 技术栈增长数 */
  techStackGrowth: number;
  /** 项目总数 */
  projectCount: number;
  /** 已完成项目数 */
  completedProjects: number;
  /** 项目成功率（百分比） */
  projectSuccessRate: number;
  /** 平均交互深度（1-10） */
  avgInteractionDepth: number;
  /** 连续使用天数 */
  streakDays: number;
  /** 总交互次数 */
  totalInteractions: number;
  /** 技能使用次数 */
  totalSkillUses: number;
  /** 掌握的技能数（使用10次以上） */
  masteredSkills: number;
}

/** 雷达图维度 */
export interface RadarDimension {
  name: string;
  score: number; // 0-100
  description: string;
}

/** 成长报告 */
export interface GrowthReport {
  id: string;
  userId: string;
  period: ReportPeriod;
  periodStart: number;
  periodEnd: number;
  generatedAt: number;
  metrics: GrowthMetrics;
  milestones: Milestone[];
  radarChart: {
    dimensions: string[];
    scores: number[];
  };
  summary: string;
  suggestions: string[];
  comparison?: {
    prevPeriodMetrics: Partial<GrowthMetrics>;
    improvements: string[];
  };
}

/** 报告生成选项 */
export interface ReportGenerationOptions {
  period?: ReportPeriod;
  startDate?: number;
  endDate?: number;
  compareWithPrevious?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** 功能开关 - 默认开启，可通过环境变量关闭 */
export const GROWTH_REPORT_ENABLED = process.env.GROWTH_REPORT_ENABLED !== "false";

/** 里程碑阈值配置 */
const MILESTONE_THRESHOLDS = {
  TECH_STACK_EXPANSION: 5,      // 技术栈扩展阈值
  SKILL_MASTERY_USES: 10,       // 技能掌握使用次数
  INTERACTION_MILESTONES: [100, 500, 1000, 5000, 10000],
  PROJECT_MILESTONES: [1, 5, 10, 25, 50],
};

/** 雷达图维度定义 */
const RADAR_DIMENSIONS = [
  { key: "technicalDepth", name: "技术深度", weight: 0.25 },
  { key: "projectExperience", name: "项目经验", weight: 0.20 },
  { key: "usageStickiness", name: "使用粘性", weight: 0.25 },
  { key: "learningSpeed", name: "学习速度", weight: 0.15 },
  { key: "professionalBreadth", name: "专业广度", weight: 0.15 },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 获取周期起始时间
 */
function getPeriodStart(period: ReportPeriod, endDate: number = Date.now()): number {
  const end = new Date(endDate);
  const start = new Date(end);

  switch (period) {
    case "weekly":
      start.setDate(end.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarterly":
      start.setMonth(end.getMonth() - 3);
      break;
    case "yearly":
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return start.getTime();
}

/**
 * 计算技术栈总数
 */
function calculateTechStackSize(stack: TechnicalStack): number {
  return (
    stack.languages.length +
    stack.frameworks.length +
    stack.tools.length +
    stack.databases.length +
    stack.platforms.length +
    (stack.cloud_products?.length || 0) +
    (stack.storage?.length || 0) +
    (stack.networking?.length || 0) +
    (stack.ai_ml?.length || 0) +
    (stack.security_products?.length || 0) +
    (stack.delivery_ops?.length || 0)
  );
}

/**
 * 分析交互深度
 * 根据内容长度、技能使用、问题复杂度评分
 */
function analyzeInteractionDepth(interaction: Interaction): number {
  let depth = 5; // 基础分

  // 根据内容长度评分
  const contentLength = interaction.content.length;
  if (contentLength > 500) depth += 2;
  else if (contentLength > 200) depth += 1;

  // 使用技能增加深度
  if (interaction.skillId) depth += 2;

  // 根据结果调整
  if (interaction.outcome === "success") depth += 1;
  else if (interaction.outcome === "failure") depth -= 1;

  // 用户反馈
  if (interaction.userFeedback === "positive") depth += 1;
  else if (interaction.userFeedback === "negative") depth -= 1;

  return Math.max(1, Math.min(10, depth));
}

/**
 * 计算连续使用天数
 */
function calculateStreakDays(interactionsByDate: Map<string, number>): number {
  const dates = Array.from(interactionsByDate.keys()).sort().reverse();
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let currentDate = new Date();

  // 检查今天是否有交互，如果没有从昨天开始算
  const hasToday = interactionsByDate.has(today);
  if (!hasToday) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (true) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (interactionsByDate.has(dateStr) && interactionsByDate.get(dateStr)! > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * 计算成长指标
 */
export async function calculateGrowthMetrics(
  userId: string,
  startDate: number,
  endDate: number
): Promise<GrowthMetrics> {
  // 获取长期记忆数据
  const longTermMemory = await longTermMemoryManager.getFullMemory(userId);

  // 获取周期内的短期记忆数据
  const shortTermMemories: ShortTermMemory[] = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const memory = await shortTermMemoryManager.getMemoryForDate(userId, dateStr);
    if (memory.dailyInteractions.length > 0) {
      shortTermMemories.push(memory);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 计算各项指标
  const metrics: GrowthMetrics = {
    techStackGrowth: 0,
    projectCount: 0,
    completedProjects: 0,
    projectSuccessRate: 0,
    avgInteractionDepth: 0,
    streakDays: 0,
    totalInteractions: 0,
    totalSkillUses: 0,
    masteredSkills: 0,
  };

  if (longTermMemory) {
    // 技术栈统计
    metrics.techStackGrowth = calculateTechStackSize(longTermMemory.userProfile.technicalStack);

    // 项目统计
    const projects = longTermMemory.projectHistory;
    metrics.projectCount = projects.length;
    metrics.completedProjects = projects.filter(p => p.status === "completed").length;
    metrics.projectSuccessRate = projects.length > 0
      ? Math.round((metrics.completedProjects / projects.length) * 100)
      : 0;

    // 技能统计
    const skillPatterns = longTermMemory.skillUsagePatterns.patterns;
    metrics.totalSkillUses = skillPatterns.reduce((sum, p) => sum + p.totalUses, 0);
    metrics.masteredSkills = skillPatterns.filter(p => p.totalUses >= MILESTONE_THRESHOLDS.SKILL_MASTERY_USES).length;
  }

  // 交互统计
  const allInteractions: Interaction[] = [];
  const interactionsByDate = new Map<string, number>();

  for (const memory of shortTermMemories) {
    allInteractions.push(...memory.dailyInteractions);
    interactionsByDate.set(memory.date, memory.dailyInteractions.length);
  }

  metrics.totalInteractions = allInteractions.length;

  // 计算平均交互深度
  if (allInteractions.length > 0) {
    const totalDepth = allInteractions.reduce((sum, i) => sum + analyzeInteractionDepth(i), 0);
    metrics.avgInteractionDepth = Math.round((totalDepth / allInteractions.length) * 10) / 10;
  }

  // 计算连续使用天数
  metrics.streakDays = calculateStreakDays(interactionsByDate);

  return metrics;
}

/**
 * 检测里程碑事件
 */
export async function detectMilestones(
  userId: string,
  metrics: GrowthMetrics,
  startDate: number,
  endDate: number
): Promise<Milestone[]> {
  const milestones: Milestone[] = [];
  const longTermMemory = await longTermMemoryManager.getFullMemory(userId);

  if (!longTermMemory) return milestones;

  const now = Date.now();

  // 1. 首个项目里程碑
  const completedProjects = longTermMemory.projectHistory.filter(p => p.status === "completed");
  const firstCompleted = completedProjects
    .filter(p => p.endDate && p.endDate >= startDate && p.endDate <= endDate)
    .sort((a, b) => (a.endDate || 0) - (b.endDate || 0))[0];

  if (firstCompleted && completedProjects.length === 1) {
    milestones.push({
      id: `milestone-first-project-${firstCompleted.id}`,
      type: "first_project",
      title: "项目初体验",
      description: `恭喜完成第一个项目「${firstCompleted.name}」，迈出了项目交付的第一步！`,
      achievedAt: firstCompleted.endDate || now,
    });
  }

  // 2. 技术栈扩展里程碑
  const techStackSize = calculateTechStackSize(longTermMemory.userProfile.technicalStack);
  if (techStackSize >= MILESTONE_THRESHOLDS.TECH_STACK_EXPANSION) {
    milestones.push({
      id: `milestone-tech-stack-${now}`,
      type: "tech_stack_expanded",
      title: "技术栈扩展",
      description: `你的技术栈已扩展至 ${techStackSize} 个领域，知识面持续拓宽！`,
      achievedAt: now,
      metadata: { techStackSize },
    });
  }

  // 3. 连续使用里程碑
  if (metrics.streakDays >= 100) {
    milestones.push({
      id: `milestone-streak-100-${now}`,
      type: "streak_100_days",
      title: "百日坚持",
      description: `连续使用 ${metrics.streakDays} 天，这份坚持已经超过99%的用户！`,
      achievedAt: now,
      metadata: { streakDays: metrics.streakDays },
    });
  } else if (metrics.streakDays >= 30) {
    milestones.push({
      id: `milestone-streak-30-${now}`,
      type: "streak_30_days",
      title: "月度达人",
      description: `连续使用 ${metrics.streakDays} 天，已经成为日常工作的得力助手！`,
      achievedAt: now,
      metadata: { streakDays: metrics.streakDays },
    });
  } else if (metrics.streakDays >= 7) {
    milestones.push({
      id: `milestone-streak-7-${now}`,
      type: "streak_7_days",
      title: "周周相伴",
      description: `连续使用 ${metrics.streakDays} 天，良好的使用习惯正在养成！`,
      achievedAt: now,
      metadata: { streakDays: metrics.streakDays },
    });
  }

  // 4. 技能掌握里程碑
  const masteredSkills = longTermMemory.skillUsagePatterns.patterns
    .filter(p => p.totalUses >= MILESTONE_THRESHOLDS.SKILL_MASTERY_USES);

  for (const skill of masteredSkills) {
    // 检查是否在周期内达到掌握
    if (skill.lastUsedAt >= startDate && skill.lastUsedAt <= endDate) {
      milestones.push({
        id: `milestone-skill-${skill.skillId}-${now}`,
        type: "skill_mastered",
        title: "技能精通",
        description: `「${skill.skillName}」已使用 ${skill.totalUses} 次，这项技能已经被你熟练掌握！`,
        achievedAt: skill.lastUsedAt,
        metadata: { skillId: skill.skillId, skillName: skill.skillName, uses: skill.totalUses },
      });
    }
  }

  // 5. 交互次数里程碑
  for (const threshold of MILESTONE_THRESHOLDS.INTERACTION_MILESTONES) {
    if (metrics.totalInteractions >= threshold) {
      const prevThreshold = MILESTONE_THRESHOLDS.INTERACTION_MILESTONES[
        MILESTONE_THRESHOLDS.INTERACTION_MILESTONES.indexOf(threshold) - 1
      ] || 0;

      // 简单判断：如果当前周期内交互数跨越了里程碑阈值
      if (metrics.totalInteractions - prevThreshold < threshold) {
        milestones.push({
          id: `milestone-interactions-${threshold}-${now}`,
          type: "interaction_milestone",
          title: "互动达人",
          description: `累计交互突破 ${threshold} 次，感谢你的持续信任与支持！`,
          achievedAt: now,
          metadata: { totalInteractions: metrics.totalInteractions, threshold },
        });
      }
      break; // 只记录最高达到的里程碑
    }
  }

  // 6. 项目完成里程碑
  for (const threshold of MILESTONE_THRESHOLDS.PROJECT_MILESTONES) {
    if (metrics.completedProjects >= threshold) {
      milestones.push({
        id: `milestone-projects-${threshold}-${now}`,
        type: "project_completed",
        title: "项目专家",
        description: `累计完成 ${metrics.completedProjects} 个项目，项目交付能力不断提升！`,
        achievedAt: now,
        metadata: { completedProjects: metrics.completedProjects, threshold },
      });
      break;
    }
  }

  return milestones.sort((a, b) => b.achievedAt - a.achievedAt);
}

/**
 * 计算雷达图分数
 */
export function calculateRadarScores(metrics: GrowthMetrics): RadarDimension[] {
  const dimensions: RadarDimension[] = [];

  // 1. 技术深度 (基于技术栈大小和熟练度)
  const techDepthScore = Math.min(100, Math.round(
    (metrics.techStackGrowth / 20) * 100 + // 20个技术点为满分
    (metrics.masteredSkills * 5)           // 每个掌握的技能加5分
  ));
  dimensions.push({
    name: "技术深度",
    score: Math.min(100, techDepthScore),
    description: "技术栈广度和技能掌握程度",
  });

  // 2. 项目经验 (基于项目数量和成功率)
  const projectScore = Math.min(100, Math.round(
    (metrics.completedProjects * 10) +           // 每个项目10分
    (metrics.projectSuccessRate * 0.5)           // 成功率加权
  ));
  dimensions.push({
    name: "项目经验",
    score: Math.min(100, projectScore),
    description: "项目交付数量和成功率",
  });

  // 3. 使用粘性 (基于连续使用天数和交互频次)
  const stickinessScore = Math.min(100, Math.round(
    (metrics.streakDays / 30) * 50 +             // 连续30天得50分
    (Math.min(metrics.totalInteractions, 100) / 100) * 50  // 交互数封顶100次
  ));
  dimensions.push({
    name: "使用粘性",
    score: Math.min(100, stickinessScore),
    description: "连续使用天数和活跃度",
  });

  // 4. 学习速度 (基于交互深度和新技能获取)
  const learningScore = Math.min(100, Math.round(
    (metrics.avgInteractionDepth / 10) * 60 +    // 交互深度占60%
    (metrics.techStackGrowth * 2)                // 技术栈增长占40%
  ));
  dimensions.push({
    name: "学习速度",
    score: Math.min(100, learningScore),
    description: "问题复杂度和知识获取速度",
  });

  // 5. 专业广度 (基于技术栈多样性)
  const breadthScore = Math.min(100, Math.round(
    (metrics.techStackGrowth / 15) * 100         // 15个不同领域为满分
  ));
  dimensions.push({
    name: "专业广度",
    score: Math.min(100, breadthScore),
    description: "跨领域技术能力",
  });

  return dimensions;
}

/**
 * 生成成长总结文字
 */
function generateSummary(
  metrics: GrowthMetrics,
  milestones: Milestone[],
  period: ReportPeriod
): string {
  const periodText = {
    weekly: "本周",
    monthly: "本月",
    quarterly: "本季度",
    yearly: "今年",
  }[period];

  const parts: string[] = [];

  // 活跃度评价
  if (metrics.streakDays >= 30) {
    parts.push(`连续使用 ${metrics.streakDays} 天，已经成为你工作流中不可或缺的一部分`);
  } else if (metrics.streakDays >= 7) {
    parts.push(`连续使用 ${metrics.streakDays} 天，使用习惯正在稳步养成`);
  } else if (metrics.totalInteractions > 0) {
    parts.push(`${periodText}共有 ${metrics.totalInteractions} 次交互`);
  }

  // 技术成长
  if (metrics.techStackGrowth > 0) {
    parts.push(`技术栈覆盖 ${metrics.techStackGrowth} 个领域`);
  }

  // 项目成果
  if (metrics.completedProjects > 0) {
    parts.push(`完成 ${metrics.completedProjects} 个项目，成功率 ${metrics.projectSuccessRate}%`);
  }

  // 里程碑总结
  if (milestones.length > 0) {
    const milestoneNames = milestones.slice(0, 3).map(m => m.title).join("、");
    parts.push(`达成 ${milestones.length} 个里程碑：${milestoneNames}`);
  }

  if (parts.length === 0) {
    return `${periodText}刚开始，期待看到你的成长！`;
  }

  return parts.join("；") + "。";
}

/**
 * 生成成长建议
 */
function generateSuggestions(
  metrics: GrowthMetrics,
  dimensions: RadarDimension[]
): string[] {
  const suggestions: string[] = [];

  // 找出得分最低的维度，给出改进建议
  const sortedDimensions = [...dimensions].sort((a, b) => a.score - b.score);
  const weakestDimension = sortedDimensions[0];

  switch (weakestDimension.name) {
    case "技术深度":
      suggestions.push("尝试使用更多高级技能，深入探索技术细节");
      suggestions.push("关注技能使用反馈，持续优化使用方式");
      break;
    case "项目经验":
      suggestions.push("尝试将更多工作组织为项目形式，提升交付能力");
      suggestions.push("总结项目经验，形成可复用的工作模式");
      break;
    case "使用粘性":
      suggestions.push("设置每日提醒，保持连续使用的节奏");
      suggestions.push("探索更多使用场景，发现新的价值点");
      break;
    case "学习速度":
      suggestions.push("尝试提出更复杂的问题，挑战自己的技术边界");
      suggestions.push("关注技术趋势，持续学习新领域知识");
      break;
    case "专业广度":
      suggestions.push("探索跨领域技能，拓宽技术视野");
      suggestions.push("关注相关技术栈，建立知识体系连接");
      break;
  }

  // 基于具体指标的建议
  if (metrics.streakDays < 7) {
    suggestions.push("连续使用7天即可解锁「周周相伴」成就");
  }

  if (metrics.masteredSkills < 3) {
    suggestions.push(`再使用 ${MILESTONE_THRESHOLDS.SKILL_MASTERY_USES} 次常用技能即可解锁「技能精通」成就`);
  }

  if (metrics.projectSuccessRate < 80 && metrics.projectCount > 0) {
    suggestions.push("项目成功率还有提升空间，建议复盘未完成的项目");
  }

  // 正面激励
  if (metrics.streakDays >= 30) {
    suggestions.push("连续使用表现优秀，考虑申请相关技术认证");
  }

  return suggestions.slice(0, 4); // 最多返回4条建议
}

/**
 * 生成完整成长报告
 */
export async function generateGrowthReport(
  userId: string,
  options: ReportGenerationOptions = {}
): Promise<GrowthReport | null> {
  if (!GROWTH_REPORT_ENABLED) {
    logger.info("[GrowthReport] Feature is enabled by default");
    return null;
  }

  try {
    const period = options.period || "monthly";
    const endDate = options.endDate || Date.now();
    const startDate = options.startDate || getPeriodStart(period, endDate);

    logger.info(`[GrowthReport] Generating ${period} report for user ${userId}`);

    // 计算指标
    const metrics = await calculateGrowthMetrics(userId, startDate, endDate);

    // 检测里程碑
    const milestones = await detectMilestones(userId, metrics, startDate, endDate);

    // 计算雷达图
    const radarDimensions = calculateRadarScores(metrics);

    // 生成总结和建议
    const summary = generateSummary(metrics, milestones, period);
    const suggestions = generateSuggestions(metrics, radarDimensions);

    const report: GrowthReport = {
      id: `report-${userId}-${period}-${Date.now()}`,
      userId,
      period,
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt: Date.now(),
      metrics,
      milestones,
      radarChart: {
        dimensions: radarDimensions.map(d => d.name),
        scores: radarDimensions.map(d => d.score),
      },
      summary,
      suggestions,
    };

    logger.info(`[GrowthReport] Generated report with ${milestones.length} milestones`);
    return report;
  } catch (error) {
    logger.error("[GrowthReport] Failed to generate report:", error);
    return null;
  }
}

// ============================================================================
// GrowthReportGenerator Class
// ============================================================================

/**
 * 成长报告生成器类
 * 提供更高级的报告管理功能
 */
export class GrowthReportGenerator {
  private reportCache = new Map<string, GrowthReport>();
  private readonly cacheExpiryMs = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 检查功能是否启用
   */
  isEnabled(): boolean {
    return GROWTH_REPORT_ENABLED;
  }

  /**
   * 生成报告（带缓存）
   */
  async generateReport(
    userId: string,
    options: ReportGenerationOptions = {}
  ): Promise<GrowthReport | null> {
    const cacheKey = `${userId}-${options.period || "monthly"}`;

    // 检查缓存
    const cached = this.reportCache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt < this.cacheExpiryMs) {
      logger.debug(`[GrowthReport] Returning cached report for ${userId}`);
      return cached;
    }

    // 生成新报告
    const report = await generateGrowthReport(userId, options);

    if (report) {
      this.reportCache.set(cacheKey, report);
    }

    return report;
  }

  /**
   * 获取最新报告（优先从缓存）
   */
  async getLatestReport(userId: string): Promise<GrowthReport | null> {
    return this.generateReport(userId, { period: "monthly" });
  }

  /**
   * 获取历史报告列表（基于缓存）
   */
  getReportHistory(userId: string): GrowthReport[] {
    const reports: GrowthReport[] = [];
    const prefix = `${userId}-`;

    for (const [key, report] of this.reportCache.entries()) {
      if (key.startsWith(prefix)) {
        reports.push(report);
      }
    }

    return reports.sort((a, b) => b.generatedAt - a.generatedAt);
  }

  /**
   * 强制重新生成报告（忽略缓存）
   */
  async forceRegenerate(userId: string, options: ReportGenerationOptions = {}): Promise<GrowthReport | null> {
    const cacheKey = `${userId}-${options.period || "monthly"}`;
    this.reportCache.delete(cacheKey);
    return this.generateReport(userId, options);
  }

  /**
   * 清除缓存
   */
  clearCache(userId?: string): void {
    if (userId) {
      for (const key of this.reportCache.keys()) {
        if (key.startsWith(`${userId}-`)) {
          this.reportCache.delete(key);
        }
      }
    } else {
      this.reportCache.clear();
    }
  }

  /**
   * 获取用户里程碑列表
   */
  async getUserMilestones(userId: string, limit: number = 20): Promise<Milestone[]> {
    if (!GROWTH_REPORT_ENABLED) return [];

    // 获取所有周期的里程碑
    const allMilestones: Milestone[] = [];

    // 月度报告
    const monthlyReport = await this.generateReport(userId, { period: "monthly" });
    if (monthlyReport) {
      allMilestones.push(...monthlyReport.milestones);
    }

    // 去重并排序
    const uniqueMilestones = new Map<string, Milestone>();
    for (const milestone of allMilestones) {
      uniqueMilestones.set(milestone.id, milestone);
    }

    return Array.from(uniqueMilestones.values())
      .sort((a, b) => b.achievedAt - a.achievedAt)
      .slice(0, limit);
  }

  /**
   * 获取功能状态
   */
  getStatus(): {
    enabled: boolean;
    cacheSize: number;
    envVar: string;
  } {
    return {
      enabled: GROWTH_REPORT_ENABLED,
      cacheSize: this.reportCache.size,
      envVar: process.env.GROWTH_REPORT_ENABLED || "false",
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const growthReportGenerator = new GrowthReportGenerator();
