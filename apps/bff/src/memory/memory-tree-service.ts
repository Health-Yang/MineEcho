/**
 * Memory Tree Service Wrapper
 * Provides a simple interface for storing conversations to the hierarchical memory tree
 * with automatic summarization and bucket-seal mechanics.
 *
 * Usage:
 *   import { storeConversationToMemoryTree } from "./memory/memory-tree-service.js";
 *   await storeConversationToMemoryTree(userId, "conversation", content);
 */

import { memoryTreeManager } from "./memory-tree/index.js";
import type { MemorySource } from "./memory-tree/types.js";
import { logger } from "../utils/logger.js";
import { budgetTaskOutputForMemory } from "../task-output/task-output-budget.js";

// Feature flag - can be disabled via environment variable
const MEMORY_TREE_ENABLED = process.env.MEMORY_TREE_ENABLED !== "false";

/**
 * Importance scoring based on content characteristics
 */
function calculateImportance(
  content: string,
  source: MemorySource
): number {
  // Base importance
  let importance = 0.5;

  // Content length factor (longer content = slightly higher importance)
  const lengthFactor = Math.min(content.length / 2000, 1);
  importance += lengthFactor * 0.2;

  // Source factor
  switch (source) {
    case "conversation":
      importance += 0.1;
      break;
    case "skill":
      importance += 0.2;
      break;
    case "document":
      importance += 0.3;
      break;
    case "knowledge":
      importance += 0.4;
      break;
    case "manual":
      importance += 0.5;
      break;
    case "meeting":
      importance += 0.3;
      break;
  }

  // Keywords that indicate higher importance
  const highImportanceKeywords = [
    "important", "critical", "urgent", "deadline", "project",
    "milestone", "decision", "meeting", "presentation", "review",
    "feedback", "goal", "objective", "strategy", "plan"
  ];
  const contentLower = content.toLowerCase();
  const keywordMatches = highImportanceKeywords.filter(kw =>
    contentLower.includes(kw)
  ).length;
  importance += Math.min(keywordMatches * 0.05, 0.2);

  // Cap at 1.0
  return Math.min(importance, 1.0);
}

function getBudgetScenario(source: MemorySource): "skill" | "document" | "general" {
  if (source === "skill") return "skill";
  if (source === "document" || source === "knowledge" || source === "meeting") return "document";
  return "general";
}

/**
 * Store conversation or other content to the memory tree.
 * This is a fire-and-forget operation - it won't block or fail the main flow.
 *
 * @param userId - User identifier
 * @param source - Source type of the content
 * @param content - The actual content to store
 * @param metadata - Optional metadata like skillId, sessionId
 */
export async function storeToMemoryTree(
  userId: string,
  source: MemorySource,
  content: string,
  metadata?: {
    skillId?: string;
    skillName?: string;
    sessionId?: string;
    interactionType?: string;
  }
): Promise<void> {
  // Skip if disabled
  if (!MEMORY_TREE_ENABLED) {
    return;
  }

  // Skip empty content
  if (!content || content.trim().length === 0) {
    return;
  }

  // Skip very short content (less than 20 characters)
  if (content.trim().length < 20) {
    return;
  }

  try {
    const budgetedContent = await budgetTaskOutputForMemory({
      toolName: source,
      output: content,
      scenario: getBudgetScenario(source),
      maxInlineChars: 6000,
    });
    const memoryContent = budgetedContent.content.trim();
    const importance = calculateImportance(memoryContent, source);

    // Build source reference for tracking
    const sourceRef = metadata ? {
      type: source,
      id: metadata.sessionId || `session-${Date.now()}`,
      metadata: {
        skillId: metadata.skillId,
        skillName: metadata.skillName,
        interactionType: metadata.interactionType,
      }
    } : undefined;

    // Store to memory tree
    const result = await memoryTreeManager.storeChunk(userId, {
      source,
      content: memoryContent,
      importance,
      sourceRef,
    });

    logger.debug("[MemoryTreeService] Stored chunk", {
      userId,
      chunkId: result.chunk.id,
      source,
      importance,
      tokenCount: result.chunk.tokenCount,
      sealed: result.sealed,
    });

    // If a seal was triggered, log it
    if (result.sealed && result.sealResult) {
      logger.info("[MemoryTreeService] Bucket seal triggered", {
        userId,
        level: result.sealResult.level,
        summaryId: result.sealResult.summaryId,
      });
    }
  } catch (error) {
    // Log error but don't throw - this is fire-and-forget
    logger.warn("[MemoryTreeService] Failed to store to memory tree", {
      userId,
      source,
      error: (error as Error).message,
    });
  }
}

/**
 * Store a conversation interaction (user message + AI response) to memory tree.
 * Combines the conversation into a single meaningful chunk.
 */
export async function storeConversationToMemoryTree(
  userId: string,
  userMessage: string,
  assistantMessage: string,
  metadata?: {
    skillId?: string;
    skillName?: string;
    sessionId?: string;
    mode?: string;
  }
): Promise<void> {
  // Combine into a conversation summary
  const conversationContent = `用户: ${userMessage}\n\nAI: ${assistantMessage}`;

  await storeToMemoryTree(
    userId,
    "conversation",
    conversationContent,
    {
      ...metadata,
      interactionType: "chat",
    }
  );
}

/**
 * Store a skill invocation to memory tree.
 * Useful for tracking skill usage patterns.
 */
export async function storeSkillToMemoryTree(
  userId: string,
  skillId: string,
  skillName: string,
  context: string,
  success: boolean
): Promise<void> {
  const content = `使用了技能: ${skillName} (${skillId})\n\n上下文: ${context}\n\n结果: ${success ? "成功" : "失败"}`;

  await storeToMemoryTree(userId, "skill", content, {
    skillId,
    skillName,
    interactionType: success ? "skill_success" : "skill_failure",
  });
}

/**
 * Get memory tree statistics for a user.
 */
export async function getMemoryTreeStats(userId: string): Promise<{
  l0Count: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  entityCount: number;
  todayTokens: number;
} | null> {
  if (!MEMORY_TREE_ENABLED) {
    return null;
  }

  try {
    return memoryTreeManager.getTreeStats(userId);
  } catch (error) {
    logger.warn("[MemoryTreeService] Failed to get tree stats", {
      userId,
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Check if memory tree is enabled.
 */
export function isMemoryTreeEnabled(): boolean {
  return MEMORY_TREE_ENABLED;
}
