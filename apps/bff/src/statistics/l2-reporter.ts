/**
 * L2 Statistics Reporter
 * 负责将 L3 层对话统计数据批量上报到 L2 Store
 */

import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import type { ConversationStatsRecord } from "./conversation-stats.js";

// ============================================================================
// 类型定义
// ============================================================================

export interface ReporterConfig {
  enabled: boolean;
  l2StoreUrl: string;
  apiKey?: string;
  userId?: string;
  userToken?: string;
  flushIntervalMs: number;
  batchSize: number;
  maxRetries: number;
  queueDir: string;
  maxQueueSize: number;
  requestTimeoutMs: number;
}

export interface L2ReportPayload {
  records: {
    userId: string;
    sessionId: string;
    dayKey: string;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    skillInvocations: number;
    errors: number;
    tokensInput: number;
    tokensOutput: number;
  }[];
}

export interface L2ReportResponse {
  success: boolean;
  inserted?: number;
  updated?: number;
  total?: number;
  errors?: string[];
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: Partial<ReporterConfig> = {
  flushIntervalMs: 5 * 60 * 1000, // 5分钟
  batchSize: 50,
  maxRetries: 3,
  queueDir: "/tmp/stats-queue",
  maxQueueSize: 1000,
  requestTimeoutMs: 30000,
};

// ============================================================================
// L2 统计上报器
// ============================================================================

export class L2StatisticsReporter {
  private config: ReporterConfig;
  private queueDir: string;
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private consecutiveFailures = 0;
  private lastFlushTime = 0;

  constructor(config: Partial<ReporterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as ReporterConfig;
    this.queueDir = this.config.queueDir || "/tmp/stats-queue";

    if (!this.config.enabled) {
      logger.info("[L2Reporter] Reporter is disabled");
    }
  }

  /**
   * 启动上报器
   */
  async start(): Promise<void> {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;
    await this.ensureQueueDir();
    this.scheduleNextFlush();

    logger.info("[L2Reporter] Started", {
      l2StoreUrl: this.config.l2StoreUrl,
      flushIntervalMs: this.config.flushIntervalMs,
      batchSize: this.config.batchSize,
    });

    // 启动时尝试上报遗留数据
    this.flush().catch((err) => {
      logger.error("[L2Reporter] Initial flush failed:", err);
    });
  }

  /**
   * 停止上报器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    logger.info("[L2Reporter] Stopped");
  }

  /**
   * 添加记录到上报队列
   */
  async queueRecords(records: ConversationStatsRecord[]): Promise<number> {
    if (!this.config.enabled || records.length === 0) {
      return 0;
    }

    let successCount = 0;

    for (const record of records) {
      try {
        // 检查队列长度
        const queueSize = await this.getQueueSize();
        if (queueSize >= this.config.maxQueueSize) {
          logger.warn("[L2Reporter] Queue is full, dropping oldest record");
          await this.dropOldestRecord();
        }

        // 写入队列文件
        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
        const filepath = join(this.queueDir, filename);

        // 转换记录格式
        const queueRecord = {
          userId: record.userId,
          sessionId: record.sessionId,
          dayKey: record.dayKey,
          totalMessages: record.metrics.totalMessages,
          userMessages: record.metrics.userMessages,
          assistantMessages: record.metrics.assistantMessages,
          skillInvocations: record.metrics.skillInvocations,
          errors: record.metrics.errors,
          tokensInput: record.metrics.tokensInput,
          tokensOutput: record.metrics.tokensOutput,
        };

        await writeFile(filepath, JSON.stringify(queueRecord, null, 2), "utf8");
        successCount++;
      } catch (error) {
        logger.error("[L2Reporter] Failed to queue record:", error);
      }
    }

    logger.debug(`[L2Reporter] Queued ${successCount}/${records.length} records`);
    return successCount;
  }

  /**
   * 获取队列大小
   */
  async getQueueSize(): Promise<number> {
    try {
      const files = await readdir(this.queueDir);
      return files.filter((f) => f.endsWith(".json")).length;
    } catch {
      return 0;
    }
  }

  /**
   * 执行上报
   */
  async flush(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // 先从 conversation-stats 收集数据到队列
      await this.collectFromConversationStats();

      // 获取待上报文件
      const files = await this.getPendingFiles();
      if (files.length === 0) {
        logger.debug("[L2Reporter] No records to flush");
        this.scheduleNextFlush();
        return;
      }

      logger.info(`[L2Reporter] Flushing ${files.length} records...`);

      // 批量读取
      const records: L2ReportPayload["records"] = [];
      const filePaths: string[] = [];

      for (const file of files.slice(0, this.config.batchSize)) {
        const filepath = join(this.queueDir, file);
        const record = await this.readRecordFile(filepath);

        if (record) {
          records.push(record);
          filePaths.push(filepath);
        }
      }

      if (records.length === 0) {
        this.scheduleNextFlush();
        return;
      }

      // 发送请求
      const payload: L2ReportPayload = { records };
      const success = await this.sendWithRetry(payload);

      if (success) {
        // 删除已上报的文件
        await this.deleteReportedFiles(filePaths);
        this.consecutiveFailures = 0;
        this.lastFlushTime = Date.now();
        logger.info(`[L2Reporter] Successfully flushed ${records.length} records`);
      }
    } catch (error) {
      logger.error("[L2Reporter] Flush failed:", error);
      this.consecutiveFailures++;
    }

    this.scheduleNextFlush();
  }

