/**
 * Memory Closure Service
 * 记忆闭环服务 - 实现每日总结和主动提醒
 *
 * 功能：
 * 1. 每日总结生成：基于用户当天的对话，生成总结报告
 * 2. 主动提醒：每天早上9点提醒用户未解决的问题和今日待办
 * 3. 学习统计：定期生成用户的学习统计报告
 */

import { shortTermMemoryManager } from "./short-term-memory.js";
import { longTermMemoryManager } from "./long-term-memory.js";
import { burnoutDetector, generateCareMessage } from "./burnout-detector.js";
import { logger } from "../utils/logger.js";
import type { ShortTermMemory } from "./types.js";

interface DailySummary {
  date: string;
  userId: string;
  totalInteractions: number;
  topics: string[];
  completedTasks: number;
  pendingTasks: number;
  insights: string[];
  generatedAt: number;
  /** Burnout risk assessment - optional for backward compatibility */
  burnoutAssessment?: {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    factors: string[];
    suggestions: string[];
  };
}

interface MorningReminder {
  userId: string;
  date: string;
  unResolvedQuestions: string[];
  pendingTasks: Array<{
    id: string;
    title: string;
    priority: string;
    createdAt: number;
  }>;
  todaySuggestions: string[];
  learningStats: {
    totalInteractions: number;
    skillsUsed: string[];
    streakDays: number;
  };
}

// Store for daily summaries
const dailySummaries = new Map<string, DailySummary>();

// Active timers
let dailySummaryTimer: NodeJS.Timeout | null = null;
let morningReminderTimer: NodeJS.Timeout | null = null;

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getSummaryKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

/**
 * Generate daily summary for a user
 * 基于当天的交互生成总结
 */
export async function generateDailySummary(userId: string, date?: string): Promise<DailySummary> {
  const targetDate = date || getTodayKey();
  const memory = await shortTermMemoryManager.getMemoryForDate(userId, targetDate);

  // Extract topics from interactions
  const topics = extractTopics(memory.dailyInteractions.map(i => i.content));

  // Count completed tasks (tasks completed on this date)
  const completedTasks = memory.pendingTasks.filter(
    t => t.status === "completed" && t.completedAt
  ).length;

  // Burnout risk assessment (if enabled)
  let burnoutAssessment: DailySummary["burnoutAssessment"] | undefined;
  if (burnoutDetector.isDetectionEnabled()) {
    const assessment = await burnoutDetector.assessRisk(userId, targetDate);
    if (assessment) {
      burnoutAssessment = {
        score: assessment.score,
        level: assessment.level,
        factors: assessment.factors,
        suggestions: assessment.suggestions,
      };
    }
  }

  const summary: DailySummary = {
    date: targetDate,
    userId,
    totalInteractions: memory.dailyInteractions.length,
    topics: [...new Set(topics)].slice(0, 10), // 去重，最多10个主题
    completedTasks,
    pendingTasks: memory.pendingTasks.filter(t => t.status === "pending").length,
    insights: generateInsights(memory),
    generatedAt: Date.now(),
    burnoutAssessment,
  };

  // Store the summary
  dailySummaries.set(getSummaryKey(userId, targetDate), summary);

  logger.info(`[MemoryClosure] Generated daily summary for ${userId} on ${targetDate}:`, {
    interactions: summary.totalInteractions,
    topics: summary.topics.length,
  });

  return summary;
}

/**
 * Extract topics from interaction contents
 * 简单的主题提取（基于关键词）
 */
function extractTopics(contents: string[]): string[] {
  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    "代码开发": ["代码", "编程", "函数", "bug", "debug", "python", "javascript", "java", "c++", "react", "vue"],
    "技术问题": ["技术", "架构", "设计模式", "性能", "优化", "数据库", "api", "接口"],
    "项目管理": ["项目", "进度", "计划", "排期", "里程碑", "交付"],
    "学习提升": ["学习", "教程", "文档", "阅读", "理解", "原理"],
    "日常事务": ["会议", "邮件", "汇报", "总结", "周报", "日报"],
    "技能使用": ["技能", "工具", "脚本", "自动化", "workflow"],
  };

  for (const content of contents) {
    const lowerContent = content.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        topics.push(topic);
        break;
      }
    }
  }

  return topics;
}

/**
 * Generate insights from daily memory
 */
