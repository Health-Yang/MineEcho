/**
 * Growth Report Scheduler
 * 成长报告定时触发器 - Phase 2 实现
 *
 * 功能:
 * - 定期自动生成报告（每月/每季度）
 * - 里程碑检测触发
 * - 报告生成任务调度
 */

import { logger } from "../utils/logger.js";
import {
  growthReportGenerator,
  generateGrowthReport,
  GROWTH_REPORT_ENABLED,
  type ReportPeriod,
  type GrowthReport,
} from "./growth-report.js";

// ============================================================================
// Type Definitions
// ============================================================================

/** 调度器配置 */
export interface SchedulerConfig {
  /** 是否启用自动报告生成 */
  autoGenerateEnabled: boolean;
  /** 月度报告生成日期（每月几号） */
  monthlyReportDay: number;
  /** 季度报告生成月份（1, 4, 7, 10） */
  quarterlyReportMonths: number[];
  /** 报告生成时间（小时，0-23） */
  reportGenerationHour: number;
  /** 里程碑检查间隔（分钟） */
  milestoneCheckIntervalMinutes: number;
}

/** 调度任务状态 */
export interface SchedulerStatus {
  isRunning: boolean;
  lastRunAt: number | null;
  nextRunAt: number | null;
  config: SchedulerConfig;
  activeTimers: number;
}

/** 报告生成任务 */
interface ReportTask {
  userId: string;
  period: ReportPeriod;
  scheduledAt: number;
  priority: "high" | "normal" | "low";
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SchedulerConfig = {
  autoGenerateEnabled: process.env.GROWTH_REPORT_AUTO_GENERATE === "true",
  monthlyReportDay: parseInt(process.env.GROWTH_REPORT_MONTHLY_DAY || "1", 10),
  quarterlyReportMonths: [1, 4, 7, 10], // 每季度第一个月
  reportGenerationHour: parseInt(process.env.GROWTH_REPORT_HOUR || "9", 10),
  milestoneCheckIntervalMinutes: parseInt(process.env.GROWTH_REPORT_MILESTONE_INTERVAL || "60", 10),
};

// ============================================================================
// ReportScheduler Class
// ============================================================================

export class ReportScheduler {
  private config: SchedulerConfig;
  private isRunning = false;
  private lastRunAt: number | null = null;
  private nextRunAt: number | null = null;
  private timers: NodeJS.Timeout[] = [];
  private taskQueue: ReportTask[] = [];
  private isProcessing = false;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 启动调度器
   */
  start(): boolean {
    if (!GROWTH_REPORT_ENABLED) {
      logger.warn("[ReportScheduler] Cannot start: Growth report feature is disabled");
      return false;
    }

    if (this.isRunning) {
      logger.warn("[ReportScheduler] Already running");
      return false;
    }

    if (!this.config.autoGenerateEnabled) {
      logger.info("[ReportScheduler] Auto-generate is disabled, scheduler not started");
      return false;
    }

    logger.info("[ReportScheduler] Starting scheduler...");

    // 启动月度报告定时任务
    this.scheduleMonthlyReports();

    // 启动季度报告定时任务
    this.scheduleQuarterlyReports();

    // 启动里程碑检查任务
    this.scheduleMilestoneChecks();

    this.isRunning = true;
    this.nextRunAt = this.calculateNextRunTime();

    logger.info("[ReportScheduler] Scheduler started successfully", {
      monthlyDay: this.config.monthlyReportDay,
      quarterlyMonths: this.config.quarterlyReportMonths,
      generationHour: this.config.reportGenerationHour,
      milestoneInterval: this.config.milestoneCheckIntervalMinutes,
    });

    return true;
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info("[ReportScheduler] Stopping scheduler...");

    // 清除所有定时器
    for (const timer of this.timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.timers = [];

    this.isRunning = false;
    this.nextRunAt = null;

    logger.info("[ReportScheduler] Scheduler stopped");
  }

  /**
   * 重启调度器
   */
  restart(): boolean {
    this.stop();
    return this.start();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果正在运行，需要重启以应用新配置
    if (this.isRunning) {
      this.restart();
    }

    logger.info("[ReportScheduler] Configuration updated", this.config);
  }

  /**
   * 获取调度器状态
   */
  getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      config: { ...this.config },
      activeTimers: this.timers.length,
    };
  }

  /**
   * 手动触发报告生成
   */
  async triggerReportGeneration(
    userId: string,
    period: ReportPeriod = "monthly"
  ): Promise<GrowthReport | null> {
    if (!GROWTH_REPORT_ENABLED) {
      logger.warn("[ReportScheduler] Cannot trigger: Feature is disabled");
      return null;
    }

    logger.info(`[ReportScheduler] Manually triggering ${period} report for ${userId}`);

    const report = await growthReportGenerator.forceRegenerate(userId, { period });

    if (report) {
      this.lastRunAt = Date.now();
      logger.info(`[ReportScheduler] Report generated successfully: ${report.id}`);
    } else {
      logger.error(`[ReportScheduler] Failed to generate report for ${userId}`);
    }

    return report;
  }

  /**
   * 添加报告生成任务到队列
   */
  queueReportTask(userId: string, period: ReportPeriod, priority: "high" | "normal" | "low" = "normal"): void {
    const task: ReportTask = {
      userId,
      period,
      scheduledAt: Date.now(),
      priority,
    };

    // 根据优先级插入队列
    if (priority === "high") {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }

    logger.debug(`[ReportScheduler] Task queued for ${userId}`, { period, priority });

    // 尝试处理队列
    this.processTaskQueue();
  }

