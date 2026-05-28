/**
 * TokenJuice - Intelligent Tool Output Compaction Engine
 *
 * Ported from the Rust TokenJuice implementation.
 * MIT License - Copyright (c) 2026 Vincent Koc
 *
 * TypeScript Implementation - Core Types
 */

// ---------------------------------------------------------------------------
// Rule origin
// ---------------------------------------------------------------------------

export enum RuleOrigin {
  Builtin = 'builtin',
  User = 'user',
  Project = 'project',
}

// ---------------------------------------------------------------------------
// Rule sub-types
// ---------------------------------------------------------------------------

export interface RuleMatch {
  /** Match when toolName is one of these values. */
  toolNames?: string[];
  /** Match when argv[0] is one of these values. */
  argv0?: string[];
  /** All of these groups must each appear somewhere in argv. */
  argvIncludes?: string[][];
  /** At least one of these groups must appear in argv. */
  argvIncludesAny?: string[][];
  /** All of these strings must appear in command. */
  commandIncludes?: string[];
  /** At least one of these strings must appear in command. */
  commandIncludesAny?: string[];
}

export interface RuleFilters {
  /** Lines matching any pattern are removed. */
  skipPatterns?: string[];
  /** Only lines matching at least one pattern are kept (if any match). */
  keepPatterns?: string[];
}

export interface RuleTransforms {
  stripAnsi?: boolean;
  trimEmptyEdges?: boolean;
  dedupeAdjacent?: boolean;
  prettyPrintJson?: boolean;
}

export interface RuleSummarize {
  head?: number;
  tail?: number;
}

export interface RuleCounter {
  name: string;
  pattern: string;
  /** Regex flags (e.g. "i" for case-insensitive). "u" is always added. */
  flags?: string;
}

export interface RuleOutputMatch {
  pattern: string;
  message: string;
  flags?: string;
}

export interface RuleFailure {
  preserveOnFailure?: boolean;
  head?: number;
  tail?: number;
}

export interface JsonRule {
  id: string;
  family: string;
  description?: string;
  priority?: number;
  /** Message to return when output is empty after filtering. */
  onEmpty?: string;
  matchOutput?: RuleOutputMatch[];
  /** Whether counters run before or after keep-pattern filtering. */
  counterSource?: 'postKeep' | 'preKeep';
  match: RuleMatch;
  filters?: RuleFilters;
  transforms?: RuleTransforms;
  summarize?: RuleSummarize;
  counters?: RuleCounter[];
  failure?: RuleFailure;
}

// ---------------------------------------------------------------------------
// CompiledRule — regex patterns pre-built
// ---------------------------------------------------------------------------

export interface CompiledCounter {
  name: string;
  pattern: RegExp;
}

export interface CompiledOutputMatch {
  pattern: RegExp;
  message: string;
}

export interface CompiledParts {
  skipPatterns: RegExp[];
  keepPatterns: RegExp[];
  counters: CompiledCounter[];
  outputMatches: CompiledOutputMatch[];
}

export interface CompiledRule {
  rule: JsonRule;
  source: RuleOrigin;
  path: string;
  compiled: CompiledParts;
}

// ---------------------------------------------------------------------------
// ToolExecutionInput
// ---------------------------------------------------------------------------

export interface ToolExecutionInput {
  toolName: string;
  toolCallId?: string;
  runId?: string;
  command?: string;
  argv?: string[];
  args?: Record<string, unknown>;
  cwd?: string;
  partial?: boolean;
  stdout?: string;
  stderr?: string;
  combinedText?: string;
  exitCode?: number;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ReduceOptions
// ---------------------------------------------------------------------------

export interface ReduceOptions {
  /** Force a specific rule ID instead of auto-classification. */
  classifier?: string;
  /** Maximum inline character count (default: 1200). */
  maxInlineChars?: number;
  /** Return raw text without reduction. */
  raw?: boolean;
  /** Working directory for project-layer rule discovery. */
  cwd?: string;
}

// ---------------------------------------------------------------------------
// CompactResult
// ---------------------------------------------------------------------------

export interface ReductionStats {
  rawChars: number;
  reducedChars: number;
  ratio: number;
}

export interface ClassificationResult {
  family: string;
  confidence: number;
  matchedReducer?: string;
}

export interface CompactResult {
  /** The compacted text to inline into LLM context. */
  inlineText: string;
  /** A shorter preview (the intermediate summary before clamping). */
  previewText?: string;
  /** Named counts extracted by counters. */
  facts?: Record<string, number>;
  stats: ReductionStats;
  classification: ClassificationResult;
}

// ---------------------------------------------------------------------------
// RuleLoader options
// ---------------------------------------------------------------------------

export interface LoadRuleOptions {
  /** Extra builtin rules to load (in addition to defaults). */
  extraBuiltin?: JsonRule[];
  /** User rules directory path (default: ~/.config/tokenjuice/rules/). */
  userDir?: string;
  /** Project rules directory path (default: .tokenjuice/rules/ in cwd). */
  projectDir?: string;
  /** Pre-compiled regex patterns cache. */
  patternCache?: Map<string, RegExp>;
}
