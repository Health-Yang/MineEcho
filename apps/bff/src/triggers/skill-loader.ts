/**
 * Skill Trigger Loader
 *
 * 从 OPENCLAW_EXTENSIONS_DIR 下的 SKILL.md 文件读取 frontmatter 中的 triggers，
 * 构建进程级内存索引，供 matchTrigger() 使用。
 *
 * 替代旧的 triggerStorage（基于用户学习），改为直接从技能定义读取触发词。
 */

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { loadSkillsState } from "../skills/state.js";

// 技能触发词索引：skillId -> { name, triggers }
export interface SkillTriggerEntry {
  skillId: string;
  name: string;
  triggers: string[];
}

// 进程级内存索引（使用 let 支持原子替换，避免并发 clear+fill 竞态）
let skillTriggerIndex = new Map<string, SkillTriggerEntry>();

// 桌面版检测
const isDesktop = process.env.CONSOLE_DIST?.includes('.app/Contents');

// 桌面版扩展技能目录
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

/**
 * 从 SKILL.md frontmatter 中提取 triggers 列表
 * 使用简单字符串操作，不需要完整 YAML 解析器
 *
 * frontmatter 格式：
 * ---
 * name: 深信服产品助手
 * triggers:
 *   - HCI
 *   - 超融合
 * ---
 */
function extractTriggersFromFrontmatter(content: string): { name: string; triggers: string[] } {
  const result = { name: "", triggers: [] as string[] };

  // 匹配 frontmatter 块
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return result;

  const frontmatter = frontmatterMatch[1];

  // 提取 name
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // 提取 triggers 列表
  // 匹配 triggers: 后面的列表项（以 - 开头）
  const triggersMatch = frontmatter.match(/triggers:\s*\n((?:\s+-\s*[^\n]*\n?)*)/);
  if (triggersMatch) {
    const triggersBlock = triggersMatch[1];
    const triggerLines = triggersBlock.match(/^\s+-\s*(.+)$/gm);
    if (triggerLines) {
      for (const line of triggerLines) {
        const trigger = line.replace(/^\s+-\s*/, "").trim();
        if (trigger) {
          result.triggers.push(trigger);
        }
      }
    }
  }

  return result;
}

/**
 * 遍历 OPENCLAW_EXTENSIONS_DIR 下的所有技能目录，
 * 读取 SKILL.md 并提取 triggers，构建内存索引。
 *
 * 在以下时机调用：
 * 1. BFF 启动时
 * 2. skills/sync.ts 的 syncSkillsFromEnterprise() 成功完成后
 * 3. routes/ai-apps.ts 的 syncAllEnabledAiApps() 成功完成后
 */
export async function loadSkillTriggersFromDisk(): Promise<void> {
  // 原子替换：先构建新索引，再整体替换引用，避免并发 matchSkillTrigger 读到半清空状态
  const newIndex = new Map<string, SkillTriggerEntry>();

  try {
    if (!existsSync(OPENCLAW_EXTENSIONS_DIR)) {
      logger.info("[SkillTriggerLoader] 扩展目录不存在，跳过加载 triggers", { dir: OPENCLAW_EXTENSIONS_DIR });
      skillTriggerIndex = newIndex;
      return;
    }

    // 加载用户禁用状态（skills-state.json: skillId -> boolean）
    let disabledSkills: Set<string>;
    try {
      const state = await loadSkillsState();
      disabledSkills = new Set(
        Object.entries(state)
          .filter(([, enabled]) => enabled === false)
          .map(([id]) => id)
      );
    } catch {
      disabledSkills = new Set();
    }

    const entries = await readdir(OPENCLAW_EXTENSIONS_DIR, { withFileTypes: true });
    let loadedCount = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillId = entry.name;
      const skillMdPath = join(OPENCLAW_EXTENSIONS_DIR, skillId, "SKILL.md");

      if (!existsSync(skillMdPath)) continue;

      // 跳过用户禁用的技能
      if (disabledSkills.has(skillId)) {
        logger.debug(`[SkillTriggerLoader] 跳过禁用技能: ${skillId}`);
        continue;
      }

      try {
        const content = await readFile(skillMdPath, "utf8");
        const { name, triggers } = extractTriggersFromFrontmatter(content);

        if (triggers.length > 0) {
          newIndex.set(skillId, {
            skillId,
            name: name || skillId,
            triggers,
          });
          loadedCount++;
          logger.debug(`[SkillTriggerLoader] 已加载 triggers: ${skillId} -> [${triggers.join(", ")}]`);
        }
      } catch (e) {
        logger.warn(`[SkillTriggerLoader] 读取 SKILL.md 失败: ${skillId}`, { error: (e as Error).message });
      }
    }

    skillTriggerIndex = newIndex;
    logger.info(`[SkillTriggerLoader] 触发词索引加载完成: ${loadedCount} 个技能, ${Array.from(newIndex.values()).reduce((sum, e) => sum + e.triggers.length, 0)} 个触发词`);
  } catch (e) {
    logger.warn("[SkillTriggerLoader] 加载触发词索引失败:", { error: (e as Error).message });
    // 失败时保留旧索引，不要替换为空
  }
}

