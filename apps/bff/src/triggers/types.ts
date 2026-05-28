/**
 * Personalized Trigger Types
 *
 * MineEcho v2 learns user habits and maps personalized phrases to skills.
 * For example: User often types "帮我查一下深信服的股票" →
 * System learns that "股票" should trigger the stock lookup skill for this user.
 */

/** Personalized Trigger - maps user's phrase to skill */
export interface PersonalizedTrigger {
  id: string;
  userId: string;
  triggerPhrase: string;      // What user typed (e.g., "股票", "日报")
  normalizedTrigger: string;  // Normalized version (e.g., "股票")
  skillId: string;            // Target skill
  skillName: string;          // Human-readable skill name
  confidence: number;         // 0-1, based on usage frequency
  usageCount: number;         // How many times used
  lastUsed: number;           // Timestamp
  contextPattern?: string;    // Optional: context pattern (e.g., "查一下*股票")
  createdAt: number;
}

/** Trigger Learning Event - when system detects potential trigger */
export interface TriggerLearningEvent {
  userId: string;
  userMessage: string;
  detectedSkill: string;
  skillName: string;
  triggerCandidate: string;
  confidence: number;
  timestamp: number;
}

/** Match result from trigger matching */
export interface TriggerMatchResult {
  trigger: PersonalizedTrigger;
  matchedPhrase: string;
  confidence: number;
  matchType: 'exact' | 'contains' | 'pattern';
}

/** Trigger suggestion based on usage patterns */
export interface TriggerSuggestion {
  triggerPhrase: string;
  skillId: string;
  skillName: string;
  confidence: number;
  usageCount: number;
  reason: string;
}

/** NLP extraction pattern for trigger candidates */
export interface ExtractionPattern {
  name: string;
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => string | null;
  weight: number;
}

/** Learning configuration */
export interface LearningConfig {
  minUsageCount: number;           // Minimum usage to consider learning
  minConfidenceThreshold: number;  // Minimum confidence to auto-apply (0.7)
  maxTriggersPerUser: number;      // Maximum triggers to store per user
  decayFactor: number;             // How fast confidence decays (0.95)
  boostFactor: number;             // How much confidence increases per use (0.1)
}

/** Default learning configuration */
export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  minUsageCount: 2,
  minConfidenceThreshold: 0.7,
  maxTriggersPerUser: 100,
  decayFactor: 0.95,
  boostFactor: 0.1,
};

/** Trigger statistics for a user */
export interface TriggerStats {
  totalTriggers: number;
  highConfidenceTriggers: number;  // > 0.7
  mostUsedSkill: string | null;
  recentLearned: number;           // Last 7 days
}
