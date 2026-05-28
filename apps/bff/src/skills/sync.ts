import { join } from "path";
import { existsSync, writeFileSync, readFileSync, mkdirSync, renameSync } from "fs";
import { readFile, writeFile, mkdir, readdir, rm } from "fs/promises";
import { spawn } from "node:child_process";
import { strict as assert } from "node:assert";
import { getMineEchoHome } from "../utils/config-path.js";
import { fetchEnterpriseConfig, fetchEnterpriseSkills } from "../account/client.js";
import { logger } from "../utils/logger.js";
import { loadSkillTriggersFromDisk } from "../triggers/skill-loader.js";

const TASKS_FILE = join(getMineEchoHome(), "sync-tasks.json");

function ensureTasksDir() {
  const dir = getMineEchoHome();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

let persistPending = false;
function persistTasks() {
  if (persistPending) return;
  persistPending = true;
  Promise.resolve().then(() => {
    persistPending = false;
    try {
      ensureTasksDir();
      const obj: Record<string, any> = {};
      for (const [k, v] of syncTasks) {
        obj[k] = v;
      }
      // Atomic write: temp file then rename to avoid corruption
      const tempFile = `${TASKS_FILE}.tmp`;
      writeFileSync(tempFile, JSON.stringify(obj, null, 2));
      renameSync(tempFile, TASKS_FILE);
    } catch (e) {
      logger.warn("[SkillsSync] Failed to persist tasks:", e);
    }
  });
}

function loadTasks() {
  try {
    if (existsSync(TASKS_FILE)) {
      const raw = readFileSync(TASKS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        // Don't restore 'running' tasks (they were interrupted)
        if ((v as any).status !== 'running') {
          syncTasks.set(k, v as SyncTask);
        }
      }
    }
  } catch (e) {
    // no file yet or corrupted
  }
}

// 桌面版检测
const isDesktop = process.env.CONSOLE_DIST?.includes('.app/Contents');

// 桌面版扩展技能目录 - 使用用户数据目录
// 注意：Electron app.getPath('userData') 返回 ~/Library/Application Support/MineEcho
// Gateway 在其下创建 .openclaw 工作目录
const DESKTOP_EXTENSIONS_DIR = process.env.OPENCLAW_HOME
  ? join(process.env.OPENCLAW_HOME, '.openclaw', 'workspace', 'skills')
  : join(process.env.HOME || '', 'Library', 'Application Support', 'MineEcho', '.openclaw', 'workspace', 'skills');

// 检测是否在 Docker 容器内
const isContainer = existsSync("/app/node_modules/openclaw") || existsSync("/app/gateway/node_modules/openclaw");

// 本地开发环境使用项目目录
const DEV_EXTENSIONS_DIR = join(process.cwd(), '.openclaw', 'workspace', 'skills');

const OPENCLAW_EXTENSIONS_DIR = isDesktop
  ? DESKTOP_EXTENSIONS_DIR
  : isContainer
    ? "/app/.openclaw/workspace/skills"
    : DEV_EXTENSIONS_DIR;

interface AssignedSkill {
  id: string;
  name: string;
  description?: string;
}

/**
 * 检测技能是否需要 ES Module 支持并自动创建 package.json
 * Gateway 使用 Node.js 加载技能，ES Module 需要 "type": "module" 声明
 */
async function ensurePackageJson(skillId: string): Promise<boolean> {
  const skillDir = join(OPENCLAW_EXTENSIONS_DIR, skillId);
  const packageJsonPath = join(skillDir, "package.json");
  const callJsPath = join(skillDir, "scripts", "call.js");

  try {
    // 如果已有 package.json，检查是否需要更新
    if (existsSync(packageJsonPath)) {
      const content = await readFile(packageJsonPath, "utf8");
      try {
        const pkg = JSON.parse(content);
        // 确保有 type: module
        if (pkg.type !== "module") {
          pkg.type = "module";
          await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), "utf8");
          logger.info(`[SkillsSync] 已更新 ${skillId}/package.json 为 ES Module`);
        }
        return true;
      } catch {
        // JSON 解析失败，重新创建
      }
    }

    // 检查 call.js 是否存在且使用 ES Module 语法
    if (!existsSync(callJsPath)) {
      return false; // 没有 call.js，不需要 package.json
    }

    const callJsContent = await readFile(callJsPath, "utf8");
    // 检测 ES Module 特征：import/export 语句
    const isESModule =
      /^\s*import\s+/m.test(callJsContent) ||
      /^\s*export\s+/m.test(callJsContent) ||
      /import\s*\{[^}]+\}\s*from/m.test(callJsContent) ||
      /import\s+\w+\s+from/m.test(callJsContent);

    if (isESModule) {
      const packageJson = {
        name: skillId,
        version: "1.0.0",
        type: "module",
        main: "scripts/call.js"
      };
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf8");
      logger.info(`[SkillsSync] 已为 ${skillId} 自动创建 package.json (ES Module)`);
      return true;
    }

    return false;
  } catch (error) {
    logger.warn(`[SkillsSync] 确保 ${skillId} package.json 失败:`, error);
    return false;
  }
}

