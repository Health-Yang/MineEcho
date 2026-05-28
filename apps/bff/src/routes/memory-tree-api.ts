/**
 * Memory Tree API Routes
 * User-friendly endpoints for memory recall and statistics
 *
 * These endpoints provide a simplified interface for frontend integration
 * with the hierarchical memory tree system.
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import { memoryTreeManager } from "../memory/index.js";
import type {
  MemorySource,
  RecallOptions,
  L0Chunk,
} from "../memory/memory-tree/types.js";
import { buildMemoryTimelineResponse } from "./memory-timeline.js";
import { buildDreamInsights, runMemoryDream } from "../memory/memory-dream.js";
import { getMemoryDreamSchedulerState } from "../memory/memory-dream-scheduler.js";
import { generateMemoryStoryline } from "../memory/memory-storyline.js";
import { budgetTaskOutputForMemory } from "../task-output/task-output-budget.js";

export const memoryTreeApiRouter = Router();

function getUserId(req: { headers: { [key: string]: string | string[] | undefined }; [key: string]: any }): string {
  const headerId = req.headers["x-user-id"];
  if (headerId && typeof headerId === "string") return headerId;
  return "anonymous";
}

// ============================================================================
// Memory Statistics
// ============================================================================

/**
 * GET /api/memory/stats
 * Get comprehensive memory statistics for the user
 *
 * Returns token counts and chunk/summary counts for each level
 */
