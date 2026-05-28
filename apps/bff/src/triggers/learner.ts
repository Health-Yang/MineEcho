/**
 * Trigger Learning Algorithm
 *
 * The system monitors user conversations and learns personalized trigger phrases.
 * When user uses a skill via natural language (not explicit trigger word),
 * the system records the phrase and builds confidence over time.
 */

import type {
  PersonalizedTrigger,
  TriggerLearningEvent,
  ExtractionPattern,
  LearningConfig,
  TriggerSuggestion,
} from './types.js';
import { DEFAULT_LEARNING_CONFIG } from './types.js';
import { triggerStorage } from './storage.js';

// NLP patterns for extracting trigger candidates
const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  {
    name: 'help-me',
    pattern: /帮我[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 1.0,
  },
  {
    name: 'i-want',
    pattern: /我要[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 1.0,
  },
  {
    name: 'check-lookup',
    pattern: /查[一]?[下下]?[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.9,
  },
  {
    name: 'query-search',
    pattern: /[搜索查询][一]?[下下]?[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.9,
  },
  {
    name: 'generate-create',
    pattern: /[生成创建制作写][一]?[个份]?[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.9,
  },
  {
    name: 'send-give',
    pattern: /[发送给发][一]?[个]?[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.85,
  },
  {
    name: 'need-want',
    pattern: /(?:需要|想要)[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.85,
  },
  {
    name: 'how-to',
    pattern: /怎么[\s]*(.+?)(?:[。！？.,;]|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.8,
  },
  {
    name: 'can-you',
    pattern: /能[不能]?[帮我]?[\s]*(.+?)(?:[吗嘛][。！？.,;]?|$)/,
    extract: (match) => match[1]?.trim() || null,
    weight: 0.8,
  },
];

/**
 * Normalize a trigger phrase for storage and matching
 */
export function normalizeTrigger(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/[\s]+/g, '') // Remove all whitespace
    .replace(/[，。？！,.?!;；：:""''（）()【】[\]{}]/g, '') // Remove punctuation
    .trim();
}

/**
 * Extract trigger candidates from user message using NLP patterns
 */
export function extractTriggerCandidates(message: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const pattern of EXTRACTION_PATTERNS) {
    const match = message.match(pattern.pattern);
    if (match) {
      const extracted = pattern.extract(match);
      if (extracted && extracted.length >= 2) {
        // Normalize to avoid duplicates
        const normalized = normalizeTrigger(extracted);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          candidates.push(extracted);
        }
      }
    }
  }

  // Also extract potential keywords (2-4 character nouns)
  const keywordMatches = message.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  for (const keyword of keywordMatches) {
    const normalized = normalizeTrigger(keyword);
    if (!seen.has(normalized) && isValidKeyword(keyword)) {
      seen.add(normalized);
      candidates.push(keyword);
    }
  }

  return candidates;
}

/**
 * Check if a keyword is valid for learning
 */
function isValidKeyword(keyword: string): boolean {
  // Filter out common stop words and short phrases
  const stopWords = new Set([
    '一下', '一个', '这个', '那个', '什么', '怎么', '为什么',
    '多少', '哪里', '谁', '吗', '呢', '吧', '啊', '哦',
  ]);

  if (stopWords.has(keyword)) return false;
  if (keyword.length < 2) return false;
  if (keyword.length > 10) return false; // Too long to be a trigger

  return true;
}

/**
 * Calculate confidence based on usage patterns
 */
function calculateConfidence(
  usageCount: number,
  lastUsed: number,
  config: LearningConfig
): number {
  // Base confidence from usage count (diminishing returns)
  const baseConfidence = Math.min(0.5 + usageCount * config.boostFactor, 0.95);

  // Recency decay
  const daysSinceLastUse = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24);
  const decayMultiplier = Math.pow(config.decayFactor, daysSinceLastUse);

  return Math.min(baseConfidence * decayMultiplier, 0.99);
}

/**
 * Learn from a successful skill invocation
 * This is called when the system detects a skill was used via natural language
 */
export async function learnTrigger(
  userId: string,
  message: string,
  skillId: string,
  skillName: string,
  config: Partial<LearningConfig> = {}
): Promise<TriggerLearningEvent | null> {
  const fullConfig = { ...DEFAULT_LEARNING_CONFIG, ...config };

  // Extract trigger candidates
  const candidates = extractTriggerCandidates(message);
  if (candidates.length === 0) return null;

  // Use the first (best) candidate
  const triggerCandidate = candidates[0];
  const normalizedTrigger = normalizeTrigger(triggerCandidate);

  // Check if we already have this trigger for this user
  const existingTriggers = await triggerStorage.getByUser(userId);
  const existingTrigger = existingTriggers.find(
    (t) => t.normalizedTrigger === normalizedTrigger && t.skillId === skillId
  );

  if (existingTrigger) {
    // Update existing trigger
    const newUsageCount = existingTrigger.usageCount + 1;
    const newConfidence = calculateConfidence(
      newUsageCount,
      Date.now(),
      fullConfig
    );

    await triggerStorage.update(userId, existingTrigger.id, {
      usageCount: newUsageCount,
      confidence: newConfidence,
      lastUsed: Date.now(),
    });
  } else {
    // Check if we've reached the max triggers per user
    if (existingTriggers.length >= fullConfig.maxTriggersPerUser) {
      // Remove the lowest confidence trigger
      const sorted = existingTriggers.sort((a, b) => a.confidence - b.confidence);
      const lowest = sorted[0];
      if (lowest.confidence < 0.3) {
        await triggerStorage.delete(userId, lowest.id);
      }
    }

    // Create new trigger
    await triggerStorage.create({
      userId,
      triggerPhrase: triggerCandidate,
      normalizedTrigger,
      skillId,
      skillName,
      confidence: calculateConfidence(1, Date.now(), fullConfig),
      usageCount: 1,
      lastUsed: Date.now(),
      contextPattern: generateContextPattern(message, triggerCandidate),
    });
  }

  const event: TriggerLearningEvent = {
    userId,
    userMessage: message,
    detectedSkill: skillId,
    skillName,
    triggerCandidate,
    confidence: existingTrigger
      ? calculateConfidence(existingTrigger.usageCount + 1, Date.now(), fullConfig)
      : calculateConfidence(1, Date.now(), fullConfig),
    timestamp: Date.now(),
  };

  return event;
}

/**
 * Generate a context pattern for the trigger
 * Example: "帮我查一下股票" → "查一下*股票"
 */
function generateContextPattern(message: string, trigger: string): string {
  const index = message.indexOf(trigger);
  if (index === -1) return trigger;

  const before = message.slice(0, index).trim();
  const after = message.slice(index + trigger.length).trim();

  let pattern = '';
  if (before) {
    // Take last 2-3 characters of before context
    const contextBefore = before.slice(-3);
    pattern = contextBefore + '*';
  }
  pattern += trigger;
  if (after) {
    // Take first 2-3 characters of after context
    const contextAfter = after.slice(0, 3);
    pattern += '*' + contextAfter;
  }

  return pattern || trigger;
}

/**
 * Get personalized triggers sorted by confidence
 */
export async function getPersonalizedTriggers(
  userId: string,
  minConfidence?: number
): Promise<PersonalizedTrigger[]> {
  let triggers = await triggerStorage.getByUserSorted(userId);

  if (minConfidence !== undefined) {
    triggers = triggers.filter((t) => t.confidence >= minConfidence);
  }

  return triggers;
}

/**
 * Get trigger suggestions based on usage patterns
 * Returns triggers that might be useful but haven't reached high confidence yet
 */
export async function getTriggerSuggestions(
  userId: string,
  limit: number = 5
): Promise<TriggerSuggestion[]> {
  const triggers = await triggerStorage.getByUser(userId);

  // Filter for medium confidence triggers that could use more usage
  const suggestions = triggers
    .filter((t) => t.confidence >= 0.3 && t.confidence < 0.7)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
    .map((t) => ({
      triggerPhrase: t.triggerPhrase,
      skillId: t.skillId,
      skillName: t.skillName,
      confidence: t.confidence,
      usageCount: t.usageCount,
      reason: `已使用 ${t.usageCount} 次，置信度 ${(t.confidence * 100).toFixed(0)}%`,
    }));

  return suggestions;
}

/**
 * Record a manual trigger usage (for explicit feedback)
 */
export async function recordTriggerUsage(
  userId: string,
  triggerId: string,
  config: Partial<LearningConfig> = {}
): Promise<PersonalizedTrigger | null> {
  const fullConfig = { ...DEFAULT_LEARNING_CONFIG, ...config };

  const trigger = await triggerStorage.getById(userId, triggerId);
  if (!trigger) return null;

  const newUsageCount = trigger.usageCount + 1;
  const newConfidence = calculateConfidence(newUsageCount, Date.now(), fullConfig);

  return await triggerStorage.update(userId, triggerId, {
    usageCount: newUsageCount,
    confidence: newConfidence,
    lastUsed: Date.now(),
  });
}

/**
 * Remove a learned trigger
 */
export async function removeTrigger(
  userId: string,
  triggerId: string
): Promise<boolean> {
  return await triggerStorage.delete(userId, triggerId);
}

/**
 * Get learning statistics for a user
 */
export async function getLearningStats(userId: string) {
  return await triggerStorage.getStats(userId);
}

/**
 * Batch learn from conversation history
 * Useful for initial import or migration
 */
export async function batchLearn(
  userId: string,
  examples: Array<{
    message: string;
    skillId: string;
    skillName: string;
  }>,
  config: Partial<LearningConfig> = {}
): Promise<TriggerLearningEvent[]> {
  const events: TriggerLearningEvent[] = [];

  for (const example of examples) {
    const event = await learnTrigger(
      userId,
      example.message,
      example.skillId,
      example.skillName,
      config
    );
    if (event) {
      events.push(event);
    }
  }

  return events;
}
