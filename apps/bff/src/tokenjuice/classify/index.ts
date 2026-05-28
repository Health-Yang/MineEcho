/**
 * TokenJuice - Rule Classification
 *
 * Classifies tool execution inputs to find the appropriate reduction rule.
 * MIT License - Copyright (c) 2026 Vincent Koc
 */

import type {
  ToolExecutionInput,
  CompiledRule,
  ClassificationResult,
} from '../types/index.js';

import { tokenizeCommand } from '../text/index.js';

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Check if a rule matches the given tool execution input.
 */
function ruleMatchesInput(rule: CompiledRule, input: ToolExecutionInput): boolean {
  const { match } = rule.rule;

  // Check toolNames
  if (match.toolNames && match.toolNames.length > 0) {
    if (!match.toolNames.includes(input.toolName)) {
      return false;
    }
  }

  // Get argv (tokenize from command if not provided)
  let argv = input.argv;
  if (!argv || argv.length === 0) {
    if (input.command) {
      argv = tokenizeCommand(input.command);
    }
  }

  // Check argv0
  if (match.argv0 && match.argv0.length > 0) {
    const argv0 = argv && argv.length > 0 ? argv[0] : '';
    // Match against basename (e.g., "git" matches "git", "/usr/bin/git", "git.exe")
    const basename = argv0.split(/[/\\]/).pop() || '';
    if (!match.argv0.some(cmd => basename === cmd || argv0 === cmd)) {
      return false;
    }
  }

  // Check argvIncludes
  if (match.argvIncludes && match.argvIncludes.length > 0) {
    for (const group of match.argvIncludes) {
      // All strings in group must appear somewhere in argv
      if (!group.every(keyword => argv?.some(arg => arg.includes(keyword)))) {
        return false;
      }
    }
  }

  // Check argvIncludesAny
  if (match.argvIncludesAny && match.argvIncludesAny.length > 0) {
    // At least one group must match (all keywords present in argv)
    const hasMatch = match.argvIncludesAny.some(group =>
      group.every(keyword => argv?.some(arg => arg.includes(keyword)))
    );
    if (!hasMatch) {
      return false;
    }
  }

  // Check commandIncludes
  if (match.commandIncludes && match.commandIncludes.length > 0) {
    const command = input.command || '';
    if (!match.commandIncludes.every(keyword => command.includes(keyword))) {
      return false;
    }
  }

  // Check commandIncludesAny
  if (match.commandIncludesAny && match.commandIncludesAny.length > 0) {
    const command = input.command || '';
    if (!match.commandIncludesAny.some(keyword => command.includes(keyword))) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate match confidence (0-1).
 */
function calculateConfidence(rule: CompiledRule, input: ToolExecutionInput): number {
  let score = 0;
  const { match } = rule.rule;

  // Exact toolName match is a strong signal
  if (match.toolNames?.includes(input.toolName)) {
    score += 0.4;
  }

  // argv0 match is a strong signal
  if (match.argv0 && match.argv0.length > 0) {
    const argv = (input.argv && input.argv.length > 0) ? input.argv : tokenizeCommand(input.command || '');
    const argv0 = (argv && argv.length > 0) ? argv[0].split(/[/\\]/).pop() || '' : '';
    if (argv0 && match.argv0.some(cmd => argv0 === cmd)) {
      score += 0.3;
    }
  }

  // Specific match criteria are more reliable than general ones
  if (match.argvIncludes && match.argvIncludes.length > 0) {
    score += 0.2;
  }

  if (match.commandIncludes && match.commandIncludes.length > 0) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Classify a tool execution input and find the best matching rule.
 *
 * @param input The tool execution input to classify
 * @param rules The compiled rules to match against
 * @param forceClassifier Optional rule ID to force (skip classification)
 */
export function classifyExecution(
  input: ToolExecutionInput,
  rules: CompiledRule[],
  forceClassifier?: string
): ClassificationResult {
  // If classifier is forced, find that specific rule
  if (forceClassifier) {
    const rule = rules.find(r => r.rule.id === forceClassifier);
    if (rule) {
      return {
        family: rule.rule.family,
        confidence: 1.0,
        matchedReducer: rule.rule.id,
      };
    }
    console.warn(`[tokenjuice] Force classifier rule not found: ${forceClassifier}`);
  }

  // Find all matching rules
  const matchingRules: Array<{ rule: CompiledRule; confidence: number }> = [];

  for (const rule of rules) {
    if (ruleMatchesInput(rule, input)) {
      const confidence = calculateConfidence(rule, input);
      matchingRules.push({ rule, confidence });
    }
  }

  // Sort by confidence (descending) then by priority
  matchingRules.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    // Use priority if available (lower is higher priority)
    const priorityA = a.rule.rule.priority ?? 999;
    const priorityB = b.rule.rule.priority ?? 999;
    return priorityA - priorityB;
  });

  if (matchingRules.length === 0) {
    // Return fallback
    const fallback = rules.find(r => r.rule.id === 'generic/fallback');
    return {
      family: fallback?.rule.family ?? 'generic',
      confidence: 0,
      matchedReducer: fallback?.rule.id,
    };
  }

  const best = matchingRules[0];
  return {
    family: best.rule.rule.family,
    confidence: best.confidence,
    matchedReducer: best.rule.rule.id,
  };
}

// ---------------------------------------------------------------------------
// Quick Classification (for hot paths)
// ---------------------------------------------------------------------------

/**
 * Quick check if input looks like git status output.
 */
export function isGitStatus(input: ToolExecutionInput): boolean {
  const argv = (input.argv && input.argv.length > 0) ? input.argv : tokenizeCommand(input.command || '');
  const argv0 = (argv && argv.length > 0) ? argv[0] : '';

  // Check for git command
  const isGit = argv0 === 'git' || argv0.endsWith('/git') || argv0.endsWith('\\git');

  if (!isGit) return false;

  // Check for "status" in args
  return argv.some(arg => arg === 'status');
}

/**
 * Quick check if input looks like a help command.
 */
export function isHelpCommand(input: ToolExecutionInput): boolean {
  const argv = (input.argv && input.argv.length > 0) ? input.argv : tokenizeCommand(input.command || '');

  return argv.includes('--help') ||
    argv.includes('-h') ||
    argv.includes('-?') ||
    argv.includes('help');
}