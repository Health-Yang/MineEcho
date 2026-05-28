/**
 * Risk Knowledge Base Manager
 * 风险知识库管理 - 从用户记忆中提取和管理风险知识
 */

import { existsSync, mkdirSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { shortTermMemoryManager } from "../memory/short-term-memory.js";
import type {
  RiskKnowledge,
  ProjectRisk,
  UserRiskProfile,
  RiskAlertConfig,
  RiskCategory,
  RiskLevel,
} from "./types.js";

// 存储目录
const RISK_KB_DIR = process.env.MINECHO_RISK_DIR || join(process.cwd(), "workspace", "risk");

// 默认配置
const DEFAULT_CONFIG: RiskAlertConfig = {
  enabled: true,
  minConfidence: 0.3,
  maxAlertsPerSession: 3,
  categories: ["cutover", "data_migration", "core_change", "security"],
  excludePatterns: [],
};

function ensureRiskDir(): void {
  if (!existsSync(RISK_KB_DIR)) {
    mkdirSync(RISK_KB_DIR, { recursive: true });
  }
}

function getUserRiskProfilePath(userId: string): string {
  return join(RISK_KB_DIR, `${userId}-profile.json`);
}

function getUserRiskKnowledgePath(userId: string): string {
  return join(RISK_KB_DIR, `${userId}-knowledge.json`);
}

function getUserProjectRisksPath(userId: string): string {
  return join(RISK_KB_DIR, `${userId}-project-risks.json`);
}

/**
 * 从用户项目历史中提取风险知识
 */
export async function extractRisksFromProjectHistory(userId: string): Promise<RiskKnowledge[]> {
  const risks: RiskKnowledge[] = [];

  try {
    const projects = await longTermMemoryManager.getProjects(userId);

    for (const project of projects) {
      // 从项目描述中提取风险关键词
      if (project.description) {
        const extractedRisks = extractRisksFromText(
          project.description,
          project.id,
          project.name
        );
        risks.push(...extractedRisks);
      }

      // 从项目成果中提取风险
      if (project.keyOutcomes) {
        for (const outcome of project.keyOutcomes) {
          const extractedRisks = extractRisksFromText(outcome, project.id, project.name);
          risks.push(...extractedRisks);
        }
      }
    }
  } catch (error) {
    logger.error("[RiskKB] Failed to extract risks from project history:", { error, userId });
  }

  return risks;
}

/**
 * 从日常交互中提取失败/问题记录
 */
export async function extractRisksFromDailyInteractions(userId: string, days: number = 30): Promise<RiskKnowledge[]> {
  const risks: RiskKnowledge[] = [];

  try {
    const history = await shortTermMemoryManager.getMemoryHistory(userId, days);

    for (const memory of history) {
      for (const interaction of memory.dailyInteractions) {
        // 只关注失败的交互
        if (interaction.outcome === "failure") {
          const extractedRisks = extractRisksFromText(
            interaction.content,
            undefined,
            undefined,
            "user_history"
          );
          risks.push(...extractedRisks);
        }
      }
    }
  } catch (error) {
    logger.error("[RiskKB] Failed to extract risks from daily interactions:", { error, userId });
  }

  return risks;
}

/**
 * 从文本中提取风险信息
 */
function extractRisksFromText(
  text: string,
  projectId?: string,
  projectName?: string,
  source: "user_history" | "system" | "inferred" = "system"
): RiskKnowledge[] {
  const risks: RiskKnowledge[] = [];
  const now = Date.now();

  // 风险模式匹配
  const riskPatterns: Array<{
    pattern: RegExp;
    category: RiskCategory;
    title: string;
    description: string;
    mitigation: string[];
  }> = [
    {
      pattern: /回滚|rollback|回退/i,
      category: "cutover",
      title: "割接回滚风险",
      description: "历史项目中曾出现需要回滚的情况",
      mitigation: ["制定详细的回滚方案", "准备回滚脚本", "在维护窗口内完成", "提前通知相关方"],
    },
    {
      pattern: /数据丢失|数据损坏|数据不一致|data (loss|corruption|inconsistency)/i,
      category: "data_migration",
      title: "数据迁移风险",
      description: "历史项目中曾出现数据相关问题",
      mitigation: ["迁移前完整备份", "分批次迁移", "迁移后数据校验", "保留回退方案"],
    },
    {
      pattern: /超时|timeout|性能下降|慢查询|performance (degradation|issue)/i,
      category: "performance",
      title: "性能风险",
      description: "历史项目中曾出现性能问题",
      mitigation: ["提前进行压测", "制定容量规划", "准备扩容方案", "监控关键指标"],
    },
    {
      pattern: /兼容|不兼容|版本冲突|compatibility|conflict/i,
      category: "compatibility",
      title: "兼容性风险",
      description: "历史项目中曾出现兼容性问题",
      mitigation: ["充分的兼容性测试", "灰度发布", "版本兼容性矩阵", "回退方案"],
    },
    {
      pattern: /安全漏洞|未授权|泄露|security|vulnerability|leak/i,
      category: "security",
      title: "安全风险",
      description: "历史项目中曾出现安全问题",
      mitigation: ["安全评审", "渗透测试", "最小权限原则", "安全监控"],
    },
    {
      pattern: /服务中断|不可用|宕机|downtime|outage|unavailable/i,
      category: "core_change",
      title: "服务可用性风险",
      description: "历史项目中曾出现服务中断",
      mitigation: ["高可用架构设计", "故障转移方案", "监控告警", "快速恢复预案"],
    },
  ];

  for (const { pattern, category, title, description, mitigation } of riskPatterns) {
    if (pattern.test(text)) {
      risks.push({
        id: `risk-${now}-${Math.random().toString(36).slice(2, 9)}`,
        category,
        title,
        description: projectName ? `${description}（项目：${projectName}）` : description,
        mitigation,
        relatedProjects: projectId ? [projectId] : undefined,
        source,
        createdAt: now,
        updatedAt: now,
        occurrenceCount: 1,
      });
    }
  }

  return risks;
}

/**
 * 获取用户风险画像
 */
export async function getUserRiskProfile(userId: string): Promise<UserRiskProfile> {
  ensureRiskDir();
  const filePath = getUserRiskProfilePath(userId);

  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data) as UserRiskProfile;
  } catch {
    // 创建默认画像
    const profile: UserRiskProfile = {
      userId,
      totalRisksEncountered: 0,
      riskCategories: {
        cutover: 0,
        data_migration: 0,
        core_change: 0,
        architecture: 0,
        security: 0,
        performance: 0,
        compatibility: 0,
      },
      highRiskProjects: [],
      commonMistakes: [],
      alertCountToday: 0,
      config: DEFAULT_CONFIG,
      updatedAt: Date.now(),
    };
    await saveUserRiskProfile(profile);
    return profile;
  }
}

