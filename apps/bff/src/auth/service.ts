/**
 * Authentication Service
 *
 * Business logic for user registration, login, and session management.
 */

import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";
import {
  createUser,
  getUserByEmail,
  getUserById,
  createAccount,
  getAccountsByUserId,
  getAccountById,
  getInvitationByCode,
  updateInvitation,
} from "../db/user-db.js";
import { signToken, verifyToken, extractToken } from "./jwt.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  account?: {
    id: string;
    name: string;
    type: string;
    quota: number;
    usedQuota: number;
  };
  error?: string;
}

export interface ValidateInvitationResult {
  valid: boolean;
  invitation?: {
    id: string;
    code: string;
    type: string;
    quota: number;
    expiresAt: number;
    maxUses?: number;
    useCount?: number;
  };
  error?: string;
}

// ── Invitation Validation ────────────────────────────────────────────────────

/**
 * Validate an invitation code
 * @param invitationCode - The invitation code to validate
 * @returns Validation result with invitation details if valid
 */
export function validateInvitation(invitationCode: string): ValidateInvitationResult {
  if (!invitationCode || typeof invitationCode !== "string") {
    return { valid: false, error: "邀请码不能为空" };
  }

  const invitation = getInvitationByCode(invitationCode.trim());
  if (!invitation) {
    return { valid: false, error: "邀请码无效" };
  }

  // Check max uses
  const maxUses = invitation.maxUses || 1;
  const useCount = invitation.useCount || 0;
  if (useCount >= maxUses) {
    return { valid: false, error: "邀请码已被使用" };
  }

  // Check if expired
  if (invitation.expiresAt < Date.now()) {
    return { valid: false, error: "邀请码已过期" };
  }

  // Check if revoked
  if (invitation.status === "revoked") {
    return { valid: false, error: "邀请码已被撤销" };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      code: invitation.code,
      type: invitation.type,
      quota: invitation.quota,
      expiresAt: invitation.expiresAt,
      maxUses: invitation.maxUses,
      useCount: invitation.useCount,
    },
  };
}

// ── Password Validation ─────────────────────────────────────────────────────

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "密码不能为空" };
  }

  if (password.length < 8) {
    return { valid: false, error: "密码长度至少8位" };
  }

  if (password.length > 128) {
    return { valid: false, error: "密码长度不能超过128位" };
  }

  return { valid: true };
}

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * Register a new user
 * @param email - User email address
 * @param password - User password (plaintext, will be hashed)
 * @param name - User display name
 * @param invitationCode - Optional invitation code for quota bonus
 * @returns Authentication result with token and user info
 */
export async function register(
  email: string,
  password: string,
  name: string,
  invitationCode?: string
): Promise<AuthResult> {
  // Validate email
  if (!email || typeof email !== "string") {
    return { success: false, error: "邮箱不能为空" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: "邮箱格式不正确" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = getUserByEmail(normalizedEmail);
  if (existingUser) {
    return { success: false, error: "该邮箱已注册" };
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return { success: false, error: "姓名不能为空" };
  }

  // Validate invitation code if provided
  let quota = 100000; // Default quota for personal account
  let invitationUsed = false;

  if (invitationCode && invitationCode.trim()) {
    const invitationValidation = validateInvitation(invitationCode.trim());
    if (!invitationValidation.valid) {
      return { success: false, error: invitationValidation.error };
    }
    quota += invitationValidation.invitation!.quota;
    invitationUsed = true;
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = createUser({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
    });

    logger.info(`[Auth] New user registered: ${user.email} (${user.id})`);

    // Create default account for the user
    const account = createAccount({
      userId: user.id,
      name: "我的账户",
      type: "personal",
      quota: quota,
    });

    logger.info(`[Auth] Created default account for ${user.email}: ${account.id} with quota ${quota}`);

    // Mark invitation as used if applicable
    if (invitationUsed) {
      const invitation = getInvitationByCode(invitationCode!.trim());
      if (invitation) {
        updateInvitation(invitation.id, {
          usedBy: user.id,
          usedAt: Date.now(),
          useCount: (invitation.useCount || 0) + 1,
        });
        logger.info(`[Auth] Invitation ${invitation.code} used by ${user.email} (count: ${(invitation.useCount || 0) + 1}/${invitation.maxUses || 1})`);
      }
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      accountId: account.id,
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
        quota: account.quota,
        usedQuota: account.usedQuota,
      },
    };
  } catch (err) {
    logger.error("[Auth] Registration failed:", err);
    return { success: false, error: "注册失败，请稍后重试" };
  }
}

// ── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate a user with email and password
 * @param email - User email address
 * @param password - User password (plaintext)
 * @returns Authentication result with token and user info
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  // Validate inputs
  if (!email || typeof email !== "string") {
    return { success: false, error: "邮箱不能为空" };
  }

  if (!password || typeof password !== "string") {
    return { success: false, error: "密码不能为空" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user
  const user = getUserByEmail(normalizedEmail);
  if (!user) {
    return { success: false, error: "邮箱或密码错误" };
  }

  // Verify password
  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  } catch (err) {
    logger.error("[Auth] Password comparison failed:", err);
    return { success: false, error: "登录失败，请稍后重试" };
  }

  if (!isPasswordValid) {
    return { success: false, error: "邮箱或密码错误" };
  }

  logger.info(`[Auth] User logged in: ${user.email} (${user.id})`);

  // Get user's default account (first active account)
  const accounts = getAccountsByUserId(user.id);
  const activeAccount = accounts.find(a => a.status === "active") || accounts[0];

  if (!activeAccount) {
    // Create a default account if none exists
    const account = createAccount({
      userId: user.id,
      name: "我的账户",
      type: "personal",
      quota: 100000,
    });

    // Generate token with new account
    const token = signToken({
      userId: user.id,
      email: user.email,
      accountId: account.id,
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
        quota: account.quota,
        usedQuota: account.usedQuota,
      },
    };
  }

  // Generate JWT token
  const token = signToken({
    userId: user.id,
    email: user.email,
    accountId: activeAccount.id,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    account: {
      id: activeAccount.id,
      name: activeAccount.name,
      type: activeAccount.type,
      quota: activeAccount.quota,
      usedQuota: activeAccount.usedQuota,
    },
  };
}

// ── Get Current User ─────────────────────────────────────────────────────────

/**
 * Get current user info from token
 * @param token - JWT token
 * @returns User info if token is valid
 */
export function getCurrentUser(token: string): AuthResult {
  try {
    const payload = verifyToken(token);

    const user = getUserById(payload.userId);
    if (!user) {
      return { success: false, error: "用户不存在" };
    }

    // Get account info
    let account = null;
    if (payload.accountId) {
      account = getAccountById(payload.accountId);
    }

    if (!account) {
      const accounts = getAccountsByUserId(user.id);
      account = accounts.find(a => a.status === "active") || accounts[0];
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      account: account ? {
        id: account.id,
        name: account.name,
        type: account.type,
        quota: account.quota,
        usedQuota: account.usedQuota,
      } : undefined,
    };
  } catch (err) {
    return { success: false, error: "无效的认证令牌" };
  }
}

// ── Auth Middleware Helper ───────────────────────────────────────────────────

/**
 * Extract and verify user from Authorization header
 * @param authHeader - Authorization header value
 * @returns Auth result with user info or error
 */
export function authenticateRequest(authHeader: string | undefined): AuthResult {
  const token = extractToken(authHeader);
  if (!token) {
    return { success: false, error: "未提供认证令牌" };
  }

  return getCurrentUser(token);
}
