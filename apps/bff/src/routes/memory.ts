/**
 * Memory System API Routes
 * Provides endpoints for the three-tier memory system
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import {
  shortTermMemoryManager,
  longTermMemoryManager,
  workingMemoryManager,
  userProfileLearner,
} from "../memory/index.js";
import type {
  UpdateProfileRequest,
  LearnRequest,
  Interaction,
} from "../memory/types.js";
import { budgetTaskOutputForMemory } from "../task-output/task-output-budget.js";

export const memoryRouter = Router();

function getUserId(req: { headers: { [key: string]: string | string[] | undefined }; [key: string]: any }): string {
  const headerId = req.headers["x-user-id"];
  if (headerId && typeof headerId === "string") return headerId;
  return "anonymous";
}

// ============================================================================
// User Profile Routes
// ============================================================================

/**
 * GET /api/memory/profile
 * Get the user's long-term profile
 */
memoryRouter.get("/profile", async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = await longTermMemoryManager.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Generate insights
    const insights = await userProfileLearner.generateInsights(userId);

    res.json({
      profile,
      suggestions: insights,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get profile:", { error });
    res.status(500).json({
      error: "Failed to get user profile",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/profile
 * Update the user's profile
 */
memoryRouter.post("/profile", async (req, res) => {
  try {
    const userId = getUserId(req);
    const updates: UpdateProfileRequest = req.body;

    const currentProfile = await longTermMemoryManager.getUserProfile(userId);
    if (!currentProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Merge updates
    const updatedProfile = await longTermMemoryManager.updateUserProfile(userId, {
      workStyle: updates.workStyle
        ? { ...currentProfile.workStyle, ...updates.workStyle }
        : undefined,
      technicalStack: updates.technicalStack
        ? { ...currentProfile.technicalStack, ...updates.technicalStack }
        : undefined,
      customShortcuts: updates.customShortcuts,
    });

    res.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to update profile:", { error });
    res.status(500).json({
      error: "Failed to update profile",
      message: (error as Error).message,
    });
  }
});

/**
 * PUT /api/memory/profile/work-style
 * Update work style preferences
 */
memoryRouter.put("/profile/work-style", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { workStyle } = req.body;

    if (!workStyle) {
      return res.status(400).json({ error: "workStyle is required" });
    }

    const updatedProfile = await longTermMemoryManager.updateWorkStyle(userId, workStyle);

    res.json({
      success: true,
      workStyle: updatedProfile.workStyle,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to update work style:", { error });
    res.status(500).json({
      error: "Failed to update work style",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/profile/technical-skill
 * Add a technical skill to the user's profile
 */
memoryRouter.post("/profile/technical-skill", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, skill, proficiency } = req.body;

    if (!category || !skill) {
      return res.status(400).json({ error: "category and skill are required" });
    }

    const validCategories = ["languages", "frameworks", "tools", "databases", "platforms", "proficiency", "cloud_products", "storage", "networking", "ai_ml", "security_products", "delivery_ops"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
        validCategories,
      });
    }

    const updatedProfile = await longTermMemoryManager.addTechnicalSkill(
      userId,
      category,
      skill,
      proficiency
    );

    res.json({
      success: true,
      technicalStack: updatedProfile.technicalStack,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to add technical skill:", { error });
    res.status(500).json({
      error: "Failed to add technical skill",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/profile/shortcut
 * Add a custom shortcut
 */
memoryRouter.post("/profile/shortcut", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { trigger, action, skillId, parameters } = req.body;

    if (!trigger || !action) {
      return res.status(400).json({ error: "trigger and action are required" });
    }

    const updatedProfile = await longTermMemoryManager.addCustomShortcut(
      userId,
      trigger,
      action,
      skillId,
      parameters
    );

    res.json({
      success: true,
      shortcuts: updatedProfile.customShortcuts,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to add shortcut:", { error });
    res.status(500).json({
      error: "Failed to add shortcut",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Short-term Memory Routes
// ============================================================================

/**
 * GET /api/memory/short-term
 * Get today's short-term memory
 */
memoryRouter.get("/short-term", async (req, res) => {
  try {
    const userId = getUserId(req);
    const memory = await shortTermMemoryManager.getTodayMemory(userId);
    const stats = await shortTermMemoryManager.getStats(userId);

    res.json({
      memory,
      stats,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get short-term memory:", { error });
    res.status(500).json({
      error: "Failed to get short-term memory",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/short-term/history
 * Get memory history for multiple days
 */
memoryRouter.get("/short-term/history", async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);

    const history = await shortTermMemoryManager.getMemoryHistory(userId, days);

    res.json({
      history,
      days,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get memory history:", { error });
    res.status(500).json({
      error: "Failed to get memory history",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/short-term/interaction
 * Record a new interaction
 */
memoryRouter.post("/short-term/interaction", async (req, res) => {
  try {
    const userId = getUserId(req);
    const interaction: Omit<Interaction, "id" | "timestamp"> = req.body;

    if (!interaction.type || !interaction.content) {
      return res.status(400).json({ error: "type and content are required" });
    }

    const budgeted = await budgetTaskOutputForMemory({
      toolName: interaction.skillName || interaction.skillId || interaction.type,
      output: interaction.content,
      scenario: interaction.type === "skill_invocation" ? "skill" : "general",
      maxInlineChars: 5000,
    });
    const safeInteraction = {
      ...interaction,
      content: budgeted.content,
    };

    const newInteraction = await shortTermMemoryManager.addInteraction(userId, safeInteraction);

    // Also learn from this interaction for long-term profile
    userProfileLearner.learnFromInteraction(userId, newInteraction).catch((err) => {
      logger.warn("[Memory API] Failed to learn from interaction:", { error: err });
    });

    res.json({
      success: true,
      interaction: newInteraction,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to record interaction:", { error });
    res.status(500).json({
      error: "Failed to record interaction",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/short-term/task
 * Add a new task
 */
memoryRouter.post("/short-term/task", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description, priority = "medium", dueAt, relatedSkillId } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const task = await shortTermMemoryManager.addTask(userId, {
      title,
      description,
      priority,
      status: "pending",
      dueAt: dueAt ? new Date(dueAt).getTime() : undefined,
      relatedSkillId,
    });

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to add task:", { error });
    res.status(500).json({
      error: "Failed to add task",
      message: (error as Error).message,
    });
  }
});

/**
 * PUT /api/memory/short-term/task/:taskId
 * Update a task
 */
memoryRouter.put("/short-term/task/:taskId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;
    const updates = req.body;

    const task = await shortTermMemoryManager.updateTask(userId, taskId, updates);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to update task:", { error });
    res.status(500).json({
      error: "Failed to update task",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/short-term/task/:taskId/complete
 * Mark a task as completed
 */
memoryRouter.post("/short-term/task/:taskId/complete", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;

    const task = await shortTermMemoryManager.completeTask(userId, taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to complete task:", { error });
    res.status(500).json({
      error: "Failed to complete task",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/short-term/tasks/pending
 * Get all pending tasks
 */
memoryRouter.get("/short-term/tasks/pending", async (req, res) => {
  try {
    const userId = getUserId(req);
    const tasks = await shortTermMemoryManager.getAllPendingTasks(userId);

    res.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get pending tasks:", { error });
    res.status(500).json({
      error: "Failed to get pending tasks",
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/memory/short-term
 * Clear today's short-term memory
 */
memoryRouter.delete("/short-term", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { date } = req.query;

    await shortTermMemoryManager.clearDay(userId, date as string | undefined);

    res.json({
      success: true,
      message: date ? `Memory for ${date} cleared` : "Today's memory cleared",
    });
  } catch (error) {
    logger.error("[Memory API] Failed to clear short-term memory:", { error });
    res.status(500).json({
      error: "Failed to clear short-term memory",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Learning Routes
// ============================================================================

/**
 * POST /api/memory/learn
 * Submit learning data to improve user profile
 */
memoryRouter.post("/learn", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data }: LearnRequest = req.body;

    if (!data || !data.type || !data.category) {
      return res.status(400).json({
        error: "Invalid learning data",
        required: ["type", "category", "content"],
      });
    }

    const updates = await userProfileLearner.learnFromFeedback(userId, data);

    res.json({
      success: true,
      updates,
      message: `Learned ${updates.length} new preference(s)`,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to process learning data:", { error });
    res.status(500).json({
      error: "Failed to process learning data",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Skill Patterns Routes
// ============================================================================

/**
 * GET /api/memory/skill-patterns
 * Get skill usage patterns and insights
 */
memoryRouter.get("/skill-patterns", async (req, res) => {
  try {
    const userId = getUserId(req);
    const patterns = await longTermMemoryManager.getSkillPatterns(userId);

    if (!patterns) {
      const shortTermStats = await shortTermMemoryManager.getStats(userId);
      return res.json({
        patterns: [],
        workflows: [],
        insights: [],
        recommendations: ["Start using skills to generate usage patterns"],
        totalInteractions: shortTermStats.totalInteractions,
        totalSkillsUsed: 0,
        averageConfidence: 0,
      });
    }

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze patterns
    if (patterns.patterns.length > 0) {
      const totalUses = patterns.patterns.reduce((sum, p) => sum + p.totalUses, 0);
      insights.push(`You've used skills ${totalUses} times`);

      const topSkill = patterns.patterns.sort((a, b) => b.totalUses - a.totalUses)[0];
      insights.push(`Your most used skill is "${topSkill.skillName}" (${topSkill.totalUses} uses)`);

      // Peak usage hours
      if (patterns.peakUsageHours.length > 0) {
        insights.push(`You typically use skills during hours: ${patterns.peakUsageHours.join(", ")}`);
      }

      // Recommendations
      const unusedCategories = patterns.preferredCategories.filter(
        (cat) => !patterns.patterns.some((p) => p.skillId.includes(cat))
      );
      if (unusedCategories.length > 0) {
        recommendations.push(`Try exploring skills in: ${unusedCategories.join(", ")}`);
      }
    } else {
      recommendations.push("Start exploring available skills to get personalized recommendations");
    }

    // Get interaction stats from short-term memory
    const shortTermStats = await shortTermMemoryManager.getStats(userId);

    // Calculate average success rate
    const avgSuccessRate = patterns.patterns.length > 0
      ? patterns.patterns.reduce((sum, p) => sum + p.averageSuccessRate, 0) / patterns.patterns.length
      : 0;

    res.json({
      patterns: patterns.patterns,
      workflows: patterns.commonWorkflows,
      insights,
      recommendations,
      // Additional stats for frontend
      totalInteractions: shortTermStats.totalInteractions,
      totalSkillsUsed: patterns.patterns.length,
      averageConfidence: avgSuccessRate,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get skill patterns:", { error });
    res.status(500).json({
      error: "Failed to get skill patterns",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/skill-usage
 * Record skill usage
 */
memoryRouter.post("/skill-usage", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { skillId, skillName, success = true } = req.body;

    if (!skillId || !skillName) {
      return res.status(400).json({ error: "skillId and skillName are required" });
    }

    await longTermMemoryManager.recordSkillUsage(userId, skillId, skillName, success);

    // Also record as interaction
    await shortTermMemoryManager.addInteraction(userId, {
      type: "skill_invocation",
      content: `Used skill: ${skillName}`,
      skillId,
      skillName,
      outcome: success ? "success" : "failure",
    });

    res.json({
      success: true,
      message: "Skill usage recorded",
    });
  } catch (error) {
    logger.error("[Memory API] Failed to record skill usage:", { error });
    res.status(500).json({
      error: "Failed to record skill usage",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Knowledge Graph Routes
// ============================================================================

/**
 * GET /api/memory/knowledge-graph
 * Get the user's knowledge graph
 */
memoryRouter.get("/knowledge-graph", async (req, res) => {
  try {
    const userId = getUserId(req);
    const graph = await longTermMemoryManager.getKnowledgeGraph(userId);

    if (!graph) {
      return res.json({
        nodes: [],
        edges: [],
        lastUpdated: Date.now(),
      });
    }

    res.json(graph);
  } catch (error) {
    logger.error("[Memory API] Failed to get knowledge graph:", { error });
    res.status(500).json({
      error: "Failed to get knowledge graph",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/knowledge-graph/search
 * Search knowledge nodes
 */
memoryRouter.get("/knowledge-graph/search", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { q: query, type } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const nodes = await longTermMemoryManager.searchKnowledgeNodes(
      userId,
      query,
      type as string | undefined
    );

    res.json({
      query,
      nodes,
      count: nodes.length,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to search knowledge graph:", { error });
    res.status(500).json({
      error: "Failed to search knowledge graph",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Project History Routes
// ============================================================================

/**
 * GET /api/memory/projects
 * Get project history
 */
memoryRouter.get("/projects", async (req, res) => {
  try {
    const userId = getUserId(req);
    const projects = await longTermMemoryManager.getProjects(userId);

    res.json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get projects:", { error });
    res.status(500).json({
      error: "Failed to get projects",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/projects/active
 * Get active projects
 */
memoryRouter.get("/projects/active", async (req, res) => {
  try {
    const userId = getUserId(req);
    const projects = await longTermMemoryManager.getActiveProjects(userId);

    res.json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get active projects:", { error });
    res.status(500).json({
      error: "Failed to get active projects",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/projects
 * Add a new project
 */
memoryRouter.post("/projects", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, description, technologies = [], skillsUsed = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const project = await longTermMemoryManager.addProject(userId, {
      name,
      description,
      status: "active",
      startDate: Date.now(),
      technologies,
      skillsUsed,
      relatedConversations: [],
    });

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to add project:", { error });
    res.status(500).json({
      error: "Failed to add project",
      message: (error as Error).message,
    });
  }
});

/**
 * PUT /api/memory/projects/:projectId
 * Update a project
 */
memoryRouter.put("/projects/:projectId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { projectId } = req.params;
    const updates = req.body;

    const project = await longTermMemoryManager.updateProject(userId, projectId, updates);

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to update project:", { error });
    res.status(500).json({
      error: "Failed to update project",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Working Memory Routes (for debugging/monitoring)
// ============================================================================

/**
 * GET /api/memory/working/:sessionId
 * Get working memory for a session (debug only)
 */
memoryRouter.get("/working/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = workingMemoryManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    logger.error("[Memory API] Failed to get working memory:", { error });
    res.status(500).json({
      error: "Failed to get working memory",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/working-stats
 * Get working memory statistics (debug only)
 */
memoryRouter.get("/working-stats", (_req, res) => {
  try {
    const stats = workingMemoryManager.getStats();
    res.json(stats);
  } catch (error) {
    logger.error("[Memory API] Failed to get working memory stats:", { error });
    res.status(500).json({
      error: "Failed to get working memory stats",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Export/Import Routes
// ============================================================================

/**
 * GET /api/memory/export
 * Export all memory for a user
 */
memoryRouter.get("/export", async (req, res) => {
  try {
    const userId = getUserId(req);
    const longTerm = await longTermMemoryManager.exportMemory(userId);
    const shortTerm = await shortTermMemoryManager.exportMemory(userId);

    res.json({
      userId,
      exportedAt: Date.now(),
      longTerm: JSON.parse(longTerm),
      shortTerm,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to export memory:", { error });
    res.status(500).json({
      error: "Failed to export memory",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/import
 * Import memory for a user
 */
memoryRouter.post("/import", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { longTerm, shortTerm } = req.body;

    if (longTerm) {
      await longTermMemoryManager.importMemory(userId, JSON.stringify(longTerm));
    }

    if (shortTerm) {
      await shortTermMemoryManager.importMemory(shortTerm);
    }

    res.json({
      success: true,
      message: "Memory imported successfully",
    });
  } catch (error) {
    logger.error("[Memory API] Failed to import memory:", { error });
    res.status(500).json({
      error: "Failed to import memory",
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/memory/all
 * Delete all memory for a user (GDPR-style right to be forgotten)
 */
memoryRouter.delete("/all", async (req, res) => {
  try {
    const userId = getUserId(req);

    await longTermMemoryManager.deleteUserMemory(userId);
    await shortTermMemoryManager.clearAllUserMemory(userId);

    res.json({
      success: true,
      message: "All memory deleted for user",
    });
  } catch (error) {
    logger.error("[Memory API] Failed to delete memory:", { error });
    res.status(500).json({
      error: "Failed to delete memory",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Memory Closure Routes (Daily Summary & Morning Reminders)
// ============================================================================

import {
  generateDailySummary,
  generateMorningReminder,
  sendMorningReminder,
  getDailySummary,
} from "../memory/memory-closure.js";

/**
 * GET /api/memory/daily-summary
 * Get daily summary for a specific date (defaults to today)
 */
memoryRouter.get("/daily-summary", async (req, res) => {
  try {
    const userId = getUserId(req);
    const date = (req.query.date as string) || undefined;

    // Try to get existing summary
    let summary = getDailySummary(userId, date);

    // If not found or forced refresh, generate new one
    if (!summary || req.query.refresh === "true") {
      summary = await generateDailySummary(userId, date);
    }

    res.json({
      summary,
      generated: true,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get daily summary:", { error });
    res.status(500).json({
      error: "Failed to get daily summary",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/daily-summary/generate
 * Force generate a new daily summary
 */
memoryRouter.post("/daily-summary/generate", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { date } = req.body;

    const summary = await generateDailySummary(userId, date);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to generate daily summary:", { error });
    res.status(500).json({
      error: "Failed to generate daily summary",
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/memory/morning-reminder
 * Get morning reminder for today
 */
memoryRouter.get("/morning-reminder", async (req, res) => {
  try {
    const userId = getUserId(req);

    const reminder = await generateMorningReminder(userId);

    res.json({
      reminder,
      generatedAt: Date.now(),
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get morning reminder:", { error });
    res.status(500).json({
      error: "Failed to get morning reminder",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/memory/morning-reminder/send
 * Trigger sending morning reminder (for testing)
 */
memoryRouter.post("/morning-reminder/send", async (req, res) => {
  try {
    const userId = getUserId(req);

    await sendMorningReminder(userId);

    res.json({
      success: true,
      message: "Morning reminder sent",
    });
  } catch (error) {
    logger.error("[Memory API] Failed to send morning reminder:", { error });
    res.status(500).json({
      error: "Failed to send morning reminder",
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Reminder Polling Routes (for frontend to fetch pending reminders)
// ============================================================================

/**
 * GET /api/memory/reminders/pending
 * Get today's pending reminders (morning reminders, burnout care, etc.)
 * Frontend polls this endpoint to display reminders in chat
 */
memoryRouter.get("/reminders/pending", async (req, res) => {
  try {
    const userId = getUserId(req);
    const today = new Date().toISOString().split("T")[0];
    const memory = await shortTermMemoryManager.getMemoryForDate(userId, today);

    // Filter interactions that are system reminders
    const reminders = memory.dailyInteractions
      .filter((interaction) =>
        interaction.type === "chat" &&
        interaction.content &&
        interaction.content.startsWith("【每日提醒】")
      )
      .map((interaction) => ({
        id: interaction.id,
        content: interaction.content.replace(/^【每日提醒】/, "").trim(),
        timestamp: interaction.timestamp,
        type: "morning" as const,
      }));

    res.json({
      reminders,
      count: reminders.length,
      date: today,
    });
  } catch (error) {
    logger.error("[Memory API] Failed to get pending reminders:", { error });
    res.status(500).json({
      error: "Failed to get pending reminders",
      message: (error as Error).message,
    });
  }
});
