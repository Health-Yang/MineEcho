/**
 * Personalized Trigger Learning System
 *
 * MineEcho v2 learns user habits and maps personalized phrases to skills.
 *
 * Example flow:
 * 1. User types: "帮我查一下深信服的股票"
 * 2. System detects stock_lookup skill was used
 * 3. System learns: "股票" → stock_lookup skill
 * 4. Next time user says: "今天股票怎么样？"
 * 5. Matcher returns: { skillId: "stock_lookup", confidence: 0.85 }
 * 6. System prepends: "[使用技能:股票查询] 今天股票怎么样？"
 */

// Type definitions
export type {
  PersonalizedTrigger,
  TriggerLearningEvent,
  TriggerMatchResult,
  TriggerSuggestion,
  ExtractionPattern,
  LearningConfig,
  TriggerStats,
} from './types.js';

export { DEFAULT_LEARNING_CONFIG } from './types.js';

// Storage layer
export { triggerStorage } from './storage.js';

// Learning algorithm
export {
  extractTriggerCandidates,
  learnTrigger,
  getPersonalizedTriggers,
  getTriggerSuggestions,
  recordTriggerUsage,
  removeTrigger,
  getLearningStats,
  batchLearn,
  normalizeTrigger,
} from './learner.js';

// Matching algorithm
export {
  matchTrigger,
  findAllMatches,
  shouldInjectSkill,
  injectSkillContext,
  processMessageForTriggers,
  getMatchStats,
} from './matcher.js';

// Skill trigger loader (from SKILL.md frontmatter)
export {
  loadSkillTriggersFromDisk,
  getSkillTriggerEntries,
  matchSkillTrigger,
  getSkillTriggerIndex,
  getSkillTriggerStats,
} from './skill-loader.js';