  /**
   * 处理任务队列
   */
  private async processTaskQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) continue;

      try {
        logger.info(`[ReportScheduler] Processing task for ${task.userId}`, {
          period: task.period,
          priority: task.priority,
        });

        await growthReportGenerator.generateReport(task.userId, { period: task.period });

        // 添加延迟避免过载
        await this.delay(1000);
      } catch (error) {
        logger.error(`[ReportScheduler] Task failed for ${task.userId}:`, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * 调度月度报告
   */
  private scheduleMonthlyReports(): void {
    const checkAndGenerate = () => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentHour = now.getHours();

      // 检查是否是报告生成日
      if (currentDay === this.config.monthlyReportDay && currentHour === this.config.reportGenerationHour) {
        logger.info("[ReportScheduler] Triggering monthly report generation");
        this.generateReportsForAllUsers("monthly");
      }
    };

    // 每小时检查一次
    const timer = setInterval(checkAndGenerate, 60 * 60 * 1000);
    this.timers.push(timer);

    // 立即执行一次检查
    checkAndGenerate();
  }

  /**
   * 调度季度报告
   */
  private scheduleQuarterlyReports(): void {
    const checkAndGenerate = () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentDay = now.getDate();
      const currentHour = now.getHours();

      // 检查是否是季度报告生成时间
      if (
        this.config.quarterlyReportMonths.includes(currentMonth) &&
        currentDay === 1 &&
        currentHour === this.config.reportGenerationHour
      ) {
        logger.info("[ReportScheduler] Triggering quarterly report generation");
        this.generateReportsForAllUsers("quarterly");
      }
    };

    // 每小时检查一次
    const timer = setInterval(checkAndGenerate, 60 * 60 * 1000);
    this.timers.push(timer);
  }

  /**
   * 调度里程碑检查
   */
  private scheduleMilestoneChecks(): void {
    const checkMilestones = async () => {
      logger.debug("[ReportScheduler] Running milestone check");

      // 这里可以实现里程碑检测逻辑
      // 例如：检查用户是否达到新的里程碑，发送通知等

      // 示例：检查活跃用户的新里程碑
      // 实际实现中可能需要从数据库获取活跃用户列表
    };

    const intervalMs = this.config.milestoneCheckIntervalMinutes * 60 * 1000;
    const timer = setInterval(checkMilestones, intervalMs);
    this.timers.push(timer);

    // 立即执行一次
    checkMilestones();
  }

  /**
   * 为所有用户生成报告
   */
  private async generateReportsForAllUsers(period: ReportPeriod): Promise<void> {
    // 注意：实际实现中需要从用户管理系统获取所有用户ID
    // 这里使用示例用户ID
    const userIds = ["default-user"]; // 可以扩展为从数据库获取

    logger.info(`[ReportScheduler] Queueing ${period} reports for ${userIds.length} users`);

    for (const userId of userIds) {
      this.queueReportTask(userId, period, "normal");
    }
  }

  /**
   * 计算下次运行时间
   */
  private calculateNextRunTime(): number {
    const now = new Date();
    const next = new Date(now);

    // 找到下一个报告生成时间点
    next.setHours(this.config.reportGenerationHour, 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next.getTime();
  }

  /**
   * 延迟辅助函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取下次报告生成时间
   */
  getNextReportTime(): { monthly: number | null; quarterly: number | null } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    // 计算下次月度报告时间
    const nextMonthly = new Date(now);
    nextMonthly.setDate(this.config.monthlyReportDay);
    nextMonthly.setHours(this.config.reportGenerationHour, 0, 0, 0);
    if (nextMonthly <= now) {
      nextMonthly.setMonth(nextMonthly.getMonth() + 1);
    }

    // 计算下次季度报告时间
    const nextQuarterMonth = this.config.quarterlyReportMonths.find(m => m > currentMonth)
      || this.config.quarterlyReportMonths[0];
    const nextQuarterly = new Date(now);
    nextQuarterly.setMonth(nextQuarterMonth - 1);
    nextQuarterly.setDate(1);
    nextQuarterly.setHours(this.config.reportGenerationHour, 0, 0, 0);
    if (nextQuarterly <= now) {
      nextQuarterly.setFullYear(nextQuarterly.getFullYear() + 1);
    }

    return {
      monthly: nextMonthly.getTime(),
      quarterly: nextQuarterly.getTime(),
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const reportScheduler = new ReportScheduler();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * 启动报告调度器
 */
export function startReportScheduler(): boolean {
  return reportScheduler.start();
}

/**
 * 停止报告调度器
 */
export function stopReportScheduler(): void {
  reportScheduler.stop();
}

/**
 * 获取调度器状态
 */
export function getSchedulerStatus(): SchedulerStatus {
  return reportScheduler.getStatus();
}

/**
 * 手动触发报告生成
 */
export async function triggerScheduledReport(
  userId: string,
  period: ReportPeriod = "monthly"
): Promise<GrowthReport | null> {
  return reportScheduler.triggerReportGeneration(userId, period);
}

/**
 * 检查即将到来的报告
 */
export function getUpcomingReports(): {
  monthly: Date;
  quarterly: Date;
  daysUntilMonthly: number;
  daysUntilQuarterly: number;
} {
  const nextTimes = reportScheduler.getNextReportTime();
  const now = Date.now();

  const monthlyDate = nextTimes.monthly ? new Date(nextTimes.monthly) : new Date();
  const quarterlyDate = nextTimes.quarterly ? new Date(nextTimes.quarterly) : new Date();

  const daysUntilMonthly = Math.ceil((nextTimes.monthly! - now) / (1000 * 60 * 60 * 24));
  const daysUntilQuarterly = Math.ceil((nextTimes.quarterly! - now) / (1000 * 60 * 60 * 24));

  return {
    monthly: monthlyDate,
    quarterly: quarterlyDate,
    daysUntilMonthly,
    daysUntilQuarterly,
  };
}
