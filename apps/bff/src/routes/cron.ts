import { Router } from "express";
import { readFile, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { getMineEchoHome } from "../utils/config-path.js";
import { getLocalBffUrl } from "../utils/bff-url.js";

export const cronRouter = Router();

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: "success" | "failed";
  lastError?: string;
  nextRun?: string;
  command?: string;
  description?: string;
}

const activeTimers = new Map<string, NodeJS.Timeout>();

function parseCronInterval(schedule: string): number | null {
  // Parse "*/n * * * *" format to milliseconds (n minutes → n*60*1000)
  const match = schedule.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    return minutes * 60 * 1000;
  }
  return null;
}

async function loadJobs(): Promise<CronJob[]> {
  const mineechoHome = getMineEchoHome();
  const filePath = join(mineechoHome, "cron-jobs.json");

  try {
    const data = await readFile(filePath, "utf8");
    return JSON.parse(data).jobs as CronJob[];
  } catch {
    return [];
  }
}

async function saveJobs(jobs: CronJob[]): Promise<void> {
  const mineechoHome = getMineEchoHome();
  await mkdir(mineechoHome, { recursive: true });
  const filePath = join(mineechoHome, "cron-jobs.json");
  await writeFile(filePath, JSON.stringify({ jobs }, null, 2), "utf8");
}

function stopJobTimer(id: string): void {
  const timer = activeTimers.get(id);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(id);
  }
}

async function executeJobCommand(job: CronJob): Promise<{ success: boolean; error?: string }> {
  if (!job.command) {
    return { success: false, error: "No command specified" };
  }

  try {
    // 发送提示词到 Gateway
    const response = await fetch(getLocalBffUrl("/api/chat/send"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: job.command,
        sessionId: `cron_${job.id}`,
        mode: "general"
      }),
    });

    if (!response.ok) {
      throw new Error(`Gateway responded with status ${response.status}`);
    }

    logger.info(`[cron] Successfully sent prompt to Gateway: ${job.command}`);
    return { success: true };
  } catch (error) {
    logger.error(`[cron] Failed to execute job ${job.name}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

function startJobTimer(job: CronJob): void {
  const interval = parseCronInterval(job.schedule);
  if (interval === null) return;

  const timer = setInterval(async () => {
    logger.info(`[cron] Executing job: ${job.name} (${job.id})`);

    // 执行任务命令
    const result = await executeJobCommand(job);

    // 更新 lastRun 和执行结果
    const jobs = await loadJobs();
    const j = jobs.find((x) => x.id === job.id);
    if (j) {
      j.lastRun = new Date().toISOString();
      j.lastStatus = result.success ? "success" : "failed";
      if (!result.success && result.error) {
        j.lastError = result.error;
        logger.error(`[cron] Job ${job.name} failed: ${result.error}`);
      } else {
        j.lastError = undefined;
      }
      await saveJobs(jobs);
    }
  }, interval);

  activeTimers.set(job.id, timer);
}

// GET / - returns all jobs
cronRouter.get("/", async (_req, res) => {
  try {
    const jobs = await loadJobs();
    res.json({ jobs });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST / - create new job
cronRouter.post("/", async (req, res) => {
  try {
    const { name, schedule, command, description } = req.body || {};

    const job: CronJob = {
      id: String(Date.now()),
      name: name || "未命名任务",
      schedule: schedule || "*/5 * * * *",
      enabled: false,
      command,
      description,
    };

    const jobs = await loadJobs();
    jobs.push(job);
    await saveJobs(jobs);

    if (job.enabled) {
      startJobTimer(job);
    }

    res.status(201).json(job);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// PATCH /:id - update job
cronRouter.patch("/:id", async (req, res) => {
  try {
    const jobs = await loadJobs();
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: "not found" });
    }

    const { enabled, name, schedule, command, description } = req.body || {};

    if (name !== undefined) job.name = name;
    if (schedule !== undefined) job.schedule = schedule;
    if (command !== undefined) job.command = command;
    if (description !== undefined) job.description = description;

    if (typeof enabled === "boolean") {
      job.enabled = enabled;
      if (enabled) {
        startJobTimer(job);
      } else {
        stopJobTimer(job.id);
      }
    } else if (schedule !== undefined && job.enabled) {
      // Restart timer if schedule changed while enabled
      stopJobTimer(job.id);
      startJobTimer(job);
    }

    await saveJobs(jobs);
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE /:id - delete job
cronRouter.delete("/:id", async (req, res) => {
  try {
    stopJobTimer(req.params.id);

    const jobs = await loadJobs();
    const filtered = jobs.filter((j) => j.id !== req.params.id);
    await saveJobs(filtered);

    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Initialize: load jobs and start enabled timers
loadJobs()
  .then((jobs) => {
    jobs.filter((j) => j.enabled).forEach(startJobTimer);
  })
  .catch((e) => {
    logger.warn("[cron] Failed to restore jobs on startup:", e.message);
  });
