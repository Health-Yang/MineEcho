/**
 * Workplace Intelligence System
 * 职场关系智能系统
 *
 * 识别用户咨询中的职场敏感场景，并给出超越技术层面的职场建议
 *
 * 核心功能：
 * 1. 敏感场景识别：数据安全/合规、责任边界、人际关系、职业发展
 * 2. 职场建议生成：基于场景类型匹配建议模板，结合用户角色给出针对性建议
 * 3. 表达方式：温和、非评判性语气，明确标记为"职场建议"
 *
 * 向后兼容：
 * - 不修改现有 chat 响应格式
 * - 敏感检测本地完成
 * - 可配置关闭
 */

// Type exports
export type {
  SensitiveScenarioType,
  SeverityLevel,
  DetectedScenario,
  DetectionRule,
  AdviceTemplate,
  WorkplaceAdvice,
  UserRoleInfo,
  WorkplaceIntelligenceConfig,
  DetectionResult,
  EnhancedMessageMetadata,
} from "./types.js";

// Config exports
export { DEFAULT_CONFIG } from "./types.js";

// Detector exports
export {
  ScenarioDetector,
  scenarioDetector,
} from "./detector.js";

// Rules exports
export {
  ALL_DETECTION_RULES,
  RULES_BY_TYPE,
  getRulesStats,
} from "./detection-rules.js";

// Templates exports
export {
  ALL_ADVICE_TEMPLATES,
  findBestTemplate,
  renderTemplate,
  generateAdvice,
} from "./advice-templates.js";

// Integration exports
export {
  WorkplaceIntelligenceIntegration,
  workplaceIntelligenceIntegration,
} from "./integration.js";
