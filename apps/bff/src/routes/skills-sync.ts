import { Router } from "express";
import {
  syncSkillsFromEnterprise,
  getLoadedSkills,
  createSyncTask,
  getSyncTask,
  listSyncTasks,
} from "../skills/sync.js";
import { logger } from "../utils/logger.js";

export const skillsSyncRouter = Router();

// 手动触发同步（异步执行，立即返回 taskId）
skillsSyncRouter.post("/sync", async (_req, res) => {
  try {
    const taskId = await syncSkillsFromEnterprise();
    res.json({ ok: true, taskId, status: "started", message: "同步任务已启动" });
  } catch (error) {
    logger.error("[SkillsSync] 手动同步失败:", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "同步失败",
    });
  }
});

// 获取当前同步进度（用于轮询）
skillsSyncRouter.get("/sync/status", async (req, res) => {
  const taskId = req.query.taskId as string | undefined;

  let task: ReturnType<typeof getSyncTask>;
  if (taskId) {
    task = getSyncTask(taskId);
  } else {
    const tasks = listSyncTasks();
    task = tasks[0];
  }

  if (!task) {
    return res.json({ status: "idle", taskId: taskId || null });
  }

  res.json({
    taskId: task.taskId,
    status: task.status,
    total: task.total,
    completed: task.completed,
    failed: task.failed,
    skills: task.skills,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  });
});

// 获取当前已加载的技能列表（从 OpenClaw 扩展目录读取）
skillsSyncRouter.get("/loaded", async (_req, res) => {
  const skills = await getLoadedSkills();
  res.json({ skills });
});