/**
 * 为 AI 应用型 skill 生成 fallback call.js
 * 当 L2 下发的技能包有 SKILL.md 但没有 scripts/call.js 时调用
 * 从 SKILL.md frontmatter 中读取 apiUrl/apiKey（如果 L1 已写入）
 */
async function ensureAiAppCallJs(skillId: string): Promise<boolean> {
  const skillDir = join(OPENCLAW_EXTENSIONS_DIR, skillId);
  const callJsPath = join(skillDir, "scripts", "call.js");
  const skillMdPath = join(skillDir, "SKILL.md");
  const metaJsonPath = join(skillDir, "meta.json");

  // 如果已有 call.js，不需要生成
  if (existsSync(callJsPath)) return false;

  try {
    // 读取 meta.json 判断是否为 AI 应用类型
    let isAiApp = false;
    let apiUrl = "";
    let apiKey = "";

    if (existsSync(metaJsonPath)) {
      try {
        const metaContent = await readFile(metaJsonPath, "utf8");
        const meta = JSON.parse(metaContent);
        if (meta.type === "ai-app" || meta.type === "rag" || meta.type === "workflow") {
          isAiApp = true;
        }
        if (meta.apiUrl) apiUrl = meta.apiUrl;
        if (meta.apiKey) apiKey = meta.apiKey;
        if (meta.endpoint) apiUrl = meta.endpoint;
      } catch {
        // meta.json 解析失败，继续检查 SKILL.md
      }
    }

    // 从 SKILL.md frontmatter 读取 API 配置线索
    if (existsSync(skillMdPath)) {
      const skillMdContent = await readFile(skillMdPath, "utf8");

      // 检查 frontmatter 中是否有 apiUrl / apiKey
      const apiUrlMatch = skillMdContent.match(/^apiUrl:\s*(.+)$/m);
      const apiKeyMatch = skillMdContent.match(/^apiKey:\s*(.+)$/m);
      const endpointMatch = skillMdContent.match(/^endpoint:\s*(.+)$/m);

      if (apiUrlMatch) apiUrl = apiUrlMatch[1].trim();
      if (apiKeyMatch) apiKey = apiKeyMatch[1].trim();
      if (endpointMatch) apiUrl = endpointMatch[1].trim();

      // 如果 SKILL.md 中包含 AI 应用相关关键词，也视为 AI 应用
      if (!isAiApp) {
        const aiAppIndicators = ["ai-app", "fastgpt", "rag", "workflow", "apiUrl", "apiKey", "endpoint"];
        const lowerContent = skillMdContent.toLowerCase();
        if (aiAppIndicators.some(ind => lowerContent.includes(ind))) {
          isAiApp = true;
        }
      }
    }

    if (!isAiApp || !apiUrl) {
      return false; // 不是 AI 应用类型，或缺少 API 配置
    }

    // 生成简化版 call.js
    const callScript = `#!/usr/bin/env node
import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
import { URL } from "url";

const CONFIG = {
  apiUrl: "${apiUrl}",
  apiKey: "${apiKey}"
};

async function callAiApp(message) {
  if (!CONFIG.apiUrl) {
    logger.error(JSON.stringify({ error: "AI 应用未配置 API URL" }));
    process.exit(1);
  }

  const url = new URL(CONFIG.apiUrl);
  const clientRequest = url.protocol === "https:" ? httpsRequest : httpRequest;

  const postData = JSON.stringify({ messages: [{ role: "user", content: message }], stream: false });

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname + url.search,
    method: "POST",
    headers: { "Content-Type": "application/json" }
  };
  if (CONFIG.apiKey) options.headers["Authorization"] = "Bearer " + CONFIG.apiKey;

  return new Promise((resolve, reject) => {
    const req = clientRequest(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          const content = result.choices?.[0]?.message?.content
            || result.data?.answer || result.answer || result.response
            || result.content || result.text || JSON.stringify(result);
          resolve(content);
        } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

const message = process.argv[2] || process.env.USER_MESSAGE || "";
if (message) {
  callAiApp(message).then(
    result => { process.stdout.write(String(result)); },
    err => { process.stderr.write(JSON.stringify({ error: err.message })); process.exit(1); }
  );
}

export { callAiApp };
`;

    await mkdir(join(skillDir, "scripts"), { recursive: true });
    await writeFile(callJsPath, callScript, "utf8");
    logger.info(`[SkillsSync] 已为 AI 应用技能 ${skillId} 生成 fallback call.js`);
    return true;
  } catch (error) {
    logger.warn(`[SkillsSync] 为 ${skillId} 生成 fallback call.js 失败:`, error);
    return false;
  }
}

