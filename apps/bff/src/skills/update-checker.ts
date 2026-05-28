/**
 * 技能更新检查服务
 * 主动检查 L2 技能更新并提示用户
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";
import { fetchEnterpriseConfig, fetchEnterpriseSkills } from "../account/client.js";
import { getLoadedSkills } from "./sync.js";
import { logger } from "../utils/logger.js";

// 技能状态存储路径
const SKILLS_STATE_FILE = join(getMineEchoHome(), "skills-state.json");

// 检查间隔配置（默认24小时）
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

// 技能状态接口
export interface SkillVersionState {
  id: string;
  name: string;
  localVersion: string;
  remoteVersion: string;
  lastCheckedAt: number;
  lastSyncedAt: number;
  updateAvailable: boolean;
}

// 更新检查结果
export interface UpdateCheckResult {
  error?: string;
  hasUpdates: boolean;
  totalSkills: number;
  updatableSkills: number;
  newSkills: number;
  removedSkills: number;
  skills: SkillVersionState[];
  checkedAt: number;
  nextCheckAt: number;
}

// 持久化的技能状态
interface SkillsState {
  lastCheckedAt: number;
  nextCheckAt: number;
  skills: Record<string, SkillVersionState>;
}

/**
 * 读取技能状态文件
 */
async function readSkillsState(): Promise<SkillsState> {
  try {
    if (!existsSync(SKILLS_STATE_FILE)) {
      return {
        lastCheckedAt: 0,
        nextCheckAt: 0,
        skills: {}
      };
    }
    const content = await readFile(SKILLS_STATE_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    logger.warn("[SkillsUpdate] Failed to read skills state:", { error });
    return {
      lastCheckedAt: 0,
      nextCheckAt: 0,
      skills: {}
    };
  }
}

/**
 * 保存技能状态文件
 */
async function saveSkillsState(state: SkillsState): Promise<void> {
  try {
    await mkdir(getMineEchoHome(), { recursive: true });
    await writeFile(SKILLS_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    logger.warn("[SkillsUpdate] Failed to save skills state:", { error });
  }
}

/**
 * 获取技能的本地版本
 * 通过读取 SKILL.md 文件中的 version 字段
 */
async function getLocalSkillVersion(skillId: string): Promise<string> {
  try {
    const { join } = await import("node:path");
    const { existsSync } = await import("node:fs");

    // 桌面版检测
    const isDesktop = process.env.CONSOLE_DIST?.includes('.app/Contents');
    const DESKTOP_EXTENSIONS_DIR = process.env.OPENCLAW_HOME
      ? join(process.env.OPENCLAW_HOME, '.openclaw', 'workspace', 'skills')
      : join(process.env.HOME || '', 'Library', 'Application Support', 'MineEcho', '.openclaw', 'workspace', 'skills');
    const OPENCLAW_EXTENSIONS_DIR = isDesktop
      ? DESKTOP_EXTENSIONS_DIR
      : "/app/.openclaw/workspace/skills";

    const skillMdPath = join(OPENCLAW_EXTENSIONS_DIR, skillId, "SKILL.md");

    if (!existsSync(skillMdPath)) {
      return "0.0.0";
    }

    const content = await readFile(skillMdPath, "utf8");

    // 解析 YAML frontmatter 中的 version
    const versionMatch = content.match(/^version:\s*(.+)$/m);
    if (versionMatch) {
      return versionMatch[1].trim();
    }

    // 如果没有 version 字段，使用文件修改时间作为版本标识
    const { stat } = await import("node:fs/promises");
    const stats = await stat(skillMdPath);
    return `local-${stats.mtime.getTime()}`;
  } catch (error) {
    logger.warn(`[SkillsUpdate] Failed to get local version for ${skillId}:`, { error });
    return "0.0.0";
  }
}

/**
 * 比较版本号
 * 返回: 1 表示 v1 > v2, -1 表示 v1 < v2, 0 表示相等
 */
function compareVersions(v1: string, v2: string): number {
  // 处理非标准版本号（如 local-timestamp）
  if (v1.startsWith("local-") || v2.startsWith("local-")) {
    return v1 === v2 ? 0 : (v1 > v2 ? 1 : -1);
  }

  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * 检查技能更新
 */
export async function checkSkillUpdates(force = false): Promise<UpdateCheckResult> {
  const now = Date.now();
  const state = await readSkillsState();

  // 如果不是强制检查，且未到检查时间，返回缓存结果
  if (!force && now < state.nextCheckAt && Object.keys(state.skills).length > 0) {
    const cachedSkills = Object.values(state.skills);
    const updatableCount = cachedSkills.filter(s => s.updateAvailable).length;

    return {
      hasUpdates: updatableCount > 0,
      totalSkills: cachedSkills.length,
      updatableSkills: updatableCount,
      newSkills: 0,
      removedSkills: 0,
      skills: cachedSkills,
      checkedAt: state.lastCheckedAt,
      nextCheckAt: state.nextCheckAt
    };
  }

  try {
    // 获取企业配置
    const config = await fetchEnterpriseConfig();
    if (!config.enabled || !config.storeUrl) {
      return {
        hasUpdates: false,
        totalSkills: 0,
        updatableSkills: 0,
        newSkills: 0,
        removedSkills: 0,
        skills: [],
        checkedAt: now,
        nextCheckAt: now + CHECK_INTERVAL_MS
      };
    }

    // 获取远程技能列表
    const result = await fetchEnterpriseSkills();
    if (result.error) {
      throw new Error(result.error);
    }

    const remoteSkills = result.skills || [];
    const localSkills = await getLoadedSkills();
    const localSkillMap = new Map(localSkills.map(s => [s.id, s]));

    // 获取本地技能版本
    const skillStates: Record<string, SkillVersionState> = {};
    let updatableCount = 0;
    let newCount = 0;
    let removedCount = 0;

    // 检查远程技能
    for (const remoteSkill of remoteSkills) {
      const localVersion = await getLocalSkillVersion(remoteSkill.id);
      const remoteVersion = remoteSkill.version || "1.0.0";

      const hasLocal = localSkillMap.has(remoteSkill.id);
      const isUpdateAvailable = hasLocal && compareVersions(remoteVersion, localVersion) > 0;
      const isNew = !hasLocal;

      if (isUpdateAvailable) updatableCount++;
      if (isNew) newCount++;

      skillStates[remoteSkill.id] = {
        id: remoteSkill.id,
        name: remoteSkill.name,
        localVersion,
        remoteVersion,
        lastCheckedAt: now,
        lastSyncedAt: hasLocal ? (state.skills[remoteSkill.id]?.lastSyncedAt || 0) : 0,
        updateAvailable: isUpdateAvailable || isNew
      };
    }

    // 检查已删除的技能
    for (const localSkill of localSkills) {
      if (!skillStates[localSkill.id]) {
        removedCount++;
        skillStates[localSkill.id] = {
          id: localSkill.id,
          name: localSkill.name,
          localVersion: await getLocalSkillVersion(localSkill.id),
          remoteVersion: "0.0.0",
          lastCheckedAt: now,
          lastSyncedAt: state.skills[localSkill.id]?.lastSyncedAt || 0,
          updateAvailable: false // 技能被删除，不是更新
        };
      }
    }

    // 保存状态
    const newState: SkillsState = {
      lastCheckedAt: now,
      nextCheckAt: now + CHECK_INTERVAL_MS,
      skills: skillStates
    };
    await saveSkillsState(newState);

    return {
      hasUpdates: updatableCount > 0 || newCount > 0,
      totalSkills: Object.keys(skillStates).length,
      updatableSkills: updatableCount,
      newSkills: newCount,
      removedSkills: removedCount,
      skills: Object.values(skillStates),
      checkedAt: now,
      nextCheckAt: newState.nextCheckAt
    };
  } catch (error) {
    logger.error("[SkillsUpdate] Check failed:", { error });

    // 返回缓存结果（如果有）
    const cachedSkills = Object.values(state.skills);
    const updatableCount = cachedSkills.filter(s => s.updateAvailable).length;

    return {
      hasUpdates: updatableCount > 0,
      totalSkills: cachedSkills.length,
      updatableSkills: updatableCount,
      newSkills: 0,
      removedSkills: 0,
      skills: cachedSkills,
      checkedAt: state.lastCheckedAt,
      nextCheckAt: state.nextCheckAt,
      error: error instanceof Error ? error.message : "检查更新失败"
    };
  }
}

/**
 * 标记技能已同步
 * 在成功同步后调用
 */
export async function markSkillSynced(skillId: string): Promise<void> {
  const state = await readSkillsState();

  if (state.skills[skillId]) {
    const now = Date.now();
    state.skills[skillId].lastSyncedAt = now;
    state.skills[skillId].localVersion = state.skills[skillId].remoteVersion;
    state.skills[skillId].updateAvailable = false;
    await saveSkillsState(state);
  }
}

/**
 * 获取技能更新详情
 */
export async function getSkillUpdateDetails(skillId: string): Promise<{
  id: string;
  name: string;
  localVersion: string;
  remoteVersion: string;
  updateAvailable: boolean;
  changelog?: string;
} | null> {
  const state = await readSkillsState();
  const skill = state.skills[skillId];

  if (!skill) {
    return null;
  }

  // TODO: 从 L2 获取变更日志
  return {
    id: skill.id,
    name: skill.name,
    localVersion: skill.localVersion,
    remoteVersion: skill.remoteVersion,
    updateAvailable: skill.updateAvailable,
    changelog: undefined
  };
}

let updateCheckIntervalId: NodeJS.Timeout | null = null;

/**
 * 启动定时更新检查
 */
export function startPeriodicUpdateCheck(callback?: (result: UpdateCheckResult) => void): void {
  // 如果已经启动，先停止
  if (updateCheckIntervalId) {
    clearInterval(updateCheckIntervalId);
  }

  // 立即执行一次检查
  checkSkillUpdates().then(result => {
    if (callback && result.hasUpdates) {
      callback(result);
    }
  });

  // 设置定时检查（已包含异常捕获）
  updateCheckIntervalId = setInterval(async () => {
    try {
      const result = await checkSkillUpdates();
      if (callback && result.hasUpdates) {
        callback(result);
      }
    } catch (error) {
      logger.error('[SkillsUpdate] Periodic check failed:', { error });
      // 不中断定时器，继续下次执行
    }
  }, CHECK_INTERVAL_MS);

  // 进程退出时清理
  process.on('SIGTERM', () => {
    if (updateCheckIntervalId) {
      clearInterval(updateCheckIntervalId);
      updateCheckIntervalId = null;
      logger.info('[SkillsUpdate] Interval cleared on SIGTERM');
    }
  });

  logger.info("[SkillsUpdate] Periodic update check started", { interval: CHECK_INTERVAL_MS });
}

/**
 * 停止定时更新检查
 */
export function stopPeriodicUpdateCheck(): void {
  if (updateCheckIntervalId) {
    clearInterval(updateCheckIntervalId);
    updateCheckIntervalId = null;
    logger.info("[SkillsUpdate] Periodic update check stopped");
  }
}
