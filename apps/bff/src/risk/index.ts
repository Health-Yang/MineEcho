/**
 * Risk Alert System
 * 风险兜底提醒系统 - 基于用户历史项目经验的风险识别与提醒
 *
 * Features:
 * - 异步风险检测（不阻塞主流程）
 * - 基于用户历史项目经验的风险知识库
 * - 自然语言风险提醒生成
 * - 可配置的提醒策略
 */

// 类型导出
export type {
  RiskLevel,
  RiskCategory,
  RiskTrigger,
  RiskKnowledge,
  ProjectRisk,
  RiskDetectionResult,
  RiskAlert,
  RiskAlertConfig,
  UserRiskProfile,
  RiskAlertRecord,
} from "./types.js";

// 检测器导出
export {
  detectRisk,
  detectRisksInBatch,
  isSolutionDesignDiscussion,
  getRiskLevel,
  generateAlertHash,
} from "./detector.js";

// 知识库导出
export {
  extractRisksFromProjectHistory,
  extractRisksFromDailyInteractions,
  getUserRiskProfile,
  updateRiskConfig,
  getUserRiskKnowledge,
  refreshRiskKnowledge,
  getRelevantRisks,
  recordRiskAlert,
  shouldAlert,
} from "./knowledge-base.js";

// 提醒生成器导出
export {
  generateRiskAlert,
  formatRiskAlert,
  formatRiskAlertConcise,
} from "./alert-generator.js";

// 检测服务导出
export {
  detectRiskAsync,
  detectRisksInHistory,
  detectSolutionDesignScenario,
  getFormattedRiskAlert,
  resetSessionAlertCount,
  getSessionAlertCount,
  getDetectionStats,
  riskDetectionMiddleware,
  isRiskAlertEnabled,
  type RiskDetectionOptions,
  type RiskDetectionTaskResult,
} from "./detection-service.js";
