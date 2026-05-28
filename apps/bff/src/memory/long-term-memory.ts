/**
 * Long-term Memory Manager
 * Manages persistent user memory across sessions
 * - User profile with work style preferences
 * - Skill usage patterns
 * - Knowledge graph
 * - Project history
 * - Stored in SQLite via file-based storage (for MVP)
 */

import { existsSync, mkdirSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { LRUCache } from "../utils/lru-cache.js";
import type {
  LongTermMemory,
  UserProfile,
  SkillPattern,
  SkillUsage,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  Project,
  BurnoutHistory,
  ILongTermMemoryManager,
} from "./types.js";

// 内存缓存上限配置
const MAX_MEMORY_CACHE_SIZE = parseInt(process.env.MAX_MEMORY_CACHE_SIZE || "1000", 10);

// Storage directory for long-term memory
const MEMORY_DIR = process.env.MINECHO_MEMORY_DIR || join(process.cwd(), "workspace", "memory");

// Batch write configuration
const BATCH_WRITE_ENABLED = process.env.ENABLE_BATCH_WRITE !== "false"; // Default: true
const BATCH_INTERVAL = parseInt(process.env.BATCH_WRITE_INTERVAL_MS || "30000", 10); // Default: 30s

// Ensure memory directory exists
function ensureMemoryDir(): void {
  if (!existsSync(MEMORY_DIR)) {
    try {
      mkdirSync(MEMORY_DIR, { recursive: true });
    } catch (error) {
      logger.warn(`[LongTermMemory] Failed to create memory directory`, { dir: MEMORY_DIR, error });
      // Fallback to temp directory
      const fallbackDir = join(process.cwd(), "tmp", "memory");
      if (!existsSync(fallbackDir)) {
        try {
          mkdirSync(fallbackDir, { recursive: true });
        } catch (fallbackError) {
          logger.error("[LongTermMemory] Failed to create fallback memory directory:", { error: fallbackError });
        }
      }
    }
  }
}

function getUserMemoryPath(userId: string): string {
  return join(MEMORY_DIR, `${userId}.json`);
}

function createDefaultUserProfile(userId: string): UserProfile {
  const now = Date.now();
  return {
    userId,
    workStyle: {
      preferredResponseLength: "adaptive",
      communicationTone: "professional",
      peakProductivityHours: [9, 10, 11, 14, 15, 16],
      decisionMakingStyle: "collaborative",
    },
    technicalStack: {
      languages: [],
      frameworks: [],
      tools: [],
      databases: [],
      platforms: [],
      // Extended categories for delivery engineers
      cloud_products: [],
      storage: [],
      networking: [],
      ai_ml: [],
      security_products: [],
      delivery_ops: [],
      proficiency: {},
    },
    domainExpertise: [],
    frequentlyUsedSkills: [],
    customShortcuts: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

function createDefaultSkillPattern(userId: string): SkillPattern {
  return {
    userId,
    patterns: [],
    preferredCategories: [],
    commonWorkflows: [],
    peakUsageHours: [9, 10, 11, 14, 15, 16],
    updatedAt: Date.now(),
  };
}

function createDefaultKnowledgeGraph(userId: string): KnowledgeGraph {
  return {
    userId,
    nodes: [],
    edges: [],
    lastUpdated: Date.now(),
  };
}

function createDefaultLongTermMemory(userId: string): LongTermMemory {
  const now = Date.now();
  return {
    userId,
    userProfile: createDefaultUserProfile(userId),
    skillUsagePatterns: createDefaultSkillPattern(userId),
    knowledgeGraph: createDefaultKnowledgeGraph(userId),
    projectHistory: [],
    lastUpdated: now,
  };
}

class LongTermMemoryManager implements ILongTermMemoryManager {
  // 使用LRU缓存替代普通Map，限制最大用户内存缓存数
  private memoryCache = new LRUCache<string, LongTermMemory>({
    maxSize: MAX_MEMORY_CACHE_SIZE,
    name: "LongTermMemoryCache",
    logEviction: true,
  });

  // Batch write optimization fields
  private writeQueue = new Map<string, LongTermMemory>();
  private writeTimer: NodeJS.Timeout | null = null;
  private isFlushInProgress = false;

  constructor() {
    ensureMemoryDir();
    if (BATCH_WRITE_ENABLED) {
      logger.info(`[LongTermMemory] Initialized with max cache size: ${MAX_MEMORY_CACHE_SIZE}, batch write enabled, interval: ${BATCH_INTERVAL}ms`);
    } else {
      logger.info(`[LongTermMemory] Initialized with max cache size: ${MAX_MEMORY_CACHE_SIZE}, batch write disabled, using synchronous writes`);
    }
  }

  // ==================== Batch Write Optimization ====================

  /**
   * Mark a user's memory for batch save
   * Internal use only - replaces direct saveUserMemory calls
   */
  private markForSave(userId: string, memory: LongTermMemory): void {
    memory.lastUpdated = Date.now();
    this.memoryCache.set(userId, memory);

    if (BATCH_WRITE_ENABLED) {
      // Add to write queue
      this.writeQueue.set(userId, memory);
      this.scheduleBatchWrite();
    } else {
      // Fallback to immediate write
      this.saveUserMemoryImmediate(userId, memory).catch((error) => {
        logger.error("[LongTermMemory] Failed to save memory (sync mode):", { userId, error });
      });
    }
  }

  /**
   * Schedule a batch write operation
   * Uses debouncing to batch multiple writes within the interval
   */
  private scheduleBatchWrite(): void {
    if (this.writeTimer) {
      // Timer already scheduled, will batch with pending writes
      return;
    }

    this.writeTimer = setTimeout(() => {
      this.flushWriteQueue().catch((error) => {
        logger.error("[LongTermMemory] Batch write failed:", { error });
      });
    }, BATCH_INTERVAL);
    this.writeTimer.unref?.();
  }

  /**
   * Execute batch write for all queued memory updates
   */
  private async flushWriteQueue(): Promise<void> {
    if (this.isFlushInProgress || this.writeQueue.size === 0) {
      this.writeTimer = null;
      return;
    }

    this.isFlushInProgress = true;
    const startTime = Date.now();
    const queueSize = this.writeQueue.size;

    try {
      // Copy queue and clear it immediately to allow new writes during processing
      const queueSnapshot = new Map(this.writeQueue);
      this.writeQueue.clear();
      this.writeTimer = null;

      // Execute all writes in parallel
      const writePromises: Promise<void>[] = [];
      for (const [userId, memory] of queueSnapshot) {
        writePromises.push(
          this.saveUserMemoryImmediate(userId, memory).catch((error) => {
            logger.error("[LongTermMemory] Failed to save user memory during batch write:", {
              userId,
              error,
            });
            // Re-queue failed writes for next batch
            this.writeQueue.set(userId, memory);
          })
        );
      }

      await Promise.all(writePromises);

      const duration = Date.now() - startTime;
      logger.debug("[LongTermMemory] Batch write completed:", {
        count: queueSize,
        durationMs: duration,
      });
    } catch (error) {
      logger.error("[LongTermMemory] Unexpected error during batch write:", { error });
    } finally {
      this.isFlushInProgress = false;

      // If new items were added during processing, schedule another batch
      if (this.writeQueue.size > 0 && !this.writeTimer) {
        this.scheduleBatchWrite();
      }
    }
  }

  /**
   * Immediately save user memory to disk (internal use)
   * This is the actual file I/O operation
   */
  private async saveUserMemoryImmediate(userId: string, memory: LongTermMemory): Promise<void> {
    const filePath = getUserMemoryPath(userId);
    await writeFile(filePath, JSON.stringify(memory, null, 2), "utf-8");
  }

  /**
   * Flush all pending writes immediately
   * Call this during graceful shutdown to ensure no data loss
   */
  async flush(): Promise<void> {
    if (!BATCH_WRITE_ENABLED) {
      logger.info("[LongTermMemory] Flush called but batch write is disabled");
      return;
    }

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    const pendingCount = this.writeQueue.size;
    if (pendingCount > 0) {
      logger.info("[LongTermMemory] Flushing pending writes:", { count: pendingCount });
      await this.flushWriteQueue();
    } else {
      logger.debug("[LongTermMemory] No pending writes to flush");
    }
  }

  // ==================== Core Memory Operations ====================

  private async loadUserMemory(userId: string): Promise<LongTermMemory> {
    // Check cache first
    const cached = this.memoryCache.get(userId);
    if (cached) {
      return cached;
    }

    // Try to load from disk
    const filePath = getUserMemoryPath(userId);
    try {
      const data = await readFile(filePath, "utf-8");
      const memory = JSON.parse(data) as LongTermMemory;
      this.memoryCache.set(userId, memory);
      return memory;
    } catch {
      // File doesn't exist or is corrupted, create default
      const memory = createDefaultLongTermMemory(userId);
      // Use markForSave to ensure consistency with batch write logic
      await this.saveUserMemory(userId, memory);
      return memory;
    }
  }

  /**
   * Public save method - maintains backward compatibility
   * When batch write is enabled, this queues the write
   * When disabled, this performs immediate write
   */
  private async saveUserMemory(userId: string, memory: LongTermMemory): Promise<void> {
    this.markForSave(userId, memory);

    // If batch write is disabled, we need to wait for immediate write
    // markForSave handles this asynchronously in sync mode
    if (!BATCH_WRITE_ENABLED) {
      // Small delay to allow the async write to complete in most cases
      // This maintains approximate backward compatibility for sync callers
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  // ==================== User Profile ====================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const memory = await this.loadUserMemory(userId);
      return memory.userProfile;
    } catch (error) {
      logger.error(`[LongTermMemory] Failed to get user profile:`, { error });
      return null;
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const memory = await this.loadUserMemory(userId);

    memory.userProfile = {
      ...memory.userProfile,
      ...updates,
      userId, // Ensure userId is not overwritten
      updatedAt: Date.now(),
      version: memory.userProfile.version + 1,
    };

    await this.saveUserMemory(userId, memory);
    return memory.userProfile;
  }

  async updateWorkStyle(
    userId: string,
    workStyleUpdates: Partial<UserProfile["workStyle"]>
  ): Promise<UserProfile> {
    const memory = await this.loadUserMemory(userId);

    memory.userProfile.workStyle = {
      ...memory.userProfile.workStyle,
      ...workStyleUpdates,
    };

    return this.updateUserProfile(userId, memory.userProfile);
  }

  async addTechnicalSkill(
    userId: string,
    category: keyof UserProfile["technicalStack"],
    skill: string,
    proficiency?: "beginner" | "intermediate" | "advanced" | "expert"
  ): Promise<UserProfile> {
    const memory = await this.loadUserMemory(userId);

    if (category === "proficiency") {
      if (proficiency) {
        memory.userProfile.technicalStack.proficiency[skill] = proficiency;
      }
    } else {
      let existing = memory.userProfile.technicalStack[category];
      // Handle potentially undefined categories (for backward compatibility)
      if (!existing) {
        // Initialize new category array for extended categories
        (memory.userProfile.technicalStack as any)[category] = [];
        existing = memory.userProfile.technicalStack[category];
      }
      if (existing && !existing.includes(skill)) {
        existing.push(skill);
      }
      if (proficiency) {
        memory.userProfile.technicalStack.proficiency[skill] = proficiency;
      }
    }

    return this.updateUserProfile(userId, memory.userProfile);
  }

  async addCustomShortcut(
    userId: string,
    trigger: string,
    action: string,
    skillId?: string,
    parameters?: Record<string, unknown>
  ): Promise<UserProfile> {
    const memory = await this.loadUserMemory(userId);

    const existingIndex = memory.userProfile.customShortcuts.findIndex(
      (s) => s.trigger === trigger
    );

    const shortcut = {
      id: `shortcut-${Date.now()}`,
      trigger,
      action,
      skillId,
      parameters,
      createdAt: Date.now(),
      useCount: 0,
    };

    if (existingIndex >= 0) {
      memory.userProfile.customShortcuts[existingIndex] = shortcut;
    } else {
      memory.userProfile.customShortcuts.push(shortcut);
    }

    return this.updateUserProfile(userId, memory.userProfile);
  }

  // ==================== Skill Patterns ====================

  async getSkillPatterns(userId: string): Promise<SkillPattern | null> {
    try {
      const memory = await this.loadUserMemory(userId);
      return memory.skillUsagePatterns;
    } catch (error) {
      logger.error(`[LongTermMemory] Failed to get skill patterns:`, { error });
      return null;
    }
  }

  async recordSkillUsage(
    userId: string,
    skillId: string,
    skillName: string,
    success: boolean,
    details?: {
      failureReason?: string;
      latencyMs?: number;
      tokens?: number;
      feedback?: "positive" | "negative" | "neutral";
    }
  ): Promise<void> {
    const memory = await this.loadUserMemory(userId);
    const patterns = memory.skillUsagePatterns;

    const existingIndex = patterns.patterns.findIndex(
      (p) => p.skillId === skillId
    );

    const now = Date.now();
    const hour = new Date().getHours();
    const dayOfWeek = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (existingIndex >= 0) {
      const pattern = patterns.patterns[existingIndex];
      pattern.totalUses += 1;
      pattern.lastUsedAt = now;

      // Update success rate
      const totalSuccesses = pattern.averageSuccessRate * (pattern.totalUses - 1);
      pattern.averageSuccessRate =
        (totalSuccesses + (success ? 1 : 0)) / pattern.totalUses;

      // Update usage by hour
      pattern.usageByHour[hour] = (pattern.usageByHour[hour] || 0) + 1;

      // Update usage by day
      pattern.usageByDay[dayOfWeek] = (pattern.usageByDay[dayOfWeek] || 0) + 1;

      // Update optional details
      if (details) {
        if (details.failureReason) {
          if (!pattern.failureReasons) pattern.failureReasons = [];
          pattern.failureReasons.push(details.failureReason);
          if (pattern.failureReasons.length > 10) {
            pattern.failureReasons = pattern.failureReasons.slice(-10);
          }
        }
        if (details.latencyMs !== undefined) {
          if (pattern.averageLatencyMs === undefined) {
            pattern.averageLatencyMs = details.latencyMs;
          } else {
            pattern.averageLatencyMs =
              (pattern.averageLatencyMs * (pattern.totalUses - 1) + details.latencyMs) /
              pattern.totalUses;
          }
        }
        if (details.tokens !== undefined) {
          if (pattern.averageTokensPerCall === undefined) {
            pattern.averageTokensPerCall = details.tokens;
          } else {
            pattern.averageTokensPerCall =
              (pattern.averageTokensPerCall * (pattern.totalUses - 1) + details.tokens) /
              pattern.totalUses;
          }
        }
        if (details.feedback) {
          if (!pattern.userFeedbackSummary) {
            pattern.userFeedbackSummary = { positive: 0, negative: 0, neutral: 0 };
          }
          pattern.userFeedbackSummary[details.feedback] += 1;
        }
      }
    } else {
      const newPattern: SkillUsage = {
        skillId,
        skillName,
        totalUses: 1,
        lastUsedAt: now,
        averageSuccessRate: success ? 1 : 0,
        usageByHour: { [hour]: 1 },
        usageByDay: { [dayOfWeek]: 1 },
        failureReasons: details?.failureReason ? [details.failureReason] : undefined,
        averageLatencyMs: details?.latencyMs,
        averageTokensPerCall: details?.tokens,
        userFeedbackSummary: details?.feedback
          ? { positive: 0, negative: 0, neutral: 0, [details.feedback]: 1 }
          : undefined,
      };
      patterns.patterns.push(newPattern);
    }

    // Update peak usage hours
    const hourCounts: Record<number, number> = {};
    for (const pattern of patterns.patterns) {
      for (const [h, count] of Object.entries(pattern.usageByHour)) {
        hourCounts[parseInt(h)] = (hourCounts[parseInt(h)] || 0) + count;
      }
    }
    patterns.peakUsageHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([h]) => parseInt(h));

    patterns.updatedAt = now;
    await this.saveUserMemory(userId, memory);
  }

  async updateSkillFavoriteParams(
    userId: string,
    skillId: string,
    params: Record<string, unknown>
  ): Promise<void> {
    const memory = await this.loadUserMemory(userId);
    const pattern = memory.skillUsagePatterns.patterns.find(
      (p) => p.skillId === skillId
    );

    if (pattern) {
      pattern.favoriteParameters = { ...pattern.favoriteParameters, ...params };
      await this.saveUserMemory(userId, memory);
    }
  }

  async getMostUsedSkills(userId: string, limit: number = 5): Promise<SkillUsage[]> {
    const patterns = await this.getSkillPatterns(userId);
    if (!patterns) return [];

    return patterns.patterns
      .sort((a, b) => b.totalUses - a.totalUses)
      .slice(0, limit);
  }

  // ==================== Knowledge Graph ====================

  async getKnowledgeGraph(userId: string): Promise<KnowledgeGraph | null> {
    try {
      const memory = await this.loadUserMemory(userId);
      return memory.knowledgeGraph;
    } catch (error) {
      logger.error(`[LongTermMemory] Failed to get knowledge graph:`, { error });
      return null;
    }
  }

  async addKnowledgeNode(
    userId: string,
    node: Omit<KnowledgeNode, "id" | "createdAt">
  ): Promise<KnowledgeNode> {
    const memory = await this.loadUserMemory(userId);

    // Check if node already exists
    const existingIndex = memory.knowledgeGraph.nodes.findIndex(
      (n) => n.name.toLowerCase() === node.name.toLowerCase() && n.type === node.type
    );

    if (existingIndex >= 0) {
      // Update existing node
      const existing = memory.knowledgeGraph.nodes[existingIndex];
      existing.lastAccessedAt = Date.now();
      existing.accessCount += 1;
      await this.saveUserMemory(userId, memory);
      return existing;
    }

    // Create new node
    const newNode: KnowledgeNode = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };

    memory.knowledgeGraph.nodes.push(newNode);
    memory.knowledgeGraph.lastUpdated = Date.now();
    await this.saveUserMemory(userId, memory);

    return newNode;
  }

  async addKnowledgeEdge(
    userId: string,
    edge: Omit<KnowledgeEdge, "createdAt">
  ): Promise<void> {
    const memory = await this.loadUserMemory(userId);

    // Check if edge already exists
    const existing = memory.knowledgeGraph.edges.find(
      (e) =>
        e.sourceId === edge.sourceId &&
        e.targetId === edge.targetId &&
        e.relation === edge.relation
    );

    if (existing) {
      // Strengthen existing edge
      existing.strength = Math.min(1, existing.strength + 0.1);
      existing.evidence.push(...edge.evidence);
    } else {
      const newEdge: KnowledgeEdge = {
        ...edge,
        createdAt: Date.now(),
      };
      memory.knowledgeGraph.edges.push(newEdge);
    }

    memory.knowledgeGraph.lastUpdated = Date.now();
    await this.saveUserMemory(userId, memory);
  }

  async searchKnowledgeNodes(
    userId: string,
    query: string,
    type?: string
  ): Promise<KnowledgeNode[]> {
    const graph = await this.getKnowledgeGraph(userId);
    if (!graph) return [];

    const lowerQuery = query.toLowerCase();
    return graph.nodes.filter((node) => {
      const matchesType = type ? node.type === type : true;
      const matchesQuery =
        node.name.toLowerCase().includes(lowerQuery) ||
        (node.description?.toLowerCase().includes(lowerQuery) ?? false);
      return matchesType && matchesQuery;
    });
  }

  // ==================== Projects ====================

  async getProjects(userId: string): Promise<Project[]> {
    try {
      const memory = await this.loadUserMemory(userId);
      return memory.projectHistory;
    } catch (error) {
      logger.error(`[LongTermMemory] Failed to get projects:`, { error });
      return [];
    }
  }

  async addProject(
    userId: string,
    project: Omit<Project, "id">
  ): Promise<Project> {
    const memory = await this.loadUserMemory(userId);

    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    memory.projectHistory.push(newProject);
    await this.saveUserMemory(userId, memory);

    return newProject;
  }

  async updateProject(
    userId: string,
    projectId: string,
    updates: Partial<Project>
  ): Promise<Project> {
    const memory = await this.loadUserMemory(userId);
    const index = memory.projectHistory.findIndex((p) => p.id === projectId);

    if (index === -1) {
      throw new Error(`Project ${projectId} not found`);
    }

    memory.projectHistory[index] = {
      ...memory.projectHistory[index],
      ...updates,
    };

    await this.saveUserMemory(userId, memory);
    return memory.projectHistory[index];
  }

  async getActiveProjects(userId: string): Promise<Project[]> {
    const projects = await this.getProjects(userId);
    return projects.filter((p) => p.status === "active");
  }

  // ==================== Full Memory Operations ====================

  async getFullMemory(userId: string): Promise<LongTermMemory | null> {
    try {
      return await this.loadUserMemory(userId);
    } catch (error) {
      logger.error(`[LongTermMemory] Failed to get full memory:`, { error });
      return null;
    }
  }

  async deleteUserMemory(userId: string): Promise<void> {
    this.memoryCache.delete(userId);
    // Also remove from write queue if present
    this.writeQueue.delete(userId);
    const filePath = getUserMemoryPath(userId);
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(filePath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  async exportMemory(userId: string): Promise<string> {
    const memory = await this.loadUserMemory(userId);
    return JSON.stringify(memory, null, 2);
  }

  async importMemory(userId: string, jsonData: string): Promise<void> {
    const memory = JSON.parse(jsonData) as LongTermMemory;
    memory.userId = userId; // Ensure correct userId
    memory.lastUpdated = Date.now();
    await this.saveUserMemory(userId, memory);
  }

  // ==================== Burnout History ====================

  async getBurnoutHistory(userId: string): Promise<BurnoutHistory | null> {
    try {
      const memory = await this.loadUserMemory(userId);
      return memory.burnoutHistory || null;
    } catch (error) {
      logger.error(`[LongTermMemory] Failed to get burnout history:`, { error });
      return null;
    }
  }

  async updateBurnoutHistory(
    userId: string,
    updates: Partial<BurnoutHistory>
  ): Promise<BurnoutHistory> {
    const memory = await this.loadUserMemory(userId);

    if (!memory.burnoutHistory) {
      memory.burnoutHistory = {
        dailyScores: [],
        consecutiveHighRiskDays: 0,
        careFrequency: "daily",
        optedOut: false,
        lastUpdated: Date.now(),
      };
    }

    memory.burnoutHistory = {
      ...memory.burnoutHistory,
      ...updates,
      lastUpdated: Date.now(),
    };

    await this.saveUserMemory(userId, memory);
    return memory.burnoutHistory;
  }

  // ==================== Background Review Insights ====================

  async addInsight(
    userId: string,
    insight: { content: string; source: string; timestamp: number }
  ): Promise<void> {
    const memory = await this.loadUserMemory(userId);
    if (!memory.insights) {
      memory.insights = [];
    }
    // Deduplicate: don't add exact duplicates
    if (memory.insights.some((i) => i.content === insight.content)) {
      return;
    }
    memory.insights.push(insight);
    // Keep only last 50 insights to prevent bloat
    if (memory.insights.length > 50) {
      memory.insights = memory.insights.slice(-50);
    }
    memory.lastUpdated = Date.now();
    await this.saveUserMemory(userId, memory);
  }
}

// Export singleton instance
export const longTermMemoryManager = new LongTermMemoryManager();

// Export class for testing
export { LongTermMemoryManager };
