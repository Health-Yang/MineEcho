/**
 * Account Service
 *
 * Business logic for account management including CRUD operations and quota management.
 */

import { logger } from "../utils/logger.js";
import {
  createAccount,
  getAccountsByUserId,
  getAccountById,
  updateAccount,
  deleteAccount,
  type Account,
} from "../db/user-db.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateAccountResult {
  success: boolean;
  account?: Account;
  error?: string;
}

export interface UpdateAccountResult {
  success: boolean;
  account?: Account;
  error?: string;
}

export interface AccountListResult {
  success: boolean;
  accounts?: Account[];
  error?: string;
}

// ── Default Quotas ───────────────────────────────────────────────────────────

const DEFAULT_PERSONAL_QUOTA = 100000;
const DEFAULT_TEAM_QUOTA = 500000;
const DEFAULT_ENTERPRISE_QUOTA = 2000000;

// ── Account Creation ─────────────────────────────────────────────────────────

/**
 * Create a new account for a user
 * @param userId - Owner user ID
 * @param name - Account display name
 * @param type - Account type (personal/team/enterprise)
 * @param quota - Optional custom quota
 * @returns Result with created account or error
 */
export function createUserAccount(
  userId: string,
  name: string,
  type: "personal" | "team" | "enterprise" = "personal",
  quota?: number
): CreateAccountResult {
  // Validate inputs
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "用户ID不能为空" };
  }

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return { success: false, error: "账户名称不能为空" };
  }

  try {
    // Determine quota based on account type if not provided
    const accountQuota = quota ?? (type === "enterprise" ? DEFAULT_ENTERPRISE_QUOTA :
                                     type === "team" ? DEFAULT_TEAM_QUOTA :
                                     DEFAULT_PERSONAL_QUOTA);

    const account = createAccount({
      userId,
      name: name.trim(),
      type,
      quota: accountQuota,
    });

    logger.info(`[Account] Created account ${account.id} for user ${userId}: ${account.name} (${type})`);

    return { success: true, account };
  } catch (error) {
    logger.error("[Account] Failed to create account:", error);
    return { success: false, error: "创建账户失败" };
  }
}

// ── Account Retrieval ────────────────────────────────────────────────────────

/**
 * Get all accounts for a user
 * @param userId - Owner user ID
 * @returns Result with account list or error
 */
export function getUserAccounts(userId: string): AccountListResult {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "用户ID不能为空" };
  }

  try {
    const accounts = getAccountsByUserId(userId);
    return { success: true, accounts };
  } catch (error) {
    logger.error("[Account] Failed to get accounts:", error);
    return { success: false, error: "获取账户列表失败" };
  }
}

/**
 * Get a single account by ID with ownership verification
 * @param accountId - Account ID
 * @param userId - Owner user ID for verification
 * @returns Result with account or error
 */
export function getAccountWithOwnership(accountId: string, userId: string): CreateAccountResult {
  const account = getAccountById(accountId);

  if (!account) {
    return { success: false, error: "账户不存在" };
  }

  if (account.userId !== userId) {
    return { success: false, error: "无权限访问此账户" };
  }

  return { success: true, account };
}

// ── Account Update ───────────────────────────────────────────────────────────

/**
 * Update account details
 * @param accountId - Account ID to update
 * @param userId - Owner user ID for verification
 * @param updates - Fields to update (name, type, quota)
 * @returns Result with updated account or error
 */
export function updateUserAccount(
  accountId: string,
  userId: string,
  updates: {
    name?: string;
    type?: "personal" | "team" | "enterprise";
    quota?: number;
  }
): UpdateAccountResult {
  // Validate inputs
  if (!accountId || typeof accountId !== "string") {
    return { success: false, error: "账户ID不能为空" };
  }

  if (!userId || typeof userId !== "string") {
    return { success: false, error: "用户ID不能为空" };
  }

  // Verify ownership
  const account = getAccountById(accountId);
  if (!account) {
    return { success: false, error: "账户不存在" };
  }

  if (account.userId !== userId) {
    return { success: false, error: "无权限修改此账户" };
  }

  // Check if account is deleted
  if (account.status === "deleted") {
    return { success: false, error: "已删除的账户无法修改" };
  }

  try {
    // Build update object
    const updateData: Partial<Account> = {};

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || updates.name.trim().length < 1) {
        return { success: false, error: "账户名称不能为空" };
      }
      updateData.name = updates.name.trim();
    }

    if (updates.type !== undefined) {
      if (!["personal", "team", "enterprise"].includes(updates.type)) {
        return { success: false, error: "无效的账户类型" };
      }
      updateData.type = updates.type;
    }

    if (updates.quota !== undefined) {
      if (typeof updates.quota !== "number" || updates.quota < 0) {
        return { success: false, error: "配额必须为非负数" };
      }
      updateData.quota = updates.quota;
    }

    updateAccount(accountId, updateData);

    const updatedAccount = getAccountById(accountId);
    logger.info(`[Account] Updated account ${accountId} for user ${userId}`);

    return { success: true, account: updatedAccount! };
  } catch (error) {
    logger.error("[Account] Failed to update account:", error);
    return { success: false, error: "更新账户失败" };
  }
}

// ── Account Deletion ────────────────────────────────────────────────────────

/**
 * Soft-delete an account (sets status to "deleted")
 * @param accountId - Account ID to delete
 * @param userId - Owner user ID for verification
 * @returns Result with success or error
 */
export function removeAccount(accountId: string, userId: string): UpdateAccountResult {
  // Validate inputs
  if (!accountId || typeof accountId !== "string") {
    return { success: false, error: "账户ID不能为空" };
  }

  if (!userId || typeof userId !== "string") {
    return { success: false, error: "用户ID不能为空" };
  }

  // Verify ownership
  const account = getAccountById(accountId);
  if (!account) {
    return { success: false, error: "账户不存在" };
  }

  if (account.userId !== userId) {
    return { success: false, error: "无权限删除此账户" };
  }

  // Check if already deleted
  if (account.status === "deleted") {
    return { success: false, error: "账户已删除" };
  }

  try {
    // Soft delete by setting status to "deleted"
    deleteAccount(accountId);

    logger.info(`[Account] Deleted account ${accountId} for user ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error("[Account] Failed to delete account:", error);
    return { success: false, error: "删除账户失败" };
  }
}

// ── Account Switching ─────────────────────────────────────────────────────────

/**
 * Validate that an account can be switched to
 * @param accountId - Target account ID
 * @param userId - Owner user ID
 * @returns Result with account or error
 */
export function validateAccountSwitch(accountId: string, userId: string): CreateAccountResult {
  const account = getAccountById(accountId);

  if (!account) {
    return { success: false, error: "账户不存在" };
  }

  if (account.userId !== userId) {
    return { success: false, error: "无权限访问此账户" };
  }

  if (account.status === "deleted") {
    return { success: false, error: "账户已删除，无法切换" };
  }

  if (account.status === "suspended") {
    return { success: false, error: "账户已暂停，无法切换" };
  }

  return { success: true, account };
}