/**
 * Trigger Matcher
 *
 * Matches user input to learned triggers with confidence scoring.
 * Used before sending messages to Gateway to inject skill context.
 *
 * V3 更新：触发词不再从 triggerStorage（用户学习）读取，
 * 改为从 SKILL.md frontmatter 中的 triggers 列表读取。
 * 旧的 triggerStorage / learner 代码保留作为兼容，但不再使用。
 */

import type { PersonalizedTrigger, TriggerMatchResult } from './types.js';
import { triggerStorage } from './storage.js';
import { normalizeTrigger } from './learner.js';
import { getSkillTriggerEntries, matchSkillTrigger, type SkillTriggerEntry } from './skill-loader.js';
import type { SkillRegistrySnapshot } from '../skills/registry.js';
import { routeSkillQuery } from '../skills/router.js';

// Minimum confidence threshold for auto-applying triggers
const DEFAULT_MATCH_THRESHOLD = 0.7;

// Fuzzy matching options
interface MatchOptions {
  threshold?: number;
  exactMatchBoost?: number;
  prefixMatchBoost?: number;
  containsMatchBoost?: number;
  contextMatchBoost?: number;
}

interface PreferredSkillSelection {
  skillId?: string;
  skillName?: string | null;
}

const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  threshold: DEFAULT_MATCH_THRESHOLD,
  exactMatchBoost: 1.0,
  prefixMatchBoost: 0.9,
  containsMatchBoost: 0.8,
  contextMatchBoost: 0.85,
};

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Create matrix
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Check if message matches a context pattern
 * Pattern format: "查一下*股票" or "帮我*"
 */
function matchesContextPattern(message: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return message.includes(pattern);
  }

  const parts = pattern.split('*');
  let remainingMessage = message;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    const index = remainingMessage.indexOf(part);
    if (index === -1) return false;

    // For parts after the first, ensure they're in order
    if (i > 0) {
      remainingMessage = remainingMessage.slice(index + part.length);
    } else {
      // First part must be at the start or have some flexibility
      if (index > 5) return false; // Too far from start
    }
  }

  return true;
}

/**
 * Match user input against all learned triggers for a user
 *
 * V3: 优先从 SKILL.md frontmatter 的 triggers 匹配，
 * 若未匹配到，则回退到旧的 triggerStorage（兼容模式）。
 */
export async function matchTrigger(
  _userId: string,
  message: string,
  options: MatchOptions = {}
): Promise<TriggerMatchResult | null> {
  const opts = { ...DEFAULT_MATCH_OPTIONS, ...options };

  // V3: 优先从 SKILL.md 触发词索引匹配
  const skillMatch = matchSkillTrigger(message);
  if (skillMatch && skillMatch.confidence >= (opts.threshold ?? DEFAULT_MATCH_THRESHOLD)) {
    // 构造兼容的 TriggerMatchResult
    const trigger: PersonalizedTrigger = {
      id: `skill_${skillMatch.skillId}`,
      userId: _userId,
      triggerPhrase: skillMatch.matchedTrigger,
      normalizedTrigger: normalizeTrigger(skillMatch.matchedTrigger),
      skillId: skillMatch.skillId,
      skillName: skillMatch.skillName,
      confidence: skillMatch.confidence,
      usageCount: 1,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };

    return {
      trigger,
      matchedPhrase: skillMatch.matchedTrigger,
      confidence: skillMatch.confidence,
      matchType: skillMatch.confidence >= 0.9 ? 'exact' : 'contains',
    };
  }

  // 回退：旧的 triggerStorage（兼容模式，通常为空）
  const normalizedMessage = normalizeTrigger(message);
  const triggers = await triggerStorage.getByUser(_userId);
  if (triggers.length === 0) return null;

  let bestMatch: TriggerMatchResult | null = null;
  let bestScore = 0;

  for (const trigger of triggers) {
    const result = evaluateMatch(trigger, normalizedMessage, message, opts);
    if (result && result.confidence > bestScore) {
      bestScore = result.confidence;
      bestMatch = result;
    }
  }

  // Only return if above threshold
  if (bestMatch && bestMatch.confidence >= (opts.threshold ?? DEFAULT_MATCH_THRESHOLD)) {
    return bestMatch;
  }

  return null;
}