/**
 * 从 L2 下载技能 SKILL.md 内容（降级方案）
 * L2 从 L1 获取并缓存，避免 L3 直接访问 L1 造成压力
 */
async function downloadSkillFromL2(
  skillId: string,
  storeUrl: string
): Promise<string | null> {
  try {
    // 调用 L2 的技能内容端点（带上 userId 用于 L2 终端认证）
    const cfg = fetchEnterpriseConfig();
    const userIdParam = cfg.userId ? `?userId=${encodeURIComponent(cfg.userId)}` : "";
    const url = `${storeUrl.replace(/\/$/, "")}/api/terminal/skills/${skillId}/content${userIdParam}`;
    const headers: Record<string, string> = {};
    if (cfg.userToken) headers["X-User-Token"] = cfg.userToken;

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.warn(
        `[SkillsSync] 无法从 L2 下载技能 ${skillId}: ${response.status}`
      );
      return null;
    }

    const data = await response.json();
    return data.content || null;
  } catch (error) {
    logger.warn(`[SkillsSync] 从 L2 下载技能 ${skillId} 失败:`, error);
    return null;
  }
}

/**
 * 从 L2 下载完整技能包并解压
 */
async function downloadAndExtractSkill(
  skillId: string,
  storeUrl: string
): Promise<boolean> {
  try {
    const cfg = fetchEnterpriseConfig();
    const userIdParam = cfg.userId ? `?userId=${encodeURIComponent(cfg.userId)}` : "";
    const url = `${storeUrl.replace(/\/$/, "")}/api/terminal/skills/${skillId}/package${userIdParam}`;
    const headers: Record<string, string> = {};
    if (cfg.userToken) headers["X-User-Token"] = cfg.userToken;

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(60000), // 包下载可能需要更长时间
    });

    if (!response.ok) {
      logger.warn(`[SkillsSync] 无法下载技能包 ${skillId}: ${response.status}`);
      return false;
    }

    // 获取二进制数据
    const buffer = await response.arrayBuffer();

    // 解压 tar.gz 到技能目录
    const skillDir = join(OPENCLAW_EXTENSIONS_DIR, skillId);
    await mkdir(skillDir, { recursive: true });

    const fs = await import("node:fs");

    // 先写入临时文件
    const tempPath = join(OPENCLAW_EXTENSIONS_DIR, `.${skillId}.tmp.tar.gz`);
    await fs.promises.writeFile(tempPath, new Uint8Array(buffer));

    try {
      // 验证 skillId
      assert(/^[a-zA-Z0-9_-]+$/.test(skillId), 'Invalid skillId');

      // 使用 spawn 安全解压
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('tar', ['-xzf', tempPath, '-C', skillDir]);
        proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`tar exited ${code}`)));
        proc.on('error', (err) => reject(err));
      });

      // 清理 macOS 压缩包产生的 ._* 资源文件和 __MACOSX 目录
      const cleanMacOsArtifacts = async (dir: string) => {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.name.startsWith('._')) {
            await fs.promises.rm(fullPath, { recursive: true, force: true }).catch(() => {});
          } else if (entry.isDirectory()) {
            if (entry.name === '__MACOSX') {
              await fs.promises.rm(fullPath, { recursive: true, force: true }).catch(() => {});
            } else {
              await cleanMacOsArtifacts(fullPath);
            }
          }
        }
      };
      await cleanMacOsArtifacts(skillDir);

      // 处理 zip 文件中包含的顶级目录（如 fastgpt-chat/fastgpt-chat/）
      // 标准：解压后根目录必须包含 SKILL.md，否则尝试从子目录上移内容
      const rootSkillMd = join(skillDir, "SKILL.md");
      if (!existsSync(rootSkillMd)) {
        const entries = await readdir(skillDir, { withFileTypes: true });
        // 忽略隐藏目录和 macOS 元数据目录
        const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== '__MACOSX');

        for (const subdir of subdirs) {
          const subdirSkillMd = join(skillDir, subdir.name, "SKILL.md");
          if (existsSync(subdirSkillMd)) {
            // 找到包含 SKILL.md 的子目录，将内容移动到根目录
            const subdirPath = join(skillDir, subdir.name);
            const files = await readdir(subdirPath);
            for (const file of files) {
              const srcPath = join(subdirPath, file);
              const destPath = join(skillDir, file);
              if (existsSync(destPath)) {
                await fs.promises.rm(destPath, { recursive: true, force: true });
              }
              await fs.promises.rename(srcPath, destPath);
            }
            // 删除已清空的子目录
            await fs.promises.rm(subdirPath, { recursive: true, force: true }).catch(() => {});
            logger.info(`[SkillsSync] 已整理技能包结构 (移除嵌套层): ${skillId}`);
            break;
          }
        }
      }

      // 最终校验：根目录必须有 SKILL.md
      if (!existsSync(rootSkillMd)) {
        logger.warn(`[SkillsSync] 技能包 ${skillId} 解压后根目录缺少 SKILL.md，结构不合法`);
        return false;
      }

      // 创建 L2 同步标记文件，用于后续识别哪些技能是从 L2 同步的
      try {
        const markerPath = join(skillDir, ".synced-from-l2");
        await fs.promises.writeFile(markerPath, new Date().toISOString(), "utf8");
      } catch {
        // 标记文件创建失败不影响同步成功
      }

      logger.info(`[SkillsSync] 已解压技能包: ${skillId}`);
      return true;
    } finally {
      // 清理临时文件
      try { fs.unlinkSync(tempPath); } catch {}
    }
  } catch (error) {
    logger.warn(`[SkillsSync] 下载/解压技能包 ${skillId} 失败:`, error);
    return false;
  }
}

