/**
 * Risk Detection Service
 * 异步风险检测服务 - 不阻塞主流程的并行检测
 */

import { detectRisk, isSolutionDesignDiscussion } from "./detector.js";
import { generateRiskAlert, formatRiskAlertConcise } from "./alert-generator.js";
import { logger } from "../utils/logger.js";
import { LRUCache } from "../utils/lru-cache.js";
import type { RiskAlert, RiskDetectionResult } from "./types.js";

// 功能开关：默认开启，可通过 RISK_ALERT_ENABLED=false 关闭
const RISK_ALERT_ENABLED = process.env.RISK_ALERT_ENABLED !== "false";

// 检测缓存上限配置
const MAX_DETECTION_CACHE_SIZE = parseInt(process.env.MAX_DETECTION_CACHE_SIZE || "1000", 10);

// 检测结果缓存（用于去重）- 使用LRU缓存限制上限
const detectionCache = new LRUCache<string, { result: RiskDetectionResult; timestamp: number }>({
  maxSize: MAX_DETECTION_CACHE_SIZE,
  name: "RiskDetectionCache",
  logEviction: true,
});
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

// 会话级提醒计数器
const sessionAlertCount = new Map<string, number>();
const MAX_ALERTS_PER_SESSION = 3;

/**
 * 异步风险检测选项
 */
export interface RiskDetectionOptions {
  userId: string;
  sessionId: string;
  message: string;
  messageId?: string;
  enableAlert?: boolean;
  maxAlertsPerSession?: number;
}

/**
 * 风险检测任务结果
 */
export interface RiskDetectionTaskResult {
  detected: boolean;
  alert?: RiskAlert;
  detectionResult?: RiskDetectionResult;
  error?: string;
}

/**
 * 执行异步风险检测
 * 此函数立即返回，检测在后台执行
 * 如果功能开关未启用，直接返回未检测结果
 */
export function detectRiskAsync(
  options: RiskDetectionOptions,
  onAlert?: (alert: RiskAlert) => void
): Promise<RiskDetectionTaskResult> {
  // 功能开关检查：如果未启用，直接返回不检测
  if (!RISK_ALERT_ENABLED) {
    return Promise.resolve({ detected: false });
  }

  return new Promise((resolve) => {
    // 使用 setImmediate 确保不阻塞主流程
    setImmediate(async () => {
      try {
        const result = await performDetection(options, onAlert);
        resolve(result);
      } catch (error) {
        logger.error("[RiskDetection] Async detection failed:", { error, options });
        resolve({
          detected: false,
          error: (error as Error).message,
        });
      }
    });
  });
}

/**
 * 执行实际检测
 */
async function performDetection(
  options: RiskDetectionOptions,
  onAlert?: (alert: RiskAlert) => void
): Promise<RiskDetectionTaskResult> {
  const { userId, sessionId, message, enableAlert = true } = options;

  // 检查缓存
  const cacheKey = `${userId}:${sessionId}:${message.slice(0, 100)}`;
  const cached = detectionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug("[RiskDetection] Using cached result:", { cacheKey });
    return {
      detected: cached.result.detected,
      detectionResult: cached.result,
    };
  }

  // 执行检测
  const detectionResult = detectRisk(message);

  // 缓存结果
  detectionCache.set(cacheKey, { result: detectionResult, timestamp: Date.now() });

  // 清理过期缓存
  cleanupCache();

  if (!detectionResult.detected || !detectionResult.category) {
    return { detected: false, detectionResult };
  }

  // 检查会话提醒次数限制
  const currentCount = sessionAlertCount.get(sessionId) || 0;
  const maxAlerts = options.maxAlertsPerSession || MAX_ALERTS_PER_SESSION;

  if (currentCount >= maxAlerts) {
    logger.debug("[RiskDetection] Session alert limit reached:", { sessionId, currentCount });
    return { detected: true, detectionResult };
  }

  // 生成提醒
  if (enableAlert) {
    const alert = await generateRiskAlert(
      userId,
      sessionId,
      detectionResult.category,
      detectionResult.confidence,
      detectionResult.matchedKeywords,
      detectionResult.context
    );

    if (alert) {
      // 更新会话计数
      sessionAlertCount.set(sessionId, currentCount + 1);

      // 回调通知
      if (onAlert) {
        onAlert(alert);
      }

      return { detected: true, alert, detectionResult };
    }
  }

  return { detected: true, detectionResult };
}

/**
 * 批量检测多条消息（用于历史记录分析）
 */
export async function detectRisksInHistory(
  userId: string,
  messages: Array<{ content: string; timestamp: number }>
): Promise<RiskDetectionResult[]> {
  const results: RiskDetectionResult[] = [];

  for (const message of messages) {
    const result = detectRisk(message.content);
    if (result.detected) {
      results.push(result);
    }
  }

  return results;
}

/**
 * 检测是否为方案设计场景
 */
export function detectSolutionDesignScenario(message: string): boolean {
  return isSolutionDesignDiscussion(message);
}

/**
 * 获取格式化的风险提醒文本（用于插入到回复中）
 */
export function getFormattedRiskAlert(alert: RiskAlert): string {
  return formatRiskAlertConcise(alert);
}

/**
 * 重置会话提醒计数
 */
export function resetSessionAlertCount(sessionId: string): void {
  sessionAlertCount.delete(sessionId);
}

/**
 * 获取会话提醒计数
 */
export function getSessionAlertCount(sessionId: string): number {
  return sessionAlertCount.get(sessionId) || 0;
}

/**
 * 清理过期缓存
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of detectionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      detectionCache.delete(key);
    }
  }
}

/**
 * 获取检测统计信息
 */
export function getDetectionStats(): {
  cacheSize: number;
  sessionCount: number;
} {
  return {
    cacheSize: detectionCache.size,
    sessionCount: sessionAlertCount.size,
  };
}

/**
 * 风险检测中间件（用于 Express）
 * 在请求处理链中异步执行检测，不阻塞响应
 */
export function riskDetectionMiddleware() {
  return async (req: any, res: any, next: any) => {
    // 功能开关检查
    if (!RISK_ALERT_ENABLED) {
      return next();
    }

    // 只处理 chat 相关的 POST 请求
    if (req.method !== "POST" || !req.path?.includes("/chat/")) {
      return next();
    }

    const content = req.body?.content;
    const userId = req.headers["x-user-id"] || "default-user";
    const sessionId = req.body?.sessionId || "main";

    if (!content) {
      return next();
    }

    // 将检测任务附加到请求对象，供后续使用
    req.riskDetection = detectRiskAsync(
      {
        userId,
        sessionId,
        message: content,
        enableAlert: false, // 中间件模式不直接生成提醒
      },
      undefined
    );

    next();
  };
}

/**
 * 检查风险提醒功能是否启用
 */
export function isRiskAlertEnabled(): boolean {
  return RISK_ALERT_ENABLED;
}
