/**
 * Usage Service
 *
 * Service layer for tracking and querying user usage statistics.
 * Handles recording usage events (conversations, tokens, storage) and
 * providing aggregated statistics and history.
 */

import { getUserDb, getAccountById, recordUsage, getUsageByAccountAndType, getUsageSumByAccountAndType, type UsageRecord } from "../db/user-db.js";
import { logger } from "../utils/logger.js";

export type UsageType = "conversation" | "token" | "storage";

// Map to internal DB types
function mapToDbType(type: UsageType): "chat" | "transcription" | "summary" | "skill" | "other" {
  switch (type) {
    case "conversation":
      return "chat";
    case "token":
      return "skill";
    case "storage":
      return "other";
    default:
      return "other";
  }
}

export interface UsageStats {
  conversations: number;
  tokens: number;
  storageMb: number;
  conversationQuota: number;
  tokenQuota: number;
  storageQuota: number;
}

export interface DailyUsage {
  date: string;
  conversations: number;
  tokens: number;
  storageMb: number;
}

export interface RecordUsageResult {
  success: boolean;
  error?: string;
}

/**
 * Record a usage event for an account
 *
 * @param accountId - The account ID to record usage for
 * @param type - Type of usage: "conversation" | "token" | "storage"
 * @param amount - Amount to record (for tokens and storage)
 * @returns Result with success status and optional error message
 */
export function recordUserUsage(
  accountId: string,
  type: UsageType,
  amount: number = 1
): RecordUsageResult {
  const account = getAccountById(accountId);
  if (!account) {
    return { success: false, error: "账号不存在" };
  }

  try {
    const dbType = mapToDbType(type);

    recordUsage({
      accountId,
      type: dbType,
      tokens: amount,
      metadata: { usageType: type }
    });

    logger.debug(`[Usage] Recorded ${type}: ${amount} for account ${accountId}`);
    return { success: true };
  } catch (error) {
    logger.error("[Usage] Record usage error:", error);
    return { success: false, error: "记录用量失败" };
  }
}

/**
 * Get current usage statistics for an account
 *
 * @param accountId - The account ID to get stats for
 * @returns UsageStats or null if account not found
 */
export function getUsageStats(accountId: string): UsageStats | null {
  const account = getAccountById(accountId);
  if (!account) {
    return null;
  }

  // Get usage sums by type
  const conversations = getUsageSumByAccountAndType(accountId, "chat");
  const tokens = getUsageSumByAccountAndType(accountId, "skill");
  const storageMb = getUsageSumByAccountAndType(accountId, "other");

  return {
    conversations,
    tokens,
    storageMb,
    conversationQuota: account.quota,
    tokenQuota: account.monthlyQuota,
    storageQuota: account.quota // Reuse quota for storage as well
  };
}

/**
 * Get usage history for an account over a period of days
 *
 * @param accountId - The account ID to get history for
 * @param days - Number of days to look back (default: 30)
 * @returns Array of DailyUsage records
 */
export function getUsageHistory(accountId: string, days: number = 30): DailyUsage[] {
  const result: DailyUsage[] = [];

  // Get timestamps for the date range
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < days; i++) {
    const dayStart = now - (i * msPerDay);
    const dayEnd = dayStart;

    // Calculate day boundaries
    const startOfDay = new Date(dayStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dayEnd);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

    // Get records for this day
    const conversationRecords = getUsageByAccountAndType(accountId, "chat");
    const tokenRecords = getUsageByAccountAndType(accountId, "skill");
    const storageRecords = getUsageByAccountAndType(accountId, "other");

    // Filter records for this specific day
    const dayConversations = conversationRecords
      .filter((r: UsageRecord) => r.createdAt >= startTimestamp && r.createdAt <= endTimestamp)
      .reduce((sum: number, r: UsageRecord) => sum + r.tokens, 0);

    const dayTokens = tokenRecords
      .filter((r: UsageRecord) => r.createdAt >= startTimestamp && r.createdAt <= endTimestamp)
      .reduce((sum: number, r: UsageRecord) => sum + r.tokens, 0);

    const dayStorage = storageRecords
      .filter((r: UsageRecord) => r.createdAt >= startTimestamp && r.createdAt <= endTimestamp)
      .reduce((sum: number, r: UsageRecord) => sum + r.tokens, 0);

    result.push({
      date: startOfDay.toISOString().slice(0, 10),
      conversations: dayConversations,
      tokens: dayTokens,
      storageMb: dayStorage
    });
  }

  // Return in chronological order (oldest first)
  return result.reverse();
}

/**
 * Get quota information for an account
 *
 * @param accountId - The account ID to get quota for
 * @returns Quota info or null if account not found
 */
export function getQuotaInfo(accountId: string): {
  conversationQuota: number;
  tokenQuota: number;
  storageQuota: number;
  usedConversations: number;
  usedTokens: number;
  usedStorage: number;
} | null {
  const account = getAccountById(accountId);
  if (!account) {
    return null;
  }

  const usedConversations = getUsageSumByAccountAndType(accountId, "chat");
  const usedTokens = getUsageSumByAccountAndType(accountId, "skill");
  const usedStorage = getUsageSumByAccountAndType(accountId, "other");

  return {
    conversationQuota: account.quota,
    tokenQuota: account.monthlyQuota,
    storageQuota: account.quota,
    usedConversations,
    usedTokens,
    usedStorage
  };
}