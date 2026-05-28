/**
 * Risk Alert System - Type Definitions
 * 风险兜底提醒系统类型定义
 */

/**
 * 风险等级
 */
export type RiskLevel = "critical" | "high" | "medium" | "low";

/**
 * 风险类别
 */
export type RiskCategory =
  | "cutover"           // 割接/上线
  | "data_migration"    // 数据迁移
  | "core_change"       // 核心系统变更
  | "architecture"      // 架构设计
  | "security"          // 安全相关
  | "performance"       // 性能相关
  | "compatibility";    // 兼容性

/**
 * 风险触发关键词
 */
export interface RiskTrigger {
  keywords: string[];
  category: RiskCategory;
  weight: number;  // 0-1, 触发权重
}

/**
 * 风险知识条目
 */
export interface RiskKnowledge {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  mitigation: string[];  // 缓解措施
  relatedProjects?: string[];  // 关联项目ID
  source: "user_history" | "system" | "inferred";
  createdAt: number;
  updatedAt: number;
  occurrenceCount: number;  // 发生次数
}

/**
 * 用户项目中的风险记录
 */
export interface ProjectRisk {
  id: string;
  projectId: string;
  projectName: string;
  riskType: RiskCategory;
  description: string;
  impact: string;
  resolution?: string;
  occurredAt: number;
  severity: RiskLevel;
}

/**
 * 风险检测结果
 */
export interface RiskDetectionResult {
  detected: boolean;
  category?: RiskCategory;
  confidence: number;  // 0-1
  matchedKeywords: string[];
  context?: string;  // 触发上下文
}

/**
 * 风险提醒
 */
export interface RiskAlert {
  id: string;
  level: RiskLevel;
  category: RiskCategory;
  title: string;
  message: string;
  relatedRisks: RiskKnowledge[];
  relatedProjects?: ProjectRisk[];
  suggestedActions: string[];
  timestamp: number;
  source: "memory" | "system";
}

/**
 * 风险提醒配置
 */
export interface RiskAlertConfig {
  enabled: boolean;
  minConfidence: number;  // 最小置信度触发提醒
  maxAlertsPerSession: number;  // 每会话最大提醒数
  categories: RiskCategory[];  // 启用的类别
  excludePatterns?: string[];  // 排除的正则模式
}

/**
 * 用户风险画像
 */
export interface UserRiskProfile {
  userId: string;
  totalRisksEncountered: number;
  riskCategories: Record<RiskCategory, number>;  // 各类别发生次数
  highRiskProjects: string[];  // 高风险项目ID
  commonMistakes: string[];  // 常见踩坑点
  lastAlertAt?: number;
  alertCountToday: number;
  config: RiskAlertConfig;
  updatedAt: number;
}

/**
 * 风险提醒记录（用于去重和统计）
 */
export interface RiskAlertRecord {
  id: string;
  userId: string;
  sessionId: string;
  alertId: string;
  category: RiskCategory;
  messageHash: string;  // 用于去重
  acknowledged: boolean;
  createdAt: number;
}
