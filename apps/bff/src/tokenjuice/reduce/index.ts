/**
 * TokenLess - Reduction Pipeline
 *
 * Core compression engine that reduces tool output to LLM-friendly summaries.
 * MIT License - Copyright (c) 2026 Vincent Koc
 */

import type {
  ToolExecutionInput,
  ReduceOptions,
  CompactResult,
  CompiledRule,
  ReductionStats,
  ClassificationResult,
} from '../types/index.js';

import {
  TINY_OUTPUT_MAX_CHARS,
  DEFAULT_MAX_INLINE_CHARS,
  tokenizeCommand,
  normalizeLines,
  stripAnsi,
  trimEmptyEdges,
  dedupeAdjacent,
  countTextChars,
  headTail,
  clampText,
  clampTextMiddle,
  prettyPrintJsonIfPossible,
  pluralize,
  rewriteGitStatusLines,
  formatGhTableLine,
  formatGhJsonRecord,
  compactWhitespace,
} from '../text/index.js';

import { classifyExecution } from '../classify/index.js';

import { findRule, getFallbackRule } from '../rules/loader.js';

// ---------------------------------------------------------------------------
// Apply Rule Result
// ---------------------------------------------------------------------------

interface ApplyResult {
  summary: string;
  facts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Build Raw Text
// ---------------------------------------------------------------------------

/**
 * Build combined raw text from stdout/stderr.
 */
function buildRawText(input: ToolExecutionInput): string {
  if (input.combinedText) {
    return input.combinedText;
  }

  const stdout = input.stdout || '';
  const stderr = input.stderr || '';

  if (stdout) {
    return stderr ? `${stdout}\n${stderr}` : stdout;
  }

  return stderr;
}

// ---------------------------------------------------------------------------
// Normalize Execution Input
// ---------------------------------------------------------------------------

/**
 * Normalize execution input - fill argv from command if needed.
 */
export function normalizeExecutionInput(input: ToolExecutionInput): ToolExecutionInput {
  if (input.argv && input.argv.length > 0) {
    return input;
  }

  if (!input.command) {
    return input;
  }

  const argv = tokenizeCommand(input.command);
  if (argv.length === 0) {
    return input;
  }

  return {
    ...input,
    argv,
  };
}

// ---------------------------------------------------------------------------
// Check for File Content Inspection
// ---------------------------------------------------------------------------

const FILE_TOOLS = ['cat', 'sed', 'head', 'tail', 'nl', 'bat', 'batcat', 'jq', 'yq'];

/**
 * Check if command is a file content inspection tool.
 * These should not be compacted.
 */
export function isFileContentInspectionCommand(input: ToolExecutionInput): boolean {
  const argv = input.argv || tokenizeCommand(input.command || '');

  if (argv.length === 0) {
    return false;
  }

  const argv0 = argv[0].split(/[/\\]/).pop() || '';

  return FILE_TOOLS.includes(argv0);
}

// ---------------------------------------------------------------------------
// Apply Rule
// ---------------------------------------------------------------------------

/**
 * Apply a compiled rule to tool execution input.
 */
function applyRule(
  compiledRule: CompiledRule,
  input: ToolExecutionInput,
  rawText: string
): ApplyResult {
  const rule = compiledRule.rule;
  let text = rawText;
  const facts: Record<string, number> = {};

  // Pretty print JSON if requested
  if (rule.transforms?.prettyPrintJson) {
    text = prettyPrintJsonIfPossible(text);
  }

  let lines = normalizeLines(text);

  // Strip ANSI codes if requested
  if (rule.transforms?.stripAnsi) {
    lines = normalizeLines(stripAnsi(lines.join('\n')));
  }

  // Check outputMatches first (before filtering)
  const trimmedText = trimEmptyEdges(lines).join('\n');
  for (const outputMatch of compiledRule.compiled.outputMatches) {
    if (outputMatch.pattern.test(trimmedText)) {
      return {
        summary: outputMatch.message,
        facts,
      };
    }
  }

  // Apply skip patterns
  if (rule.filters?.skipPatterns && rule.filters.skipPatterns.length > 0) {
    lines = lines.filter(line =>
      !compiledRule.compiled.skipPatterns.some(pattern => pattern.test(line))
    );
  }

  // Keep track of pre-filter lines for counters
  const preKeepLines = [...lines];

  // Apply keep patterns
  if (compiledRule.compiled.keepPatterns.length > 0) {
    const kept = lines.filter(line =>
      compiledRule.compiled.keepPatterns.some(pattern => pattern.test(line))
    );
    if (kept.length > 0) {
      lines = kept;
    }
  }

  // Trim empty edges
  if (rule.transforms?.trimEmptyEdges) {
    lines = trimEmptyEdges(lines);
  }

  // Dedupe adjacent
  if (rule.transforms?.dedupeAdjacent) {
    lines = dedupeAdjacent(lines);
  }

  // Special post-processors
  if (rule.id === 'git/status') {
    lines = rewriteGitStatusLines(lines);
  }

  // Counters
  const counterLines = rule.counterSource === 'preKeep' ? preKeepLines : lines;
  for (const counter of compiledRule.compiled.counters) {
    const count = counterLines.filter(line => counter.pattern.test(line)).length;
    facts[counter.name] = count;
  }

  // Check onEmpty
  if (lines.length === 0) {
    return {
      summary: rule.onEmpty || '(no output)',
      facts,
    };
  }

  // Failure-preserving summarize
  const isFailure = input.exitCode !== undefined && input.exitCode !== 0;
  const preserveOnFailure = rule.failure?.preserveOnFailure ?? false;

  let head = rule.summarize?.head ?? 6;
  let tail = rule.summarize?.tail ?? 6;

  if (isFailure && preserveOnFailure) {
    head = rule.failure?.head ?? head;
    tail = rule.failure?.tail ?? tail;
  }

  const compacted = headTail(lines, head, tail);

  return {
    summary: compacted.join('\n').trim(),
    facts,
  };
}

// ---------------------------------------------------------------------------
// Build Passthrough Text
// ---------------------------------------------------------------------------

/**
 * Build text for passthrough (minimal processing).
 */
function buildPassthroughText(input: ToolExecutionInput, rawText: string): string {
  const stripped = stripAnsi(rawText);
  const normalized = trimEmptyEdges(normalizeLines(stripped)).join('\n').trim();

  if (normalized === '') {
    return '(no output)';
  }

  if (input.exitCode !== undefined && input.exitCode !== 0) {
    return `exit ${input.exitCode}\n${normalized}`;
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// Format Inline Text
// ---------------------------------------------------------------------------

/**
 * Format the final inline text with facts.
 */
function formatInline(
  classification: ClassificationResult,
  input: ToolExecutionInput,
  summary: string,
  facts: Record<string, number>
): string {
  const factParts = Object.entries(facts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => pluralize(count, name))
    .sort();

  const lines: string[] = [];

  // Add exit code if error
  if (input.exitCode !== undefined && input.exitCode !== 0) {
    lines.push(`exit ${input.exitCode}`);
  }

  // Decide whether to include facts
  const includeFacts =
    classification.family === 'search' ||
    (classification.family !== 'git-status' &&
      classification.family !== 'help' &&
      summary.includes('omitted')) ||
    (classification.family === 'test-results' &&
      input.exitCode !== undefined && input.exitCode !== 0);

  if (includeFacts && factParts.length > 0) {
    lines.push(factParts.join(', '));
  }

  if (summary) {
    lines.push(summary);
  }

  return lines.join('\n').trim();
}

// ---------------------------------------------------------------------------
// Select Inline Text
// ---------------------------------------------------------------------------

/**
 * Select the best text representation (passthrough vs compact).
 */
function selectInlineText(
  classification: ClassificationResult,
  input: ToolExecutionInput,
  rawText: string,
  compactText: string,
  maxInlineChars: number
): string {
  // Git status always uses compact
  if (classification.family === 'git-status') {
    return compactText;
  }

  const passthrough = buildPassthroughText(input, rawText);
  const rawChars = countTextChars(stripAnsi(rawText));
  const compactChars = countTextChars(stripAnsi(compactText));

  // Help commands get more space
  const passthroughLimit = classification.family === 'help'
    ? maxInlineChars
    : TINY_OUTPUT_MAX_CHARS;

  // If passthrough is short enough, use it
  if (countTextChars(stripAnsi(passthrough)) > passthroughLimit) {
    return compactText;
  }

  // If raw is short enough and compact didn't help, use raw
  if (rawChars <= maxInlineChars && compactChars >= rawChars) {
    return passthrough;
  }

  // If passthrough is shorter than compact, use it
  if (countTextChars(stripAnsi(passthrough)) <= compactChars) {
    return passthrough;
  }

  return compactText;
}

// ---------------------------------------------------------------------------
// Main Reduction Function
// ---------------------------------------------------------------------------

/**
 * Reduce tool execution output to LLM-friendly format.
 *
 * @param input The tool execution input to reduce
 * @param rules The compiled rules to use
 * @param options Reduction options
 * @returns The compact result
 */
export function reduceExecutionWithRules(
  input: ToolExecutionInput,
  rules: CompiledRule[],
  options: ReduceOptions = {}
): CompactResult {
  const normalizedInput = normalizeExecutionInput(input);
  const rawText = buildRawText(normalizedInput);
  const measuredRawChars = countTextChars(stripAnsi(rawText));

  // Classify
  const classification = classifyExecution(
    normalizedInput,
    rules,
    options.classifier
  );

  // Raw mode - no reduction
  if (options.raw) {
    return {
      inlineText: rawText,
      previewText: undefined,
      facts: undefined,
      stats: {
        rawChars: measuredRawChars,
        reducedChars: measuredRawChars,
        ratio: 1.0,
      },
      classification,
    };
  }

  // File content inspection - never compact
  if (classification.matchedReducer === 'generic/fallback' &&
      isFileContentInspectionCommand(normalizedInput)) {
    return {
      inlineText: rawText,
      previewText: undefined,
      facts: undefined,
      stats: {
        rawChars: measuredRawChars,
        reducedChars: measuredRawChars,
        ratio: 1.0,
      },
      classification,
    };
  }

  // Find matching rule (fall back to generic/fallback)
  let matchedRule = findRule(rules, classification.matchedReducer || '');
  if (!matchedRule) {
    matchedRule = getFallbackRule(rules);
  }

  // Apply rule
  const { summary, facts } = applyRule(matchedRule, normalizedInput, rawText);

  // Format inline text
  const compactText = formatInline(classification, normalizedInput, summary, facts);

  // Select best representation
  const maxInlineChars = options.maxInlineChars ?? DEFAULT_MAX_INLINE_CHARS;
  const selected = selectInlineText(
    classification,
    normalizedInput,
    rawText,
    compactText,
    maxInlineChars
  );

  // Clamp to max chars
  const useMiddleClamp = classification.family === 'help' || selected.includes('\n');
  const inlineText = useMiddleClamp
    ? clampTextMiddle(selected, maxInlineChars)
    : clampText(selected, maxInlineChars);

  // Calculate stats
  const reducedChars = countTextChars(stripAnsi(inlineText));
  const ratio = measuredRawChars === 0
    ? 1.0
    : reducedChars / measuredRawChars;

  return {
    inlineText,
    previewText: summary || undefined,
    facts: Object.keys(facts).length > 0 ? facts : undefined,
    stats: {
      rawChars: measuredRawChars,
      reducedChars,
      ratio,
    },
    classification,
  };
}
