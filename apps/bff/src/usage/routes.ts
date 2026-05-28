/**
 * Usage API Routes
 *
 * REST API endpoints for tracking and querying user usage statistics.
 * All endpoints require JWT authentication via Authorization header.
 */

import { Router, Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { authenticateRequest, type AuthResult } from "../auth/service.js";
import { recordUserUsage, getUsageStats, getUsageHistory, getQuotaInfo, type UsageType } from "./service.js";

export const usageRouter = Router();

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RecordUsageRequest {
  accountId: string;
  type: UsageType;
  amount: number;
}

// Extend Express Request to include our custom properties
interface AuthenticatedRequest extends Request {
  user?: AuthResult["user"];
  account?: AuthResult["account"];
}

// ── Auth Middleware ─────────────────────────────────────────────────────────

function requireAuth(req: AuthenticatedRequest, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const authResult = authenticateRequest(authHeader);

  if (!authResult.success || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: authResult.error || "未授权",
    } as ApiResponse);
  }

  // Attach user and account to request
  req.user = authResult.user;
  req.account = authResult.account;
  next();
}

// ── GET /api/usage/stats - Get current usage statistics ─────────────────────

/**
 * GET /api/usage/stats
 * Get current usage statistics for the authenticated user's account
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: UsageStats
 *     - conversations: number (current conversation count)
 *     - tokens: number (current token usage)
 *     - storageMb: number (current storage in MB)
 *     - conversationQuota: number
 *     - tokenQuota: number
 *     - storageQuota: number
 *   - error: string (if success is false)
 */
usageRouter.get("/stats", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountId = req.account?.id;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "账号信息不存在",
      } as ApiResponse);
    }

    const stats = getUsageStats(accountId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "账号不存在",
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: stats,
    } as ApiResponse);
  } catch (err) {
    logger.error("[Usage] GET /stats error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── GET /api/usage/quota - Get quota information ────────────────────────────

/**
 * GET /api/usage/quota
 * Get quota information and usage for the authenticated user's account
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Query params:
 *   - days: number (optional, default 30)
 *
 * Response:
 *   - success: boolean
 *   - data: {
 *       conversationQuota: number
 *       tokenQuota: number
 *       storageQuota: number
 *       usedConversations: number
 *       usedTokens: number
 *       usedStorage: number
 *     }
 */
usageRouter.get("/quota", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountId = req.account?.id;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "账号信息不存在",
      } as ApiResponse);
    }

    const quotaInfo = getQuotaInfo(accountId);

    if (!quotaInfo) {
      return res.status(404).json({
        success: false,
        error: "账号不存在",
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: quotaInfo,
    } as ApiResponse);
  } catch (err) {
    logger.error("[Usage] GET /quota error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── GET /api/usage/history - Get usage history ──────────────────────────────

/**
 * GET /api/usage/history
 * Get historical usage data for the authenticated user's account
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Query params:
 *   - days: number (optional, default 30, max 90)
 *
 * Response:
 *   - success: boolean
 *   - data: DailyUsage[]
 *     Each entry contains:
 *     - date: string (YYYY-MM-DD)
 *     - conversations: number
 *     - tokens: number
 *     - storageMb: number
 */
usageRouter.get("/history", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountId = req.account?.id;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "账号信息不存在",
      } as ApiResponse);
    }

    // Parse and validate days parameter
    let days = parseInt(req.query.days as string, 10) || 30;
    days = Math.min(Math.max(days, 1), 90); // Clamp between 1 and 90

    const history = getUsageHistory(accountId, days);

    res.json({
      success: true,
      data: history,
    } as ApiResponse);
  } catch (err) {
    logger.error("[Usage] GET /history error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── POST /api/usage/record - Record usage (internal use) ───────────────────

/**
 * POST /api/usage/record
 * Record a usage event (internal API for other services)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - accountId: string
 *   - type: "conversation" | "token" | "storage"
 *   - amount: number (default 1)
 *
 * Response:
 *   - success: boolean
 *   - error: string (if success is false)
 */
usageRouter.post("/record", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId, type, amount } = req.body as RecordUsageRequest;

    // Validate required fields
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "accountId 不能为空",
      } as ApiResponse);
    }

    if (!type || !["conversation", "token", "storage"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "type 必须是 conversation, token, 或 storage",
      } as ApiResponse);
    }

    const validAmount = typeof amount === "number" && amount > 0 ? amount : 1;

    const result = recordUserUsage(accountId, type, validAmount);

    if (!result.success) {
      logger.warn(`[Usage] Record failed for account ${accountId}: ${result.error}`);
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        message: "用量已记录",
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Usage] POST /record error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── GET /api/usage/summary - Get usage summary ──────────────────────────────

/**
 * GET /api/usage/summary
 * Get a combined summary of usage stats and quota
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: {
 *       current: UsageStats
 *       quota: QuotaInfo
 *       percentageUsed: {
 *         conversations: number
 *         tokens: number
 *         storage: number
 *       }
 *     }
 */
usageRouter.get("/summary", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountId = req.account?.id;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "账号信息不存在",
      } as ApiResponse);
    }

    const stats = getUsageStats(accountId);
    const quota = getQuotaInfo(accountId);

    if (!stats || !quota) {
      return res.status(404).json({
        success: false,
        error: "账号不存在",
      } as ApiResponse);
    }

    // Calculate percentage used
    const percentageUsed = {
      conversations: stats.conversationQuota > 0
        ? Math.round((stats.conversations / stats.conversationQuota) * 100)
        : 0,
      tokens: stats.tokenQuota > 0
        ? Math.round((stats.tokens / stats.tokenQuota) * 100)
        : 0,
      storage: stats.storageQuota > 0
        ? Math.round((stats.storageMb / stats.storageQuota) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        current: stats,
        quota: quota,
        percentageUsed
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Usage] GET /summary error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});
