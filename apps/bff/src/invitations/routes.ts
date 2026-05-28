/**
 * Invitation API Routes
 *
 * REST API endpoints for invitation code management.
 * All routes require authentication via JWT token.
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import { authenticateRequest } from "../auth/service.js";
import {
  createInvite,
  validateInvite,
  getUserInvitations,
  revokeInvitation,
  useInvitation,
} from "./service.js";

export const invitationsRouter = Router();

// ── Request/Response Types ───────────────────────────────────────────────────

interface CreateInviteRequest {
  type?: "trial" | "subscription" | "admin";
  expiresInDays?: number;
  quota?: number;
  maxUses?: number;
}

interface ValidateInviteRequest {
  code: string;
}

interface UseInviteRequest {
  code: string;
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
  next();
}

// ── List Invitations ─────────────────────────────────────────────────────────

/**
 * GET /api/invitations
 * Get all invitations created by the authenticated user
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: { invitations: Invitation[] }
 *   - error: string (if success is false)
 */
invitationsRouter.get("/", requireAuth, (req: any, res) => {
  try {
    const result = getUserInvitations(req.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    // Format invitations for client
    const invitations = (result.invitations || []).map(inv => ({
      id: inv.id,
      code: inv.code,
      type: inv.type,
      quota: inv.quota,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      usedAt: inv.usedAt,
      usedBy: inv.usedBy,
    }));

    res.json({
      success: true,
      data: {
        invitations,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Invitations] GET /api/invitations error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Create Invitation ─────────────────────────────────────────────────────────

/**
 * POST /api/invitations
 * Create a new invitation code (admin only for subscription/admin type)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - type: Invitation type (optional, default: "trial")
 *   - expiresInDays: Days until expiration (optional, default: 7)
 *   - quota: Custom quota (optional)
 *
 * Response:
 *   - success: boolean
 *   - data: { invitation: Invitation }
 *   - error: string (if success is false)
 */
invitationsRouter.post("/", requireAuth, (req: any, res) => {
  try {
    const { type, expiresInDays, quota, maxUses } = req.body as CreateInviteRequest;

    // Validate type
    if (type && !["trial", "subscription", "admin"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "无效的邀请码类型",
      } as ApiResponse);
    }

    // Validate expiresInDays
    if (expiresInDays !== undefined) {
      if (typeof expiresInDays !== "number" || expiresInDays < 1 || expiresInDays > 365) {
        return res.status(400).json({
          success: false,
          error: "有效期必须在1-365天之间",
        } as ApiResponse);
      }
    }

    // Validate quota
    if (quota !== undefined) {
      if (typeof quota !== "number" || quota < 0) {
        return res.status(400).json({
          success: false,
          error: "配额必须为非负数",
        } as ApiResponse);
      }
    }

    // Validate maxUses
    if (maxUses !== undefined) {
      if (typeof maxUses !== "number" || maxUses < 1 || maxUses > 1000) {
        return res.status(400).json({
          success: false,
          error: "使用次数必须在1-1000之间",
        } as ApiResponse);
      }
    }

    const result = createInvite(
      req.user.id,
      type || "trial",
      expiresInDays || 7,
      quota,
      maxUses || 1
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Invitations] User ${req.user.email} created invitation: ${result.invitation?.code}`);

    res.status(201).json({
      success: true,
      data: {
        invitation: {
          id: result.invitation!.id,
          code: result.invitation!.code,
          type: result.invitation!.type,
          quota: result.invitation!.quota,
          status: result.invitation!.status,
          expiresAt: result.invitation!.expiresAt,
          createdAt: result.invitation!.createdAt,
          maxUses: result.invitation!.maxUses,
          useCount: result.invitation!.useCount,
        },
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Invitations] POST /api/invitations error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Validate Invitation ───────────────────────────────────────────────────────

/**
 * POST /api/invitations/validate
 * Validate an invitation code
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - code: Invitation code to validate
 *
 * Response:
 *   - success: boolean
 *   - data: { valid, invitation }
 *   - error: string (if success is false)
 */
invitationsRouter.post("/validate", requireAuth, (req: any, res) => {
  try {
    const { code } = req.body as ValidateInviteRequest;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "邀请码不能为空",
      } as ApiResponse);
    }

    const result = validateInvite(code);

    res.json({
      success: true,
      data: {
        valid: result.valid,
        invitation: result.valid ? {
          id: result.invitation!.id,
          code: result.invitation!.code,
          type: result.invitation!.type,
          quota: result.invitation!.quota,
          expiresAt: result.invitation!.expiresAt,
        } : undefined,
        error: result.valid ? undefined : result.error,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Invitations] POST /api/invitations/validate error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Use Invitation ────────────────────────────────────────────────────────────

/**
 * POST /api/invitations/use
 * Use an invitation code (mark as used by current user)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Body:
 *   - code: Invitation code to use
 *
 * Response:
 *   - success: boolean
 *   - data: { quota, invitation }
 *   - error: string (if success is false)
 */
invitationsRouter.post("/use", requireAuth, (req: any, res) => {
  try {
    const { code } = req.body as UseInviteRequest;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "邀请码不能为空",
      } as ApiResponse);
    }

    const result = useInvitation(code.trim().toUpperCase(), req.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Invitations] User ${req.user.email} used invitation code`);

    res.json({
      success: true,
      data: {
        quota: result.quota,
        message: "邀请码使用成功",
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Invitations] POST /api/invitations/use error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Revoke Invitation ─────────────────────────────────────────────────────────

/**
 * POST /api/invitations/:code/revoke
 * Revoke an invitation code (owner only)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - message: string
 *   - error: string (if success is false)
 */
invitationsRouter.post("/:code/revoke", requireAuth, (req: any, res) => {
  try {
    const code = req.params.code;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "无效的邀请码",
      } as ApiResponse);
    }

    const result = revokeInvitation(code.trim().toUpperCase(), req.user.id);

    if (!result.success) {
      const statusCode = result.error?.includes("不存在") ? 404 :
                        result.error?.includes("无权限") ? 403 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Invitations] User ${req.user.email} revoked invitation: ${code}`);

    res.json({
      success: true,
      data: {
        message: "邀请码已撤销",
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Invitations] POST /api/invitations/:code/revoke error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});