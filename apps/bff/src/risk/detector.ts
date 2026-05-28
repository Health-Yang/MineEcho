/**
 * Risk Detection Engine
 * 风险检测引擎 - 基于关键词和上下文的实时风险识别
 */

import { createHash } from "node:crypto";
import type {
  RiskCategory,
  RiskTrigger,
  RiskDetectionResult,
  RiskLevel,
} from "./types.js";

// 风险触发关键词库
const RISK_TRIGGERS: RiskTrigger[] = [
  // 割接/上线类
  {
    keywords: ["割接", "上线", "发布", "投产", "go live", "go-live", "deploy to prod", "production deploy"],
    category: "cutover",
    weight: 0.9,
  },
  {
    keywords: ["变更", "change", "modify", "update", "alter", "调整", "改动"],
    category: "cutover",
    weight: 0.6,
  },
  {
    keywords: ["窗口期", "维护窗口", "maintenance window", "downtime", "停机"],
    category: "cutover",
    weight: 0.85,
  },
  {
    keywords: ["回滚", "rollback", "回退", "撤销", "回朔"],
    category: "cutover",
    weight: 0.8,
  },

  // 数据迁移类
  {
    keywords: ["数据迁移", "data migration", "迁移数据", "导数据", "数据导入", "数据导出"],
    category: "data_migration",
    weight: 0.9,
  },
  {
    keywords: ["数据库迁移", "db migration", "表结构变更", "schema change", "ddl"],
    category: "data_migration",
    weight: 0.85,
  },
  {
    keywords: ["全量同步", "增量同步", "数据同步", "data sync", "replication"],
    category: "data_migration",
    weight: 0.75,
  },
  {
    keywords: ["数据清洗", "data cleaning", "etl", "数据转换"],
    category: "data_migration",
    weight: 0.7,
  },

  // 核心系统变更类
  {
    keywords: ["核心系统", "core system", "关键系统", "critical system", "支付系统", "交易系统"],
    category: "core_change",
    weight: 0.9,
  },
  {
    keywords: ["基础架构", "infrastructure", "底层", "foundation", "根基"],
    category: "core_change",
    weight: 0.8,
  },
  {
    keywords: ["配置中心变更", "注册中心变更", "核心网关变更", "负载均衡变更"],
    category: "core_change",
    weight: 0.75,
  },

  // 架构设计类
  {
    keywords: ["方案设计", "架构设计", "solution design", "architecture design", "技术方案"],
    category: "architecture",
    weight: 0.7,
  },
  {
    keywords: ["高可用", "high availability", "ha", "容灾", "disaster recovery", "dr"],
    category: "architecture",
    weight: 0.75,
  },
  {
    keywords: ["性能优化", "performance tuning", "容量规划", "capacity planning"],
    category: "performance",
    weight: 0.7,
  },

  // 安全类
  {
    keywords: ["安全", "security", "漏洞", "vulnerability", "渗透测试", "安全审计"],
    category: "security",
    weight: 0.8,
  },
  {
    keywords: ["权限", "permission", "认证", "auth", "授权", "authorization"],
    category: "security",
    weight: 0.65,
  },

  // 兼容性类
  {
    keywords: ["兼容性", "compatibility", "版本升级", "upgrade", "降级", "downgrade"],
    category: "compatibility",
    weight: 0.7,
  },
  {
    keywords: ["接口变更", "api change", "协议变更", "breaking change", "不兼容"],
    category: "compatibility",
    weight: 0.8,
  },
];

// 敏感操作模式（正则表达式）
const SENSITIVE_PATTERNS = [
  {
    pattern: /delete\s+from|drop\s+table|truncate\s+table/i,
    category: "data_migration" as RiskCategory,
    weight: 0.95,
    level: "critical" as RiskLevel,
  },
  {
    pattern: /update\s+.*\s+where\s+1\s*=\s*1|update\s+.*\s+without\s+where/i,
    category: "data_migration" as RiskCategory,
    weight: 0.95,
    level: "critical" as RiskLevel,
  },
  {
    pattern: /rm\s+-rf|rm\s+\//i,
    category: "core_change" as RiskCategory,
    weight: 0.95,
    level: "critical" as RiskLevel,
  },
  {
    pattern: /grant\s+all|revoke\s+all/i,
    category: "security" as RiskCategory,
    weight: 0.85,
    level: "high" as RiskLevel,
  },
];

