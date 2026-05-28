/**
 * Memory Tree API Routes
 * REST API for hierarchical memory tree operations
 */

import { Router } from "express";
import { logger } from "../../utils/logger.js";
import { memoryTreeManager } from "./tree-manager.js";
import { budgetTaskOutputForMemory } from "../../task-output/task-output-budget.js";
import type {
  StoreChunkRequest,
  RecallRequest,
  RecapRequest,
  GetTreeRequest,
  MemorySource,
} from "./types.js";

export const memoryTreeRouter = Router();

function getUserId(req: { headers: { [key: string]: string | string[] | undefined }; [key: string]: any }): string {
  const headerId = req.headers["x-user-id"];
  if (headerId && typeof headerId === "string") return headerId;
  return "anonymous";
}

// ============================================================================
// L0 Chunk Operations
// ============================================================================

/**
 * POST /api/memory/tree/l0
 * Store a new L0 chunk
 */
memoryTreeRouter.post("/l0", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { source, content, sourceRef, importance } = req.body as StoreChunkRequest;

    if (!source || !content) {
      return res.status(400).json({ error: "source and content are required" });
    }

    const budgetedContent = await budgetTaskOutputForMemory({
      toolName: source,
      output: content,
      scenario: source === "skill" ? "skill" : source === "document" ? "document" : "general",
      maxInlineChars: 6000,
    });

    const result = await memoryTreeManager.storeChunk(userId, {
      source: source as MemorySource,
      content: budgetedContent.content,
      sourceRef,
      importance,
    });

    res.json({
      success: true,
      chunkId: result.chunk.id,
      tokenCount: result.chunk.tokenCount,
      sealed: result.sealed,
    });
  } catch (error) {
    logger.error("[MemoryTree API] store chunk error:", error);
    res.status(500).json({
      error: "Failed to store chunk",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/l0
 * Get L0 chunks with optional filtering
 */
memoryTreeRouter.get("/l0", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { date, source, limit, since } = req.query;

    const chunks = memoryTreeManager.getChunks(userId, {
      date: date as string,
      source: source as MemorySource,
      limit: limit ? parseInt(limit as string) : undefined,
      since: since ? parseInt(since as string) : undefined,
    });

    res.json({
      chunks,
      count: chunks.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get chunks error:", error);
    res.status(500).json({
      error: "Failed to get chunks",
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/memory/tree/l0/:chunkId
 * Delete an L0 chunk
 */
memoryTreeRouter.delete("/l0/:chunkId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { chunkId } = req.params;

    const deleted = await memoryTreeManager.deleteChunk(userId, chunkId);

    res.json({
      success: deleted,
      message: deleted ? "Chunk deleted" : "Chunk not found",
    });
  } catch (error) {
    logger.error("[MemoryTree API] delete chunk error:", error);
    res.status(500).json({
      error: "Failed to delete chunk",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// L1 Summary Operations
// ============================================================================

/**
 * POST /api/memory/tree/l1/generate
 * Generate L1 summary for a specific date
 */
memoryTreeRouter.post("/l1/generate", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { date } = req.body;

    const summary = await memoryTreeManager.generateL1Summary(userId, date);

    if (!summary) {
      return res.json({
        success: false,
        message: "No chunks to summarize for this date",
      });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] generate L1 error:", error);
    res.status(500).json({
      error: "Failed to generate L1 summary",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/l1/:date
 * Get L1 summary for a specific date
 */
memoryTreeRouter.get("/l1/:date", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { date } = req.params;

    const summary = memoryTreeManager.getL1Summary(userId, date);

    if (!summary) {
      return res.status(404).json({ error: "L1 summary not found" });
    }

    res.json({
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get L1 error:", error);
    res.status(500).json({
      error: "Failed to get L1 summary",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/l1
 * Get L1 summaries in date range
 */
memoryTreeRouter.get("/l1", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const summaries = memoryTreeManager.getL1SummariesInRange(
      userId,
      startDate as string,
      endDate as string
    );

    res.json({
      summaries,
      count: summaries.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get L1 range error:", error);
    res.status(500).json({
      error: "Failed to get L1 summaries",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// L2 Summary Operations
// ============================================================================

/**
 * POST /api/memory/tree/l2/generate
 * Generate L2 summary for a specific week
 */
memoryTreeRouter.post("/l2/generate", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { weekStart } = req.body;

    const summary = await memoryTreeManager.generateL2Summary(userId, weekStart);

    if (!summary) {
      return res.json({
        success: false,
        message: "No L1 summaries to combine for this week",
      });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] generate L2 error:", error);
    res.status(500).json({
      error: "Failed to generate L2 summary",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/l2/:weekStart
 * Get L2 summary for a specific week
 */
memoryTreeRouter.get("/l2/:weekStart", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { weekStart } = req.params;

    const summary = memoryTreeManager.getL2Summary(userId, weekStart);

    if (!summary) {
      return res.status(404).json({ error: "L2 summary not found" });
    }

    res.json({
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get L2 error:", error);
    res.status(500).json({
      error: "Failed to get L2 summary",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// L3 Summary Operations
// ============================================================================

/**
 * POST /api/memory/tree/l3/generate
 * Generate L3 summary for a specific month
 */
memoryTreeRouter.post("/l3/generate", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { month } = req.body;

    const summary = await memoryTreeManager.generateL3Summary(userId, month);

    if (!summary) {
      return res.json({
        success: false,
        message: "No L2 summaries to combine for this month",
      });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] generate L3 error:", error);
    res.status(500).json({
      error: "Failed to generate L3 summary",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/l3/:month
 * Get L3 summary for a specific month
 */
memoryTreeRouter.get("/l3/:month", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { month } = req.params;

    const summary = memoryTreeManager.getL3Summary(userId, month);

    if (!summary) {
      return res.status(404).json({ error: "L3 summary not found" });
    }

    res.json({
      summary,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get L3 error:", error);
    res.status(500).json({
      error: "Failed to get L3 summary",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Recall Operations
// ============================================================================

/**
 * POST /api/memory/tree/recall
 * Recall relevant memories for a query
 */
memoryTreeRouter.post("/recall", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, options } = req.body as RecallRequest;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const result = await memoryTreeManager.recall(userId, query, options);

    res.json({
      result,
    });
  } catch (error) {
    logger.error("[MemoryTree API] recall error:", error);
    res.status(500).json({
      error: "Failed to recall memories",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/tree/context
 * Build full memory context for LLM injection
 */
memoryTreeRouter.post("/context", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, maxTokens } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const context = await memoryTreeManager.buildContext(userId, query, maxTokens || 4000);

    res.json({
      context,
    });
  } catch (error) {
    logger.error("[MemoryTree API] build context error:", error);
    res.status(500).json({
      error: "Failed to build context",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/tree/recap
 * Get a recap for a time range
 */
memoryTreeRouter.post("/recap", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { timeRange, maxTokens } = req.body as RecapRequest;

    if (!timeRange) {
      return res.status(400).json({ error: "timeRange is required" });
    }

    // Get summaries for the time range
    const summaries: Array<{ level: 1 | 2 | 3; id: string; preview: string; date: string }> = [];

    if (timeRange.end && timeRange.start) {
      const start = new Date(timeRange.start);
      const end = new Date(timeRange.end);
      const days = Math.ceil((timeRange.end - timeRange.start) / (24 * 60 * 60 * 1000));

      if (days <= 7) {
        // Use L1 summaries
        const startDate = start.toISOString().split("T")[0];
        const endDate = end.toISOString().split("T")[0];
        const l1s = memoryTreeManager.getL1SummariesInRange(userId, startDate, endDate);
        for (const l1 of l1s) {
          summaries.push({
            level: 1,
            id: l1.id,
            preview: l1.summary.slice(0, 200),
            date: l1.date,
          });
        }
      } else if (days <= 30) {
        // Use L2 summaries
        const l1s = memoryTreeManager.getL1SummariesInRange(
          userId,
          start.toISOString().split("T")[0],
          end.toISOString().split("T")[0]
        );
        for (const l1 of l1s) {
          summaries.push({
            level: 1,
            id: l1.id,
            preview: l1.summary.slice(0, 200),
            date: l1.date,
          });
        }
      } else {
        // Use L3 summaries
        // TODO: Implement L3 range query
      }
    }

    const recap = summaries.map(s => `【${s.date}】${s.preview}`).join("\n\n");

    res.json({
      recap,
      summaries,
      totalTokens: recap.length / 2, // Rough estimate
    });
  } catch (error) {
    logger.error("[MemoryTree API] recap error:", error);
    res.status(500).json({
      error: "Failed to generate recap",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Seal Operations
// ============================================================================

/**
 * POST /api/memory/tree/seal
 * Trigger bucket-seal check manually
 */
memoryTreeRouter.post("/seal", async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await memoryTreeManager.maybeSeal(userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("[MemoryTree API] seal error:", error);
    res.status(500).json({
      error: "Failed to trigger seal",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Entity Operations
// ============================================================================

/**
 * GET /api/memory/tree/entities
 * Get all entities for a user
 */
memoryTreeRouter.get("/entities", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { kind } = req.query;

    const entities = memoryTreeManager.getEntities(userId, kind as any);

    res.json({
      entities,
      count: entities.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get entities error:", error);
    res.status(500).json({
      error: "Failed to get entities",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/entities/search
 * Search entities
 */
memoryTreeRouter.get("/entities/search", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "q query parameter is required" });
    }

    const entities = memoryTreeManager.searchEntities(userId, q as string);

    res.json({
      entities,
      count: entities.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] search entities error:", error);
    res.status(500).json({
      error: "Failed to search entities",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/tree/entities/:entityId/relations
 * Get relations for an entity
 */
memoryTreeRouter.get("/entities/:entityId/relations", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { entityId } = req.params;

    const relations = memoryTreeManager.getRelationsForEntity(userId, entityId);

    res.json({
      relations,
      count: relations.length,
    });
  } catch (error) {
    logger.error("[MemoryTree API] get relations error:", error);
    res.status(500).json({
      error: "Failed to get relations",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Statistics
// ============================================================================

/**
 * GET /api/memory/tree/stats
 * Get tree statistics
 */
memoryTreeRouter.get("/stats", async (req, res) => {
  try {
    const userId = getUserId(req);

    const stats = memoryTreeManager.getTreeStats(userId);

    res.json({
      stats,
    });
  } catch (error) {
    logger.error("[MemoryTree API] stats error:", error);
    res.status(500).json({
      error: "Failed to get stats",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Integration with Existing Memory System
// ============================================================================

/**
 * POST /api/memory/tree/integrate/conversation
 * Store a conversation as memory chunk
 */
memoryTreeRouter.post("/integrate/conversation", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId, messages, summary } = req.body;

    // Store conversation summary as L0 chunk
    const content = summary || messages.map((m: any) => `[${m.role}]: ${m.content}`).join("\n");
    const budgetedContent = await budgetTaskOutputForMemory({
      toolName: "conversation",
      output: content,
      scenario: "general",
      maxInlineChars: 6000,
    });

    const result = await memoryTreeManager.storeChunk(userId, {
      source: "conversation",
      content: budgetedContent.content,
      sourceRef: {
        type: "conversation",
        id: conversationId || `conv-${Date.now()}`,
      },
    });

    res.json({
      success: true,
      chunkId: result.chunk.id,
    });
  } catch (error) {
    logger.error("[MemoryTree API] integrate conversation error:", error);
    res.status(500).json({
      error: "Failed to integrate conversation",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/tree/integrate/skill
 * Store skill invocation as memory chunk
 */
memoryTreeRouter.post("/integrate/skill", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { skillId, skillName, input, output, success } = req.body;

    const budgetedOutput = await budgetTaskOutputForMemory({
      toolName: skillName || skillId || "skill",
      input,
      output: output || "",
      scenario: "skill",
      exitCode: success ? 0 : 1,
      maxInlineChars: 5000,
    });
    const content = `技能调用: ${skillName}\n输入: ${input}\n输出: ${budgetedOutput.content}\n结果: ${success ? "成功" : "失败"}`;

    const result = await memoryTreeManager.storeChunk(userId, {
      source: "skill",
      content,
      sourceRef: {
        type: "skill",
        id: skillId,
      },
      importance: success ? 0.5 : 0.8, // Higher importance for failures
    });

    res.json({
      success: true,
      chunkId: result.chunk.id,
    });
  } catch (error) {
    logger.error("[MemoryTree API] integrate skill error:", error);
    res.status(500).json({
      error: "Failed to integrate skill",
      message: (error as Error).message,
    });
  }
});
