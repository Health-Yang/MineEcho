/**
 * Short-term Memory Manager
 * Manages daily memory that persists during the day
 * - Stored in SQLite on backend (with in-memory fallback)
 * - Resets at day change
 * - Tracks daily interactions, learned preferences, and pending tasks
 */

import { logger } from "../utils/logger.js";
import { getShortTermDb } from "./memory-db.js";
import type {
  ShortTermMemory,
  Interaction,
  Preference,
  Task,
  IShortTermMemoryManager,
} from "./types.js";

// 每日交互上限配置（默认300，支持约60次完整对话）
const MAX_DAILY_INTERACTIONS = parseInt(process.env.MAX_DAILY_INTERACTIONS || "300", 10);

function calculateImportance(
  interaction: Omit<Interaction, 'id' | 'timestamp' | 'importance'>,
  context?: { isCorrection?: boolean; isComplexTask?: boolean; isFirstTimeSkill?: boolean; hasNegativeFeedback?: boolean }
): number {
  let score = 0.5; // baseline

  // Type-based scoring
  if (interaction.type === 'preference_indicated') score += 0.2;
  if (interaction.type === 'task_created') score += 0.15;
  if (interaction.type === 'skill_invocation') {
    score += 0.1;
    if (interaction.outcome === 'failure') score += 0.15; // failures teach more
  }

  // Context-based scoring
  if (context?.isCorrection) score += 0.25;
  if (context?.isComplexTask) score += 0.15;
  if (context?.isFirstTimeSkill) score += 0.1;
  if (context?.hasNegativeFeedback) score += 0.2; // negative feedback is valuable

  // Content heuristics
  const content = interaction.content || '';
  if (content.length > 500) score += 0.05; // longer = more substance
  if (/error|bug|fix|broken|not working|failed/i.test(content)) score += 0.1;
  if (/urgent|asap|critical|important/i.test(content)) score += 0.1;

  return Math.min(1.0, Math.max(0.0, score));
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function getMemoryKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

function createEmptyMemory(userId: string, date: string): ShortTermMemory {
  return {
    date,
    userId,
    dailyInteractions: [],
    learnedPreferences: [],
    pendingTasks: [],
    lastUpdated: Date.now(),
  };
}

class ShortTermMemoryManager implements IShortTermMemoryManager {
  private db = getShortTermDb();

  /**
   * Get or create today's memory for a user
   */
  async getTodayMemory(userId: string): Promise<ShortTermMemory> {
    const today = getTodayKey();
    return this.getMemoryForDate(userId, today);
  }

  /**
   * Get memory for a specific date
   */
  async getMemoryForDate(userId: string, date: string): Promise<ShortTermMemory> {
    const [interactions, preferences, tasks, summary] = await Promise.all([
      this.db.getInteractions(userId, date),
      this.db.getPreferences(userId, date),
      this.db.getTasks(userId),
      this.db.getDailySummary(userId, date),
    ]);

    return {
      date,
      userId,
      dailyInteractions: interactions,
      learnedPreferences: preferences,
      pendingTasks: tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
      summary: summary || undefined,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Add an interaction to today's memory
   */
  async addInteraction(
    userId: string,
    interaction: Omit<Interaction, "id" | "timestamp" | "importance">,
    context?: { isCorrection?: boolean; isComplexTask?: boolean; isFirstTimeSkill?: boolean; hasNegativeFeedback?: boolean }
  ): Promise<Interaction> {
    const today = getTodayKey();
    const importance = calculateImportance(interaction, context);
    const newInteraction = await this.db.addInteraction(userId, today, { ...interaction, importance });

    // 使用环境变量配置的每日交互上限，防止内存膨胀
    const count = await this.db.countInteractions(userId, today);
    if (count > MAX_DAILY_INTERACTIONS) {
      const evictedCount = count - MAX_DAILY_INTERACTIONS;
      await this.db.pruneInteractions(userId, today, MAX_DAILY_INTERACTIONS);
      logger.warn(
        `[ShortTermMemory] Daily interactions limit reached (${MAX_DAILY_INTERACTIONS}), evicted ${evictedCount} oldest interactions for user ${userId}`
      );
    }

    return newInteraction;
  }

  /**
   * Add a learned preference to today's memory
   */
  async addPreference(
    userId: string,
    preference: Omit<Preference, "id" | "timestamp">
  ): Promise<Preference> {
    const today = getTodayKey();
    return this.db.upsertPreference(userId, today, preference);
  }

  /**
   * Add a new task
   */
  async addTask(userId: string, task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    return this.db.addTask(userId, task);
  }

  /**
   * Update an existing task
   */
  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task | null> {
    return this.db.updateTask(userId, taskId, updates);
  }

  /**
   * Mark a task as completed
   */
  async completeTask(userId: string, taskId: string): Promise<Task | null> {
    return this.updateTask(userId, taskId, {
      status: "completed",
      completedAt: Date.now(),
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    return this.db.deleteTask(userId, taskId);
  }

  /**
   * Get all pending tasks for a user (across all days)
   */
  async getAllPendingTasks(userId: string): Promise<Task[]> {
    return this.db.getTasks(userId, "pending");
  }

  /**
   * Clear memory for a specific day (or today if not specified)
   */
  async clearDay(userId: string, date?: string): Promise<void> {
    const targetDate = date || getTodayKey();
    await this.db.clearDay(userId, targetDate);
  }

  /**
   * Clear all memory for a user
   */
  async clearAllUserMemory(userId: string): Promise<void> {
    await this.db.clearAllUserMemory(userId);
  }

  /**
   * Get statistics for today
   */
  async getStats(userId: string): Promise<{
    totalInteractions: number;
    preferencesLearned: number;
    pendingTasks: number;
  }> {
    const today = getTodayKey();
    const [interactions, preferences, tasks] = await Promise.all([
      this.db.getInteractions(userId, today),
      this.db.getPreferences(userId, today),
      this.db.getTasks(userId, "pending"),
    ]);

    return {
      totalInteractions: interactions.length,
      preferencesLearned: preferences.length,
      pendingTasks: tasks.length,
    };
  }

  /**
   * Get recent interactions
   */
  async getRecentInteractions(userId: string, count: number = 10): Promise<Interaction[]> {
    const today = getTodayKey();
    const interactions = await this.db.getInteractions(userId, today);
    return interactions.slice(-count).reverse();
  }

  /**
   * Get top interactions by importance (blend: 60% importance + 40% recency)
   */
  async getTopInteractions(userId: string, count: number = 5): Promise<Interaction[]> {
    const today = getTodayKey();
    const interactions = await this.db.getInteractions(userId, today);
    if (interactions.length === 0) return [];

    const scored = interactions.map((i, idx) => ({
      ...i,
      recencyScore: idx / Math.max(interactions.length, 1), // 0 = oldest, 1 = newest
      blendedScore: (i.importance ?? 0.5) * 0.6 + (idx / Math.max(interactions.length, 1)) * 0.4,
    }));

    return scored
      .sort((a, b) => b.blendedScore - a.blendedScore)
      .slice(0, count)
      .sort((a, b) => a.timestamp - b.timestamp); // re-sort by time for natural reading
  }

  /**
   * Get preferences learned today
   */
  async getTodayPreferences(userId: string): Promise<Preference[]> {
    const today = getTodayKey();
    return this.db.getPreferences(userId, today);
  }

  /**
   * Generate a daily summary (placeholder for AI-generated summary)
   */
  async setDailySummary(userId: string, summary: string): Promise<void> {
    const today = getTodayKey();
    await this.db.setDailySummary(userId, today, summary);
  }

  /**
   * Get memory history for multiple days
   */
  async getMemoryHistory(userId: string, days: number = 7): Promise<ShortTermMemory[]> {
    const history: ShortTermMemory[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];

      const memory = await this.getMemoryForDate(userId, dateKey);
      // Only include days that have some data
      if (
        memory.dailyInteractions.length > 0 ||
        memory.learnedPreferences.length > 0 ||
        memory.pendingTasks.length > 0 ||
        memory.summary
      ) {
        history.push(memory);
      }
    }

    return history;
  }

  /**
   * Export memory for persistence (e.g., to localStorage on frontend)
   */
  async exportMemory(userId: string, date?: string): Promise<ShortTermMemory | null> {
    const targetDate = date || getTodayKey();
    try {
      return await this.getMemoryForDate(userId, targetDate);
    } catch {
      return null;
    }
  }

  /**
   * Import memory from persistence
   */
  async importMemory(memory: ShortTermMemory): Promise<void> {
    const { userId, date } = memory;

    // Import interactions
    for (const interaction of memory.dailyInteractions) {
      await this.db.addInteraction(userId, date, {
        type: interaction.type,
        content: interaction.content,
        skillId: interaction.skillId,
        skillName: interaction.skillName,
        outcome: interaction.outcome,
        userFeedback: interaction.userFeedback,
        importance: interaction.importance ?? 0.5,
      });
    }

    // Import preferences
    for (const pref of memory.learnedPreferences) {
      await this.db.upsertPreference(userId, date, {
        category: pref.category,
        key: pref.key,
        value: pref.value,
        confidence: pref.confidence,
        source: pref.source,
        context: pref.context,
      });
    }

    // Import tasks
    for (const task of memory.pendingTasks) {
      await this.db.addTask(userId, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
        completedAt: task.completedAt,
        relatedSkillId: task.relatedSkillId,
      });
    }

    // Import summary
    if (memory.summary) {
      await this.db.setDailySummary(userId, date, memory.summary);
    }
  }

  /**
   * Clean up old memory (keep last 30 days)
   */
  async cleanupOldMemory(userId?: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

    if (userId) {
      // For a specific user, we need to clear day by day since our DB
      // doesn't have a user-scoped date filter in cleanupOldMemory.
      // Get all dates for this user and delete selectively.
      // Simpler approach: clear all for user (but that deletes everything).
      // Instead, we just rely on the global cleanup for now.
      logger.warn(`[ShortTermMemory] cleanupOldMemory for specific user not fully implemented, using global cleanup`);
    }

    await this.db.cleanupOldMemory(cutoffDate);
  }
}

// Export singleton instance
export const shortTermMemoryManager = new ShortTermMemoryManager();

// Export class for testing
export { ShortTermMemoryManager };