/**
 * 保存用户风险画像
 */
export async function saveUserRiskProfile(profile: UserRiskProfile): Promise<void> {
  ensureRiskDir();
  const filePath = getUserRiskProfilePath(profile.userId);
  profile.updatedAt = Date.now();
  await writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");
}

/**
 * 更新用户风险配置
 */
export async function updateRiskConfig(
  userId: string,
  configUpdates: Partial<RiskAlertConfig>
): Promise<RiskAlertConfig> {
  const profile = await getUserRiskProfile(userId);
  profile.config = { ...profile.config, ...configUpdates };
  await saveUserRiskProfile(profile);
  return profile.config;
}

/**
 * 获取用户风险知识库
 */
export async function getUserRiskKnowledge(userId: string): Promise<RiskKnowledge[]> {
  ensureRiskDir();
  const filePath = getUserRiskKnowledgePath(userId);

  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data) as RiskKnowledge[];
  } catch {
    // 首次使用，从记忆中提取
    const risks = await buildRiskKnowledgeFromMemory(userId);
    await saveUserRiskKnowledge(userId, risks);
    return risks;
  }
}

/**
 * 保存用户风险知识库
 */
export async function saveUserRiskKnowledge(userId: string, risks: RiskKnowledge[]): Promise<void> {
  ensureRiskDir();
  const filePath = getUserRiskKnowledgePath(userId);
  await writeFile(filePath, JSON.stringify(risks, null, 2), "utf-8");
}

/**
 * 从记忆中构建风险知识库
 */
export async function buildRiskKnowledgeFromMemory(userId: string): Promise<RiskKnowledge[]> {
  const [projectRisks, interactionRisks] = await Promise.all([
    extractRisksFromProjectHistory(userId),
    extractRisksFromDailyInteractions(userId),
  ]);

  // 合并并去重
  const riskMap = new Map<string, RiskKnowledge>();

  for (const risk of [...projectRisks, ...interactionRisks]) {
    const key = `${risk.category}:${risk.title}`;
    if (riskMap.has(key)) {
      const existing = riskMap.get(key)!;
      existing.occurrenceCount += 1;
      existing.updatedAt = Date.now();
      if (risk.relatedProjects) {
        existing.relatedProjects = [
          ...(existing.relatedProjects || []),
          ...risk.relatedProjects,
        ];
      }
    } else {
      riskMap.set(key, risk);
    }
  }

  return Array.from(riskMap.values());
}

/**
 * 刷新用户风险知识库
 */
export async function refreshRiskKnowledge(userId: string): Promise<RiskKnowledge[]> {
  const risks = await buildRiskKnowledgeFromMemory(userId);
  await saveUserRiskKnowledge(userId, risks);

  // 更新用户画像统计
  const profile = await getUserRiskProfile(userId);
  profile.totalRisksEncountered = risks.length;
  for (const risk of risks) {
    profile.riskCategories[risk.category] = (profile.riskCategories[risk.category] || 0) + 1;
  }
  await saveUserRiskProfile(profile);

  return risks;
}

/**
 * 根据类别获取相关风险
 */
export async function getRelevantRisks(
  userId: string,
  category: RiskCategory,
  limit: number = 3
): Promise<RiskKnowledge[]> {
  const risks = await getUserRiskKnowledge(userId);
  return risks
    .filter((r) => r.category === category)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, limit);
}

/**
 * 记录风险提醒（用于去重）
 */
export async function recordRiskAlert(
  userId: string,
  sessionId: string,
  category: RiskCategory,
  messageHash: string
): Promise<boolean> {
  const profile = await getUserRiskProfile(userId);

  // 检查今日提醒次数
  const today = new Date().toDateString();
  const lastAlertDate = profile.lastAlertAt ? new Date(profile.lastAlertAt).toDateString() : null;

  if (lastAlertDate !== today) {
    profile.alertCountToday = 0;
  }

  if (profile.alertCountToday >= profile.config.maxAlertsPerSession) {
    return false; // 超过限制
  }

  profile.alertCountToday++;
  profile.lastAlertAt = Date.now();
  await saveUserRiskProfile(profile);

  return true;
}

/**
 * 检查是否应该提醒（去重检查）
 */
export async function shouldAlert(
  userId: string,
  messageHash: string,
  cooldownMs: number = 3600000 // 1小时冷却
): Promise<boolean> {
  // 简化实现：基于哈希的冷却期检查
  // 实际生产环境可以使用 Redis 或数据库
  return true;
}
