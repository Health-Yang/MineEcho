/**
 * Memory Tree Manager
 * Core orchestrator for hierarchical memory tree with bucket-seal mechanics
 * Version 2.0 - Auto-compression enabled
 */

import { logger } from "../../utils/logger.js";
import {
  type L0Chunk,
  type L0ChunkInput,
  type L1Summary,
  type L2Summary,
  type L3Summary,
  type MemoryEntity,
  type MemoryRelation,
  type MemoryContext,
  type RecallOptions,
  type RecallResult,
  type MemoryTreeConfig,
  type MemorySource,
  type EntityKind,
  type QuotaConfig,
  type QuotaUsage,
  type CompressionJob,
  type CompressionResult,
  DEFAULT_MEMORY_TREE_CONFIG,
  DEFAULT_QUOTA_CONFIG,
  getQuotaStatus,
  CompressionPriority,
  getDateString,
  getWeekStart,
  getMonth,
} from "./types.js";
import * as db from "./tree-db.js";
import * as store from "./content-store.js";
import {
  generateL1SummaryFromChunks,
  generateL2SummaryFromL1,
  generateL3SummaryFromL2,
  extractEntities,
  estimateTokens,
  createL1Summary,
  createL2Summary,
  createL3Summary,
} from "./summarizer.js";
import {
  type AggregatedQueryOptions,
  type AggregatedQueryResult,
  type MemoryItem,
} from "./types.js";
import { longTermMemoryManager } from "../long-term-memory.js";
import { shortTermMemoryManager } from "../short-term-memory.js";
import { scoreSemanticMemory } from "./semantic-recall.js";
import { buildSemanticVector, cosineSimilarity } from "./semantic-vector.js";
import { scoreMemoryEmbeddingBatch } from "./memory-embedding.js";

// ============================================================================
// Background Compression Queue
// ============================================================================

class BackgroundCompressionQueue {
  private queue: CompressionJob[] = [];
  private processing = false;
  private singleProcessing = false;
  private readonly maxConcurrent = 2;
  private readonly processInterval = 30000; // 30 seconds

  constructor(private manager: MemoryTreeManager) {
    // Start processing loop
    setInterval(() => this.processQueue(), this.processInterval).unref?.();
  }

  /**
   * Add a compression job to the queue
   * @param job The compression job to add
   * @param immediate Whether to trigger immediate processing (default: false)
   */
  enqueue(job: Omit<CompressionJob, "id" | "status" | "createdAt">, immediate = false): void {
    const compressionJob: CompressionJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      status: "pending",
      createdAt: Date.now(),
    };

    // Insert by priority (higher first)
    const insertIndex = this.queue.findIndex(j => j.priority < job.priority);
    if (insertIndex === -1) {
      this.queue.push(compressionJob);
    } else {
      this.queue.splice(insertIndex, 0, compressionJob);
    }

    logger.info(`[CompressionQueue] Enqueued job ${compressionJob.id} with priority ${job.priority}`);

    // Trigger immediate processing for high-priority jobs or when explicitly requested
    if (immediate || job.priority === CompressionPriority.HIGH) {
      this.triggerImmediate();
    }
  }

  /**
   * Process a single job from the queue (sequential processing)
   * This ensures one job completes before the next starts
   */
  private async processNext(): Promise<void> {
    if (this.singleProcessing) return;
    if (this.queue.length === 0) return;

    this.singleProcessing = true;

    try {
      // Find the first pending job (highest priority first)
      const jobIndex = this.queue.findIndex(j => j.status === "pending");
      if (jobIndex === -1) return;

      const job = this.queue[jobIndex];
      logger.info(`[CompressionQueue] Processing job ${job.id} (${job.sourceLevel}->${job.targetLevel})`);

      try {
        job.status = "running";
        const result = await this.manager.performCompression(job);
        job.status = result.success ? "completed" : "failed";
        if (result.error) {
          job.error = result.error;
        }
        logger.info(`[CompressionQueue] Job ${job.id} ${job.status}`, result);
      } catch (err) {
        job.status = "failed";
        job.error = (err as Error).message;
        logger.error(`[CompressionQueue] Job ${job.id} failed:`, err);
      }

      // Remove completed/failed jobs from queue
      this.queue = this.queue.filter(j => j.status === "pending" || j.status === "running");

      // If there are more jobs in the queue, continue processing (with delay)
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 2000); // 2 second delay between jobs
      }
    } finally {
      this.singleProcessing = false;
    }
  }

  /**
   * Process the compression queue (batch processing mode)
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      const jobs = this.queue.splice(0, this.maxConcurrent);
      logger.info(`[CompressionQueue] Processing ${jobs.length} jobs (batch mode)`);

      await Promise.all(
        jobs.map(async (job) => {
          try {
            job.status = "running";
            const result = await this.manager.performCompression(job);
            job.status = result.success ? "completed" : "failed";
            if (result.error) {
              job.error = result.error;
            }
            logger.info(`[CompressionQueue] Job ${job.id} ${job.status}`, result);
          } catch (err) {
            job.status = "failed";
            job.error = (err as Error).message;
            logger.error(`[CompressionQueue] Job ${job.id} failed:`, err);
          }
        })
      );
    } finally {
      this.processing = false;
    }
  }

  /**
   * Trigger immediate processing of the next job in queue
   * Call this after enqueueing a high-priority job
   */
  triggerImmediate(): void {
    logger.debug(`[CompressionQueue] Triggering immediate processing, queue length: ${this.queue.length}`);
    this.processNext();
  }

  /**
   * Get queue status
   */
  getStatus(): { pending: number; running: number; total: number; singleProcessing: boolean } {
    return {
      pending: this.queue.filter(j => j.status === "pending").length,
      running: this.queue.filter(j => j.status === "running").length,
      total: this.queue.length,
      singleProcessing: this.singleProcessing,
    };
  }
}

