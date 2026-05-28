/**
 * 技能使用统计上报服务 - 持久化队列版
 * 收集 L3 技能使用数据并上报到 L2
 * 实现统计闭环：L3采集 → L2聚合 → L1汇总
 */

import { mkdir, readdir, readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";
import { fetchEnterpriseConfig } from "../account/client.js";
import { logger } from "../utils/logger.js";

// 上报队列配置
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 30 * 1000; // 30秒批量上报
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const MAX_QUEUE_SIZE = 1000; // 最大队列大小

// 队列目录
const QUEUE_DIR = join(getMineEchoHome(), ".usage-queue");

// 使用记录接口
export interface SkillUsageRecord {
  userId: string;
  role: string;
  skillId: string;
  action: string;
  tokens?: {
    input: number;
    output: number;
  };
  latency?: number;
  success: boolean;
  metadata?: Record<string, unknown>;
  ts: number;
}

// 内存缓冲区（临时存储，立即写入文件）
const memoryBuffer: SkillUsageRecord[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let isFlushing = false;

/**
 * 确保队列目录存在
 */
async function ensureQueueDir(): Promise<void> {
  try {
    await mkdir(QUEUE_DIR, { recursive: true });
  } catch (error) {
    logger.error("[UsageReporter] Failed to create queue directory:", error);
    throw error;
  }
}

/**
 * 获取队列中的待处理文件数
 */
async function getQueueSize(): Promise<number> {
  try {
    const files = await readdir(QUEUE_DIR);
    return files.filter((f) => f.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

/**
 * 将记录写入队列文件
 */
async function queueToFile(record: SkillUsageRecord): Promise<void> {
  await ensureQueueDir();

  // 检查队列大小，如果超过限制则删除最旧的
  const currentSize = await getQueueSize();
  if (currentSize >= MAX_QUEUE_SIZE) {
    await dropOldestRecord();
  }

  const filename = `${record.ts}_${Math.random().toString(36).substr(2, 9)}.json`;
  const filepath = join(QUEUE_DIR, filename);

  try {
    await writeFile(filepath, JSON.stringify(record, null, 2), "utf8");
  } catch (error) {
    logger.error("[UsageReporter] Failed to write queue file:", error);
    throw error;
  }
}

/**
 * 删除最旧的队列记录
 */
async function dropOldestRecord(): Promise<void> {
  try {
    const files = await readdir(QUEUE_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

    if (jsonFiles.length === 0) return;

    const oldestFile = join(QUEUE_DIR, jsonFiles[0]);
    await unlink(oldestFile);
    logger.warn("[UsageReporter] Dropped oldest record:", jsonFiles[0]);
  } catch (error) {
    logger.error("[UsageReporter] Failed to drop oldest record:", error);
  }
}

/**
 * 读取队列文件
 */
async function readQueueFile(filepath: string): Promise<SkillUsageRecord | null> {
  try {
    const content = await readFile(filepath, "utf8");
    return JSON.parse(content) as SkillUsageRecord;
  } catch (error) {
    logger.error("[UsageReporter] Failed to read queue file:", filepath, error);
    return null;
  }
}

/**
 * 删除已上报的文件
 */
async function deleteReportedFiles(filePaths: string[]): Promise<void> {
  for (const filepath of filePaths) {
    try {
      await unlink(filepath);
    } catch (error) {
      logger.error("[UsageReporter] Failed to delete reported file:", filepath, error);
    }
  }
}

/**
 * 添加上报记录到队列
 */
export function reportSkillUsage(record: Omit<SkillUsageRecord, "ts">): void {
  const fullRecord: SkillUsageRecord = {
    ...record,
    ts: Date.now()
  };

  // 立即写入文件队列（持久化）
  queueToFile(fullRecord).catch((error) => {
    logger.error("[UsageReporter] Failed to queue record:", error);
    // 写入失败时放入内存缓冲区作为降级
    memoryBuffer.push(fullRecord);
  });

  // 启动定时上报（如果未启动）
  startFlushTimer();
}

/**
 * 启动定时上报
 */
function startFlushTimer(): void {
  if (flushTimer) return;

  flushTimer = setInterval(async () => {
    try {
      await flushUsageReports();
    } catch (error) {
      logger.error("[UsageReporter] Flush timer error:", { error });
      // 不中断定时器，继续下次执行
    }
  }, FLUSH_INTERVAL_MS);

  // 进程退出时清理
  process.on("SIGTERM", () => {
    stopFlushTimer();
    logger.info("[UsageReporter] Interval cleared on SIGTERM");
  });
}

/**
 * 停止定时上报
 */
export function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/**
 * 上报单个技能调用（简化接口）
 */
export function recordSkillCall(params: {
  userId?: string;
  role?: string;
  skillId: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs?: number;
  success: boolean;
  metadata?: {
    parameters?: Record<string, unknown>;
    errorMessage?: string;
    retryCount?: number;
  } & Record<string, unknown>;
}): void {
  reportSkillUsage({
    userId: params.userId || "anonymous",
    role: params.role || "default",
    skillId: params.skillId,
    action: "call",
    tokens: {
      input: params.tokensInput || 0,
      output: params.tokensOutput || 0
    },
    latency: params.latencyMs || 0,
    success: params.success,
    metadata: params.metadata || {}
  });
}

/**
 * 批量上报使用记录到 L2
 */
async function sendUsageReportsToL2(
  records: SkillUsageRecord[],
  attempt = 1
): Promise<{ success: boolean; failed: number }> {
  try {
    const config = await fetchEnterpriseConfig();
    if (!config.enabled || !config.storeUrl) {
      logger.info("[UsageReporter] Enterprise mode not configured, skipping report");
      return { success: false, failed: records.length };
    }

    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (config.userToken) {
      baseHeaders["X-User-Token"] = config.userToken;
    }
    if (config.userId) {
      baseHeaders["X-User-Id"] = config.userId;
    }

    const baseUrl = config.storeUrl.replace(/\/$/, "");
    const userIdParam = config.userId ? `?userId=${encodeURIComponent(config.userId)}` : "";
    const batchUrl = `${baseUrl}/api/terminal/usage/batch${userIdParam}`;

    // 先尝试批量端点
    try {
      const response = await fetch(batchUrl, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ records }),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        return { success: true, failed: 0 };
      }

      // 如果端点不存在（404/405），回退到逐条发送
      if (response.status === 404 || response.status === 405) {
        logger.warn("[UsageReporter] Batch endpoint not available, falling back to individual usage API");
        throw new Error("batch_not_supported");
      }

      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (
        msg.includes("batch_not_supported") ||
        msg.includes("Cannot POST") ||
        msg.includes("Cannot fetch") && msg.includes("batch")
      ) {
        // 逐条发送回退
        let failedCount = 0;
        for (const record of records) {
          try {
            const singleUrl = `${baseUrl}/api/terminal/usage${userIdParam}`;
            const singleRes = await fetch(singleUrl, {
              method: "POST",
              headers: baseHeaders,
              body: JSON.stringify(record),
              signal: AbortSignal.timeout(30000)
            });
            if (!singleRes.ok) {
              logger.warn(`[UsageReporter] Individual report failed: HTTP ${singleRes.status}`);
              failedCount++;
            }
          } catch (singleErr) {
            logger.warn("[UsageReporter] Individual report failed:", { error: (singleErr as Error).message });
            failedCount++;
          }
        }
        return { success: failedCount === 0, failed: failedCount };
      }
      throw err;
    }
  } catch (error) {
    logger.error("[UsageReporter] Failed to send reports:", { error: (error as Error).message });

    if (attempt < MAX_RETRY_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return sendUsageReportsToL2(records, attempt + 1);
    }

    return { success: false, failed: records.length };
  }
}

/**
 * 立即上报队列中的所有记录
 */
export async function flushUsageReports(): Promise<{ sent: number; failed: number }> {
  if (isFlushing) {
    return { sent: 0, failed: 0 };
  }

  isFlushing = true;

  try {
    // 获取待处理文件
    const files = await readdir(QUEUE_DIR).catch(() => []);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

    if (jsonFiles.length === 0 && memoryBuffer.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // 读取文件队列
    const records: SkillUsageRecord[] = [];
    const filePaths: string[] = [];

    for (const file of jsonFiles.slice(0, BATCH_SIZE)) {
      const filepath = join(QUEUE_DIR, file);
      const record = await readQueueFile(filepath);
      if (record) {
        records.push(record);
        filePaths.push(filepath);
      }
    }

    // 加上内存缓冲区中的记录
    while (records.length < BATCH_SIZE && memoryBuffer.length > 0) {
      records.push(memoryBuffer.shift()!);
    }

    if (records.length === 0) {
      return { sent: 0, failed: 0 };
    }

    logger.debug(`[UsageReporter] Flushing ${records.length} records...`);

    const result = await sendUsageReportsToL2(records);

    if (result.success) {
      // 删除已上报的文件
      await deleteReportedFiles(filePaths);
      logger.info(`[UsageReporter] Successfully sent ${records.length} usage records`);
      return { sent: records.length, failed: 0 };
    } else {
      // 上报失败，记录错误但不删除文件（下次重试）
      logger.warn(`[UsageReporter] Failed to send ${records.length} records, will retry`);
      return { sent: 0, failed: records.length };
    }
  } catch (error) {
    logger.error("[UsageReporter] Flush failed:", { error });
    return { sent: 0, failed: 0 };
  } finally {
    isFlushing = false;
  }
}

/**
 * 读取本地队列中的所有使用记录（用于技能分析）
 */
export async function getLocalUsageRecords(): Promise<SkillUsageRecord[]> {
  try {
    const files = await readdir(QUEUE_DIR).catch(() => []);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const records: SkillUsageRecord[] = [];

    for (const file of jsonFiles) {
      const record = await readQueueFile(join(QUEUE_DIR, file));
      if (record) {
        records.push(record);
      }
    }

    // Include memory buffer records
    records.push(...memoryBuffer);
    return records;
  } catch (error) {
    logger.error("[UsageReporter] Failed to read local usage records:", { error });
    return [];
  }
}

/**
 * 获取当前队列状态（用于监控）
 */
export async function getUsageReporterStatus(): Promise<{
  queueSize: number;
  memoryBufferSize: number;
  isFlushing: boolean;
  flushIntervalMs: number;
  batchSize: number;
}> {
  return {
    queueSize: await getQueueSize(),
    memoryBufferSize: memoryBuffer.length,
    isFlushing,
    flushIntervalMs: FLUSH_INTERVAL_MS,
    batchSize: BATCH_SIZE
  };
}

/**
 * 启动上报服务
 */
export async function startUsageReporter(): Promise<void> {
  // 启动时尝试上报遗留数据
  if (existsSync(QUEUE_DIR)) {
    const queueSize = await getQueueSize();
    if (queueSize > 0) {
      logger.info(`[UsageReporter] Found ${queueSize} pending records from previous run`);
    }
  }

  startFlushTimer();
  logger.info("[UsageReporter] Started with persistent queue", {
    interval: FLUSH_INTERVAL_MS,
    queueDir: QUEUE_DIR
  });
}

/**
 * 停止上报服务
 */
export async function stopUsageReporter(): Promise<void> {
  stopFlushTimer();

  // 尝试发送剩余记录
  await flushUsageReports();
}

// 进程退出时尝试发送剩余记录
process.on("beforeExit", async () => {
  await stopUsageReporter();
});