  /**
   * 发送数据到 L2（带重试）
   */
  private async sendWithRetry(payload: L2ReportPayload): Promise<boolean> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.sendToL2(payload);
        return true;
      } catch (error) {
        const isLastAttempt = attempt === this.config.maxRetries;

        if (isLastAttempt) {
          logger.error(`[L2Reporter] All ${this.config.maxRetries} retries exhausted`);
          return false;
        }

        // 指数退避
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        logger.warn(`[L2Reporter] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await this.sleep(delayMs);
      }
    }

    return false;
  }

  /**
   * 发送数据到 L2 Store
   */
  private async sendToL2(payload: L2ReportPayload): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.userToken) {
        headers["X-User-Token"] = this.config.userToken;
      }
      if (this.config.userId) {
        headers["X-User-Id"] = this.config.userId;
      }
      // Fallback to API Key if no userToken (backward compatibility)
      if (this.config.apiKey && !this.config.userToken) {
        headers["X-API-Key"] = this.config.apiKey;
      }

      const userIdParam = this.config.userId ? `?userId=${encodeURIComponent(this.config.userId)}` : "";
      const response = await fetch(`${this.config.l2StoreUrl}/api/terminal/conversation-stats${userIdParam}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: L2ReportResponse = await response.json();

      if (!result.success) {
        throw new Error(`L2 reported failure: ${JSON.stringify(result.errors)}`);
      }
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private async ensureQueueDir(): Promise<void> {
    try {
      await mkdir(this.queueDir, { recursive: true });
    } catch (error) {
      logger.error("[L2Reporter] Failed to create queue directory:", error);
      throw error;
    }
  }

  private async getPendingFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.queueDir);
      return files.filter((f) => f.endsWith(".json")).sort();
    } catch {
      return [];
    }
  }

  private async readRecordFile(filepath: string): Promise<L2ReportPayload["records"][0] | null> {
    try {
      const content = await readFile(filepath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      logger.error("[L2Reporter] Failed to read record file:", filepath, error);
      return null;
    }
  }

  private async deleteReportedFiles(filePaths: string[]): Promise<void> {
    for (const filepath of filePaths) {
      try {
        await unlink(filepath);
      } catch (error) {
        logger.error("[L2Reporter] Failed to delete reported file:", filepath, error);
      }
    }
  }

  private async dropOldestRecord(): Promise<void> {
    try {
      const files = await this.getPendingFiles();
      if (files.length === 0) return;

      const oldestFile = join(this.queueDir, files[0]);
      await unlink(oldestFile);
      logger.warn("[L2Reporter] Dropped oldest record:", oldestFile);
    } catch (error) {
      logger.error("[L2Reporter] Failed to drop oldest record:", error);
    }
  }

  /**
   * 从 conversation-stats 收集数据到队列
   */
  private async collectFromConversationStats(): Promise<void> {
    try {
      const { getConversationStats } = await import("./conversation-stats.js");
      const collector = getConversationStats();
      if (!collector) return;

      const records = collector.getAllStats();
      if (records.length === 0) return;

      // 转换为队列记录格式并写入队列
      for (const record of records) {
        const queueRecord = {
          userId: record.userId,
          sessionId: record.sessionId,
          dayKey: record.dayKey,
          totalMessages: record.metrics.totalMessages,
          userMessages: record.metrics.userMessages,
          assistantMessages: record.metrics.assistantMessages,
          skillInvocations: record.metrics.skillInvocations,
          errors: record.metrics.errors,
          tokensInput: record.metrics.tokensInput,
          tokensOutput: record.metrics.tokensOutput,
        };

        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
        const filepath = join(this.queueDir, filename);
        await writeFile(filepath, JSON.stringify(queueRecord, null, 2), "utf8");
      }

      // 清空已上报的记录
      const dayKeys = [...new Set(records.map(r => r.dayKey))];
      collector.clearReportedRecords(dayKeys);

      logger.info(`[L2Reporter] Collected ${records.length} records from conversation stats`);
    } catch (error) {
      logger.error("[L2Reporter] Failed to collect from conversation stats:", error);
    }
  }

  private scheduleNextFlush(): void {
    if (!this.isRunning) return;

    // 根据连续失败次数调整间隔
    let interval = this.config.flushIntervalMs;
    if (this.consecutiveFailures > 0) {
      interval = Math.min(interval * Math.pow(1.5, this.consecutiveFailures), 300000);
    }

    this.timer = setTimeout(() => {
      this.flush().catch((err) => {
        logger.error("[L2Reporter] Scheduled flush failed:", err);
      });
    }, interval);

    logger.debug(`[L2Reporter] Next flush scheduled in ${interval}ms`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取上报器状态
   */
  getStatus(): {
    enabled: boolean;
    isRunning: boolean;
    queueSize: Promise<number>;
    consecutiveFailures: number;
    lastFlushTime: number;
  } {
    return {
      enabled: this.config.enabled,
      isRunning: this.isRunning,
      queueSize: this.getQueueSize(),
      consecutiveFailures: this.consecutiveFailures,
      lastFlushTime: this.lastFlushTime,
    };
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let globalReporter: L2StatisticsReporter | null = null;

export function initL2Reporter(config: Partial<ReporterConfig>): L2StatisticsReporter {
  globalReporter = new L2StatisticsReporter(config);
  return globalReporter;
}

export function getL2Reporter(): L2StatisticsReporter | null {
  return globalReporter;
}

export default L2StatisticsReporter;
