/**
 * L3 心跳服务
 * 定期向 L2 发送心跳，支持在线用户/终端统计
 */

import { fetchEnterpriseConfig } from "../account/client.js";
import { logger } from "../utils/logger.js";

// 心跳配置
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5分钟
const HEARTBEAT_TIMEOUT_MS = 10000; // 10秒超时

// 定时器
let heartbeatTimer: NodeJS.Timeout | null = null;
let isRunning = false;

// 当前终端状态
interface TerminalStatus {
  userId: string;
  version?: string;
  platform?: string;
  activeSessions: number;
  lastActivity: number;
}

let currentStatus: TerminalStatus | null = null;

/**
 * 发送心跳到 L2
 */
async function sendHeartbeat(): Promise<void> {
  try {
    const config = await fetchEnterpriseConfig();
    if (!config.enabled || !config.storeUrl) {
      logger.debug("[Heartbeat] Enterprise mode not configured, skipping");
      return;
    }

    if (!currentStatus) {
      logger.debug("[Heartbeat] No status to report");
      return;
    }

    const url = `${config.storeUrl.replace(/\/$/, "")}/api/terminal/heartbeat`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    const payload = {
      terminalId: `terminal-${currentStatus.userId}`,
      userId: currentStatus.userId,
      version: currentStatus.version || "1.0.0",
      platform: currentStatus.platform || "web",
      status: "online",
      metrics: {
        activeSessions: currentStatus.activeSessions,
        lastActivity: currentStatus.lastActivity
      },
      timestamp: Date.now()
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    logger.debug("[Heartbeat] Sent successfully", { userId: currentStatus.userId });
  } catch (error) {
    logger.warn("[Heartbeat] Failed to send:", error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 启动心跳定时器
 */
function startHeartbeatTimer(): void {
  if (heartbeatTimer) return;

  // 立即发送一次
  sendHeartbeat();

  // 定时发送
  heartbeatTimer = setInterval(() => {
    sendHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);

  logger.info("[Heartbeat] Timer started", { interval: HEARTBEAT_INTERVAL_MS });
}

/**
 * 停止心跳定时器
 */
export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  isRunning = false;
  logger.info("[Heartbeat] Stopped");
}

/**
 * 启动心跳服务
 */
export function startHeartbeat(userId: string, options?: { version?: string; platform?: string }): void {
  if (isRunning) return;

  currentStatus = {
    userId,
    version: options?.version || "1.0.0",
    platform: options?.platform || "web",
    activeSessions: 0,
    lastActivity: Date.now()
  };

  isRunning = true;
  startHeartbeatTimer();

  // 进程退出时清理
  process.on("SIGTERM", () => {
    stopHeartbeat();
  });
}

/**
 * 更新心跳状态
 */
export function updateHeartbeatStatus(updates: Partial<TerminalStatus>): void {
  if (!currentStatus) return;

  currentStatus = {
    ...currentStatus,
    ...updates,
    lastActivity: Date.now()
  };
}

/**
 * 记录用户活动
 */
export function recordActivity(sessionCount?: number): void {
  if (!currentStatus) return;

  currentStatus.lastActivity = Date.now();
  if (sessionCount !== undefined) {
    currentStatus.activeSessions = sessionCount;
  }
}

/**
 * 获取心跳服务状态
 */
export function getHeartbeatStatus(): {
  isRunning: boolean;
  intervalMs: number;
  currentUser?: string;
} {
  return {
    isRunning,
    intervalMs: HEARTBEAT_INTERVAL_MS,
    currentUser: currentStatus?.userId
  };
}

// 进程退出时发送最后一次心跳
process.on("beforeExit", async () => {
  if (isRunning && currentStatus) {
    try {
      await sendHeartbeat();
    } catch {
      // 忽略错误
    }
  }
});
