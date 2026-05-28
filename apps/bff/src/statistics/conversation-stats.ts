/**
 * L3 层对话统计收集器
 * 仅统计数字指标，不记录消息内容，保护用户隐私
 */

import { logger } from "../utils/logger.js";

// ============================================================================
// 类型定义
// ============================================================================

export interface ConversationMetrics {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  skillInvocations: number;
  errors: number;
  tokensInput: number;
  tokensOutput: number;
}

export interface ConversationStatsRecord {
  userId: string;
  sessionId: string;
  dayKey: string; // YYYY-MM-DD
  metrics: ConversationMetrics;
  ts: number;
}

export interface StatsCollectorConfig {
  enabled: boolean;
  maxRecordsPerUser: number;
  maxDaysRetention: number;
}

// ============================================================================
// 配置
// ============================================================================

const DEFAULT_CONFIG: StatsCollectorConfig = {
  enabled: process.env.ENABLE_CONVERSATION_STATS !== "false", // 默认开启
  maxRecordsPerUser: 1000,
  maxDaysRetention: 2,
};

function getDayKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getRecordKey(userId: string, sessionId: string, dayKey: string): string {
  return `${userId}:${sessionId}:${dayKey}`;
}

// ============================================================================
// 统计收集器
// ============================================================================

export class ConversationStatsCollector {
  private config: StatsCollectorConfig;
  private records: Map<string, ConversationStatsRecord> = new Map();
  private userRecordCount: Map<string, number> = new Map();
  private lastCleanupTime: number = 0;