function generateInsights(memory: ShortTermMemory): string[] {
  const insights: string[] = [];

  if (memory.dailyInteractions.length === 0) {
    insights.push("今天还没有对话记录");
    return insights;
  }

  // Activity level
  if (memory.dailyInteractions.length > 20) {
    insights.push("今天非常活跃，进行了大量交流");
  } else if (memory.dailyInteractions.length > 10) {
    insights.push("今天使用频率正常");
  } else {
    insights.push("今天使用较少");
  }

  // Task completion rate
  const totalTasks = memory.pendingTasks.length;
  const completedTasks = memory.pendingTasks.filter(t => t.status === "completed").length;
  if (totalTasks > 0) {
    const rate = Math.round((completedTasks / totalTasks) * 100);
    insights.push(`任务完成率：${rate}% (${completedTasks}/${totalTasks})`);
  }

  // Learning progress
  if (memory.learnedPreferences.length > 0) {
    insights.push(`今天学到了 ${memory.learnedPreferences.length} 个新偏好`);
  }

  return insights;
}

/**
 * Generate morning reminder for a user
 * 生成早上提醒（未解决问题 + 今日待办）
 */
export async function generateMorningReminder(userId: string): Promise<MorningReminder> {
  const today = getTodayKey();

  // Get yesterday's memory for unresolved questions
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  const yesterdayMemory = await shortTermMemoryManager.getMemoryForDate(userId, yesterdayKey);

  // Find potentially unresolved questions (heuristic: questions without clear answers)
  const unResolvedQuestions = yesterdayMemory.dailyInteractions
    .filter(i => {
      const content = i.content.toLowerCase();
      return content.includes("?") ||
             content.includes("？") ||
             content.includes("怎么") ||
             content.includes("如何") ||
             content.includes("为什么");
    })
    .slice(-5)
    .map(i => i.content.slice(0, 100) + (i.content.length > 100 ? "..." : ""));

  // Get all pending tasks
  const allPendingTasks = await shortTermMemoryManager.getAllPendingTasks(userId);

  // Get user profile for personalized suggestions
  const profile = await longTermMemoryManager.getUserProfile(userId);

  // Generate suggestions based on profile and history
  const suggestions: string[] = [];

  if (allPendingTasks.length > 0) {
    suggestions.push(`您有 ${allPendingTasks.length} 个待办任务等待处理`);
  }

  if ((profile?.workStyle as any)?.preferredTimes?.length) {
    const preferredTime = (profile?.workStyle as any).preferredTimes[0];
    suggestions.push(`根据您的习惯，${preferredTime}是您的高效时段，适合处理复杂任务`);
  }

  // Get recent skill usage for recommendations
  const skillPatterns = await longTermMemoryManager.getSkillPatterns(userId);
  if (skillPatterns?.preferredCategories?.length) {
    const topCategory = skillPatterns.preferredCategories[0];
    suggestions.push(`您经常使用${topCategory}类技能，今天可以尝试探索相关新技能`);
  }

  // Calculate streak (consecutive days with interactions)
  const streakDays = await calculateStreakDays(userId);

  const reminder: MorningReminder = {
    userId,
    date: today,
    unResolvedQuestions: [...new Set(unResolvedQuestions)],
    pendingTasks: allPendingTasks.slice(0, 10).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      createdAt: t.createdAt,
    })),
    todaySuggestions: suggestions,
    learningStats: {
      totalInteractions: yesterdayMemory.dailyInteractions.length,
      skillsUsed: skillPatterns?.patterns?.map(p => p.skillName) || [],
      streakDays,
    },
  };

  return reminder;
}

/**
 * Calculate consecutive days with interactions (streak)
 */
async function calculateStreakDays(userId: string): Promise<number> {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const memory = await shortTermMemoryManager.exportMemory(userId, dateKey);

    if (memory && memory.dailyInteractions.length > 0) {
      streak++;
    } else if (i > 0) {
      // If no interactions on a past day (and it's not today), break the streak
      break;
    }
  }

  return streak;
}

/**
 * Send morning reminder to user via notification system
 * 发送早上提醒（可以通过 WebSocket、邮件、企业微信等）
 */
