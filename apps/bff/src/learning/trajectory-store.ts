/**
 * Trajectory Store - Records full conversation turns for self-learning
 * Pattern: persistent file-based JSONL queue with batched writes
 */

import { mkdirSync, existsSync, writeFileSync, readdirSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";
import { logger } from "../utils/logger.js";

export interface TrajectoryTurn {
  sessionId: string;
  userId: string;
  timestamp: number;
  mode: string;
  userMessage: string;
  assistantContent: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
    result?: string;
    latencyMs?: number;
    success?: boolean;
  }>;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs?: number;
  error?: string;
  feedback?: {
    rating: "positive" | "negative" | "neutral";
    comment?: string;
    timestamp?: number;
  };
  skillName?: string;
}

export interface FeedbackRecord {
  sessionId: string;
  messageId: string;
  userId: string;
  timestamp: number;
  rating: "positive" | "negative" | "neutral";
  comment?: string;
}

export interface TrajectoryFilter {
  sessionId?: string;
  skillId?: string;
  userId?: string;
  startTime?: number;
  endTime?: number;
  mode?: string;
  hasError?: boolean;
  limit?: number;
}

const FLUSH_INTERVAL_MS = 30 * 1000;
const RETENTION_DAYS = 30;

function getTrajectoryDir(): string {
  return join(getMineEchoHome(), "trajectories");
}

function getFeedbackPath(): string {
  return join(getMineEchoHome(), "feedback.jsonl");
}

function ensureTrajectoryDir(): string {
  const dir = getTrajectoryDir();
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      logger.error("[TrajectoryStore] Failed to create trajectory directory:", error);
      throw error;
    }
  }
  return dir;
}

function ensureFeedbackDir(): string {
  const path = getFeedbackPath();
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      logger.error("[TrajectoryStore] Failed to create feedback directory:", error);
      throw error;
    }
  }
  return path;
}

function getTrajectoryFilePath(dir: string, date?: Date): string {
  const now = date || new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return join(dir, `trajectories-${dateStr}.jsonl`);
}

class TrajectoryStore {
  private queue: TrajectoryTurn[] = [];
  private feedbackQueue: FeedbackRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  recordTurn(turn: TrajectoryTurn): void {
    this.queue.push(turn);
    this.startFlushTimer();
  }

  recordFeedback(feedback: FeedbackRecord): void {
    this.feedbackQueue.push(feedback);
    this.startFlushTimer();
  }

  /**
   * Update an existing trajectory turn with feedback by rewriting the JSONL file.
   * This is a best-effort operation: it finds the turn matching sessionId + messageId
   * (messageId maps to timestamp) and appends feedback.
   */
  async updateTurnWithFeedback(
    sessionId: string,
    messageId: string,
    feedback: TrajectoryTurn["feedback"]
  ): Promise<boolean> {
    const dir = ensureTrajectoryDir();
    // messageId is typically `a-${timestamp}`; try today's file first, then recent files
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse();

    for (const file of files) {
      const filepath = join(dir, file);
      try {
        const content = readFileSync(filepath, "utf8");
        const lines = content.split("\n");
        let modified = false;
        const newLines: string[] = [];

        for (const line of lines) {
          if (!line.trim()) {
            newLines.push(line);
            continue;
          }
          try {
            const turn = JSON.parse(line) as TrajectoryTurn;
            // Match by sessionId and approximate timestamp from messageId
            if (turn.sessionId === sessionId && messageId.includes(String(turn.timestamp))) {
              turn.feedback = feedback;
              modified = true;
            }
            newLines.push(JSON.stringify(turn));
          } catch {
            newLines.push(line);
          }
        }

        if (modified) {
          writeFileSync(filepath, newLines.join("\n"), "utf8");
          return true;
        }
      } catch (error) {
        logger.warn("[TrajectoryStore] Failed to update feedback in file:", filepath, error);
      }
    }

    return false;
  }

