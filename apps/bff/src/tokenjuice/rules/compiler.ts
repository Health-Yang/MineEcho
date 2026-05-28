/**
 * TokenLess - Rule Compiler
 *
 * Compiles JSON rules into optimized RegExp patterns.
 * MIT License - Copyright (c) 2026 Vincent Koc
 */

import type {
  JsonRule,
  CompiledRule,
  CompiledParts,
  CompiledCounter,
  CompiledOutputMatch,
  RuleOrigin,
} from '../types/index.js';

import { getOrCompile } from '../text/index.js';

// ---------------------------------------------------------------------------
// Rule Compiler
// ---------------------------------------------------------------------------

/**
 * Compile a single JSON rule into a CompiledRule.
 * Pre-builds all regex patterns for efficient matching.
 */
export function compileRule(
  rule: JsonRule,
  source: RuleOrigin,
  path: string
): CompiledRule {
  const compiled: CompiledParts = {
    skipPatterns: [],
    keepPatterns: [],
    counters: [],
    outputMatches: [],
  };

  // Compile skip patterns
  if (rule.filters?.skipPatterns) {
    compiled.skipPatterns = rule.filters.skipPatterns.map(p => getOrCompile(p));
  }

  // Compile keep patterns
  if (rule.filters?.keepPatterns) {
    compiled.keepPatterns = rule.filters.keepPatterns.map(p => getOrCompile(p));
  }

  // Compile counters
  if (rule.counters) {
    compiled.counters = rule.counters.map(counter => ({
      name: counter.name,
      pattern: getOrCompile(counter.pattern),
    }));
  }

  // Compile output matches
  if (rule.matchOutput) {
    compiled.outputMatches = rule.matchOutput.map(om => ({
      pattern: getOrCompile(om.pattern),
      message: om.message,
    }));
  }

  return {
    rule,
    source,
    path,
    compiled,
  };
}

/**
 * Validate a JSON rule for required fields and basic correctness.
 */
export function validateRule(rule: unknown): rule is JsonRule {
  if (typeof rule !== 'object' || rule === null) {
    return false;
  }

  const r = rule as Record<string, unknown>;

  // Required fields
  if (typeof r.id !== 'string' || r.id.trim() === '') {
    console.warn('[tokenjuice] Rule missing required field: id');
    return false;
  }
  if (typeof r.family !== 'string' || r.family.trim() === '') {
    console.warn(`[tokenjuice] Rule ${r.id} missing required field: family`);
    return false;
  }
  if (typeof r.match !== 'object' || r.match === null) {
    console.warn(`[tokenjuice] Rule ${r.id} missing required field: match`);
    return false;
  }

  // Validate patterns
  if (r.filters) {
    const filters = r.filters as Record<string, unknown>;
    if (filters.skipPatterns && !Array.isArray(filters.skipPatterns)) {
      console.warn(`[tokenjuice] Rule ${r.id}: skipPatterns must be an array`);
      return false;
    }
    if (filters.keepPatterns && !Array.isArray(filters.keepPatterns)) {
      console.warn(`[tokenjuice] Rule ${r.id}: keepPatterns must be an array`);
      return false;
    }
  }

  // Validate counters
  if (r.counters && !Array.isArray(r.counters)) {
    console.warn(`[tokenjuice] Rule ${r.id}: counters must be an array`);
    return false;
  }

  return true;
}

/**
 * Validate all regex patterns in a rule.
 * Returns list of invalid pattern strings.
 */
export function validatePatterns(rule: JsonRule): string[] {
  const invalid: string[] = [];

  // Test skip patterns
  if (rule.filters?.skipPatterns) {
    for (const pattern of rule.filters.skipPatterns) {
      try {
        new RegExp(pattern, 'u');
      } catch {
        invalid.push(`skipPattern: ${pattern}`);
      }
    }
  }

  // Test keep patterns
  if (rule.filters?.keepPatterns) {
    for (const pattern of rule.filters.keepPatterns) {
      try {
        new RegExp(pattern, 'u');
      } catch {
        invalid.push(`keepPattern: ${pattern}`);
      }
    }
  }

  // Test counter patterns
  if (rule.counters) {
    for (const counter of rule.counters) {
      try {
        new RegExp(counter.pattern, 'u');
      } catch {
        invalid.push(`counter (${counter.name}): ${counter.pattern}`);
      }
    }
  }

  // Test output match patterns
  if (rule.matchOutput) {
    for (const om of rule.matchOutput) {
      try {
        new RegExp(om.pattern, 'u');
      } catch {
        invalid.push(`matchOutput: ${om.pattern}`);
      }
    }
  }

  return invalid;
}