// ============================================================================
// Memory Tree Manager
// ============================================================================

export class MemoryTreeManager {
  private config: MemoryTreeConfig;
  private quotaConfig: QuotaConfig;
  private pendingSeals: Map<string, NodeJS.Timeout> = new Map();
  private compressionQueue: BackgroundCompressionQueue;

  constructor(
    config: MemoryTreeConfig = DEFAULT_MEMORY_TREE_CONFIG,
    quotaConfig: QuotaConfig = DEFAULT_QUOTA_CONFIG
  ) {
    this.config = config;
    this.quotaConfig = quotaConfig;
    this.compressionQueue = new BackgroundCompressionQueue(this);

    logger.info("[MemoryTree] Initialized with config:", {
      l0ChunkMaxTokens: config.l0ChunkMaxTokens,
      l0SealThreshold: config.l0SealThreshold,
      l1Fanout: config.l1Fanout,
      l2Fanout: config.l2Fanout,
      l3Fanout: config.l3Fanout,
      quotaConfig: quotaConfig,
    });
  }

  // ============================================================================
  // L0 Chunk Storage
  // ============================================================================

  /**
   * Store a new L0 chunk and potentially trigger seal
   */
  async storeChunk(userId: string, input: L0ChunkInput): Promise<{
    chunk: L0Chunk;
    sealed: boolean;
    sealResult?: { level: 1 | 2 | 3; summaryId: string };
  }> {
    const now = Date.now();
    const tokenCount = estimateTokens(input.content);
    const importance = input.importance ?? 0.5;

    // Generate chunk ID
    const chunkId = `l0-${userId}-${now}-${Math.random().toString(36).slice(2, 9)}`;

    const chunk: L0Chunk = {
      id: chunkId,
      userId,
      source: input.source,
      content: input.content,
      tokenCount,
      createdAt: now,
      entityTags: input.entityTags || [],
      sourceRef: input.sourceRef,
      importance,
    };

    // Store in SQLite
    db.storeL0Chunk(chunk);

    // Write to Obsidian-compatible file
    await store.writeL0Chunk(chunk);

    // Extract and store entities
    if (tokenCount > 100) {
      // Only extract entities for substantial content
      this.extractAndStoreEntities(userId, chunk.content, chunk.entityTags);
    }

    // Check if seal is needed
    const todayTokens = db.getL0TokensToday(userId);
    const sealNeeded = todayTokens >= this.config.l0SealThreshold;

    logger.debug(`[MemoryTree] Stored chunk ${chunkId}, today tokens: ${todayTokens}, seal needed: ${sealNeeded}`);

    // Trigger seal if needed
    if (sealNeeded) {
      // Debounce seal to avoid multiple concurrent seals
      const sealKey = `${userId}:${getDateString()}`;
      if (!this.pendingSeals.has(sealKey)) {
        // Schedule seal after a short delay (debounce)
        const timeout = setTimeout(() => {
          this.pendingSeals.delete(sealKey);
          this.performL1Seal(userId).catch(err => {
            logger.error("[MemoryTree] L1 seal failed:", err);
          });
        }, 5000); // 5 second debounce
        this.pendingSeals.set(sealKey, timeout);
      }
    }

    // Check quota and trigger auto-compression if needed (after storage)
    this.checkAndTriggerAutoCompression(userId);

    return {
      chunk,
      sealed: sealNeeded,
    };
  }

  // ============================================================================
  // Quota Management
  // ============================================================================

