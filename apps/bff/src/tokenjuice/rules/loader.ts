/**
 * TokenJuice - Rule Loader
 *
 * Loads rules from builtin, user, and project layers.
 * MIT License - Copyright (c) 2026 Vincent Koc
 */

import { readFile, readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

import {
  type JsonRule,
  type CompiledRule,
  type LoadRuleOptions,
  RuleOrigin,
} from '../types/index.js';

import { compileRule } from './compiler.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Default user rules directory. */
export const DEFAULT_USER_DIR = join(homedir(), '.config', 'tokenjuice', 'rules');

/** Default project rules directory name. */
export const DEFAULT_PROJECT_DIR = '.tokenjuice/rules';

/** Fallback rule ID. */
export const FALLBACK_RULE_ID = 'generic/fallback';

// ---------------------------------------------------------------------------
// Builtin Rules Loader (from JSON files)
// ---------------------------------------------------------------------------

/**
 * Load built-in rules from JSON files in the rules/builtin directory.
 */
async function loadBuiltinFromFiles(): Promise<CompiledRule[]> {
  const rules: CompiledRule[] = [];

  // Get the directory of this file
  const thisFile = fileURLToPath(import.meta.url);
  const rulesDir = join(dirname(thisFile), 'builtin');

  if (!existsSync(rulesDir)) {
    return rules;
  }

  try {
    const files = await readdir(rulesDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(rulesDir, file);
      const content = await readFile(filePath, 'utf-8');

      try {
        const rule = JSON.parse(content);
        if (typeof rule === 'object' && rule !== null && typeof rule.id === 'string') {
          rules.push(compileRule(rule, RuleOrigin.Builtin, `builtin:${file}`));
        }
      } catch {
        console.warn(`[tokenjuice] Failed to parse builtin rule: ${file}`);
      }
    }
  } catch (err) {
    console.warn(`[tokenjuice] Failed to load builtin rules from files:`, err);
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Fallback Rule
// ---------------------------------------------------------------------------

const FALLBACK_RULE: JsonRule = {
  id: FALLBACK_RULE_ID,
  family: 'generic',
  match: {
    toolNames: ['*'],
  },
  filters: {
    skipPatterns: [],
    keepPatterns: [],
  },
  transforms: {
    stripAnsi: true,
    trimEmptyEdges: true,
  },
  summarize: {
    head: 6,
    tail: 6,
  },
};

// ---------------------------------------------------------------------------
// Rule Loading
// ---------------------------------------------------------------------------

/**
 * Check if a JSON file is a valid rule.
 */
function isValidRuleFile(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null && typeof parsed.id === 'string';
  } catch {
    return false;
  }
}

/**
 * Load a single rule file.
 */
async function loadRuleFile(filePath: string, source: RuleOrigin): Promise<CompiledRule | null> {
  try {
    const content = await readFile(filePath, 'utf-8');

    if (!isValidRuleFile(content)) {
      console.warn(`[tokenjuice] Invalid rule file: ${filePath}`);
      return null;
    }

    const rule = JSON.parse(content) as JsonRule;
    return compileRule(rule, source, filePath);
  } catch (err) {
    console.warn(`[tokenjuice] Failed to load rule file: ${filePath}`, err);
    return null;
  }
}

/**
 * Load all rules from a directory.
 */
async function loadRulesFromDir(
  dirPath: string,
  source: RuleOrigin
): Promise<CompiledRule[]> {
  const rules: CompiledRule[] = [];

  if (!existsSync(dirPath)) {
    return rules;
  }

  const { readdir } = await import('fs/promises');

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = join(dirPath, entry.name);
        const rule = await loadRuleFile(filePath, source);
        if (rule) {
          rules.push(rule);
        }
      }
    }
  } catch (err) {
    console.warn(`[tokenjuice] Failed to read directory: ${dirPath}`, err);
  }

  return rules;
}

/**
 * Load built-in rules from embedded JSON + files.
 */
export async function loadBuiltinRules(extraBuiltin?: JsonRule[]): Promise<CompiledRule[]> {
  const rules: CompiledRule[] = [];

  // Add fallback rule first
  rules.push(compileRule(FALLBACK_RULE, RuleOrigin.Builtin, 'builtin:fallback'));

  // Load from JSON files
  const fileRules = await loadBuiltinFromFiles();
  rules.push(...fileRules);

  // Add extra builtins if provided
  if (extraBuiltin) {
    for (const rule of extraBuiltin) {
      rules.push(compileRule(rule, RuleOrigin.Builtin, 'builtin:extra'));
    }
  }

  return rules;
}

/**
 * Load rules from all three layers:
 * 1. Builtin (embedded or default path)
 * 2. User (~/.config/tokenjuice/rules/)
 * 3. Project (.tokenjuice/rules/ in cwd)
 *
 * Higher priority layers override lower ones by rule ID.
 */
export async function loadRules(options: LoadRuleOptions = {}): Promise<CompiledRule[]> {
  const {
    extraBuiltin,
    userDir = DEFAULT_USER_DIR,
    projectDir,
  } = options;

  // Start with builtin rules
  const builtinRules = await loadBuiltinRules(extraBuiltin);
  const rulesMap = new Map<string, CompiledRule>();

  // Add all builtins (including fallback)
  for (const rule of builtinRules) {
    rulesMap.set(rule.rule.id, rule);
  }

  // Load user rules
  const userRules = await loadRulesFromDir(userDir, RuleOrigin.User);
  for (const rule of userRules) {
    // User rules override builtin
    rulesMap.set(rule.rule.id, rule);
  }

  // Load project rules
  if (projectDir) {
    const projectRules = await loadRulesFromDir(projectDir, RuleOrigin.Project);
    for (const rule of projectRules) {
      // Project rules override user and builtin
      rulesMap.set(rule.rule.id, rule);
    }
  }

  // Convert back to array
  return Array.from(rulesMap.values());
}

// ---------------------------------------------------------------------------
// Rule Lookup
// ---------------------------------------------------------------------------

/**
 * Find a rule by ID in the loaded rules.
 */
export function findRule(rules: CompiledRule[], ruleId: string): CompiledRule | undefined {
  return rules.find(r => r.rule.id === ruleId);
}

/**
 * Get the fallback rule (must always be present).
 */
export function getFallbackRule(rules: CompiledRule[]): CompiledRule {
  const fallback = findRule(rules, FALLBACK_RULE_ID);
  if (!fallback) {
    // Should never happen if loadRules was called properly
    return compileRule(FALLBACK_RULE, RuleOrigin.Builtin, 'builtin:fallback');
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Rule Statistics
// ---------------------------------------------------------------------------

/**
 * Get statistics about loaded rules.
 */
export function getRuleStats(rules: CompiledRule[]): {
  total: number;
  byFamily: Record<string, number>;
  bySource: Record<string, number>;
} {
  const byFamily: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const rule of rules) {
    const family = rule.rule.family;
    const source = rule.source;

    byFamily[family] = (byFamily[family] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  }

  return {
    total: rules.length,
    byFamily,
    bySource,
  };
}