/**
 * Evaluate how well a trigger matches the message
 */
function evaluateMatch(
  trigger: PersonalizedTrigger,
  normalizedMessage: string,
  originalMessage: string,
  opts: MatchOptions
): TriggerMatchResult | null {
  const normalizedTrigger = trigger.normalizedTrigger;

  // 1. Exact match (highest priority)
  if (normalizedMessage === normalizedTrigger) {
    return {
      trigger,
      matchedPhrase: trigger.triggerPhrase,
      confidence: Math.min(trigger.confidence * (opts.exactMatchBoost ?? 1.0), 0.99),
      matchType: 'exact',
    };
  }

  // 2. Prefix match (message starts with trigger)
  if (normalizedMessage.startsWith(normalizedTrigger)) {
    const prefixConfidence = trigger.confidence * (opts.prefixMatchBoost ?? 0.9);
    return {
      trigger,
      matchedPhrase: trigger.triggerPhrase,
      confidence: prefixConfidence,
      matchType: 'contains',
    };
  }

  // 3. Contains match (trigger is in the middle of message)
  if (normalizedMessage.includes(normalizedTrigger)) {
    const containsConfidence = trigger.confidence * (opts.containsMatchBoost ?? 0.8);
    return {
      trigger,
      matchedPhrase: trigger.triggerPhrase,
      confidence: containsConfidence,
      matchType: 'contains',
    };
  }

  // 4. Context pattern match
  if (trigger.contextPattern && matchesContextPattern(originalMessage, trigger.contextPattern)) {
    const contextConfidence = trigger.confidence * (opts.contextMatchBoost ?? 0.85);
    return {
      trigger,
      matchedPhrase: trigger.triggerPhrase,
      confidence: contextConfidence,
      matchType: 'pattern',
    };
  }

  // 5. Fuzzy match (for typos and variations)
  const similarity = calculateSimilarity(normalizedMessage, normalizedTrigger);
  if (similarity >= 0.7) {
    const fuzzyConfidence = trigger.confidence * similarity * 0.9;
    return {
      trigger,
      matchedPhrase: trigger.triggerPhrase,
      confidence: fuzzyConfidence,
      matchType: 'contains',
    };
  }

  return null;
}

/**
 * Find all potential matches (not just the best one)
 */