  /**
   * Get current quota usage for a user
   */
  getQuotaUsage(userId: string): QuotaUsage {
    const l0Tokens = db.getL0TokensTotal(userId);
    const l0Chunks = db.getL0Chunks(userId, { limit: 10000 }).length;
    const l1Summaries = db.getL1SummariesInRange(userId, "1970-01-01", "2099-12-31");
    const l1Tokens = l1Summaries.reduce((sum, s) => sum + s.tokenCount, 0);
    const l2Summaries = db.getL2SummariesInRange(userId, "1970-01-01", "2099-12-31");
    const l2Tokens = l2Summaries.reduce((sum, s) => sum + s.tokenCount, 0);
    const l3Summaries = db.getL3SummariesInRange(userId, "1970-01-01", "2099-12-31");
    const l3Tokens = l3Summaries.reduce((sum, s) => sum + s.tokenCount, 0);

    return {
      userId,
      l0Used: l0Tokens,
      l1Used: l1Tokens,
      l2Used: l2Tokens,
      l3Used: l3Tokens,
      totalUsed: l0Tokens + l1Tokens + l2Tokens + l3Tokens,
      l0Chunks,
      l1Count: l1Summaries.length,
      l2Count: l2Summaries.length,
      l3Count: l3Summaries.length,
      quota: this.quotaConfig,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Check quota and trigger auto-compression if threshold reached
   */
  private checkAndTriggerAutoCompression(userId: string): void {
    const usage = this.getQuotaUsage(userId);
    const threshold = this.quotaConfig.compressThreshold;

    // Check L0 quota - trigger compression if at threshold
    if (this.quotaConfig.l0Limit > 0) {
      const l0Percentage = usage.l0Used / this.quotaConfig.l0Limit;
      if (l0Percentage >= threshold) {
        logger.info(`[MemoryTree] L0 quota at ${(l0Percentage * 100).toFixed(1)}%, triggering auto-compression`);

        // Get low-importance chunks for compression
        const chunks = db.getL0Chunks(userId, { limit: 100 });
        const lowImportanceChunks = chunks
          .filter(c => c.importance < 0.5)
          .sort((a, b) => a.importance - b.importance);

        if (lowImportanceChunks.length > 0) {
          this.compressionQueue.enqueue({
            userId,
            sourceLevel: 0,
            targetLevel: 1,
            itemIds: lowImportanceChunks.slice(0, 10).map(c => c.id),
            priority: CompressionPriority.LOW,
          });
        }
      }
    }

    // Check L1 quota
    if (this.quotaConfig.l1Limit > 0) {
      const l1Percentage = usage.l1Used / this.quotaConfig.l1Limit;
      if (l1Percentage >= threshold) {
        logger.info(`[MemoryTree] L1 quota at ${(l1Percentage * 100).toFixed(1)}%, triggering weekly compression`);

        // Enqueue L1→L2 compression for the oldest week
        const oldestL1 = db.getRecentL1Summaries(userId, 1)[0];
        if (oldestL1) {
          const weekStart = getWeekStart(new Date(oldestL1.date));
          this.compressionQueue.enqueue({
            userId,
            sourceLevel: 1,
            targetLevel: 2,
            itemIds: [oldestL1.id],
            priority: CompressionPriority.LOW,
          });
        }
      }
    }
  }

  /**
   * Perform actual compression (called by queue)
   */
  async performCompression(job: CompressionJob): Promise<CompressionResult> {
    const { userId, sourceLevel, targetLevel, itemIds } = job;

    try {
      if (sourceLevel === 0 && targetLevel === 1) {
        // L0 → L1 compression
        const chunks = itemIds.map(id => db.getL0Chunks(userId, { limit: 1000 }).find(c => c.id === id)).filter(Boolean) as L0Chunk[];

        if (chunks.length === 0) {
          return { success: false, sourceLevel, targetLevel, compressedItems: 0, tokensFreed: 0, error: "No chunks found" };
        }

        const tokensFreed = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
        const output = await generateL1SummaryFromChunks(chunks);
        const summary = createL1Summary(userId, getDateString(), chunks, output);

        db.storeL1Summary(summary);
        await store.writeL1Summary(summary);

        // Mark chunks as compressed (soft delete)
        for (const chunk of chunks) {
          db.archiveL0Chunk(userId, chunk.id);
        }

        logger.info(`[MemoryTree] Compressed ${chunks.length} L0 chunks → L1 summary ${summary.id}`);

        return {
          success: true,
          sourceLevel,
          targetLevel,
          compressedItems: chunks.length,
          outputSummaryId: summary.id,
          tokensFreed,
        };
      }

      if (sourceLevel === 1 && targetLevel === 2) {
        // L1 → L2 compression
        const l1Summaries = itemIds.map(id => db.getL1Summary(userId, id)).filter(Boolean) as L1Summary[];

        if (l1Summaries.length === 0) {
          return { success: false, sourceLevel, targetLevel, compressedItems: 0, tokensFreed: 0, error: "No L1 summaries found" };
        }

        const tokensFreed = l1Summaries.reduce((sum, s) => sum + s.tokenCount, 0);
        const output = await generateL2SummaryFromL1(l1Summaries);
        const summary = createL2Summary(userId, getWeekStart(), l1Summaries, output);

        db.storeL2Summary(summary);
        await store.writeL2Summary(summary);

        logger.info(`[MemoryTree] Compressed ${l1Summaries.length} L1 summaries → L2 summary ${summary.id}`);

        return {
          success: true,
          sourceLevel,
          targetLevel,
          compressedItems: l1Summaries.length,
          outputSummaryId: summary.id,
          tokensFreed,
        };
      }

      return { success: false, sourceLevel, targetLevel, compressedItems: 0, tokensFreed: 0, error: "Unknown compression path" };
    } catch (err) {
      return { success: false, sourceLevel, targetLevel, compressedItems: 0, tokensFreed: 0, error: (err as Error).message };
    }
  }

  /**
   * Get compression queue status
   */
  getCompressionQueueStatus(): { pending: number; running: number; total: number; singleProcessing: boolean } {
    return this.compressionQueue.getStatus();
  }

  /**
   * Enqueue a compression job
   */
  enqueueCompression(job: Omit<CompressionJob, "id" | "status" | "createdAt">): void {
    this.compressionQueue.enqueue(job);
    logger.info(`[MemoryTree] Compression job enqueued: ${job.sourceLevel}->${job.targetLevel}`);
  }

  /**
   * Get L0 chunks with optional filtering
   */
  getChunks(
    userId: string,
    options?: {
      date?: string;
      source?: MemorySource;
      limit?: number;
      since?: number;
    }
  ): L0Chunk[] {
    return db.getL0Chunks(userId, options);
  }

  /**
   * Delete an L0 chunk
   */
  async deleteChunk(userId: string, chunkId: string): Promise<boolean> {
    // Get chunk info first
    const chunks = db.getL0Chunks(userId, { limit: 1000 });
    const chunk = chunks.find(c => c.id === chunkId);

    if (chunk) {
      await store.deleteL0Content(chunk.source, chunkId);
    }

    return db.deleteL0Chunk(userId, chunkId);
  }

  // ============================================================================
  // L1 Daily Summaries
  // ============================================================================

  /**
   * Generate L1 summary for a specific date
   */
  async generateL1Summary(userId: string, date?: string): Promise<L1Summary | null> {
    const targetDate = date || getDateString();

    // Check if already exists
    const existing = db.getL1Summary(userId, targetDate);
    if (existing) {
      return existing;
    }

    // Get L0 chunks for this date
    const chunks = db.getL0Chunks(userId, { date: targetDate, limit: 100 });

    if (chunks.length === 0) {
      logger.debug(`[MemoryTree] No chunks for ${targetDate}, skipping L1 generation`);
      return null;
    }

    logger.info(`[MemoryTree] Generating L1 summary for ${targetDate} with ${chunks.length} chunks`);

    // Generate summary using LLM
    const output = await generateL1SummaryFromChunks(chunks);

    // Create summary object
    const summary = createL1Summary(userId, targetDate, chunks, output);

    // Store in SQLite
    db.storeL1Summary(summary);

    // Write to Obsidian file
    await store.writeL1Summary(summary);

    logger.info(`[MemoryTree] Generated L1 summary ${summary.id} for ${targetDate}`);

    return summary;
  }

  /**
   * Get L1 summary for a specific date
   */
  getL1Summary(userId: string, date: string): L1Summary | null {
    return db.getL1Summary(userId, date);
  }

  /**
   * Get L1 summaries in date range
   */
  getL1SummariesInRange(userId: string, startDate: string, endDate: string): L1Summary[] {
    return db.getL1SummariesInRange(userId, startDate, endDate);
  }

  // ============================================================================
  // L2 Weekly Summaries
  // ============================================================================

  /**
   * Generate L2 summary for a specific week
   */
  async generateL2Summary(userId: string, weekStart?: string): Promise<L2Summary | null> {
    const targetWeek = weekStart || getWeekStart();

    // Check if already exists
    const existing = db.getL2Summary(userId, targetWeek);
    if (existing) {
      return existing;
    }

    // Get all L1 summaries for this week (7 days)
    const weekDates = this.getDatesForWeek(targetWeek);
    const l1Summaries: L1Summary[] = [];

    for (const date of weekDates) {
      const l1 = db.getL1Summary(userId, date);
      if (l1) {
        l1Summaries.push(l1);
      }
    }

    if (l1Summaries.length === 0) {
      logger.debug(`[MemoryTree] No L1 summaries for week ${targetWeek}, skipping L2 generation`);
      return null;
    }

    logger.info(`[MemoryTree] Generating L2 summary for week ${targetWeek} with ${l1Summaries.length} L1s`);

    // Generate summary
    const output = await generateL2SummaryFromL1(l1Summaries);

    // Create summary
    const summary = createL2Summary(userId, targetWeek, l1Summaries, output);

    // Store
    db.storeL2Summary(summary);
    await store.writeL2Summary(summary);

    logger.info(`[MemoryTree] Generated L2 summary ${summary.id} for week ${targetWeek}`);

    return summary;
  }

  /**
   * Get L2 summary for a specific week
   */
  getL2Summary(userId: string, weekStart: string): L2Summary | null {
    return db.getL2Summary(userId, weekStart);
  }

  // ============================================================================
  // L3 Monthly Summaries
  // ============================================================================

  /**
   * Generate L3 summary for a specific month
   */
  async generateL3Summary(userId: string, month?: string): Promise<L3Summary | null> {
    const targetMonth = month || getMonth();

    // Check if already exists
    const existing = db.getL3Summary(userId, targetMonth);
    if (existing) {
      return existing;
    }

    // Get all L2 summaries for this month (4-5 weeks)
    const weeks = this.getWeeksForMonth(targetMonth);
    const l2Summaries: L2Summary[] = [];

    for (const week of weeks) {
      const l2 = db.getL2Summary(userId, week);
      if (l2) {
        l2Summaries.push(l2);
      }
    }

    if (l2Summaries.length === 0) {
      logger.debug(`[MemoryTree] No L2 summaries for month ${targetMonth}, skipping L3 generation`);
      return null;
    }

    logger.info(`[MemoryTree] Generating L3 summary for month ${targetMonth} with ${l2Summaries.length} L2s`);

    // Generate summary
    const output = await generateL3SummaryFromL2(l2Summaries);

    // Create summary
    const summary = createL3Summary(userId, targetMonth, l2Summaries, output);

    // Store
    db.storeL3Summary(summary);
    await store.writeL3Summary(summary);

    logger.info(`[MemoryTree] Generated L3 summary ${summary.id} for month ${targetMonth}`);

    return summary;
  }

  /**
   * Get L3 summary for a specific month
   */
  getL3Summary(userId: string, month: string): L3Summary | null {
    return db.getL3Summary(userId, month);
  }

  // ============================================================================
  // Bucket-Seal Logic
  // ============================================================================

  /**
   * Check if seal is needed and perform it
   */
  async maybeSeal(userId: string): Promise<{ sealed: boolean; level?: 1 | 2 | 3; summaryId?: string }> {
    // Check L1 seal (daily token budget exceeded)
    const todayTokens = db.getL0TokensToday(userId);
    if (todayTokens >= this.config.l0SealThreshold) {
      return this.performL1Seal(userId);
    }

    // Check L2 seal (7 L1s exist for consecutive days)
    const recentL1s = db.getRecentL1Summaries(userId, 7);
    if (recentL1s.length >= this.config.l1Fanout) {
      const weekStart = getWeekStart(new Date(recentL1s[0].date));
      return this.performL2Seal(userId, weekStart);
    }

    return { sealed: false };
  }

  /**
   * Perform L1 seal (combine L0 chunks into daily summary)
   */
  private async performL1Seal(userId: string): Promise<{ sealed: boolean; level: 1; summaryId: string }> {
    const date = getDateString();

    // Check if L1 already exists for today
    const existing = db.getL1Summary(userId, date);
    if (existing) {
      return { sealed: true, level: 1, summaryId: existing.id };
    }

    // Get today's chunks
    const chunks = db.getL0Chunks(userId, { date });

    if (chunks.length === 0) {
      return { sealed: false, level: 1, summaryId: "" };
    }

    // Generate L1
    const summary = await this.generateL1Summary(userId, date);

    if (summary) {
      logger.info(`[MemoryTree] L1 seal completed: ${summary.id}`);
      return { sealed: true, level: 1, summaryId: summary.id };
    }

    return { sealed: false, level: 1, summaryId: "" };
  }

  /**
   * Perform L2 seal (combine L1 summaries into weekly summary)
   */
  private async performL2Seal(userId: string, weekStart: string): Promise<{ sealed: boolean; level: 2; summaryId: string }> {
    // Check if L2 already exists
    const existing = db.getL2Summary(userId, weekStart);
    if (existing) {
      return { sealed: true, level: 2, summaryId: existing.id };
    }

    // Generate L2
    const summary = await this.generateL2Summary(userId, weekStart);

    if (summary) {
      logger.info(`[MemoryTree] L2 seal completed: ${summary.id}`);
      return { sealed: true, level: 2, summaryId: summary.id };
    }

    return { sealed: false, level: 2, summaryId: "" };
  }

  // ============================================================================
  // Memory Recall
  // ============================================================================

  private scoreMemoryTextLocal(content: string, query: string, queryVector: number[]): number {
    const semanticRelevance = scoreSemanticMemory(content, query);
    const vectorRelevance = Math.max(0, cosineSimilarity(buildSemanticVector(content), queryVector));
    return Math.max(semanticRelevance, vectorRelevance);
  }

  private async scoreMemoryTexts(contents: string[], query: string): Promise<number[]> {
    const scores = await scoreMemoryEmbeddingBatch(query, contents);
    return scores.scores;
  }

  /**
   * Recall relevant memories for a query
   */
  async recall(userId: string, query: string, options?: RecallOptions): Promise<RecallResult> {
    const maxTokens = options?.maxTokens || 4000;
    const entities: MemoryEntity[] = [];
    const l0Chunks: L0Chunk[] = [];
    const l1Summaries: L1Summary[] = [];
    const l2Summaries: L2Summary[] = [];
    const l3Summaries: L3Summary[] = [];

    let currentTokens = 0;

    // 1. Extract entities only when the caller explicitly asks for entity context.
    // Chat recall must stay fast; semantic chunk scoring below is enough for memory injection.
    let queryEntityCount = 0;
    if (options?.includeEntities) {
      const queryEntities = await extractEntities(query);
      queryEntityCount = queryEntities.entities.length;
      for (const entity of queryEntities.entities) {
        const stored = db.getEntityByName(userId, entity.name, entity.kind);
        if (stored) {
          entities.push(stored);
        }
      }
    }

    // 2. Search for relevant L0 chunks
    const recentChunks = db.getL0Chunks(userId, {
      since: options?.timeRange?.start,
      source: options?.sources?.[0],
      limit: 50,
    });

    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const queryVector = buildSemanticVector(query);
    const coarseScoredChunks = recentChunks
      .filter((chunk) => !options?.minImportance || chunk.importance >= options.minImportance)
      .map((chunk) => {
        const chunkTerms = chunk.content.toLowerCase();
        const keywordRelevance = queryTerms.length > 0
          ? queryTerms.filter(term => chunkTerms.includes(term)).length / queryTerms.length
          : 0;
        const semanticRelevance = scoreSemanticMemory(chunk.content, query);
        const vectorRelevance = Math.max(0, cosineSimilarity(buildSemanticVector(chunk.content), queryVector));
        const ageDays = Math.max(0, (Date.now() - chunk.createdAt) / (24 * 60 * 60 * 1000));
        const recencyScore = 1 / (1 + ageDays / 14);
        const meaningRelevance = Math.max(keywordRelevance, semanticRelevance, vectorRelevance);
        const score =
          meaningRelevance * 0.72 +
          chunk.importance * 0.18 +
          recencyScore * 0.10;
        return { chunk, score, keywordRelevance, semanticRelevance, vectorRelevance };
      })
      .filter((item) => item.score >= 0.16 || item.keywordRelevance > 0.1 || item.semanticRelevance > 0.18 || item.vectorRelevance > 0.20)
      .sort((a, b) => b.score - a.score || b.chunk.createdAt - a.chunk.createdAt);
    const rerankWindow = coarseScoredChunks.slice(0, 30);
    const embeddingScores = await this.scoreMemoryTexts(rerankWindow.map((item) => item.chunk.content), query);
    const scoredChunks = rerankWindow
      .map((item, index) => ({
        ...item,
        score: Math.max(item.score, embeddingScores[index] ?? 0) * 0.82 + item.chunk.importance * 0.12 + item.score * 0.06,
      }))
      .sort((a, b) => b.score - a.score || b.chunk.createdAt - a.chunk.createdAt);

    for (const { chunk } of scoredChunks) {
      if (currentTokens + chunk.tokenCount <= maxTokens) {
        l0Chunks.push(chunk);
        currentTokens += chunk.tokenCount;
      }
    }

    // 3. Include relevant recent L1 summaries. Recent but unrelated summaries add noise to chat context.
    const l1Candidates = db.getRecentL1Summaries(userId, 14);
    const l1EmbeddingScores = await this.scoreMemoryTexts(l1Candidates.map((summary) => summary.summary), query);
    const recentL1 = l1Candidates
      .map((summary, index) => {
        const localRelevance = this.scoreMemoryTextLocal(summary.summary, query, queryVector);
        const embeddingRelevance = l1EmbeddingScores[index] ?? 0;
        return {
          summary,
          localRelevance,
          relevance: localRelevance >= 0.10 ? Math.max(localRelevance, embeddingRelevance) : localRelevance,
        };
      })
      .filter((item) => item.relevance >= 0.16)
      .sort((a, b) => b.relevance - a.relevance || b.summary.createdAt - a.summary.createdAt)
      .slice(0, 4)
      .map((item) => item.summary);
    for (const l1 of recentL1) {
      if (currentTokens + l1.tokenCount <= maxTokens) {
        l1Summaries.push(l1);
        currentTokens += l1.tokenCount;
      }
    }

    // 4. Include L2 summaries if query spans longer time
    if (options?.timeRange && (options.timeRange.end || Date.now()) - options.timeRange.start! > 7 * 24 * 60 * 60 * 1000) {
      // More than a week - include L2s
      const l2Candidates = db.getL2SummariesInRange(userId, getWeekStart(new Date(options.timeRange.start!)), getWeekStart());
      const l2EmbeddingScores = await this.scoreMemoryTexts(l2Candidates.map((summary) => summary.summary), query);
      const recentL2 = l2Candidates
        .map((summary, index) => {
          const localRelevance = this.scoreMemoryTextLocal(summary.summary, query, queryVector);
          const embeddingRelevance = l2EmbeddingScores[index] ?? 0;
          return {
            summary,
            localRelevance,
            relevance: localRelevance >= 0.10 ? Math.max(localRelevance, embeddingRelevance) : localRelevance,
          };
        })
        .filter((item) => item.relevance >= 0.16)
        .sort((a, b) => b.relevance - a.relevance || b.summary.createdAt - a.summary.createdAt)
        .slice(0, 2)
        .map((item) => item.summary);
      for (const l2 of recentL2) {
        if (currentTokens + l2.tokenCount <= maxTokens) {
          l2Summaries.push(l2);
          currentTokens += l2.tokenCount;
        }
      }
    }

    // Build formatted text
    let text = "";

    if (l0Chunks.length > 0) {
      text += "【相关记忆片段】\n";
      for (const chunk of l0Chunks.slice(-5)) {
        text += `- ${new Date(chunk.createdAt).toLocaleDateString("zh-CN")}: ${chunk.content.slice(0, 200)}...\n`;
      }
      text += "\n";
    }

    if (l1Summaries.length > 0) {
      text += "【近期日摘要】\n";
      for (const l1 of l1Summaries) {
        text += `【${l1.date}】${l1.summary.slice(0, 300)}...\n\n`;
      }
    }

    if (l2Summaries.length > 0) {
      text += "【周摘要】\n";
      for (const l2 of l2Summaries) {
        text += `【${l2.weekStart}】${l2.summary.slice(0, 500)}...\n\n`;
      }
    }

    return {
      text: text || "没有找到相关记忆。",
      l0Chunks,
      l1Summaries,
      l2Summaries,
      l3Summaries,
      entities,
      totalTokens: currentTokens,
      scores: {
        l0: l0Chunks.length / Math.max(recentChunks.length, 1),
        l1: l1Summaries.length / 7,
        l2: l2Summaries.length / 4,
        l3: 0,
        entity: entities.length / Math.max(queryEntityCount, 1),
      },
    };
  }

  /**
   * Build full memory context for LLM injection
   */
  async buildContext(userId: string, query: string, maxTokens: number = 4000): Promise<MemoryContext> {
    const today = getDateString();

    // 1. Get recent working memory context (from short-term memory)
    const shortTerm = await shortTermMemoryManager.getTodayMemory(userId);
    const todayInteractions = shortTerm.dailyInteractions
      .slice(-10)
      .map(i => `[${i.type}] ${i.content}`)
      .join("\n");
    const todayTasks = shortTerm.pendingTasks.map(t => `- ${t.title}`).join("\n");

    // 2. Get long-term memory (user profile)
    const profile = await longTermMemoryManager.getUserProfile(userId);
    const profileText = profile ? `用户画像：\n- 沟通风格：${profile.workStyle?.communicationTone || "专业"}\n- 技术栈：${profile.technicalStack?.languages?.join(", ") || "未知"}\n` : "";

    // 3. Recall relevant tree memories
    const recallResult = await this.recall(userId, query, { maxTokens: Math.floor(maxTokens * 0.5) });

    // 4. Get entities for context
    const recentEntities = db.getEntities(userId).slice(0, 10);

    return {
      workingMemory: {
        messages: [],
        context: {},
      },
      shortTermMemory: {
        interactions: todayInteractions ? [todayInteractions] : [],
        tasks: todayTasks ? [todayTasks] : [],
        preferences: [],
      },
      treeMemory: {
        l0Context: recallResult.l0Chunks?.map(c => c.content).join("\n\n") || "",
        l1Context: recallResult.l1Summaries?.map(s => s.summary).join("\n\n") || "",
        l2Context: recallResult.l2Summaries?.map(s => s.summary).join("\n\n") || "",
        l3Context: recallResult.l3Summaries?.map(s => s.summary).join("\n\n") || "",
      },
      longTermMemory: {
        userProfile: profileText,
        skills: profile?.frequentlyUsedSkills?.map(s => s.skillName) || [],
        projects: [],
      },
      entities: recentEntities.map(e => ({
        name: e.name,
        kind: e.kind,
        description: undefined,
      })),
      totalTokens: estimateTokens(
        profileText +
        recallResult.text +
        todayInteractions +
        recentEntities.map(e => e.name).join(", ")
      ),
    };
  }

  // ============================================================================
  // Entity Management
  // ============================================================================

  /**
   * Extract and store entities from content
   */
  private async extractAndStoreEntities(userId: string, content: string, existingTags: string[] = []): Promise<void> {
    try {
      const result = await extractEntities(content);

      // Store entities
      for (const entity of result.entities) {
        const memoryEntity: MemoryEntity = {
          id: `entity-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          userId,
          name: entity.name,
          kind: entity.kind,
          mentions: 1,
          lastSeen: Date.now(),
          createdAt: Date.now(),
        };
        db.upsertEntity(memoryEntity);
      }

      // Store relations
      for (const relation of result.relations) {
        const subjectEntity = db.getEntityByName(userId, relation.from, "concept");
        const objectEntity = db.getEntityByName(userId, relation.to, "concept");

        if (subjectEntity && objectEntity) {
          const memoryRelation: MemoryRelation = {
            id: `rel-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            userId,
            subjectId: subjectEntity.id,
            predicate: relation.label,
            objectId: objectEntity.id,
            evidence: relation.evidence,
            strength: 0.5,
            createdAt: Date.now(),
          };
          db.storeRelation(memoryRelation);
        }
      }

      // Update long-term memory knowledge graph
      if (result.entities.length > 0) {
        for (const entity of result.entities) {
          await longTermMemoryManager.addKnowledgeNode(userId, {
            type: entity.kind as any,
            name: entity.name,
            description: entity.description,
            metadata: {},
            lastAccessedAt: Date.now(),
            accessCount: 0,
          });
        }
      }
    } catch (err) {
      logger.warn("[MemoryTree] Entity extraction failed:", err);
    }
  }

  /**
   * Get all entities for a user
   */
  getEntities(userId: string, kind?: EntityKind): MemoryEntity[] {
    return db.getEntities(userId, kind);
  }

  /**
   * Search entities
   */
  searchEntities(userId: string, query: string): MemoryEntity[] {
    return db.searchEntities(userId, query);
  }

  /**
   * Get relations for an entity
   */
  getRelationsForEntity(userId: string, entityId: string): MemoryRelation[] {
    return db.getRelationsForEntity(userId, entityId);
  }

  // ============================================================================
  // Tree Statistics
  // ============================================================================

  /**
   * Get tree statistics
   */
  getTreeStats(userId: string): {
    l0Count: number;
    l1Count: number;
    l2Count: number;
    l3Count: number;
    entityCount: number;
    relationCount: number;
    todayTokens: number;
  } {
    const stats = db.getTreeStats(userId);
    const todayTokens = db.getL0TokensToday(userId);

    return {
      ...stats,
      todayTokens,
    };
  }

  // ============================================================================
  // Cross-Level Aggregated Query
  // ============================================================================

  /**
   * Perform aggregated query across L0/L1/L2/L3 levels
   * Smart routing based on time range for optimal performance
   */
  async aggregatedQuery(
    userId: string,
    options: AggregatedQueryOptions = {}
  ): Promise<AggregatedQueryResult> {
    const {
      timeRange,
      sources,
      minImportance = 0,
      limit = 100,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeArchived = false,
    } = options;

    const now = Date.now();
    const startTime = timeRange?.start ?? 0;
    const endTime = timeRange?.end ?? now;

    // Calculate time span in milliseconds
    const timeSpan = endTime - startTime;

    // Determine which levels to query based on time range
    // - Recent (≤3 days): L0 only (fast, granular)
    // - Weekly (3-7 days): L0 + L1 (balance speed/coverage)
    // - Monthly (7-90 days): L1 + L2 (summarized)
    // - Old (>90 days): L2 + L3 (compressed archive)
    const shouldQueryL0 = timeSpan <= 3 * 24 * 60 * 60 * 1000;
    const shouldQueryL1 = timeSpan <= 90 * 24 * 60 * 60 * 1000;
    const shouldQueryL2 = true; // Always include L2 for broader context
    const shouldQueryL3 = timeSpan > 30 * 24 * 60 * 60 * 1000;

    const items: MemoryItem[] = [];
    let totalTokens = 0;

    // Helper to convert date string to timestamp
    const dateToTimestamp = (dateStr: string): number => {
      return new Date(dateStr).getTime();
    };

    // Query L0 chunks (raw content)
    if (shouldQueryL0) {
      const chunks = db.getL0Chunks(userId, {
        since: startTime,
        source: sources?.[0],
        minImportance,
        includeArchived,
        limit: limit * 2, // Fetch more to account for filtering
      });

      for (const chunk of chunks) {
        if (chunk.createdAt >= startTime && chunk.createdAt <= endTime) {
          if (!sources || sources.length === 0 || sources.includes(chunk.source)) {
            items.push({
              id: chunk.id,
              userId: chunk.userId,
              level: 0,
              source: chunk.source,
              content: chunk.content,
              tokenCount: chunk.tokenCount,
              createdAt: chunk.createdAt,
              dateKey: getDateString(new Date(chunk.createdAt)),
              importance: chunk.importance,
              childCount: 0,
              metadata: {
                entityTags: chunk.entityTags,
                sourceRef: chunk.sourceRef,
              },
            });
            totalTokens += chunk.tokenCount;
          }
        }
      }
    }

    // Query L1 summaries (daily)
    if (shouldQueryL1) {
      const startDate = getDateString(new Date(startTime));
      const endDate = getDateString(new Date(endTime));
      const l1Summaries = db.getL1SummariesInRange(userId, startDate, endDate);

      for (const l1 of l1Summaries) {
        items.push({
          id: l1.id,
          userId: l1.userId,
          level: 1,
          source: "conversation" as MemorySource, // L1 summaries are derived from conversations
          content: l1.summary,
          tokenCount: l1.tokenCount,
          createdAt: dateToTimestamp(l1.date),
          dateKey: l1.date,
          importance: 0.6, // Default importance for summaries
          childCount: l1.childIds.length,
          metadata: {
            childIds: l1.childIds,
          },
        });
        totalTokens += l1.tokenCount;
      }
    }

    // Query L2 summaries (weekly)
    if (shouldQueryL2) {
      const startWeek = getWeekStart(new Date(startTime));
      const endWeek = getWeekStart(new Date(endTime));
      const l2Summaries = db.getL2SummariesInRange(userId, startWeek, endWeek);

      for (const l2 of l2Summaries) {
        items.push({
          id: l2.id,
          userId: l2.userId,
          level: 2,
          source: "conversation" as MemorySource,
          content: l2.summary,
          tokenCount: l2.tokenCount,
          createdAt: dateToTimestamp(l2.weekStart),
          dateKey: l2.weekStart,
          importance: 0.5, // Lower importance for older summaries
          childCount: l2.childIds.length,
          metadata: {
            childIds: l2.childIds,
          },
        });
        totalTokens += l2.tokenCount;
      }
    }

    // Query L3 summaries (monthly archives)
    if (shouldQueryL3) {
      const startMonth = getMonth(new Date(startTime));
      const endMonth = getMonth(new Date(endTime));
      const l3Summaries = db.getL3SummariesInRange(userId, startMonth, endMonth);

      for (const l3 of l3Summaries) {
        items.push({
          id: l3.id,
          userId: l3.userId,
          level: 3,
          source: "conversation" as MemorySource,
          content: l3.summary,
          tokenCount: l3.tokenCount,
          createdAt: dateToTimestamp(l3.month + "-01"),
          dateKey: l3.month,
          importance: 0.4, // Lowest importance for oldest archives
          childCount: l3.childIds.length,
          metadata: {
            childIds: l3.childIds,
          },
        });
        totalTokens += l3.tokenCount;
      }
    }

    // Sort items
    items.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "createdAt":
          comparison = a.createdAt - b.createdAt;
          break;
        case "importance":
          comparison = a.importance - b.importance;
          break;
        case "tokenCount":
          comparison = a.tokenCount - b.tokenCount;
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply limit and count by level
    const limitedItems = items.slice(0, limit);

    const levelBreakdown = {
      l0: limitedItems.filter(i => i.level === 0).length,
      l1: limitedItems.filter(i => i.level === 1).length,
      l2: limitedItems.filter(i => i.level === 2).length,
      l3: limitedItems.filter(i => i.level === 3).length,
    };

    logger.debug(`[MemoryTree] aggregatedQuery: ${items.length} items found, ${limitedItems.length} returned`, {
      levelBreakdown,
      timeRange: { start: startTime, end: endTime },
      shouldQueryL0,
      shouldQueryL1,
      shouldQueryL2,
      shouldQueryL3,
    });

    return {
      items: limitedItems,
      totalTokens,
      levelBreakdown,
      timeRange: {
        start: startTime,
        end: endTime,
      },
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getDatesForWeek(weekStart: string): string[] {
    // Parse ISO week format YYYY-WXX
    const [year, week] = weekStart.split("-W").map(Number);
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - jan1.getDay() + 1; // Start from Monday

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(year, 0, daysOffset + i + 1);
      dates.push(getDateString(date));
    }
    return dates;
  }

  private getWeeksForMonth(month: string): string[] {
    // Get all weeks that overlap with this month
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const weeks: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      weeks.push(getWeekStart(current));
      current.setDate(current.getDate() + 7);
    }

    return [...new Set(weeks)]; // Deduplicate
  }
}

// Export singleton instance
export const memoryTreeManager = new MemoryTreeManager();