  /**
   * Read and filter trajectory turns from JSONL files.
   */
  getTurns(filter: TrajectoryFilter = {}): TrajectoryTurn[] {
    const dir = ensureTrajectoryDir();
    const results: TrajectoryTurn[] = [];

    try {
      const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
      for (const file of files) {
        const content = readFileSync(join(dir, file), "utf8");
        const lines = content.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          try {
            const turn = JSON.parse(line) as TrajectoryTurn;
            if (this.matchesFilter(turn, filter)) {
              results.push(turn);
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    } catch (error) {
      logger.error("[TrajectoryStore] Failed to read trajectory files:", { error });
    }

    // Sort by timestamp desc and apply limit
    results.sort((a, b) => b.timestamp - a.timestamp);
    if (filter.limit && filter.limit > 0) {
      return results.slice(0, filter.limit);
    }
    return results;
  }

  private matchesFilter(turn: TrajectoryTurn, filter: TrajectoryFilter): boolean {
    if (filter.sessionId && turn.sessionId !== filter.sessionId) return false;
    if (filter.userId && turn.userId !== filter.userId) return false;
    if (filter.mode && turn.mode !== filter.mode) return false;
    if (filter.startTime && turn.timestamp < filter.startTime) return false;
    if (filter.endTime && turn.timestamp > filter.endTime) return false;
    if (filter.hasError === true && !turn.error) return false;
    if (filter.hasError === false && turn.error) return false;
    if (filter.skillId) {
      const hasSkill = turn.toolCalls?.some((tc) => tc.name === filter.skillId || tc.id === filter.skillId);
      if (!hasSkill && turn.skillName !== filter.skillId) return false;
    }
    return true;
  }

  /**
   * Prune trajectory files older than RETENTION_DAYS.
   */
  pruneOldFiles(): void {
    const dir = ensureTrajectoryDir();
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    try {
      const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
      for (const file of files) {
        // Extract date from filename: trajectories-YYYY-MM-DD.jsonl
        const match = file.match(/trajectories-(\d{4})-(\d{2})-(\d{2})\.jsonl/);
        if (match) {
          const fileDate = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`).getTime();
          if (fileDate < cutoff) {
            try {
              unlinkSync(join(dir, file));
              logger.info("[TrajectoryStore] Pruned old trajectory file:", file);
            } catch (error) {
              logger.warn("[TrajectoryStore] Failed to prune file:", file, error);
            }
          }
        }
      }
    } catch (error) {
      logger.error("[TrajectoryStore] Failed to prune old trajectories:", { error });
    }
  }

  async flush(): Promise<void> {
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;

    try {
      await this.flushTurns();
      await this.flushFeedback();
      this.pruneOldFiles();
    } catch (error) {
      logger.error("[TrajectoryStore] Flush failed:", { error });
    } finally {
      this.isFlushing = false;
    }
  }

  private async flushTurns(): Promise<void> {
    if (this.queue.length === 0) return;

    const dir = ensureTrajectoryDir();
    const filepath = getTrajectoryFilePath(dir);
    const batch = this.queue.splice(0, this.queue.length);
    const lines = batch.map((turn) => JSON.stringify(turn)).join("\n") + "\n";

    try {
      writeFileSync(filepath, lines, { flag: "a", encoding: "utf8" });
      logger.debug(`[TrajectoryStore] Flushed ${batch.length} turns to ${filepath}`);
    } catch (error) {
      logger.error("[TrajectoryStore] Failed to write trajectory file:", error);
      // Re-queue on failure
      this.queue.unshift(...batch);
    }
  }

  private async flushFeedback(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    const filepath = ensureFeedbackDir();
    const batch = this.feedbackQueue.splice(0, this.feedbackQueue.length);
    const lines = batch.map((fb) => JSON.stringify(fb)).join("\n") + "\n";

    try {
      writeFileSync(filepath, lines, { flag: "a", encoding: "utf8" });
      logger.debug(`[TrajectoryStore] Flushed ${batch.length} feedback records`);
    } catch (error) {
      logger.error("[TrajectoryStore] Failed to write feedback file:", error);
      // Re-queue on failure
      this.feedbackQueue.unshift(...batch);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        logger.error("[TrajectoryStore] Flush timer error:", { error });
      });
    }, FLUSH_INTERVAL_MS);

    process.on("SIGTERM", () => {
      this.stopFlushTimer();
      logger.info("[TrajectoryStore] Interval cleared on SIGTERM");
    });
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const trajectoryStore = new TrajectoryStore();

// Process exit flush
process.on("beforeExit", async () => {
  await trajectoryStore.flush();
});