/**
 * 获取当前内存中的技能触发词索引（只读）
 */
export function getSkillTriggerIndex(): ReadonlyMap<string, SkillTriggerEntry> {
  return skillTriggerIndex;
}

/**
 * 获取当前技能触发词索引的稳定快照。
 */
export function getSkillTriggerEntries(): SkillTriggerEntry[] {
  return Array.from(skillTriggerIndex.values()).map((entry) => ({
    skillId: entry.skillId,
    name: entry.name,
    triggers: [...entry.triggers],
  }));
}

/**
 * 根据用户消息匹配技能触发词
 * 简单字符串包含检查，不需要 NLP 库
 *
 * @returns 匹配到的 skillId 和匹配信息，无匹配返回 null
 */
export function matchSkillTrigger(message: string): {
  skillId: string;
  skillName: string;
  confidence: number;
  matchedTrigger: string;
} | null {
  if (!message || typeof message !== "string") return null;

  const normalizedMessage = message.toLowerCase().trim();
  if (!normalizedMessage) return null;

  // 收集所有匹配，然后统一排序选择，避免遍历顺序影响结果
  const matches: Array<{
    skillId: string;
    skillName: string;
    confidence: number;
    matchedTrigger: string;
    matchType: "exact" | "startsWith" | "includes";
  }> = [];

  for (const [, entry] of skillTriggerIndex) {
    for (const trigger of entry.triggers) {
      const normalizedTrigger = trigger.toLowerCase().trim();
      if (!normalizedTrigger) continue;

      // 1. 完全匹配（最高优先级）
      if (normalizedMessage === normalizedTrigger) {
        matches.push({
          skillId: entry.skillId,
          skillName: entry.name,
          confidence: 1.0,
          matchedTrigger: trigger,
          matchType: "exact",
        });
        continue;
      }

      // 2. 消息以 trigger 开头
      if (normalizedMessage.startsWith(normalizedTrigger)) {
        matches.push({
          skillId: entry.skillId,
          skillName: entry.name,
          confidence: 0.9,
          matchedTrigger: trigger,
          matchType: "startsWith",
        });
        continue;
      }

      // 3. 消息包含 trigger
      if (normalizedMessage.includes(normalizedTrigger)) {
        // 根据 trigger 长度计算置信度：越长越精确
        const lengthBoost = Math.min(normalizedTrigger.length / 10, 0.1);
        matches.push({
          skillId: entry.skillId,
          skillName: entry.name,
          confidence: 0.75 + lengthBoost,
          matchedTrigger: trigger,
          matchType: "includes",
        });
      }
    }
  }

  if (matches.length === 0) return null;

  // 排序规则：
  // 1. confidence 降序
  // 2. matchType 精确度降序（exact > startsWith > includes）
  // 3. trigger 长度降序（越长越精确）
  const matchTypeRank = { exact: 3, startsWith: 2, includes: 1 };

  matches.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    if (matchTypeRank[b.matchType] !== matchTypeRank[a.matchType]) {
      return matchTypeRank[b.matchType] - matchTypeRank[a.matchType];
    }
    return b.matchedTrigger.length - a.matchedTrigger.length;
  });

  const best = matches[0];
  return {
    skillId: best.skillId,
    skillName: best.skillName,
    confidence: best.confidence,
    matchedTrigger: best.matchedTrigger,
  };
}

/**
 * 获取已加载的技能触发词统计信息
 */
export function getSkillTriggerStats(): {
  totalSkills: number;
  totalTriggers: number;
  skills: Array<{ skillId: string; name: string; triggerCount: number }>;
} {
  const skills: Array<{ skillId: string; name: string; triggerCount: number }> = [];
  let totalTriggers = 0;

  for (const [, entry] of skillTriggerIndex) {
    skills.push({
      skillId: entry.skillId,
      name: entry.name,
      triggerCount: entry.triggers.length,
    });
    totalTriggers += entry.triggers.length;
  }

  return {
    totalSkills: skillTriggerIndex.size,
    totalTriggers,
    skills,
  };
}
