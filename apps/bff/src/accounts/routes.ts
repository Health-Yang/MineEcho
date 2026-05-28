/**
 * Account API Routes
 *
 * REST API endpoints for account management.
 * All routes require authentication via JWT token.
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import { authenticateRequest } from "../auth/service.js";
import { signToken } from "../auth/jwt.js";
import {
  createUserAccount,
  getUserAccounts,
  getAccountWithOwnership,
  updateUserAccount,
  removeAccount,
  validateAccountSwitch,
} from "./service.js";

export const accountsRouter = Router();

// ── Request/Response Types ───────────────────────────────────────────────────

interface CreateAccountRequest {
  name: string;
  type?: "personal" | "team" | "enterprise";
  quota?: number;
}

interface UpdateAccountRequest {
  name?: string;
  type?: "personal" | "team" | "enterprise";
  quota?: number;
}

interface SwitchAccountRequest {
  accountId: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Auth Middleware ───────────────────────────────────────────────────────────

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const authResult = authenticateRequest(authHeader);

  if (!authResult.success || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: authResult.error || "未授权",
    } as ApiResponse);
  }

  req.user = authResult.user;
  req.accountId = authResult.account?.id;
  next();
}

// ── List Accounts ─────────────────────────────────────────────────────────────

/**
 * GET /api/accounts
 * Get all accounts for the authenticated user
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: { accounts: Account[] }
 *   - error: string (if success is false)
 */
accountsRouter.get("/", requireAuth, (req: any, res) => {
  try {
    const result = getUserAccounts(req.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        accounts: result.accounts || [],
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Accounts] GET /api/accounts error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Create Account ─────────────────────────────────────────────────────────────

/**
 * POST /api/accounts
 * Create a new account for the authenticated user
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - name: Account display name (required)
 *   - type: Account type (optional, default: "personal")
 *   - quota: Custom quota (optional)
 *
 * Response:
 *   - success: boolean
 *   - data: { account: Account }
 *   - error: string (if success is false)
 */
accountsRouter.post("/", requireAuth, (req: any, res) => {
  try {
    const { name, type, quota } = req.body as CreateAccountRequest;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "账户名称不能为空",
      } as ApiResponse);
    }

    // Validate type if provided
    if (type && !["personal", "team", "enterprise"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "无效的账户类型",
      } as ApiResponse);
    }

    // Validate quota if provided
    if (quota !== undefined && (typeof quota !== "number" || quota < 0)) {
      return res.status(400).json({
        success: false,
        error: "配额必须为非负数",
      } as ApiResponse);
    }

    const result = createUserAccount(req.user.id, name, type, quota);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Accounts] User ${req.user.email} created account: ${result.account?.name}`);

    res.status(201).json({
      success: true,
      data: {
        account: result.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Accounts] POST /api/accounts error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Get Single Account ─────────────────────────────────────────────────────────

/**
 * GET /api/accounts/:id
 * Get a specific account by ID (ownership verified)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: { account: Account }
 *   - error: string (if success is false)
 */
accountsRouter.get("/:id", requireAuth, (req: any, res) => {
  try {
    const accountId = req.params.id;

    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({
        success: false,
        error: "无效的账户ID",
      } as ApiResponse);
    }

    const result = getAccountWithOwnership(accountId, req.user.id);

    if (!result.success) {
      const statusCode = result.error?.includes("不存在") ? 404 : 403;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        account: result.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Accounts] GET /api/accounts/:id error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Update Account ────────────────────────────────────────────────────────────

/**
 * PATCH /api/accounts/:id
 * Update account details (ownership verified)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - name: New account display name (optional)
 *   - type: New account type (optional)
 *   - quota: New quota (optional)
 *
 * Response:
 *   - success: boolean
 *   - data: { account: Account }
 *   - error: string (if success is false)
 */
accountsRouter.patch("/:id", requireAuth, (req: any, res) => {
  try {
    const accountId = req.params.id;
    const { name, type, quota } = req.body as UpdateAccountRequest;

    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({
        success: false,
        error: "无效的账户ID",
      } as ApiResponse);
    }

    // Validate type if provided
    if (type && !["personal", "team", "enterprise"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "无效的账户类型",
      } as ApiResponse);
    }

    // Validate quota if provided
    if (quota !== undefined && (typeof quota !== "number" || quota < 0)) {
      return res.status(400).json({
        success: false,
        error: "配额必须为非负数",
      } as ApiResponse);
    }

    const result = updateUserAccount(accountId, req.user.id, { name, type, quota });

    if (!result.success) {
      const statusCode = result.error?.includes("不存在") ? 404 :
                        result.error?.includes("无权限") ? 403 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Accounts] User ${req.user.email} updated account: ${accountId}`);

    res.json({
      success: true,
      data: {
        account: result.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Accounts] PATCH /api/accounts/:id error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Delete Account ────────────────────────────────────────────────────────────

/**
 * DELETE /api/accounts/:id
 * Soft-delete an account (ownership verified)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - message: string
 *   - error: string (if success is false)
 */
accountsRouter.delete("/:id", requireAuth, (req: any, res) => {
  try {
    const accountId = req.params.id;

    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({
        success: false,
        error: "无效的账户ID",
      } as ApiResponse);
    }

    const result = removeAccount(accountId, req.user.id);

    if (!result.success) {
      const statusCode = result.error?.includes("不存在") ? 404 :
                        result.error?.includes("无权限") ? 403 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Accounts] User ${req.user.email} deleted account: ${accountId}`);

    res.json({
      success: true,
      data: {
        message: "账户已删除",
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Accounts] DELETE /api/accounts/:id error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Switch Account ────────────────────────────────────────────────────────────

/**
 * POST /api/accounts/switch
 * Switch to a different account and get a new token
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - accountId: Target account ID
 *
 * Response:
 *   - success: boolean
 *   - data: { token, account }
 *   - error: string (if success is false)
 */
accountsRouter.post("/switch", requireAuth, (req: any, res) => {
  try {
    const { accountId } = req.body as SwitchAccountRequest;

    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({
        success: false,
        error: "账户ID不能为空",
      } as ApiResponse);
    }

    const result = validateAccountSwitch(accountId, req.user.id);

    if (!result.success) {
      const statusCode = result.error?.includes("不存在") ? 404 :
                        result.error?.includes("无权限") ? 403 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    // Generate new token with the switched account
    const newToken = signToken({
      userId: req.user.id,
      email: req.user.email,
      accountId: result.account!.id,
    });

    logger.info(`[Accounts] User ${req.user.email} switched to account: ${accountId}`);

    res.json({
      success: true,
      data: {
        token: newToken,
        account: result.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Accounts] POST /api/accounts/switch error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});