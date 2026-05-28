/**
 * Memory Context Builder
 *
 * Builds context from user memory to enhance AI responses.
 * This module provides memory context WITHOUT modifying the system prompt.
 * The context is injected as a separate message for the AI to reference.
 */

import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { shortTermMemoryManager } from "../memory/short-term-memory.js";
import { workingMemoryManager } from "../memory/working-memory.js";
import { memoryTreeManager } from "../memory/memory-tree/tree-manager.js";
import { logger } from "../utils/logger.js";

interface MemoryContext {
  userProfile?: {
    workStyle: string;
    technicalStack: string[];
    domainExpertise: string[];
    preferredResponseLength: string;
  };
  recentInteractions?: Array<{
    type: string;
    content: string;
    skillId?: string;
    importance?: number;
  }>;
  pendingTasks?: Array<{
    title: string;
    priority: string;
  }>;
  skillPatterns?: Array<{
    skillId: string;
    usageCount: number;
  }>;
  relevantTreeMemories?: Array<{
    label: string;
    content: string;
    source?: string;
    importance?: number;
  }>;
}

/**
 * Build memory context for a user session.
 * Returns null if no meaningful memory data exists.
 */
export async function buildMemoryContext(userId: string, sessionId: string, query = ""): Promise<MemoryContext | null> {
  const context: MemoryContext = {};

  try {
    // Load user profile
    const profile = await longTermMemoryManager.getUserProfile(userId);
    if (profile) {
      const techStack = [
        ...profile.technicalStack.languages.slice(0, 5),
        ...profile.technicalStack.frameworks.slice(0, 3),
        ...profile.technicalStack.tools.slice(0, 3),
      ].filter(Boolean);

      if (techStack.length > 0 || profile.domainExpertise.length > 0) {
        context.userProfile = {
          workStyle: `${profile.workStyle.communicationTone}风格，偏好${profile.workStyle.preferredResponseLength}回复`,
          technicalStack: techStack,
          domainExpertise: profile.domainExpertise.slice(0, 5).map(e => e.domain),
          preferredResponseLength: profile.workStyle.preferredResponseLength,
        };
      }
    }

    // Load top interactions by importance (blend: 60% importance + 40% recency)
    const shortTerm = await shortTermMemoryManager.getTodayMemory(userId);
    if (shortTerm && shortTerm.dailyInteractions.length > 0) {
      const interactions = shortTerm.dailyInteractions;
      const scored = interactions.map((i, idx) => ({
        ...i,
        recencyScore: idx / Math.max(interactions.length, 1), // 0 = oldest, 1 = newest
        blendedScore: (i.importance ?? 0.5) * 0.6 + (idx / Math.max(interactions.length, 1)) * 0.4,
      }));
      const topInteractions = scored
        .sort((a, b) => b.blendedScore - a.blendedScore)
        .slice(0, 5)
        .sort((a, b) => a.timestamp - b.timestamp) // re-sort by time for natural reading
        .map((i) => ({
          type: i.type,
          content: i.content.slice(0, 100),
          skillId: i.skillId,
          importance: i.importance,
        }));
      if (topInteractions.length > 0) {
        context.recentInteractions = topInteractions;
      }
    }

    // Load pending tasks (max 3)
    if (shortTerm && shortTerm.pendingTasks.length > 0) {
      const pending = shortTerm.pendingTasks
        .filter((t: any) => t.status === "pending")
        .slice(0, 3)
        .map((t: any) => ({
          title: t.title,
          priority: t.priority,
        }));
      if (pending.length > 0) {
        context.pendingTasks = pending;
      }
    }

    // Load skill patterns (top 3)
    const skillPattern = await longTermMemoryManager.getSkillPatterns(userId);
    if (skillPattern && skillPattern.patterns.length > 0) {
      const topSkills = skillPattern.patterns
        .sort((a: any, b: any) => b.totalUses - a.totalUses)
        .slice(0, 3)
        .map((p: any) => ({
          skillId: p.skillId,
          usageCount: p.totalUses,
        }));
      if (topSkills.length > 0) {
        context.skillPatterns = topSkills;
      }
    }

    // Recall relevant cross-day memory-tree entries for the current user query.
    // This is the path that lets MineEcho remember topics from previous days.
    const normalizedQuery = query.trim();
    if (normalizedQuery.length >= 2) {
      try {
        const recall = await memoryTreeManager.recall(userId, normalizedQuery, {
          maxTokens: 1200,
        });
        const recalled = [
          ...(recall.l0Chunks || []).slice(-4).map((chunk) => ({
            label: new Date(chunk.createdAt).toLocaleDateString("zh-CN"),
            content: chunk.content,
            source: chunk.source,
            importance: chunk.importance,
          })),
          ...(recall.l1Summaries || []).slice(-2).map((summary) => ({
            label: summary.date,
            content: summary.summary,
            source: "L1",
          })),
          ...(recall.l2Summaries || []).slice(-1).map((summary) => ({
            label: summary.weekStart,
            content: summary.summary,
            source: "L2",
          })),
        ];
        if (recalled.length > 0) {
          context.relevantTreeMemories = recalled
            .filter((item) => item.content.trim().length > 0)
            .slice(0, 5);
        }
      } catch (error) {
        logger.warn("[MemoryContext] Failed to recall memory tree context:", {
          error: (error as Error).message,
          userId,
        });
      }
    }

    // Return null if no meaningful context
    if (
      !context.userProfile &&
      !context.recentInteractions &&
      !context.pendingTasks &&
      !context.skillPatterns &&
      !context.relevantTreeMemories
    ) {
      return null;
    }

    return context;
  } catch (error) {
    logger.error("[MemoryContext] Failed to build context:", { error });
    return null;
  }
}

