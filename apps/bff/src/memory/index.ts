/**
 * MineEcho Memory System
 * Three-tier memory architecture for AI Companion
 *
 * Working Memory  - Current session (in-memory only, last 20 messages)
 * Short-term Memory - Daily memory (localStorage, resets daily)
 * Long-term Memory  - Persistent profile (file-based storage)
 */

// Type exports
export type {
  // Working Memory
  Message,
  MessageMetadata,
  Attachment,
  Context,
  Entity,
  WorkingMemory,

  // Short-term Memory
  Interaction,
  Preference,
  PreferenceCategory,
  Task,
  ShortTermMemory,
  DailyBurnoutMetrics,

  // Long-term Memory
  UserProfile,
  WorkStyle,
  TechnicalStack,
  DomainExpertise,
  SkillUsage,
  Shortcut,
  SkillPattern,
  Workflow,
  WorkflowStep,
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeGraph,
  Project,
  LongTermMemory,
  BurnoutHistory,

  // Learning
  LearningData,
  ProfileUpdate,

  // API Types
  GetProfileResponse,
  UpdateProfileRequest,
  GetShortTermMemoryResponse,
  LearnRequest,
  LearnResponse,
  GetSkillPatternsResponse,

  // Manager Interfaces
  IWorkingMemoryManager,
  IShortTermMemoryManager,
  ILongTermMemoryManager,
  IUserProfileLearner,
} from "./types.js";

// Manager exports
export {
  workingMemoryManager,
  WorkingMemoryManager,
} from "./working-memory.js";

export {
  shortTermMemoryManager,
  ShortTermMemoryManager,
} from "./short-term-memory.js";

export {
  longTermMemoryManager,
  LongTermMemoryManager,
} from "./long-term-memory.js";

export {
  userProfileLearner,
  UserProfileLearner,
} from "./user-profile.js";

// Memory Closure exports
export {
  generateDailySummary,
  generateMorningReminder,
  sendMorningReminder,
  getDailySummary,
  startMemoryClosureScheduler,
  stopMemoryClosureScheduler,
} from "./memory-closure.js";
// Type exports from memory-closure are inline

// Burnout Detection exports
export {
  burnoutDetector,
  BurnoutDetector,
  calculateBurnoutMetrics,
  calculateRiskScore,
  getRiskLevel,
  generateCareMessage,
  generateCareSuggestions,
} from "./burnout-detector.js";
export type {
  BurnoutRiskAssessment,
  CareMessage,
} from "./burnout-detector.js";

// Growth Report exports
export {
  growthReportGenerator,
  GrowthReportGenerator,
  generateGrowthReport,
  calculateGrowthMetrics,
  detectMilestones,
  calculateRadarScores,
  GROWTH_REPORT_ENABLED,
} from "./growth-report.js";
export type {
  GrowthReport,
  GrowthMetrics,
  Milestone,
  MilestoneType,
  ReportPeriod,
  RadarDimension,
  ReportGenerationOptions,
} from "./growth-report.js";

// Report Scheduler exports
export {
  reportScheduler,
  ReportScheduler,
  startReportScheduler,
  stopReportScheduler,
  getSchedulerStatus,
  triggerScheduledReport,
  getUpcomingReports,
} from "./report-scheduler.js";
export type {
  SchedulerConfig,
  SchedulerStatus,
} from "./report-scheduler.js";

// Background Review exports
export {
  onTurnCompleted,
  clearSessionTurnCount,
} from "./background-review.js";
export type {
  ReviewableTurn,
} from "./background-review.js";

// Memory Tree Service exports (convenience functions for storing)
export {
  storeToMemoryTree,
  storeConversationToMemoryTree,
  storeSkillToMemoryTree,
  getMemoryTreeStats,
  isMemoryTreeEnabled,
} from "./memory-tree-service.js";

// Memory Tree exports (hierarchical summarization)
export {
  memoryTreeManager,
  MemoryTreeManager,
} from "./memory-tree/tree-manager.js";

export {
  buildDreamInsights,
  runMemoryDream,
} from "./memory-dream.js";
export type {
  DreamInsights,
  DreamRunResult,
} from "./memory-dream.js";

export {
  MemoryDreamScheduler,
  startMemoryDreamScheduler,
  stopMemoryDreamScheduler,
  getMemoryDreamSchedulerState,
  getDreamSchedulerConfigFromEnv,
} from "./memory-dream-scheduler.js";
export type {
  DreamSchedulerConfig,
  DreamSchedulerState,
} from "./memory-dream-scheduler.js";

export type {
  L0Chunk,
  L0ChunkInput,
  L1Summary,
  L2Summary,
  L3Summary,
  MemoryEntity,
  MemoryRelation,
  MemoryContext,
  RecallOptions,
  RecallResult,
  MemoryTreeConfig,
  MemorySource,
  EntityKind,
  StoreChunkRequest,
  RecallRequest,
  RecapRequest,
} from "./memory-tree/types.js";
