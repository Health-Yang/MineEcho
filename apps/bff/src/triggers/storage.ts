/**
 * Trigger Storage Layer
 *
 * SQLite-based storage for personalized triggers.
 * Uses in-memory storage for MVP, can be swapped to SQLite or other DB.
 */

import type { PersonalizedTrigger, TriggerStats } from './types.js';

// In-memory storage (replace with SQLite for production)
interface StorageEntry {
  trigger: PersonalizedTrigger;
  version: number;
}

class TriggerStorage {
  private storage = new Map<string, StorageEntry>(); // key: `${userId}:${triggerId}`
  private userIndex = new Map<string, Set<string>>(); // key: userId, value: Set of triggerIds
  private phraseIndex = new Map<string, Set<string>>(); // key: normalized phrase, value: Set of keys

  private generateKey(userId: string, triggerId: string): string {
    return `${userId}:${triggerId}`;
  }

  private generateId(): string {
    return `trig_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Save or update a trigger
   */
  async save(trigger: PersonalizedTrigger): Promise<void> {
    const key = this.generateKey(trigger.userId, trigger.id);
    this.storage.set(key, { trigger, version: Date.now() });

    // Update user index
    if (!this.userIndex.has(trigger.userId)) {
      this.userIndex.set(trigger.userId, new Set());
    }
    this.userIndex.get(trigger.userId)!.add(trigger.id);

    // Update phrase index
    if (!this.phraseIndex.has(trigger.normalizedTrigger)) {
      this.phraseIndex.set(trigger.normalizedTrigger, new Set());
    }
    this.phraseIndex.get(trigger.normalizedTrigger)!.add(key);
  }

  /**
   * Create a new trigger with generated ID
   */
  async create(partial: Omit<PersonalizedTrigger, 'id' | 'createdAt'>): Promise<PersonalizedTrigger> {
    const trigger: PersonalizedTrigger = {
      ...partial,
      id: this.generateId(),
      createdAt: Date.now(),
    };
    await this.save(trigger);
    return trigger;
  }

  /**
   * Get a trigger by ID
   */
  async getById(userId: string, triggerId: string): Promise<PersonalizedTrigger | null> {
    const key = this.generateKey(userId, triggerId);
    const entry = this.storage.get(key);
    return entry?.trigger ?? null;
  }

  /**
   * Get all triggers for a user
   */
  async getByUser(userId: string): Promise<PersonalizedTrigger[]> {
    const triggerIds = this.userIndex.get(userId);
    if (!triggerIds) return [];

    const triggers: PersonalizedTrigger[] = [];
    for (const triggerId of triggerIds) {
      const key = this.generateKey(userId, triggerId);
      const entry = this.storage.get(key);
      if (entry) {
        triggers.push(entry.trigger);
      }
    }
    return triggers;
  }

  /**
   * Get triggers for a user sorted by confidence (descending)
   */
  async getByUserSorted(userId: string, limit?: number): Promise<PersonalizedTrigger[]> {
    const triggers = await this.getByUser(userId);
    triggers.sort((a, b) => b.confidence - a.confidence);
    return limit ? triggers.slice(0, limit) : triggers;
  }

  /**
   * Find triggers by normalized phrase
   */
  async findByPhrase(normalizedPhrase: string): Promise<PersonalizedTrigger[]> {
    const keys = this.phraseIndex.get(normalizedPhrase);
    if (!keys) return [];

    const triggers: PersonalizedTrigger[] = [];
    for (const key of keys) {
      const entry = this.storage.get(key);
      if (entry) {
        triggers.push(entry.trigger);
      }
    }
    return triggers;
  }

  /**
   * Find triggers by skill ID for a user
   */
  async findBySkill(userId: string, skillId: string): Promise<PersonalizedTrigger[]> {
    const triggers = await this.getByUser(userId);
    return triggers.filter(t => t.skillId === skillId);
  }

  /**
   * Update a trigger
   */
  async update(
    userId: string,
    triggerId: string,
    updates: Partial<Omit<PersonalizedTrigger, 'id' | 'userId'>>
  ): Promise<PersonalizedTrigger | null> {
    const key = this.generateKey(userId, triggerId);
    const entry = this.storage.get(key);
    if (!entry) return null;

    const updated: PersonalizedTrigger = {
      ...entry.trigger,
      ...updates,
      id: triggerId,
      userId,
    };

    this.storage.set(key, { trigger: updated, version: Date.now() });

    // Update phrase index if normalizedTrigger changed
    if (updates.normalizedTrigger && updates.normalizedTrigger !== entry.trigger.normalizedTrigger) {
      const oldKeys = this.phraseIndex.get(entry.trigger.normalizedTrigger);
      if (oldKeys) {
        oldKeys.delete(key);
      }
      if (!this.phraseIndex.has(updated.normalizedTrigger)) {
        this.phraseIndex.set(updated.normalizedTrigger, new Set());
      }
      this.phraseIndex.get(updated.normalizedTrigger)!.add(key);
    }

    return updated;
  }

  /**
   * Delete a trigger
   */
  async delete(userId: string, triggerId: string): Promise<boolean> {
    const key = this.generateKey(userId, triggerId);
    const entry = this.storage.get(key);
    if (!entry) return false;

    this.storage.delete(key);

    // Update user index
    const userTriggers = this.userIndex.get(userId);
    if (userTriggers) {
      userTriggers.delete(triggerId);
    }

    // Update phrase index
    const phraseKeys = this.phraseIndex.get(entry.trigger.normalizedTrigger);
    if (phraseKeys) {
      phraseKeys.delete(key);
    }

    return true;
  }

  /**
   * Delete all triggers for a user
   */
  async deleteByUser(userId: string): Promise<number> {
    const triggerIds = this.userIndex.get(userId);
    if (!triggerIds) return 0;

    let count = 0;
    for (const triggerId of [...triggerIds]) {
      if (await this.delete(userId, triggerId)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get trigger statistics for a user
   */
  async getStats(userId: string): Promise<TriggerStats> {
    const triggers = await this.getByUser(userId);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Count usage by skill
    const skillUsage = new Map<string, number>();
    let maxUsage = 0;
    let mostUsedSkill: string | null = null;

    for (const trigger of triggers) {
      const current = skillUsage.get(trigger.skillId) || 0;
      const updated = current + trigger.usageCount;
      skillUsage.set(trigger.skillId, updated);

      if (updated > maxUsage) {
        maxUsage = updated;
        mostUsedSkill = trigger.skillId;
      }
    }

    return {
      totalTriggers: triggers.length,
      highConfidenceTriggers: triggers.filter(t => t.confidence > 0.7).length,
      mostUsedSkill,
      recentLearned: triggers.filter(t => t.createdAt > sevenDaysAgo).length,
    };
  }

  /**
   * Get total count across all users
   */
  async getTotalCount(): Promise<number> {
    return this.storage.size;
  }

  /**
   * Get all unique user IDs
   */
  async getAllUserIds(): Promise<string[]> {
    return Array.from(this.userIndex.keys());
  }

  /**
   * Clean up old triggers (based on lastUsed)
   */
  async cleanupOldTriggers(maxAgeMs: number): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    let count = 0;

    for (const [key, entry] of this.storage) {
      if (entry.trigger.lastUsed < cutoff) {
        const [userId, triggerId] = key.split(':');
        if (await this.delete(userId, triggerId)) {
          count++;
        }
      }
    }

    return count;
  }
}

// Singleton instance
export const triggerStorage = new TriggerStorage();