memoryTreeApiRouter.get("/stats", async (req, res) => {
  try {
    const userId = getUserId(req);
    const stats = memoryTreeManager.getTreeStats(userId);

    // Get token counts for each level
    const chunks = memoryTreeManager.getChunks(userId, { limit: 10000 });
    const l0Chunks = chunks.filter(c => c.tokenCount > 0);

    // Calculate L0 tokens (today's chunks)
    const today = new Date().toISOString().split("T")[0];
    const todayChunks = chunks.filter(c => {
      const chunkDate = new Date(c.createdAt).toISOString().split("T")[0];
      return chunkDate === today;
    });
    const l0TodayTokens = todayChunks.reduce((sum, c) => sum + c.tokenCount, 0);

    // Get all L1 summaries to calculate their tokens
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const l1Summaries: Array<{ tokenCount: number }> = [];
    const l2Summaries: Array<{ tokenCount: number }> = [];
    const l3Summaries: Array<{ tokenCount: number }> = [];

    // Get token counts from tree stats (approximate)
    // L1: average ~500 tokens per summary
    const l1TokenCount = stats.l1Count * 500;
    // L2: average ~800 tokens per summary
    const l2TokenCount = stats.l2Count * 800;
    // L3: average ~1000 tokens per summary
    const l3TokenCount = stats.l3Count * 1000;

    res.json({
      userId,
      totalTokens: l0TodayTokens + l1TokenCount + l2TokenCount + l3TokenCount,
      levels: {
        l0: {
          chunks: todayChunks.length,
          tokens: l0TodayTokens,
          allTimeChunks: l0Chunks.length,
        },
        l1: {
          summaries: stats.l1Count,
          tokens: l1TokenCount,
        },
        l2: {
          summaries: stats.l2Count,
          tokens: l2TokenCount,
        },
        l3: {
          summaries: stats.l3Count,
          tokens: l3TokenCount,
        },
      },
      entities: {
        count: stats.entityCount,
      },
      lastUpdated: now,
    });
  } catch (error) {
    logger.error("[MemoryTree API] stats error:", error);
    res.status(500).json({
      error: "Failed to get memory stats",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Memory Recall
// ============================================================================

/**
 * GET /api/memory/recall
 * Recall relevant memories based on query string
 *
 * Query parameters:
 * - q: Search query (required)
 * - userId: User ID (required, can also use x-user-id header)
 * - maxTokens: Maximum tokens to return (optional, default 2000)
 * - levels: Comma-separated list of levels to query (optional, default "l0,l1")
 */
memoryTreeApiRouter.get("/recall", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { q: query, maxTokens, levels } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const maxTokensNum = maxTokens ? parseInt(maxTokens as string) : 2000;

    // Parse levels
    const levelsList = levels
      ? (levels as string).split(",").map(l => l.trim())
      : ["l0", "l1"];

    const options: RecallOptions = {
      maxTokens: maxTokensNum,
    };

    // Add time range if L2/L3 requested
    if (levelsList.includes("l2") || levelsList.includes("l3")) {
      options.timeRange = {
        start: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
        end: Date.now(),
      };
    }

    const result = await memoryTreeManager.recall(userId, query, options);

    // Format results for frontend
    const formattedResults = [
      ...(result.l0Chunks || []).map((chunk: L0Chunk) => ({
        level: "l0",
        id: chunk.id,
        content: chunk.content,
        relevance: 0.8,
        source: chunk.source,
        createdAt: chunk.createdAt,
      })),
      ...(result.l1Summaries || []).map((s: any) => ({
        level: "l1",
        id: s.id,
        content: s.summary,
        relevance: 0.6,
        source: "summary",
        createdAt: s.createdAt,
        date: s.date,
      })),
      ...(result.l2Summaries || []).map((s: any) => ({
        level: "l2",
        id: s.id,
        content: s.summary,
        relevance: 0.4,
        source: "summary",
        createdAt: s.createdAt,
        weekStart: s.weekStart,
      })),
      ...(result.l3Summaries || []).map((s: any) => ({
        level: "l3",
        id: s.id,
        content: s.summary,
        relevance: 0.2,
        source: "summary",
        createdAt: s.createdAt,
        month: s.month,
      })),
    ];

    // Build context string
    const context = result.text || "没有找到相关记忆。";

    res.json({
      query,
      results: formattedResults,
      totalTokens: result.totalTokens,
      context,
      scores: result.scores,
    });
  } catch (error) {
    logger.error("[MemoryTree API] recall error:", error);
    res.status(500).json({
      error: "Failed to recall memories",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Memory Store
// ============================================================================

/**
 * POST /api/memory/store
 * Store content into the memory tree
 *
 * Request body:
 * - userId: User ID (required)
 * - source: Source type - "conversation", "document", "skill", "knowledge", "manual" (required)
 * - content: Content to store (required)
 * - importance: Importance score 0-1 (optional, default 0.5)
 * - entityTags: Array of entity tags (optional)
 */
memoryTreeApiRouter.post("/store", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { source, content, importance, entityTags } = req.body;

    if (!source || !content) {
      return res.status(400).json({ error: "source and content are required" });
    }

    const validSources: MemorySource[] = ["conversation", "document", "skill", "knowledge", "manual", "meeting"];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        error: "Invalid source",
        validSources,
      });
    }

    const budgeted = await budgetTaskOutputForMemory({
      toolName: source,
      output: content,
      scenario: source === "skill" ? "skill" : source === "document" ? "document" : "general",
      maxInlineChars: 6000,
    });

    const result = await memoryTreeManager.storeChunk(userId, {
      source: source as MemorySource,
      content: budgeted.content,
      importance: importance ?? 0.5,
      entityTags: entityTags || [],
    });

    res.json({
      success: true,
      chunkId: result.chunk.id,
      tokenCount: result.chunk.tokenCount,
      sealed: result.sealed,
      sealResult: result.sealResult,
    });
  } catch (error) {
    logger.error("[MemoryTree API] store error:", error);
    res.status(500).json({
      error: "Failed to store memory",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Memory Context (for LLM injection)
// ============================================================================

/**
 * GET /api/memory/context
 * Get memory context for injection into conversation
 *
 * Query parameters:
 * - userId: User ID (required)
 * - maxTokens: Maximum tokens (optional, default 4000)
 */
memoryTreeApiRouter.get("/context", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { maxTokens } = req.query;

    const maxTokensNum = maxTokens ? parseInt(maxTokens as string) : 4000;

    // Build full context using the tree manager
    const context = await memoryTreeManager.buildContext(userId, "", maxTokensNum);

    res.json({
      context: {
        // Tree memory
        treeMemory: context.treeMemory,
        // Short-term memory
        shortTermMemory: context.shortTermMemory,
        // Long-term memory
        longTermMemory: context.longTermMemory,
        // Entities
        entities: context.entities,
        // Total tokens
        totalTokens: context.totalTokens,
      },
      tokenBreakdown: {
        l0: context.treeMemory.l0Context.length / 4,
        l1: context.treeMemory.l1Context.length / 4,
        l2: context.treeMemory.l2Context.length / 4,
        l3: context.treeMemory.l3Context.length / 4,
        shortTerm: context.shortTermMemory.interactions.join("").length / 4,
      },
    });
  } catch (error) {
    logger.error("[MemoryTree API] context error:", error);
    res.status(500).json({
      error: "Failed to build memory context",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Summary Generation (triggered manually)
// ============================================================================

/**
 * POST /api/memory/summarize
 * Trigger summary generation for today
 */
memoryTreeApiRouter.post("/summarize", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { level, date, weekStart, month } = req.body;

    let summary = null;

    switch (level) {
      case 1:
        summary = await memoryTreeManager.generateL1Summary(userId, date);
        break;
      case 2:
        summary = await memoryTreeManager.generateL2Summary(userId, weekStart);
        break;
      case 3:
        summary = await memoryTreeManager.generateL3Summary(userId, month);
        break;
      default:
        // Default: generate L1 for today
        summary = await memoryTreeManager.generateL1Summary(userId, date);
    }

    if (!summary) {
      return res.json({
        success: false,
        message: "No content to summarize",
      });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] summarize error:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Memory Dream / Reconstruction
// ============================================================================

/**
 * GET /api/memory/dream/preview
 * Preview deterministic memory reconstruction insights without generating summaries.
 */
memoryTreeApiRouter.get("/dream/preview", async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = req.query.days ? Math.min(Math.max(parseInt(req.query.days as string, 10), 1), 90) : 7;
    const now = Date.now();
    const start = now - days * 24 * 60 * 60 * 1000;
    const chunks = memoryTreeManager.getChunks(userId, { since: start, limit: 500 });
    const insights = buildDreamInsights(chunks);

    res.json({
      success: true,
      range: { start, end: now, days },
      ...insights,
    });
  } catch (error) {
    logger.error("[MemoryTree API] dream preview error:", error);
    res.status(500).json({
      error: "Failed to preview memory dream",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/dream/scheduler
 * Inspect background dream scheduler state.
 */
memoryTreeApiRouter.get("/dream/scheduler", async (_req, res) => {
  res.json({
    success: true,
    scheduler: getMemoryDreamSchedulerState(),
  });
});

/**
 * POST /api/memory/dream/run
 * Run one manual memory reconstruction cycle.
 */
memoryTreeApiRouter.post("/dream/run", async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = req.body?.days ? parseInt(req.body.days, 10) : 7;
    const result = await runMemoryDream(userId, { days });
    res.json(result);
  } catch (error) {
    logger.error("[MemoryTree API] dream run error:", error);
    res.status(500).json({
      error: "Failed to run memory dream",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/storyline
 * Build a deterministic stage review from recent memories.
 */
memoryTreeApiRouter.get("/storyline", async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const storyline = await generateMemoryStoryline(userId, { days });
    res.json({
      success: true,
      ...storyline,
    });
  } catch (error) {
    logger.error("[MemoryTree API] storyline error:", error);
    res.status(500).json({
      error: "Failed to build memory storyline",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Entity Search
// ============================================================================

/**
 * GET /api/memory/entities/search
 * Search for entities by name
 */
memoryTreeApiRouter.get("/entities/search", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const entities = memoryTreeManager.searchEntities(userId, q);

    res.json({
      query: q,
      entities,
      count: entities.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] entity search error:", error);
    res.status(500).json({
      error: "Failed to search entities",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Recent Memories
// ============================================================================

/**
 * GET /api/memory/recent
 * Get recent memory chunks
 */
memoryTreeApiRouter.get("/recent", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { limit, source } = req.query;

    const limitNum = limit ? parseInt(limit as string) : 20;
    const sourceFilter = source as MemorySource | undefined;

    const chunks = memoryTreeManager.getChunks(userId, {
      limit: limitNum,
      source: sourceFilter,
    });

    res.json({
      chunks,
      count: chunks.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] recent error:", error);
    res.status(500).json({
      error: "Failed to get recent memories",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/timeline
 * Get real user memory across L0-L3 for the Memory page.
 */
memoryTreeApiRouter.get("/timeline", async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 120;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const now = Date.now();
    const start = now - Math.max(days, 1) * 24 * 60 * 60 * 1000;

    const chunks = memoryTreeManager.getChunks(userId, {
      limit: Math.min(Math.max(limit, 1), 500),
      since: start,
    });
    const aggregated = await memoryTreeManager.aggregatedQuery(userId, {
      limit: Math.min(Math.max(limit, 1), 500),
      timeRange: { start, end: now },
      sortBy: "createdAt",
      sortOrder: "desc",
      includeArchived: false,
    });

    const response = buildMemoryTimelineResponse({
      chunks: chunks.sort((a, b) => b.createdAt - a.createdAt),
      items: aggregated.items,
      lastUpdated: now,
    });

    res.json(response);
  } catch (error) {
    logger.error("[MemoryTree API] timeline error:", error);
    res.status(500).json({
      error: "Failed to get memory timeline",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Quota Management
// ============================================================================

/**
 * GET /api/memory/quota
 * Get current quota usage for the user
 */
memoryTreeApiRouter.get("/quota", async (req, res) => {
  try {
    const userId = getUserId(req);
    const usage = memoryTreeManager.getQuotaUsage(userId);

    // Calculate percentages
    const percentages = {
      l0: usage.quota.l0Limit > 0 ? (usage.l0Used / usage.quota.l0Limit) * 100 : 0,
      l1: usage.quota.l1Limit > 0 ? (usage.l1Used / usage.quota.l1Limit) * 100 : 0,
      l2: usage.quota.l2Limit > 0 ? (usage.l2Used / usage.quota.l2Limit) * 100 : 0,
      l3: usage.quota.l3Limit > 0 ? (usage.l3Used / usage.quota.l3Limit) * 100 : 0,
    };

    res.json({
      ...usage,
      percentages,
      compressed: usage.l0Chunks > 0 && usage.l1Count > 0,
    });
  } catch (error) {
    logger.error("[MemoryTree API] quota error:", error);
    res.status(500).json({
      error: "Failed to get quota usage",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/compress
 * Trigger compression manually
 */
memoryTreeApiRouter.post("/compress", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sourceLevel, targetLevel, priority } = req.body;

    // Enqueue compression job
    memoryTreeManager.enqueueCompression({
      userId,
      sourceLevel: sourceLevel ?? 0,
      targetLevel: targetLevel ?? 1,
      itemIds: [], // Empty means auto-select
      priority: priority ?? "normal",
    });

    res.json({
      success: true,
      message: "Compression job enqueued",
    });
  } catch (error) {
    logger.error("[MemoryTree API] compress error:", error);
    res.status(500).json({
      error: "Failed to enqueue compression",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/compression-status
 * Get compression queue status
 */
memoryTreeApiRouter.get("/compression-status", async (req, res) => {
  try {
    const userId = getUserId(req);
    const status = memoryTreeManager.getCompressionQueueStatus();

    res.json({
      ...status,
      userId,
    });
  } catch (error) {
    logger.error("[MemoryTree API] compression-status error:", error);
    res.status(500).json({
      error: "Failed to get compression status",
      message: (error as Error).message,
    });
  }
});