export async function findAllMatches(
  userId: string,
  message: string,
  options: MatchOptions = {}
): Promise<TriggerMatchResult[]> {
  const opts = { ...DEFAULT_MATCH_OPTIONS, ...options };
  const normalizedMessage = normalizeTrigger(message);

  const triggers = await triggerStorage.getByUser(userId);
  const matches: TriggerMatchResult[] = [];

  for (const trigger of triggers) {
    const result = evaluateMatch(trigger, normalizedMessage, message, opts);
    if (result && result.confidence >= (opts.threshold ?? 0.5)) {
      matches.push(result);
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if a message should trigger skill injection
 * Returns the skill ID if a high-confidence match is found
 */
export async function shouldInjectSkill(
  userId: string,
  message: string,
  threshold: number = DEFAULT_MATCH_THRESHOLD
): Promise<{ skillId: string; skillName: string; confidence: number } | null> {
  const match = await matchTrigger(userId, message, { threshold });
  if (!match) return null;

  return {
    skillId: match.trigger.skillId,
    skillName: match.trigger.skillName,
    confidence: match.confidence,
  };
}

/**
 * Inject skill context into a message
 * Example: "今天股票怎么样？" → "[使用技能:股票查询] 今天股票怎么样？"
 */
export function injectSkillContext(
  message: string,
  skillName: string,
  confidence: number
): string {
  const confidencePercent = Math.round(confidence * 100);
  return `[使用技能:${skillName}](置信度:${confidencePercent}%) ${message}`;
}

export function buildPreferredSkillMatch(
  userId: string,
  preferredSkill: PreferredSkillSelection | undefined,
  entries: SkillTriggerEntry[] = getSkillTriggerEntries()
): TriggerMatchResult | null {
  const skillId = preferredSkill?.skillId?.trim();
  if (!skillId) return null;

  const entry = entries.find((item) => item.skillId === skillId);
  if (!entry) return null;

  const skillName = entry.name || preferredSkill?.skillName || skillId;
  const triggerPhrase = entry.triggers[0] || skillName;

  const trigger: PersonalizedTrigger = {
    id: `preferred_${skillId}`,
    userId,
    triggerPhrase,
    normalizedTrigger: normalizeTrigger(triggerPhrase),
    skillId,
    skillName,
    confidence: 1,
    usageCount: 1,
    lastUsed: Date.now(),
    createdAt: Date.now(),
  };

  return {
    trigger,
    matchedPhrase: triggerPhrase,
    confidence: 1,
    matchType: 'exact',
  };
}

export function buildRegistryRouteMatch(
  userId: string,
  message: string,
  registry: SkillRegistrySnapshot | undefined,
  threshold: number = DEFAULT_MATCH_THRESHOLD,
  mode?: string,
): TriggerMatchResult | null {
  if (!registry) return null;

  const route = routeSkillQuery(message, registry, { limit: 1, mode });
  const candidate = route.candidates[0];
  if (!candidate || !route.selectedSkillId || candidate.score < threshold) return null;

  const triggerPhrase =
    candidate.evidence.find((item) => item.type === "trigger")?.value ||
    candidate.evidence[0]?.value ||
    candidate.skillName;

  const trigger: PersonalizedTrigger = {
    id: `registry_${candidate.skillId}`,
    userId,
    triggerPhrase,
    normalizedTrigger: normalizeTrigger(triggerPhrase),
    skillId: candidate.skillId,
    skillName: candidate.skillName,
    confidence: candidate.score,
    usageCount: 1,
    lastUsed: Date.now(),
    createdAt: Date.now(),
  };

  return {
    trigger,
    matchedPhrase: triggerPhrase,
    confidence: candidate.score,
    matchType: candidate.evidence[0]?.type === "description" ? "contains" : "exact",
  };
}

/**
 * Process a message for trigger matching and skill injection
 * This is the main entry point for chat integration
 */
export async function processMessageForTriggers(
  userId: string,
  message: string,
  options: {
    autoInject?: boolean;
    threshold?: number;
    preferredSkill?: PreferredSkillSelection;
    registry?: SkillRegistrySnapshot;
    mode?: string;
  } = {}
): Promise<{
  originalMessage: string;
  processedMessage: string;
  matchedTrigger: TriggerMatchResult | null;
  skillInjected: boolean;
}> {
  const { autoInject = true, threshold = DEFAULT_MATCH_THRESHOLD, preferredSkill, registry, mode } = options;

  const preferredMatch = buildPreferredSkillMatch(userId, preferredSkill);
  const match =
    preferredMatch ||
    await matchTrigger(userId, message, { threshold }) ||
    buildRegistryRouteMatch(userId, message, registry, threshold, mode);

  if (match && autoInject) {
    const processedMessage = injectSkillContext(
      message,
      match.trigger.skillName,
      match.confidence
    );

    return {
      originalMessage: message,
      processedMessage,
      matchedTrigger: match,
      skillInjected: true,
    };
  }

  return {
    originalMessage: message,
    processedMessage: message,
    matchedTrigger: match,
    skillInjected: false,
  };
}

/**
 * Get match statistics for debugging
 */
export async function getMatchStats(userId: string): Promise<{
  totalTriggers: number;
  highConfidenceTriggers: number;
  averageConfidence: number;
  topTriggers: Array<{ phrase: string; confidence: number; skillName: string }>;
}> {
  const triggers = await triggerStorage.getByUser(userId);

  if (triggers.length === 0) {
    return {
      totalTriggers: 0,
      highConfidenceTriggers: 0,
      averageConfidence: 0,
      topTriggers: [],
    };
  }

  const sorted = triggers.sort((a, b) => b.confidence - a.confidence);
  const highConfidence = triggers.filter(t => t.confidence >= 0.7);
  const averageConfidence = triggers.reduce((sum, t) => sum + t.confidence, 0) / triggers.length;

  return {
    totalTriggers: triggers.length,
    highConfidenceTriggers: highConfidence.length,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    topTriggers: sorted.slice(0, 5).map(t => ({
      phrase: t.triggerPhrase,
      confidence: Math.round(t.confidence * 100) / 100,
      skillName: t.skillName,
    })),
  };
}
