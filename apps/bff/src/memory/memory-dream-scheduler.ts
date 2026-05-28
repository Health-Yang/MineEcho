import { logger } from "../utils/logger.js";
import { getOrCreateUserId } from "../utils/user-id.js";
import { runMemoryDream } from "./memory-dream.js";

export interface DreamSchedulerConfig {
  enabled: boolean;
  intervalMs: number;
  minIntervalMs: number;
  days: number;
  userId?: string;
  now?: () => number;
}

export interface DreamSchedulerState {
  enabled: boolean;
  running: boolean;
  lastRunAt: number | null;
  lastSuccessAt: number | null;
  lastError: string | null;
  lastProcessedChunks: number;
}

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_MIN_INTERVAL_MS = 23 * 60 * 60 * 1000;
const DEFAULT_DAYS = 7;

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDreamSchedulerConfigFromEnv(): DreamSchedulerConfig {
  return {
    enabled: process.env.MINECHO_DREAM_SCHEDULER_ENABLED !== "false",
    intervalMs: readNumberEnv("MINECHO_DREAM_SCHEDULER_INTERVAL_MS", DEFAULT_INTERVAL_MS),
    minIntervalMs: readNumberEnv("MINECHO_DREAM_SCHEDULER_MIN_INTERVAL_MS", DEFAULT_MIN_INTERVAL_MS),
    days: Math.min(Math.max(readNumberEnv("MINECHO_DREAM_SCHEDULER_DAYS", DEFAULT_DAYS), 1), 90),
  };
}

export class MemoryDreamScheduler {
  private timer: NodeJS.Timeout | null = null;
  private state: DreamSchedulerState = {
    enabled: false,
    running: false,
    lastRunAt: null,
    lastSuccessAt: null,
    lastError: null,
    lastProcessedChunks: 0,
  };

  constructor(private readonly config: DreamSchedulerConfig) {
    this.state.enabled = config.enabled;
  }

  start(): void {
    if (!this.config.enabled) {
      logger.info("[DreamScheduler] Disabled");
      return;
    }
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.config.intervalMs);
    this.timer.unref?.();
    void this.tick();
    logger.info("[DreamScheduler] Started", {
      intervalMs: this.config.intervalMs,
      minIntervalMs: this.config.minIntervalMs,
      days: this.config.days,
    });
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    logger.info("[DreamScheduler] Stopped");
  }

  getState(): DreamSchedulerState {
    return { ...this.state };
  }

  async tick(): Promise<boolean> {
    if (!this.config.enabled || this.state.running) return false;
    const now = this.config.now?.() ?? Date.now();
    if (this.state.lastRunAt && now - this.state.lastRunAt < this.config.minIntervalMs) {
      return false;
    }

    this.state.running = true;
    this.state.lastRunAt = now;
    this.state.lastError = null;
    try {
      const userId = this.config.userId || await getOrCreateUserId();
      const result = await runMemoryDream(userId, { days: this.config.days, now });
      this.state.lastProcessedChunks = result.processedChunks;
      this.state.lastSuccessAt = now;
      logger.info("[DreamScheduler] Dream run completed", {
        userId,
        processedChunks: result.processedChunks,
        l1: result.summaries.l1.length,
        hasL2: !!result.summaries.l2,
        hasL3: !!result.summaries.l3,
      });
      return true;
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : String(error);
      logger.warn("[DreamScheduler] Dream run failed", { error: this.state.lastError });
      return false;
    } finally {
      this.state.running = false;
    }
  }
}

let scheduler: MemoryDreamScheduler | null = null;

export function startMemoryDreamScheduler(config = getDreamSchedulerConfigFromEnv()): MemoryDreamScheduler {
  if (scheduler) return scheduler;
  scheduler = new MemoryDreamScheduler(config);
  scheduler.start();
  return scheduler;
}

export function stopMemoryDreamScheduler(): void {
  scheduler?.stop();
  scheduler = null;
}

export function getMemoryDreamSchedulerState(): DreamSchedulerState | null {
  return scheduler?.getState() ?? null;
}
