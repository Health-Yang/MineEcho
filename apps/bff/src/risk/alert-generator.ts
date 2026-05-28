/**
 * Risk Alert Generator
 * 风险提醒生成器 - 基于检测结果生成自然语言提醒
 */

import type {
  RiskCategory,
  RiskLevel,
  RiskAlert,
  RiskKnowledge,
} from "./types.js";
import { getRelevantRisks, getUserRiskProfile, recordRiskAlert } from "./knowledge-base.js";
import { getRiskLevel, generateAlertHash } from "./detector.js";
import { logger } from "../utils/logger.js";

// 系统级风险知识库（作为兜底）
const SYSTEM_RISK_KNOWLEDGE: Record<RiskCategory, RiskKnowledge[]> = {
  cutover: [
    {
      id: "sys-cutover-1",
      category: "cutover",
      title: "割接窗口期风险",
      description: "割接操作需要在维护窗口期内完成，超时可能导致业务影响",
      mitigation: ["精确估算操作时间", "准备自动化脚本", "设置阶段检查点", "预留回滚时间"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
    {
      id: "sys-cutover-2",
      category: "cutover",
      title: "回滚方案缺失风险",
      description: "没有准备回滚方案可能导致故障恢复时间延长",
      mitigation: ["制定详细回滚步骤", "提前验证回滚流程", "准备回滚脚本", "明确回滚决策人"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
  data_migration: [
    {
      id: "sys-migration-1",
      category: "data_migration",
      title: "数据一致性风险",
      description: "数据迁移过程中可能出现数据不一致或丢失",
      mitigation: ["迁移前完整备份", "分批次迁移验证", "迁移后数据校验", "保留原始数据"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
    {
      id: "sys-migration-2",
      category: "data_migration",
      title: "DDL变更风险",
      description: "表结构变更可能导致应用兼容性问题或锁表",
      mitigation: ["使用在线DDL工具", "选择低峰期执行", "提前测试兼容性", "准备回滚脚本"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
  core_change: [
    {
      id: "sys-core-1",
      category: "core_change",
      title: "级联故障风险",
      description: "核心系统变更可能引发级联故障",
      mitigation: ["充分的依赖分析", "灰度发布", "实时监控", "快速熔断机制"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
  architecture: [
    {
      id: "sys-arch-1",
      category: "architecture",
      title: "架构设计缺陷",
      description: "架构设计阶段未充分考虑扩展性和容错性",
      mitigation: ["架构评审", "容量规划", "故障场景分析", "性能基准测试"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
  security: [
    {
      id: "sys-sec-1",
      category: "security",
      title: "权限提升风险",
      description: "变更可能引入权限漏洞",
      mitigation: ["最小权限原则", "权限评审", "安全测试", "审计日志"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
  performance: [
    {
      id: "sys-perf-1",
      category: "performance",
      title: "性能瓶颈",
      description: "变更可能引入性能瓶颈",
      mitigation: ["性能测试", "容量评估", "监控埋点", "扩容预案"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
  compatibility: [
    {
      id: "sys-compat-1",
      category: "compatibility",
      title: "版本兼容性",
      description: "升级可能导致与现有组件不兼容",
      mitigation: ["兼容性测试", "版本矩阵验证", "灰度发布", "回退方案"],
      source: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      occurrenceCount: 1,
    },
  ],
};

// 风险级别图标
const RISK_ICONS: Record<RiskLevel, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

// 风险类别名称
const CATEGORY_NAMES: Record<RiskCategory, string> = {
  cutover: "割接上线",
  data_migration: "数据迁移",
  core_change: "核心变更",
  architecture: "架构设计",
  security: "安全",
  performance: "性能",
  compatibility: "兼容性",
};

/**
 * 生成风险提醒
 */
export async function generateRiskAlert(
  userId: string,
  sessionId: string,
  category: RiskCategory,
  confidence: number,
  matchedKeywords: string[],
  context?: string
): Promise<RiskAlert | null> {
  try {
    // 检查用户配置
    const profile = await getUserRiskProfile(userId);
    if (!profile.config.enabled) {
      return null;
    }

    if (!profile.config.categories.includes(category)) {
      return null;
    }

    if (confidence < profile.config.minConfidence) {
      return null;
    }

    // 生成消息哈希用于去重
    const messageHash = generateAlertHash(userId, category, context || matchedKeywords.join(","));

    // 检查是否应该提醒
    const shouldSend = await recordRiskAlert(userId, sessionId, category, messageHash);
    if (!shouldSend) {
      return null;
    }

    // 获取相关风险知识
    const userRisks = await getRelevantRisks(userId, category, 2);
    const systemRisks = SYSTEM_RISK_KNOWLEDGE[category] || [];

    // 如果没有用户历史风险，使用系统兜底
    const relatedRisks = userRisks.length > 0 ? userRisks : systemRisks.slice(0, 2);

    // 确定风险级别
    const level = getRiskLevel(confidence, category);

    // 生成提醒内容
    const title = generateAlertTitle(category, level, userRisks.length > 0);
    const message = generateAlertMessage(category, level, relatedRisks, matchedKeywords, userRisks.length > 0);
    const suggestedActions = generateSuggestedActions(relatedRisks);

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      level,
      category,
      title,
      message,
      relatedRisks,
      suggestedActions,
      timestamp: Date.now(),
      source: userRisks.length > 0 ? "memory" : "system",
    };
  } catch (error) {
    logger.error("[RiskAlert] Failed to generate alert:", { error, userId, category });
    return null;
  }
}

/**
 * 生成提醒标题
 */
function generateAlertTitle(category: RiskCategory, level: RiskLevel, hasUserHistory: boolean): string {
  const icon = RISK_ICONS[level];
  const categoryName = CATEGORY_NAMES[category];
  const historyTag = hasUserHistory ? "【基于你的历史项目】" : "";
  return `${icon} ${categoryName}风险提示 ${historyTag}`;
}

/**
 * 生成提醒消息
 */
function generateAlertMessage(
  category: RiskCategory,
  level: RiskLevel,
  relatedRisks: RiskKnowledge[],
  matchedKeywords: string[],
  hasUserHistory: boolean
): string {
  const parts: string[] = [];

  // 开头
  if (hasUserHistory) {
    parts.push(`检测到你在讨论${CATEGORY_NAMES[category]}相关话题。根据你过往的项目经验，这里有一些需要注意的风险点：`);
  } else {
    parts.push(`检测到你在讨论${CATEGORY_NAMES[category]}相关话题。建议关注以下常见风险：`);
  }

  parts.push("");

  // 相关风险
  for (let i = 0; i < Math.min(relatedRisks.length, 2); i++) {
    const risk = relatedRisks[i];
    parts.push(`${i + 1}. **${risk.title}**：${risk.description}`);
  }

  return parts.join("\n");
}

/**
 * 生成建议操作
 */
function generateSuggestedActions(relatedRisks: RiskKnowledge[]): string[] {
  const actions = new Set<string>();

  for (const risk of relatedRisks) {
    for (const mitigation of risk.mitigation) {
      actions.add(mitigation);
    }
  }

  return Array.from(actions).slice(0, 4);
}

/**
 * 格式化风险提醒为自然语言
 */
export function formatRiskAlert(alert: RiskAlert): string {
  const lines: string[] = [];

  lines.push(`> **${alert.title}**`);
  lines.push(">");
  lines.push(`> ${alert.message.split("\n").join("\n> ")}`);

  if (alert.suggestedActions.length > 0) {
    lines.push(">");
    lines.push("> **建议措施：**");
    for (const action of alert.suggestedActions) {
      lines.push(`> - ${action}`);
    }
  }

  lines.push(">");
  lines.push("> 💡 *此提醒基于你的历史项目经验生成，仅供参考*");

  return lines.join("\n");
}

/**
 * 格式化风险提醒为简洁形式（用于流式输出）
 */
export function formatRiskAlertConcise(alert: RiskAlert): string {
  const lines: string[] = [];

  lines.push(`\n\n${alert.title}`);
  lines.push(alert.message);

  if (alert.suggestedActions.length > 0) {
    lines.push("\n建议措施：");
    for (const action of alert.suggestedActions.slice(0, 2)) {
      lines.push(`• ${action}`);
    }
  }

  lines.push("\n💡 此提醒基于你的历史项目经验");

  return lines.join("\n");
}