/**
 * 检测消息中的风险
 */
export function detectRisk(message: string): RiskDetectionResult {
  const lowerMessage = message.toLowerCase();
  const matchedKeywords: string[] = [];
  let totalWeight = 0;
  let detectedCategory: RiskCategory | undefined;
  const categoryWeights: Record<RiskCategory, number> = {
    cutover: 0,
    data_migration: 0,
    core_change: 0,
    architecture: 0,
    security: 0,
    performance: 0,
    compatibility: 0,
  };

  // 关键词匹配
  for (const trigger of RISK_TRIGGERS) {
    for (const keyword of trigger.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        categoryWeights[trigger.category] += trigger.weight;
        totalWeight += trigger.weight;
      }
    }
  }

  // 正则模式匹配（敏感操作）
  let detectedLevel: RiskLevel | undefined;
  for (const { pattern, category, weight, level } of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      matchedKeywords.push("[敏感操作]");
      categoryWeights[category] += weight;
      totalWeight += weight;
      detectedLevel = level;
    }
  }

  // 确定主要类别
  let maxWeight = 0;
  for (const [category, weight] of Object.entries(categoryWeights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      detectedCategory = category as RiskCategory;
    }
  }

  // 计算置信度
  const confidence = Math.min(1, totalWeight / 2); // 归一化到0-1

  return {
    detected: confidence > 0.6, // 阈值：提高为0.6，避免单一宽泛关键词误触发
    category: detectedCategory,
    confidence,
    matchedKeywords: [...new Set(matchedKeywords)],
    context: detectedCategory ? extractContext(message, detectedCategory) : undefined,
  };
}

/**
 * 提取风险上下文
 */
function extractContext(message: string, category: RiskCategory): string {
  // 根据类别提取相关句子
  const sentences = message.split(/[。！？.!?]/);
  const relevantSentences: string[] = [];

  const categoryKeywords: Record<RiskCategory, string[]> = {
    cutover: ["割接", "上线", "发布", "变更", "窗口期", "回滚"],
    data_migration: ["迁移", "同步", "导入", "导出", "清洗"],
    core_change: ["核心", "基础", "底层", "配置中心", "注册中心"],
    architecture: ["方案", "架构", "设计", "高可用", "容灾"],
    security: ["安全", "漏洞", "权限", "认证", "授权"],
    performance: ["性能", "优化", "容量", "压测"],
    compatibility: ["兼容", "升级", "降级", "接口"],
  };

  const keywords = categoryKeywords[category] || [];

  for (const sentence of sentences) {
    for (const keyword of keywords) {
      if (sentence.includes(keyword)) {
        relevantSentences.push(sentence.trim());
        break;
      }
    }
  }

  return relevantSentences.slice(0, 2).join("；");
}

/**
 * 批量检测多条消息
 */
export function detectRisksInBatch(messages: string[]): RiskDetectionResult[] {
  return messages.map((msg) => detectRisk(msg));
}

/**
 * 检查是否为方案设计类对话
 */
export function isSolutionDesignDiscussion(message: string): boolean {
  const designPatterns = [
    /方案.{0,5}(设计|评审|讨论)/,
    /架构.{0,5}(设计|评审|方案)/,
    /怎么.{0,3}(设计|实现|做)/,
    /如何.{0,3}(设计|实现|部署|上线)/,
    /有什么.{0,3}(建议|方案|思路)/,
    /(帮忙|请).{0,3}(看看|评审|review)/i,
    /(review|评估|评估一下).{0,5}(方案|设计|架构)/i,
  ];

  return designPatterns.some((pattern) => pattern.test(message));
}

/**
 * 获取风险等级
 */
export function getRiskLevel(confidence: number, category: RiskCategory): RiskLevel {
  if (confidence >= 0.9) return "critical";
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

/**
 * 风险提醒去重哈希
 */
export function generateAlertHash(userId: string, category: RiskCategory, context: string): string {
  const data = `${userId}:${category}:${context.slice(0, 50)}`;
  return createHash("md5").update(data).digest("hex");
}
