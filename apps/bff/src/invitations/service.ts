/**
 * Invitation Service
 *
 * Business logic for invitation code management.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import {
  createInvitation,
  getInvitationByCode,
  getInvitationsByUserId,
  updateInvitation,
  type Invitation,
} from "../db/user-db.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateInviteResult {
  success: boolean;
  invitation?: Invitation;
  error?: string;
}

export interface ValidateInviteResult {
  valid: boolean;
  error?: string;
  invitation?: Invitation;
}

export interface InvitationListResult {
  success: boolean;
  invitations?: Invitation[];
  error?: string;
}

// ── Default Values ────────────────────────────────────────────────────────────

const DEFAULT_EXPIRES_DAYS = 7;
const DEFAULT_TRIAL_QUOTA = 10000;
const DEFAULT_SUBSCRIPTION_QUOTA = 100000;
const DEFAULT_ADMIN_QUOTA = 1000000;

// ── Code Generation ──────────────────────────────────────────────────────────

/**
 * Generate a unique invitation code in format MINECHO-XXXX
 * @returns Generated invitation code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MINECHO-";

  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

// ── Invitation Creation ─────────────────────────────────────────────────────

/**
 * Create a new invitation code
 * @param createdBy - User ID who creates the invitation
 * @param type - Invitation type (trial/subscription/admin)
 * @param expiresInDays - Days until expiration (default: 7)
 * @param quota - Quota granted by this invitation
 * @param maxUses - Maximum number of uses (default: 1)
 * @returns Result with created invitation or error
 */
export function createInvite(
  createdBy: string,
  type: "trial" | "subscription" | "admin" = "trial",
  expiresInDays: number = DEFAULT_EXPIRES_DAYS,
  quota?: number,
  maxUses: number = 1
): CreateInviteResult {
  // Validate inputs
  if (!createdBy || typeof createdBy !== "string") {
    return { success: false, error: "创建者ID不能为空" };
  }

  if (!["trial", "subscription", "admin"].includes(type)) {
    return { success: false, error: "无效的邀请码类型" };
  }

  if (expiresInDays < 1 || expiresInDays > 365) {
    return { success: false, error: "有效期必须在1-365天之间" };
  }

  try {
    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code uniqueness
    while (getInvitationByCode(code) && attempts < maxAttempts) {
      code = generateInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      logger.error("[Invitation] Failed to generate unique code after 10 attempts");
      return { success: false, error: "生成邀请码失败，请稍后重试" };
    }

    // Determine quota based on type if not provided
    const inviteQuota = quota ?? (type === "admin" ? DEFAULT_ADMIN_QUOTA :
                                     type === "subscription" ? DEFAULT_SUBSCRIPTION_QUOTA :
                                     DEFAULT_TRIAL_QUOTA);

    const invitation = createInvitation({
      code,
      createdBy,
      type,
      quota: inviteQuota,
      expiresInDays,
      maxUses,
    });

    logger.info(`[Invitation] Created ${type} invitation: ${code} by user ${createdBy}`);

    return { success: true, invitation };
  } catch (error) {
    logger.error("[Invitation] Failed to create invitation:", error);
    return { success: false, error: "创建邀请码失败" };
  }
}

// ── Invitation Validation ────────────────────────────────────────────────────

/**
 * Validate an invitation code
 * @param code - Invitation code to validate
 * @returns Validation result with invitation details if valid
 */
export function validateInvite(code: string): ValidateInviteResult {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "邀请码不能为空" };
  }

  const invitation = getInvitationByCode(code.trim().toUpperCase());

  if (!invitation) {
    return { valid: false, error: "邀请码无效" };
  }

  // Check if already used (max uses reached)
  const maxUses = invitation.maxUses || 1;
  const useCount = invitation.useCount || 0;
  if (useCount >= maxUses) {
    return { valid: false, error: "邀请码已被使用" };
  }

  // Check if revoked
  if (invitation.status === "revoked") {
    return { valid: false, error: "邀请码已被禁用" };
  }

  // Check if expired
  if (invitation.expiresAt < Date.now()) {
    return { valid: false, error: "邀请码已过期" };
  }

  return { valid: true, invitation };
}

// ── Invitation Listing ────────────────────────────────────────────────────────

/**
 * Get all invitations created by a user
 * @param userId - User ID
 * @returns Result with invitation list or error
 */
export function getUserInvitations(userId: string): InvitationListResult {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "用户ID不能为空" };
  }

  try {
    const invitations = getInvitationsByUserId(userId);
    return { success: true, invitations };
  } catch (error) {
    logger.error("[Invitation] Failed to get invitations:", error);
    return { success: false, error: "获取邀请码列表失败" };
  }
}

// ── Invitation Revocation ────────────────────────────────────────────────────

/**
 * Revoke an invitation code
 * @param code - Invitation code to revoke
 * @param userId - User ID for ownership verification
 * @returns Result with success or error
 */
export function revokeInvitation(code: string, userId: string): { success: boolean; error?: string } {
  if (!code || typeof code !== "string") {
    return { success: false, error: "邀请码不能为空" };
  }

  if (!userId || typeof userId !== "string") {
    return { success: false, error: "用户ID不能为空" };
  }

  const invitation = getInvitationByCode(code.trim().toUpperCase());

  if (!invitation) {
    return { success: false, error: "邀请码不存在" };
  }

  // Verify ownership
  if (invitation.createdBy !== userId) {
    return { success: false, error: "无权限操作此邀请码" };
  }

  // Check if already used
  if (invitation.status === "used") {
    return { success: false, error: "已使用的邀请码无法撤销" };
  }

  try {
    updateInvitation(invitation.id, { status: "revoked" });
    logger.info(`[Invitation] Revoked invitation: ${code} by user ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error("[Invitation] Failed to revoke invitation:", error);
    return { success: false, error: "撤销邀请码失败" };
  }
}

// ── Mark Invitation as Used ───────────────────────────────────────────────────

/**
 * Mark an invitation as used by a user
 * @param code - Invitation code
 * @param usedBy - User ID who used the invitation
 * @returns Result with success or error
 */
export function useInvitation(code: string, usedBy: string): { success: boolean; error?: string; quota?: number } {
  const validation = validateInvite(code);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    updateInvitation(validation.invitation!.id, {
      usedBy,
      usedAt: Date.now(),
      // Increment use count instead of setting status to "used"
      useCount: (validation.invitation!.useCount || 0) + 1,
    });

    logger.info(`[Invitation] Invitation ${code} used by user ${usedBy}`);

    return {
      success: true,
      quota: validation.invitation!.quota,
    };
  } catch (error) {
    logger.error("[Invitation] Failed to mark invitation as used:", error);
    return { success: false, error: "使用邀请码失败" };
  }
}