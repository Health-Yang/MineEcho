/**
 * Workplace Intelligence System - Type Definitions
 * 职场关系智能系统类型定义
 *
 * 用于识别职场敏感场景并给出超越技术层面的职场建议
 */

// ============================================================================
// Sensitive Scenario Detection
// ============================================================================

/** 敏感场景类型 */
export type SensitiveScenarioType =
  | "data_security"      // 数据安全/合规类
  | "responsibility"     // 责任边界类
  | "interpersonal"      // 人际关系类
  | "career_development"; // 职业发展类

/** 敏感场景严重程度 */
export type SeverityLevel = "low" | "medium" | "high" | "critical";

/** 检测到的敏感场景 */
export interface DetectedScenario {
  type: SensitiveScenarioType;
  subtype: string;           // 具体子类型，如 "customer_data_exposure"
  severity: SeverityLevel;
  confidence: number;        // 0-1 置信度
  matchedKeywords: string[]; // 匹配到的关键词
  contextSnippet: string;    // 上下文片段
  detectedAt: number;
}

/** 场景检测规则 */
export interface DetectionRule {
  id: string;
  type: SensitiveScenarioType;
  subtype: string;
  severity: SeverityLevel;
  keywords: string[];        // 必须同时包含的关键词（AND 关系）
  optionalKeywords?: string[]; // 可选关键词（OR 关系，至少匹配一个）
  excludeKeywords?: string[];  // 排除关键词
  minConfidence: number;     // 最小置信度阈值
  weight: number;            // 权重，用于计算置信度
}

// ============================================================================
// Workplace Advice Generation
// ============================================================================

/** 建议模板 */
export interface AdviceTemplate {
  id: string;
  scenarioType: SensitiveScenarioType;
  scenarioSubtype: string;
  /** 模板内容，支持变量替换如 {{userRole}} */
  template: string;
  /** 适用角色，空数组表示通用 */
  applicableRoles?: string[];
  /** 语气风格 */
  tone: "gentle" | "professional" | "urgent";
  /** 优先级 */
  priority: number;
}

/** 生成的职场建议 */
export interface WorkplaceAdvice {
  id: string;
  scenario: DetectedScenario;
  content: string;
  tone: string;
  /** 明确标记为职场建议 */
  isWorkplaceAdvice: true;
  /** 建议标签 */
  tags: string[];
  generatedAt: number;
}

/** 用户角色信息 */
export interface UserRoleInfo {
  /** 职位/角色，如 "初级工程师", "项目经理" */
  title?: string;
  /** 部门 */
  department?: string;
  /** 工作年限 */
  yearsOfExperience?: number;
  /** 是否是管理岗 */
  isManager?: boolean;
  /** 团队规模 */
  teamSize?: number;
}

// ============================================================================
// Configuration
// ============================================================================

/** 职场智能系统配置 */
export interface WorkplaceIntelligenceConfig {
  /** 是否启用敏感场景检测 */
  enabled: boolean;
  /** 最小触发置信度 */
  minConfidenceThreshold: number;
  /** 是否启用建议生成 */
  adviceGenerationEnabled: boolean;
  /** 最大建议长度（字符） */
  maxAdviceLength: number;
  /** 同一类型场景冷却时间（毫秒） */
  cooldownPeriodMs: number;
  /** 自定义规则覆盖 */
  customRules?: Partial<DetectionRule>[];
  /** 禁用特定场景类型 */
  disabledScenarioTypes?: SensitiveScenarioType[];
}

/** 默认配置 */
export const DEFAULT_CONFIG: WorkplaceIntelligenceConfig = {
  enabled: true,
  minConfidenceThreshold: 0.6,
  adviceGenerationEnabled: true,
  maxAdviceLength: 500,
  cooldownPeriodMs: 5 * 60 * 1000, // 5分钟冷却
};

// ============================================================================
// Detection Result
// ============================================================================

/** 检测结果 */
export interface DetectionResult {
  hasSensitiveScenario: boolean;
  scenarios: DetectedScenario[];
  advice?: WorkplaceAdvice;
  /** 处理时间（毫秒） */
  processingTimeMs: number;
}

/** 增强的消息元数据 */
export interface EnhancedMessageMetadata {
  /** 原始元数据 */
  originalMetadata?: Record<string, unknown>;
  /** 检测到的场景 */
  detectedScenarios?: DetectedScenario[];
  /** 生成的建议 */
  workplaceAdvice?: WorkplaceAdvice;
  /** 检测时间戳 */
  detectedAt?: number;
}