/**
 * 验证解压后的技能目录结构
 */
async function verifySkillStructure(skillId: string): Promise<{
  hasSkillMd: boolean;
  hasScripts: boolean;
  fileCount: number;
}> {
  const skillDir = join(OPENCLAW_EXTENSIONS_DIR, skillId);
  const result = {
    hasSkillMd: false,
    hasScripts: false,
    fileCount: 0,
  };

  try {
    // 检查 SKILL.md
    const skillMdPath = join(skillDir, "SKILL.md");
    result.hasSkillMd = existsSync(skillMdPath);

    // 检查 scripts 目录
    const scriptsDir = join(skillDir, "scripts");
    result.hasScripts = existsSync(scriptsDir);

    // 统计文件数量
    async function countFiles(dir: string): Promise<number> {
      let count = 0;
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            count += await countFiles(join(dir, entry.name));
          } else {
            count++;
          }
        }
      } catch {}
      return count;
    }

    result.fileCount = await countFiles(skillDir);

    logger.info(`[SkillsSync] 技能 ${skillId} 结构验证:`, {
      hasSkillMd: result.hasSkillMd,
      hasScripts: result.hasScripts,
      fileCount: result.fileCount,
    });

    return result;
  } catch (error) {
    logger.warn(`[SkillsSync] 验证技能 ${skillId} 结构失败:`, error);
    return result;
  }
}

// 同步结果详细状态
export interface SkillSyncStatus {
  id: string;
  name: string;
  status: 'pending' | 'downloading' | 'verifying' | 'success' | 'failed';
  error?: string;
}

// 带进度的同步结果
export interface SyncProgressResult {
  total: number;
  success: number;
  failed: number;
  skills: SkillSyncStatus[];
  error?: string;
}

// 进度回调类型
type ProgressCallback = (progress: SyncProgressResult) => void;

// 持久化同步任务类型
export interface SyncTask {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  total: number;
  completed: number;
  failed: number;
  skills: Array<{ id: string; status: string; error?: string }>;
}

// 模块级持久化同步任务存储
const syncTasks = new Map<string, SyncTask>();

