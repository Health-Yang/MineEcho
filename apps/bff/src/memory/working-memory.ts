/**
 * Working Memory Manager
 * Manages in-memory session state for active conversations
 * - Stores last 20 messages per session
 * - Tracks active skills and current context
 * - No persistence - lost when session ends
 */

import type {
  WorkingMemory,
  Message,
  Context,
  IWorkingMemoryManager,
} from "./types.js";
import { logger } from "../utils/logger.js";

const MAX_MESSAGES = 20;
const DEFAULT_INACTIVE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

class WorkingMemoryManager implements IWorkingMemoryManager {
  private sessions = new Map<string, WorkingMemory>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup of inactive sessions
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      try {
        this.cleanupInactiveSessions();
      } catch (error) {
        logger.error('[WorkingMemory] Cleanup interval error:', { error });
        // 不中断定时器，继续下次执行
      }
    }, 5 * 60 * 1000);

    // 进程退出时清理
    process.on('SIGTERM', () => {
      this.destroy();
      logger.info('[WorkingMemory] Interval cleared on SIGTERM');
    });
  }

  getSession(sessionId: string): WorkingMemory | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  createSession(sessionId: string): WorkingMemory {
    const now = Date.now();
    const session: WorkingMemory = {
      sessionId,
      recentMessages: [],
      currentContext: {},
      activeSkills: [],
      createdAt: now,
      lastActivity: now,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  addMessage(
    sessionId: string,
    message: Omit<Message, "id" | "timestamp">
  ): Message {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }

    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };

    session.recentMessages.push(newMessage);

    // Keep only the last MAX_MESSAGES messages
    if (session.recentMessages.length > MAX_MESSAGES) {
      session.recentMessages = session.recentMessages.slice(-MAX_MESSAGES);
    }

    session.lastActivity = Date.now();

    // Update context based on message content
    this.updateContextFromMessage(session, newMessage);

    return newMessage;
  }

  private updateContextFromMessage(session: WorkingMemory, message: Message): void {
    // Simple entity extraction from message content
    const content = message.content.toLowerCase();

    // Detect urgency
    if (/urgent|asap|immediately|emergency|critical/.test(content)) {
      session.currentContext.urgency = "high";
    } else if (/soon|today|this week/.test(content)) {
      session.currentContext.urgency = "medium";
    }

    // Detect task type based on keywords
    if (/code|program|function|bug|error|debug/.test(content)) {
      session.currentContext.taskType = "coding";
    } else if (/write|draft|document|report|email/.test(content)) {
      session.currentContext.taskType = "writing";
    } else if (/analyze|review|check|evaluate/.test(content)) {
      session.currentContext.taskType = "analysis";
    } else if (/learn|explain|how to|tutorial/.test(content)) {
      session.currentContext.taskType = "learning";
    }

    // Extract potential technologies mentioned
    const techPatterns = [
      /\b(javascript|typescript|python|go|golang|rust|java|cpp|c\+\+|c#|ruby|php)\b/gi,
      /\b(react|vue|angular|svelte|next\.?js|nuxt|express|fastapi|django|flask)\b/gi,
      /\b(docker|kubernetes|k8s|aws|azure|gcp|vercel|netlify)\b/gi,
      /\b(postgresql|mysql|mongodb|redis|sqlite|elasticsearch)\b/gi,
    ];

    const technologies: string[] = [];
    for (const pattern of techPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        technologies.push(...matches);
      }
    }

    if (technologies.length > 0) {
      const existingEntities = session.currentContext.entities || [];
      const newEntities = technologies.map((tech) => ({
        type: "technology" as const,
        name: tech,
        confidence: 0.7,
      }));
      session.currentContext.entities = [...existingEntities, ...newEntities];
    }
  }

  updateContext(sessionId: string, context: Partial<Context>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.currentContext = {
      ...session.currentContext,
      ...context,
    };
    session.lastActivity = Date.now();
  }

  setActiveSkills(sessionId: string, skillIds: string[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.activeSkills = skillIds;
    session.lastActivity = Date.now();

    // Also update context with related skills
    if (skillIds.length > 0) {
      session.currentContext.relatedSkills = skillIds;
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getRecentMessages(sessionId: string, count: number = 10): Message[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    session.lastActivity = Date.now();
    return session.recentMessages.slice(-count);
  }

  cleanupInactiveSessions(maxInactiveMs: number = DEFAULT_INACTIVE_TIMEOUT_MS): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxInactiveMs) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`[WorkingMemory] Cleaned up ${cleanedCount} inactive sessions`);
    }
  }

  getStats(): {
    totalSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  } {
    const totalSessions = this.sessions.size;
    let totalMessages = 0;

    for (const session of this.sessions.values()) {
      totalMessages += session.recentMessages.length;
    }

    return {
      totalSessions,
      totalMessages,
      averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

// Export singleton instance
export const workingMemoryManager = new WorkingMemoryManager();

// Export class for testing
export { WorkingMemoryManager };