export async function sendMorningReminder(userId: string): Promise<void> {
  try {
    const reminder = await generateMorningReminder(userId);

    // Burnout detection - add care message if needed
    let careMessage: string | undefined;
    if (burnoutDetector.isDetectionEnabled()) {
      const assessment = await burnoutDetector.assessRisk(userId);
      if (assessment && await burnoutDetector.shouldSendCareMessage(userId, assessment)) {
        const message = generateCareMessage(assessment);
        careMessage = `${message.title}\n${message.content}`;
        await burnoutDetector.recordCareMessageSent(userId);
      }
    }

    // Format the reminder message
    const lines: string[] = [
      "☀️ 早上好！这是您的今日助手提醒",
      "",
      `📊 昨日回顾：${reminder.learningStats.totalInteractions} 次对话`,
    ];

    if (reminder.learningStats.streakDays > 1) {
      lines.push(`🔥 连续使用 ${reminder.learningStats.streakDays} 天`);
    }

    if (reminder.pendingTasks.length > 0) {
      lines.push("", `📋 待办任务 (${reminder.pendingTasks.length})：`);
      reminder.pendingTasks.slice(0, 5).forEach(task => {
        const priorityEmoji = task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢";
        lines.push(`  ${priorityEmoji} ${task.title}`);
      });
      if (reminder.pendingTasks.length > 5) {
        lines.push(`  ...还有 ${reminder.pendingTasks.length - 5} 个任务`);
      }
    }

    if (reminder.unResolvedQuestions.length > 0) {
      lines.push("", "💭 昨日未解决问题：");
      reminder.unResolvedQuestions.slice(0, 3).forEach(q => {
        lines.push(`  • ${q}`);
      });
    }

    if (reminder.todaySuggestions.length > 0) {
      lines.push("", "💡 今日建议：");
      reminder.todaySuggestions.forEach(s => {
        lines.push(`  • ${s}`);
      });
    }

    // Add burnout care message if available
    if (careMessage) {
      lines.push("", careMessage);
    }

    const message = lines.join("\n");

    // TODO: Send via notification system (WebSocket, email, etc.)
    // For now, just log it
    logger.info(`[MemoryClosure] Morning reminder for ${userId}:`, { message: message.slice(0, 200) });

    // Store the reminder in short-term memory as a system message
    await shortTermMemoryManager.addInteraction(userId, {
      type: "chat",
      content: "【每日提醒】" + message,
      outcome: "success",
    });

  } catch (error) {
    logger.error(`[MemoryClosure] Failed to send morning reminder for ${userId}:`, error);
  }
}

/**
 * Get daily summary for a user
 */
export function getDailySummary(userId: string, date?: string): DailySummary | null {
  const targetDate = date || getTodayKey();
  return dailySummaries.get(getSummaryKey(userId, targetDate)) || null;
}

/**
 * Run daily summary generation for all users
 */
export async function runDailySummaryForAllUsers(): Promise<void> {
  // Get all unique user IDs from memory store
  const userIds = new Set<string>();
  // This is a simplified version - in production, you'd maintain a user registry
  // For now, just use a default user
  userIds.add("default-user");
  
  // Also check the memory store directly
  // This is a workaround since we don't have direct access to the store keys
  // In production, you'd maintain a user registry

  logger.info(`[MemoryClosure] Running daily summary for ${userIds.size} users`);

  for (const userId of userIds) {
    try {
      await generateDailySummary(userId);
    } catch (error) {
      logger.error(`[MemoryClosure] Failed to generate summary for ${userId}:`, error);
    }
  }
}

/**
 * Start the memory closure scheduled tasks
 * 启动记忆闭环定时任务
 */
export function startMemoryClosureScheduler(): void {
  // Stop existing timers
  stopMemoryClosureScheduler();

  // Schedule daily summary generation at 23:55 (11:55 PM)
  const now = new Date();
  const summaryTime = new Date(now);
  summaryTime.setHours(23, 55, 0, 0);
  if (summaryTime <= now) {
    summaryTime.setDate(summaryTime.getDate() + 1);
  }

  const msUntilSummary = summaryTime.getTime() - now.getTime();
  setTimeout(() => {
    runDailySummaryForAllUsers();
    // Then every 24 hours
    dailySummaryTimer = setInterval(runDailySummaryForAllUsers, 24 * 60 * 60 * 1000);
  }, msUntilSummary);

  logger.info(`[MemoryClosure] Scheduled daily summary at 23:55 (in ${Math.round(msUntilSummary / 60000)} minutes)`);

  // Schedule morning reminders at 9:00 AM
  const reminderTime = new Date(now);
  reminderTime.setHours(9, 0, 0, 0);
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const msUntilReminder = reminderTime.getTime() - now.getTime();
  setTimeout(() => {
    // Send reminders to all known users
    sendMorningReminder("default-user").catch(console.error);
    // Then every 24 hours
    morningReminderTimer = setInterval(() => {
      sendMorningReminder("default-user").catch(console.error);
    }, 24 * 60 * 60 * 1000);
  }, msUntilReminder);

  logger.info(`[MemoryClosure] Scheduled morning reminder at 09:00 (in ${Math.round(msUntilReminder / 60000)} minutes)`);
}

/**
 * Stop the memory closure scheduled tasks
 */
export function stopMemoryClosureScheduler(): void {
  if (dailySummaryTimer) {
    clearInterval(dailySummaryTimer);
    dailySummaryTimer = null;
  }
  if (morningReminderTimer) {
    clearInterval(morningReminderTimer);
    morningReminderTimer = null;
  }
}

// Auto-start scheduler when module is loaded (in production environment)
if (process.env.ENABLE_MEMORY_CLOSURE !== "false") {
  // Delay startup to allow other modules to initialize
  setTimeout(startMemoryClosureScheduler, 5000);
}