  constructor(config: Partial<StatsCollectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.config.enabled) {
      logger.info("[ConversationStats] Collector enabled");
    }
  }

  /**
   * 记录消息
   */
  recordMessage(
    userId: string,
    sessionId: string,
    type: "user" | "assistant",
    tokensInput: number = 0,
    tokensOutput: number = 0
  ): void {
    if (!this.config.enabled) return;

    this.cleanupIfNeeded();

    const dayKey = getDayKey();
    const recordKey = getRecordKey(userId, sessionId, dayKey);

    let record = this.records.get(recordKey);
    if (!record) {
      // 检查用户记录数限制
      const userCount = this.userRecordCount.get(userId) || 0;
      if (userCount >= this.config.maxRecordsPerUser) {
        logger.warn(`[ConversationStats] User ${userId} record limit reached`);
        return;
      }

      record = {
        userId,
        sessionId,
        dayKey,
        metrics: {
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
          skillInvocations: 0,
          errors: 0,
          tokensInput: 0,
          tokensOutput: 0,
        },
        ts: Date.now(),
      };
      this.records.set(recordKey, record);
      this.userRecordCount.set(userId, userCount + 1);
    }

    // 更新统计
    record.metrics.totalMessages++;
    if (type === "user") {
      record.metrics.userMessages++;
      record.metrics.tokensInput += tokensInput;
    } else {
      record.metrics.assistantMessages++;
      record.metrics.tokensOutput += tokensOutput;
    }
    record.ts = Date.now();

    logger.debug(`[ConversationStats] Message recorded for ${userId}/${sessionId}`);
  }

  /**
   * 记录技能调用
   */
  recordSkillInvocation(userId: string, sessionId: string): void {
    if (!this.config.enabled) return;

    this.cleanupIfNeeded();

    const dayKey = getDayKey();
    const recordKey = getRecordKey(userId, sessionId, dayKey);

    let record = this.records.get(recordKey);
    if (!record) {
      const userCount = this.userRecordCount.get(userId) || 0;
      if (userCount >= this.config.maxRecordsPerUser) {
        logger.warn(`[ConversationStats] User ${userId} record limit reached`);
        return;
      }

      record = {
        userId,
        sessionId,
        dayKey,
        metrics: {
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
          skillInvocations: 0,
          errors: 0,
          tokensInput: 0,
          tokensOutput: 0,
        },
        ts: Date.now(),
      };
      this.records.set(recordKey, record);
      this.userRecordCount.set(userId, userCount + 1);
    }

    record.metrics.skillInvocations++;
    record.ts = Date.now();

    logger.debug(`[ConversationStats] Skill invocation recorded for ${userId}/${sessionId}`);
  }

  /**
   * 记录错误
   */
  recordError(userId: string, sessionId: string): void {
    if (!this.config.enabled) return;

    this.cleanupIfNeeded();

    const dayKey = getDayKey();
    const recordKey = getRecordKey(userId, sessionId, dayKey);

    let record = this.records.get(recordKey);
    if (!record) {
      const userCount = this.userRecordCount.get(userId) || 0;
      if (userCount >= this.config.maxRecordsPerUser) {
        logger.warn(`[ConversationStats] User ${userId} record limit reached`);
        return;
      }

      record = {
        userId,
        sessionId,
        dayKey,
        metrics: {
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
          skillInvocations: 0,
          errors: 0,
          tokensInput: 0,
          tokensOutput: 0,
        },
        ts: Date.now(),
      };
      this.records.set(recordKey, record);
      this.userRecordCount.set(userId, userCount + 1);
    }

    record.metrics.errors++;
    record.ts = Date.now();

    logger.debug(`[ConversationStats] Error recorded for ${userId}/${sessionId}`);
  }

  /**
   * 获取指定日期的统计
   */
  getStatsForDay(dayKey: string): ConversationStatsRecord[] {
    const result: ConversationStatsRecord[] = [];
    for (const [key, record] of this.records) {
      if (record.dayKey === dayKey) {
        result.push({ ...record });
      }
    }
    return result;
  }

  /**
   * 获取今日统计
   */
  getTodayStats(): ConversationStatsRecord[] {
    return this.getStatsForDay(getDayKey());
  }

  /**
   * 获取所有统计（用于上报）
   */
  getAllStats(): ConversationStatsRecord[] {
    return Array.from(this.records.values()).map((r) => ({ ...r }));
  }

  /**
   * 获取汇总统计
   */
  getAggregatedStats(): {
    totalConversations: number;
    totalMessages: number;
    totalSkillInvocations: number;
    totalErrors: number;
    totalTokensInput: number;
    totalTokensOutput: number;
  } {
    let totalConversations = 0;
    let totalMessages = 0;
    let totalSkillInvocations = 0;
    let totalErrors = 0;
    let totalTokensInput = 0;
    let totalTokensOutput = 0;

    for (const record of this.records.values()) {
      totalConversations++;
      totalMessages += record.metrics.totalMessages;
      totalSkillInvocations += record.metrics.skillInvocations;
      totalErrors += record.metrics.errors;
      totalTokensInput += record.metrics.tokensInput;
      totalTokensOutput += record.metrics.tokensOutput;
    }

    return {
      totalConversations,
      totalMessages,
      totalSkillInvocations,
      totalErrors,
      totalTokensInput,
      totalTokensOutput,
    };
  }

  /**
   * 清理已上报的记录
   */
  clearReportedRecords(dayKeys: string[]): void {
    for (const [key, record] of this.records) {
      if (dayKeys.includes(record.dayKey)) {
        this.records.delete(key);
        const userCount = this.userRecordCount.get(record.userId) || 0;
        if (userCount > 0) {
          this.userRecordCount.set(record.userId, userCount - 1);
        }
      }
    }
    logger.info(`[ConversationStats] Cleared records for days: ${dayKeys.join(", ")}`);
  }

  /**
   * 清理过期数据
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    // 每小时清理一次
    if (now - this.lastCleanupTime < 60 * 60 * 1000) {
      return;
    }
    this.lastCleanupTime = now;

    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - this.config.maxDaysRetention);
    const cutoffKey = getDayKey(cutoffDate.getTime());

    let cleanedCount = 0;
    for (const [key, record] of this.records) {
      if (record.dayKey < cutoffKey) {
        this.records.delete(key);
        const userCount = this.userRecordCount.get(record.userId) || 0;
        if (userCount > 0) {
          this.userRecordCount.set(record.userId, userCount - 1);
        }
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`[ConversationStats] Cleaned up ${cleanedCount} old records`);
    }
  }

  /**
   * 获取收集器状态
   */
  getStatus(): {
    enabled: boolean;
    totalRecords: number;
    uniqueUsers: number;
  } {
    return {
      enabled: this.config.enabled,
      totalRecords: this.records.size,
      uniqueUsers: this.userRecordCount.size,
    };
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let globalCollector: ConversationStatsCollector | null = null;

export function initConversationStats(config?: Partial<StatsCollectorConfig>): ConversationStatsCollector {
  globalCollector = new ConversationStatsCollector(config);
  return globalCollector;
}

export function getConversationStats(): ConversationStatsCollector | null {
  return globalCollector;
}

export function recordMessage(
  userId: string,
  sessionId: string,
  type: "user" | "assistant",
  tokensInput?: number,
  tokensOutput?: number
): void {
  globalCollector?.recordMessage(userId, sessionId, type, tokensInput, tokensOutput);
}

export function recordSkillInvocation(userId: string, sessionId: string): void {
  globalCollector?.recordSkillInvocation(userId, sessionId);
}

export function recordError(userId: string, sessionId: string): void {
  globalCollector?.recordError(userId, sessionId);
}

export default ConversationStatsCollector;