export function createSyncTask(customTaskId?: string): string {
  const taskId = customTaskId || `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const task: SyncTask = {
    taskId,
    status: 'pending',
    startedAt: Date.now(),
    total: 0,
    completed: 0,
    failed: 0,
    skills: [],
  };
  syncTasks.set(taskId, task);
  persistTasks();
  pruneOldSyncTasks();
  return taskId;
}

export function updateSyncTaskProgress(
  taskId: string,
  skillId: string,
  status: string,
  error?: string
): void {
  const task = syncTasks.get(taskId);
  if (!task) return;

  const skill = task.skills.find((s) => s.id === skillId);
  if (skill) {
    skill.status = status;
    skill.error = error;
  } else {
    task.skills.push({ id: skillId, status, error });
  }

  // Re-aggregate counts
  task.total = task.skills.length;
  task.completed = task.skills.filter((s) => s.status === 'success').length;
  task.failed = task.skills.filter((s) => s.status === 'failed').length;
  persistTasks();
}

export function setSyncTaskStatus(
  taskId: string,
  status: SyncTask['status']
): void {
  const task = syncTasks.get(taskId);
  if (!task) return;
  task.status = status;
  if (status === 'completed' || status === 'failed') {
    task.completedAt = Date.now();
  }
  persistTasks();
}

export function getSyncTask(taskId: string): SyncTask | undefined {
  return syncTasks.get(taskId);
}

export function listSyncTasks(): SyncTask[] {
  return Array.from(syncTasks.values()).sort((a, b) => b.startedAt - a.startedAt);
}

export function pruneOldSyncTasks(maxAgeMs = 24 * 60 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs;
  for (const [taskId, task] of syncTasks.entries()) {
    const timestamp = task.completedAt || task.startedAt;
    if (timestamp < cutoff) {
      syncTasks.delete(taskId);
    }
  }
}

/**
 * 从 L2 和 L1 同步已分配技能到 OpenClaw 扩展目录
 */
export async function syncSkillsFromEnterprise(
  onProgress?: ProgressCallback,
  taskId?: string
): Promise<SyncProgressResult | string> {
  // 生成或复用 taskId，立即返回（异步模式）
  const actualTaskId = taskId || createSyncTask();

  // 如果调用方没有传 taskId（即不是通过已有任务恢复），立即返回 taskId
  if (!taskId) {
    setImmediate(async () => {
      try {
        await runActualSync(onProgress, actualTaskId);
      } catch (error) {
        logger.error("[SkillsSync] 后台同步任务异常:", error);
        setSyncTaskStatus(actualTaskId, 'failed');
      }
    });
    return actualTaskId;
  }

  // 如果传了 taskId（如启动时恢复），同步执行
  return runActualSync(onProgress, actualTaskId);
}

async function runActualSync(
  onProgress?: ProgressCallback,
  taskId?: string
): Promise<SyncProgressResult> {
  // 初始化进度结果
  const initialResult: SyncProgressResult = {
    total: 0,
    success: 0,
    failed: 0,
    skills: [],
  };

  // 发送进度更新
  const emitProgress = (result: SyncProgressResult) => {
    if (onProgress) {
      onProgress(result);
    }
  };

  if (taskId) {
    setSyncTaskStatus(taskId, 'running');
  }

  try {
    const config = await fetchEnterpriseConfig();
    if (!config.enabled || !config.storeUrl) {
      const errorResult = { ...initialResult, error: "企业模式未配置" };
      emitProgress(errorResult);
      if (taskId) {
        setSyncTaskStatus(taskId, 'failed');
      }
      return errorResult;
    }

    // 1. 从 L2 获取已分配技能列表
    const result = await fetchEnterpriseSkills();
    if (result.error) {
      const errorResult = { ...initialResult, error: result.error };
      emitProgress(errorResult);
      if (taskId) {
        setSyncTaskStatus(taskId, 'failed');
      }
      return errorResult;
    }

    const assignedSkills: AssignedSkill[] = result.skills || [];
    if (assignedSkills.length === 0) {
      const emptyResult = { ...initialResult, error: "没有分配的技能" };
      emitProgress(emptyResult);
      if (taskId) {
        setSyncTaskStatus(taskId, 'completed');
      }
      return emptyResult;
    }

    // 2. 确保扩展目录存在
    await mkdir(OPENCLAW_EXTENSIONS_DIR, { recursive: true });

    // 初始化技能状态列表（全部为 pending）
    const progressResult: SyncProgressResult = {
      total: assignedSkills.length,
      success: 0,
      failed: 0,
      skills: assignedSkills.map(s => ({
        id: s.id,
        name: s.name,
        status: 'pending' as const,
      })),
    };
    emitProgress(progressResult);

    // 3. 下载并解压每个技能的完整包
    for (let i = 0; i < assignedSkills.length; i++) {
      const skill = assignedSkills[i];
      const skillId = skill.id;

      if (taskId) {
        updateSyncTaskProgress(taskId, skillId, 'pending');
      }

      try {
        if (taskId) {
          updateSyncTaskProgress(taskId, skillId, 'downloading');
        }

        // 更新状态为 downloading
        progressResult.skills[i].status = 'downloading';
        emitProgress({ ...progressResult });

        const skillDir = join(OPENCLAW_EXTENSIONS_DIR, skillId);

        // 检查是否已存在且完整（SKILL.md + scripts 目录）
        const skillMdPath = join(skillDir, "SKILL.md");
        const scriptsDir = join(skillDir, "scripts");
        let isExisting = false;

        if (existsSync(skillMdPath) && existsSync(scriptsDir)) {
          const existing = await readFile(skillMdPath, "utf8");
          if (existing.includes(skill.name || skillId)) {
            // 验证目录结构
            progressResult.skills[i].status = 'verifying';
            emitProgress({ ...progressResult });

            await verifySkillStructure(skillId);
            progressResult.skills[i].status = 'success';
            progressResult.success++;
            emitProgress({ ...progressResult });
            isExisting = true;
          }
        }

        if (isExisting) {
          if (taskId) {
            updateSyncTaskProgress(taskId, skillId, 'success');
          }
          continue;
        }

        // 首先尝试下载完整技能包并解压
        const packageDownloaded = await downloadAndExtractSkill(
          skillId,
          config.storeUrl
        );

        if (packageDownloaded) {
          // 更新状态为 verifying
          progressResult.skills[i].status = 'verifying';
          emitProgress({ ...progressResult });

          if (taskId) {
            updateSyncTaskProgress(taskId, skillId, 'verifying');
          }

          // 验证解压后的结构
          const structure = await verifySkillStructure(skillId);

          // 确保 ES Module 技能有 package.json
          await ensurePackageJson(skillId);

          // 如果是 AI 应用型 skill 且缺少 call.js，生成 fallback
          await ensureAiAppCallJs(skillId);

          if (structure.hasSkillMd) {
            progressResult.skills[i].status = 'success';
            progressResult.success++;
            if (taskId) {
              updateSyncTaskProgress(taskId, skillId, 'success');
            }
            logger.info(`[SkillsSync] 已同步技能包: ${skillId} (${structure.fileCount} 个文件)`);
          } else {
            logger.warn(`[SkillsSync] 技能包 ${skillId} 解压后缺少 SKILL.md`);
            progressResult.skills[i].status = 'failed';
            progressResult.skills[i].error = "解压后缺少 SKILL.md";
            progressResult.failed++;
            if (taskId) {
              updateSyncTaskProgress(taskId, skillId, 'failed', "解压后缺少 SKILL.md");
            }
          }
        } else {
          // 降级方案：只下载 SKILL.md
          logger.info(`[SkillsSync] 完整包下载失败，降级为仅下载 SKILL.md: ${skillId}`);

          const skillMdContent = await downloadSkillFromL2(
            skillId,
            config.storeUrl
          );

          if (skillMdContent) {
            await mkdir(skillDir, { recursive: true });
            await writeFile(skillMdPath, skillMdContent, "utf8");
            progressResult.skills[i].status = 'success';
            progressResult.success++;
            if (taskId) {
              updateSyncTaskProgress(taskId, skillId, 'success');
            }
            logger.info(`[SkillsSync] 已同步技能 (仅 SKILL.md): ${skillId}`);
          } else {
            progressResult.skills[i].status = 'failed';
            progressResult.skills[i].error = "技能包下载失败且无法获取 SKILL.md";
            progressResult.failed++;
            if (taskId) {
              updateSyncTaskProgress(taskId, skillId, 'failed', "技能包下载失败且无法获取 SKILL.md");
            }
            logger.warn(`[SkillsSync] 技能 ${skillId} 同步失败: 技能包下载失败且无法获取 SKILL.md`);
          }
        }

        emitProgress({ ...progressResult });
      } catch (error) {
        logger.warn(`[SkillsSync] 同步技能 ${skillId} 失败:`, error);
        progressResult.skills[i].status = 'failed';
        progressResult.skills[i].error = error instanceof Error ? error.message : "未知错误";
        progressResult.failed++;
        if (taskId) {
          updateSyncTaskProgress(taskId, skillId, 'failed', error instanceof Error ? error.message : "未知错误");
        }
        emitProgress({ ...progressResult });
      }
    }

    const finalStatus = progressResult.failed > 0 ? 'failed' : 'completed';
    if (taskId) {
      setSyncTaskStatus(taskId, finalStatus);
    }

    // 清理已从 L2 删除的技能：本地有 .synced-from-l2 标记但不在 assignedSkills 中
    const assignedIds = new Set(assignedSkills.map(s => s.id));
    try {
      const localEntries = await readdir(OPENCLAW_EXTENSIONS_DIR, { withFileTypes: true });
      for (const entry of localEntries) {
        if (!entry.isDirectory()) continue;
        if (assignedIds.has(entry.name)) continue;
        const markerPath = join(OPENCLAW_EXTENSIONS_DIR, entry.name, ".synced-from-l2");
        if (existsSync(markerPath)) {
          await rm(join(OPENCLAW_EXTENSIONS_DIR, entry.name), { recursive: true, force: true });
          logger.info(`[SkillsSync] 已删除 L2 中不存在的技能: ${entry.name}`);
        }
      }
    } catch (e) {
      logger.warn("[SkillsSync] 清理已删除技能失败:", e);
    }

    // 同步完成后刷新触发词索引（先清理再刷新，确保已删除技能不残留）
    try {
      await loadSkillTriggersFromDisk();
      logger.info("[SkillsSync] 同步完成后已刷新触发词索引");
    } catch (e) {
      logger.warn("[SkillsSync] 同步后刷新触发词索引失败:", { error: (e as Error).message });
    }

    if (progressResult.failed > 0) {
      const failedNames = progressResult.skills
        .filter(s => s.status === 'failed')
        .map(s => s.name || s.id)
        .join(", ");
      return {
        ...progressResult,
        error: `以下技能同步失败: ${failedNames}`,
      };
    }

    return progressResult;
  } catch (error) {
    logger.error("[SkillsSync] 同步失败:", error);
    if (taskId) {
      setSyncTaskStatus(taskId, 'failed');
    }
    const errorResult: SyncProgressResult = {
      ...initialResult,
      error: error instanceof Error ? error.message : "未知错误",
    };
    emitProgress(errorResult);
    return errorResult;
  }
}

// 模块初始化时加载持久化的同步任务
loadTasks();

/**
 * 获取当前已加载的所有技能（从扩展目录读取）
 */
export async function getLoadedSkills(): Promise<
  { id: string; name: string; description: string }[]
> {
  try {
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(OPENCLAW_EXTENSIONS_DIR, {
      withFileTypes: true,
    });

    const skills = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMdPath = join(OPENCLAW_EXTENSIONS_DIR, entry.name, "SKILL.md");
        if (existsSync(skillMdPath)) {
          const content = await readFile(skillMdPath, "utf8");
          // 简单解析 YAML frontmatter
          const nameMatch = content.match(/^name:\s*(.+)$/m);
          const descMatch = content.match(/^description:\s*(.+)$/m);
          skills.push({
            id: entry.name,
            name: nameMatch?.[1]?.trim() || entry.name,
            description: descMatch?.[1]?.trim() || "",
          });
        }
      }
    }
    return skills;
  } catch {
    return [];
  }
}

/**
 * 获取技能的完整文件结构（用于调试和验证）
 */
export async function getSkillFileStructure(skillId: string): Promise<{
  path: string;
  type: "file" | "directory";
  size?: number;
}[]> {
  const skillDir = join(OPENCLAW_EXTENSIONS_DIR, skillId);
  const result: { path: string; type: "file" | "directory"; size?: number }[] = [];

  async function traverse(dir: string, basePath: string) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = join(basePath, entry.name);

        if (entry.isDirectory()) {
          result.push({ path: relativePath, type: "directory" });
          await traverse(fullPath, relativePath);
        } else {
          const stats = await import("node:fs/promises").then((fs) =>
            fs.stat(fullPath)
          );
          result.push({ path: relativePath, type: "file", size: stats.size });
        }
      }
    } catch {}
  }

  await traverse(skillDir, "");
  return result;
}