/**
 * Format memory context as a readable string for injection into messages.
 * This is used as a separate context message, not modifying the system prompt.
 */
export function formatMemoryContext(context: MemoryContext): string {
  const parts: string[] = [];

  if (context.userProfile) {
    const profileParts: string[] = [];
    profileParts.push(`工作风格: ${context.userProfile.workStyle}`);

    if (context.userProfile.technicalStack.length > 0) {
      profileParts.push(`技术栈: ${context.userProfile.technicalStack.join(", ")}`);
    }

    if (context.userProfile.domainExpertise.length > 0) {
      profileParts.push(`专业领域: ${context.userProfile.domainExpertise.join(", ")}`);
    }

    parts.push(`[用户画像]\n${profileParts.join("\n")}`);
  }

  if (context.pendingTasks && context.pendingTasks.length > 0) {
    const taskList = context.pendingTasks
      .map((t) => `- ${t.title} (${t.priority})`)
      .join("\n");
    parts.push(`[待办任务]\n${taskList}`);
  }

  if (context.skillPatterns && context.skillPatterns.length > 0) {
    const skillList = context.skillPatterns
      .map((s) => `- ${s.skillId} (${s.usageCount}次)`)
      .join("\n");
    parts.push(`[常用技能]\n${skillList}`);
  }

  if (context.recentInteractions && context.recentInteractions.length > 0) {
    const interactionList = context.recentInteractions
      .map((i) => {
        const marker = (i as any).importance > 0.7 ? '🔸' : '-';
        return `${marker} [${i.type}] ${i.content}`;
      })
      .join("\n");
    parts.push(`[最近交互]\n${interactionList}`);
  }

  if (context.relevantTreeMemories && context.relevantTreeMemories.length > 0) {
    const memoryList = context.relevantTreeMemories
      .map((item) => {
        const source = item.source ? `/${item.source}` : "";
        return `- [${item.label}${source}] ${item.content.replace(/\s+/g, " ").trim().slice(0, 260)}`;
      })
      .join("\n");
    parts.push(`[相关旧记忆]\n${memoryList}`);
  }

  return parts.join("\n\n");
}
