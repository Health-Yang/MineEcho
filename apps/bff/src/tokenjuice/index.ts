/**
 * TokenLess - Context Compression for MineEcho BFF
 *
 * Internal module paths keep the legacy tokenjuice name for compatibility.
 * MIT License - Copyright (c) 2026 Vincent Koc
 *
 * Intelligent tool output compaction engine that reduces verbose
 * tool output before it enters the LLM context window.
 *
 * Features:
 * - 96+ built-in rules for common tools (git, npm, cargo, docker, etc.)
 * - Three-layer rule overlay (builtin, user, project)
 * - Pattern-based filtering and transformation
 * - Up to 80% token reduction
 */

export * from './types/index.js';
export * from './text/index.js';
export * from './rules/loader.js';
export * from './rules/compiler.js';
export * from './classify/index.js';
export * from './reduce/index.js';
export * from './metrics.js';

// ---------------------------------------------------------------------------
// Quick Access Functions
// ---------------------------------------------------------------------------

import { loadRules } from './rules/loader.js';
import { reduceExecutionWithRules } from './reduce/index.js';
import { recordTokenJuiceMetric } from './metrics.js';
import type { ToolExecutionInput, CompiledRule, ReduceOptions, CompactResult } from './types/index.js';

// Global rules cache
let cachedRules: CompiledRule[] | null = null;

/**
 * Get or load the compiled rules.
 */
export async function getRules(): Promise<CompiledRule[]> {
  if (!cachedRules) {
    cachedRules = await loadRules();
    console.log(`[tokenjuice] Loaded ${cachedRules.length} rules`);
  }
  return cachedRules;
}

/**
 * Reduce tool output synchronously (uses cached rules).
 */
export async function compactToolOutput(
  input: ToolExecutionInput,
  options: ReduceOptions = {}
): Promise<CompactResult> {
  const rules = await getRules();
  const result = reduceExecutionWithRules(input, rules, options);
  recordTokenJuiceMetric({
    family: result.classification.family,
    reducer: result.classification.matchedReducer,
    rawChars: result.stats.rawChars,
    reducedChars: result.stats.reducedChars,
    ratio: result.stats.ratio,
  });
  return result;
}

/**
 * Synchronous version (must be called after initial rules load).
 */
export function compactToolOutputSync(
  input: ToolExecutionInput,
  options: ReduceOptions = {}
): CompactResult {
  if (!cachedRules) {
    throw new Error('[tokenjuice] Rules not loaded. Call getRules() first.');
  }
  const result = reduceExecutionWithRules(input, cachedRules, options);
  recordTokenJuiceMetric({
    family: result.classification.family,
    reducer: result.classification.matchedReducer,
    rawChars: result.stats.rawChars,
    reducedChars: result.stats.reducedChars,
    ratio: result.stats.ratio,
  });
  return result;
}

/**
 * Initialize rules cache (call at startup).
 */
export async function initializeTokenJuice(options: { cwd?: string } = {}): Promise<void> {
  const rules = await loadRules({
    projectDir: options.cwd ? `${options.cwd}/.tokenjuice/rules` : undefined,
  });
  cachedRules = rules;
  console.log(`[tokenjuice] Initialized with ${rules.length} rules`);
}

/**
 * Clear rules cache (for testing).
 */
export function clearRulesCache(): void {
  cachedRules = null;
}

/**
 * Check if TokenLess is initialized.
 */
export function isInitialized(): boolean {
  return cachedRules !== null;
}

// ---------------------------------------------------------------------------
// Convenience Functions
// ---------------------------------------------------------------------------

/**
 * Compact bash command output.
 */
export function compactBashOutput(
  command: string,
  stdout: string,
  stderr?: string,
  exitCode?: number,
  options?: ReduceOptions
): Promise<CompactResult> {
  return compactToolOutput({
    toolName: 'bash',
    command,
    stdout,
    stderr,
    exitCode,
    argv: command.split(/\s+/),
  }, options);
}

/**
 * Compact git command output.
 */
export function compactGitOutput(
  args: string[],
  stdout: string,
  stderr?: string,
  exitCode?: number,
  options?: ReduceOptions
): Promise<CompactResult> {
  return compactToolOutput({
    toolName: 'git',
    command: `git ${args.join(' ')}`,
    stdout,
    stderr,
    exitCode,
    argv: ['git', ...args],
  }, options);
}
