/**
 * Authentication API Routes
 *
 * REST API endpoints for user registration, login, logout, and profile management.
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import { register, login, getCurrentUser, authenticateRequest } from "./service.js";
import { signToken } from "./jwt.js";

export const authRouter = Router();

// ── Request/Response Types ───────────────────────────────────────────────────

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  invitationCode?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new user account
 *
 * Body:
 *   - email: User email address
 *   - password: User password (min 8 characters)
 *   - name: User display name
 *   - invitationCode: Optional invitation code for quota bonus
 *
 * Response:
 *   - success: boolean
 *   - data: { token, user, account }
 *   - error: string (if success is false)
 */
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, invitationCode } = req.body as RegisterRequest;

    // Basic validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "邮箱不能为空",
      } as ApiResponse);
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: "密码不能为空",
      } as ApiResponse);
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "姓名不能为空",
      } as ApiResponse);
    }

    const result = await register(email, password, name, invitationCode);

    if (!result.success) {
      // Determine appropriate status code based on error
      const isConflict = result.error?.includes("已注册") || result.error?.includes("已被使用");
      const statusCode = isConflict ? 409 : 400;

      logger.warn(`[Auth] Registration failed: ${result.error}`);
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Auth] User registered successfully: ${result.user?.email}`);

    res.status(201).json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
        account: result.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Auth] Registration endpoint error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 *
 * Body:
 *   - email: User email address
 *   - password: User password
 *
 * Response:
 *   - success: boolean
 *   - data: { token, user, account }
 *   - error: string (if success is false)
 */
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Basic validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "邮箱不能为空",
      } as ApiResponse);
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: "密码不能为空",
      } as ApiResponse);
    }

    const result = await login(email, password);

    if (!result.success) {
      logger.warn(`[Auth] Login failed for ${email}: ${result.error}`);
      return res.status(401).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    logger.info(`[Auth] User logged in: ${result.user?.email}`);

    res.json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
        account: result.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Auth] Login endpoint error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Logout ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 * Logout current user (client-side token invalidation)
 *
 * Note: Since JWT tokens are stateless, this endpoint is primarily for:
 *   1. Client-side token cleanup
 *   2. Audit logging
 *   3. Future server-side token blacklist support
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - message: string
 */
authRouter.post("/logout", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const authResult = authenticateRequest(authHeader);

    if (authResult.success && authResult.user) {
      logger.info(`[Auth] User logged out: ${authResult.user.email}`);
    }

    // Always return success - the client should discard the token regardless
    res.json({
      success: true,
      data: {
        message: "已成功退出登录",
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Auth] Logout endpoint error:", err);
    // Still return success on error - we don't want to prevent logout
    res.json({
      success: true,
      data: {
        message: "已成功退出登录",
      },
    } as ApiResponse);
  }
});

// ── Get Current User ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Get current authenticated user information
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: { user, account }
 *   - error: string (if success is false)
 */
authRouter.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const authResult = authenticateRequest(authHeader);

    if (!authResult.success) {
      logger.warn(`[Auth] /me endpoint unauthorized: ${authResult.error}`);
      return res.status(401).json({
        success: false,
        error: authResult.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        user: authResult.user,
        account: authResult.account,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Auth] /me endpoint error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});

// ── Token Refresh (Optional) ─────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Refresh the current token (extend expiration)
 *
 * Headers:
 *   - Authorization: Bearer <token>
 *
 * Response:
 *   - success: boolean
 *   - data: { token }
 *   - error: string (if success is false)
 */
authRouter.post("/refresh", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const authResult = authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return res.status(401).json({
        success: false,
        error: authResult.error || "未授权",
      } as ApiResponse);
    }

    // Re-sign a new token with the same payload
    const newToken = signToken({
      userId: authResult.user.id,
      email: authResult.user.email,
      accountId: authResult.account?.id,
    });

    logger.info(`[Auth] Token refreshed for: ${authResult.user.email}`);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    } as ApiResponse);
  } catch (err) {
    logger.error("[Auth] Token refresh error:", err);
    res.status(500).json({
      success: false,
      error: "服务器错误，请稍后重试",
    } as ApiResponse);
  }
});
