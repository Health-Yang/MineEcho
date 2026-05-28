import { Router } from "express";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { platform } from "node:process";
import { getMineEchoHome } from "../utils/config-path.js";

export const workspaceRouter = Router();

interface WorkspaceConfig {
  workspaceName: string;
  workspacePath: string;
  createdAt: string;
  updatedAt: string;
}

const WORKSPACE_NAME_REGEX = /^[a-z0-9-_]+$/;

export function getWorkspaceRoot(): string {
  // 如果设置了环境变量，使用环境变量
  if (process.env.MINECHO_WORKSPACE_ROOT) {
    return process.env.MINECHO_WORKSPACE_ROOT;
  }

  // 桌面版：使用用户数据目录
  const homeDir = homedir();

  // 根据平台选择合适的目录
  if (platform === 'darwin') {
    return join(homeDir, 'Library', 'Application Support', 'MineEcho', 'workspace');
  } else if (platform === 'win32') {
    return join(process.env.APPDATA || join(homeDir, 'AppData', 'Roaming'), 'MineEcho', 'workspace');
  } else {
    return join(homeDir, '.config', 'MineEcho', 'workspace');
  }
}

function getConfigDir(): string {
  return getMineEchoHome();
}

function getWorkspaceConfigPath(): string {
  return join(getConfigDir(), "workspace.json");
}

function resolveWorkspacePath(workspaceName: string): string {
  return join(getWorkspaceRoot(), workspaceName);
}

async function loadWorkspaceConfig(): Promise<WorkspaceConfig | null> {
  const configPath = getWorkspaceConfigPath();
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw) as WorkspaceConfig;
  } catch {
    return null;
  }
}

async function saveWorkspaceConfig(config: WorkspaceConfig): Promise<void> {
  const configDir = getConfigDir();
  const configPath = getWorkspaceConfigPath();
  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
}

async function directoryExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** GET /api/workspace/status - returns current workspace config */
workspaceRouter.get("/status", async (_req, res) => {
  try {
    const config = await loadWorkspaceConfig();
    if (!config) {
      return res.json({
        configured: false,
        workspace: null,
      });
    }

    const workspaceExists = await directoryExists(config.workspacePath);

    res.json({
      configured: true,
      workspace: {
        name: config.workspaceName,
        path: config.workspacePath,
        exists: workspaceExists,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** POST /api/workspace/setup - creates workspace directory */
workspaceRouter.post("/setup", async (req, res) => {
  try {
    const body = req.body || {};
    const workspaceName = typeof body.workspaceName === "string" ? body.workspaceName.trim() : "";

    if (!workspaceName) {
      return res.status(400).json({ error: "workspaceName is required" });
    }

    if (!WORKSPACE_NAME_REGEX.test(workspaceName)) {
      return res.status(400).json({
        error: "workspaceName can only contain lowercase letters, numbers, hyphens, and underscores",
        pattern: "^[a-z0-9-_]+$",
      });
    }

    const workspacePath = resolveWorkspacePath(workspaceName);
    const workspaceRoot = getWorkspaceRoot();

    // Create workspace root if it doesn't exist
    await mkdir(workspaceRoot, { recursive: true });

    // Create workspace directory
    await mkdir(workspacePath, { recursive: true });

    // Create subdirectories
    const subdirs = ['skills', 'cache', 'output', 'uploads'];
    for (const subdir of subdirs) {
      await mkdir(join(workspacePath, subdir), { recursive: true });
    }

    const now = new Date().toISOString();
    const config: WorkspaceConfig = {
      workspaceName,
      workspacePath,
      createdAt: now,
      updatedAt: now,
    };

    await saveWorkspaceConfig(config);

    res.json({
      success: true,
      workspace: {
        name: workspaceName,
        path: workspacePath,
        root: workspaceRoot,
      },
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** GET /api/workspace/path - returns the resolved workspace path */
workspaceRouter.get("/path", async (_req, res) => {
  try {
    const config = await loadWorkspaceConfig();
    const workspaceRoot = getWorkspaceRoot();

    // 获取宿主机工作空间根目录 - 修正映射逻辑
    const hostWorkspaceRoot = process.env.MINECHO_HOST_WORKSPACE_ROOT ||
      (process.env.MINECHO_HOST_CWD
        ? `${process.env.MINECHO_HOST_CWD}/data`  // 对应docker-compose中的 ./data:/app/workspace
        : '/Users/mac/Documents/trae_projects/cc/data');  // 默认映射路径

    if (!config) {
      return res.json({
        configured: false,
        workspaceRoot,
        workspacePath: null,
        workspaceName: null,
        hostWorkspaceRoot,
        hostWorkspacePath: null,
      });
    }

    const workspaceExists = await directoryExists(config.workspacePath);

    // 计算宿主机的绝对路径
    let hostWorkspacePath: string | null = null;
    if (hostWorkspaceRoot) {
      hostWorkspacePath = `${hostWorkspaceRoot}/${config.workspaceName}`;
    } else if (process.env.MINECHO_HOST_CWD) {
      hostWorkspacePath = `${process.env.MINECHO_HOST_CWD}/data/${config.workspaceName}`;
    }

    res.json({
      configured: true,
      workspaceRoot,
      workspacePath: config.workspacePath,
      workspaceName: config.workspaceName,
      exists: workspaceExists,
      hostWorkspaceRoot,
      hostWorkspacePath,
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});
