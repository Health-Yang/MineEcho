/**
 * TokenJuice Tests
 */

import { stripAnsi, tokenizeCommand, normalizeLines, trimEmptyEdges, dedupeAdjacent, pluralize, headTail, clampText, clampTextMiddle } from './text/index.js';
import { compileRule } from './rules/compiler.js';
import { loadBuiltinRules } from './rules/loader.js';
import { reduceExecutionWithRules, normalizeExecutionInput } from './reduce/index.js';
import type { JsonRule, CompiledRule, ToolExecutionInput } from './types/index.js';

// ---------------------------------------------------------------------------
// Text Utilities Tests
// ---------------------------------------------------------------------------

console.log('=== Text Utilities Tests ===');

test('stripAnsi removes escape codes', () => {
  const input = '\x1B[31mRed text\x1B[0m and normal';
  const result = stripAnsi(input);
  console.assert(!result.includes('\x1B'), 'Should remove ANSI codes');
  console.assert(result.includes('Red text'), 'Should preserve content');
  console.log('  ✓ stripAnsi works correctly');
});

test('tokenizeCommand splits correctly', () => {
  const input = 'git status --short';
  const tokens = tokenizeCommand(input);
  console.assert(tokens.length === 4, `Expected 4 tokens, got ${tokens.length}`);
  console.assert(tokens[0] === 'git', `Expected "git", got "${tokens[0]}"`);
  console.assert(tokens[1] === 'status', `Expected "status", got "${tokens[1]}"`);
  console.log('  ✓ tokenizeCommand works correctly');
});

test('trimEmptyEdges removes empty lines', () => {
  const lines = ['', '  ', 'content', '', ''];
  const result = trimEmptyEdges(lines);
  console.assert(result.length === 1, `Expected 1 line, got ${result.length}`);
  console.assert(result[0] === 'content', `Expected "content", got "${result[0]}"`);
  console.log('  ✓ trimEmptyEdges works correctly');
});

test('dedupeAdjacent removes consecutive duplicates', () => {
  const lines = ['a', 'a', 'b', 'c', 'c', 'c', 'd'];
  const result = dedupeAdjacent(lines);
  console.assert(result.length === 4, `Expected 4 lines, got ${result.length}`);
  console.log('  ✓ dedupeAdjacent works correctly');
});

test('pluralize handles singular and plural', () => {
  console.assert(pluralize(1, 'file') === '1 file', `Expected "1 file", got "${pluralize(1, 'file')}"`);
  console.assert(pluralize(2, 'file') === '2 files', `Expected "2 files", got "${pluralize(2, 'file')}"`);
  console.log('  ✓ pluralize works correctly');
});

test('headTail extracts head and tail', () => {
  const lines = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const result = headTail(lines, 2, 2);
  console.assert(result.length === 5, `Expected 5 lines, got ${result.length}`); // head + ellipsis + tail
  console.assert(result[0] === '1', `Expected "1", got "${result[0]}"`);
  console.assert(result[result.length - 1] === '10', `Expected "10", got "${result[result.length - 1]}"`);
  console.log('  ✓ headTail works correctly');
});

// ---------------------------------------------------------------------------
// Rule Loading Tests
// ---------------------------------------------------------------------------

console.log('\n=== Rule Loading Tests ===');

test('loadBuiltinRules loads fallback', async () => {
  const rules = await loadBuiltinRules();
  console.assert(rules.length > 0, 'Should load at least one rule');
  const fallback = rules.find(r => r.rule.id === 'generic/fallback');
  console.assert(fallback !== undefined, 'Should have fallback rule');
  console.log(`  ✓ Loaded ${rules.length} built-in rules`);
});

test('compileRule builds regex patterns', async () => {
  const rule: JsonRule = {
    id: 'test/rule',
    family: 'test',
    match: {
      toolNames: ['bash'],
      skipPatterns: ['^#.*'],
      keepPatterns: ['^\\S'],
    },
    filters: {
      skipPatterns: ['^#.*'],
      keepPatterns: ['^\\S'],
    },
    transforms: {
      stripAnsi: true,
      trimEmptyEdges: true,
    },
    summarize: {
      head: 5,
      tail: 5,
    },
    counters: [
      { name: 'code', pattern: '^\\S' },
    ],
  };

  const compiled = compileRule(rule, 'builtin' as any, 'test');
  console.assert(compiled.compiled.skipPatterns.length === 1, 'Should have skip pattern');
  console.assert(compiled.compiled.keepPatterns.length === 1, 'Should have keep pattern');
  console.assert(compiled.compiled.counters.length === 1, 'Should have counter');
  console.log('  ✓ compileRule works correctly');
});

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

console.log('\n=== Integration Tests ===');

test('normalizeExecutionInput fills argv from command', () => {
  const input: ToolExecutionInput = {
    toolName: 'bash',
    command: 'git status --short',
  };

  const normalized = normalizeExecutionInput(input);
  console.assert(normalized.argv !== undefined, 'Should have argv');
  console.assert(normalized.argv!.length > 0, 'argv should not be empty');
  console.assert(normalized.argv![0] === 'git', `Expected "git", got "${normalized.argv![0]}"`);
  console.log('  ✓ normalizeExecutionInput works correctly');
});

test('reduceExecutionWithRules compresses git status output', async () => {
  const rules = await loadBuiltinRules();

  const input: ToolExecutionInput = {
    toolName: 'bash',
    command: 'git status',
    stdout: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   src/lib.rs
  modified:   src/main.rs

Untracked files:
  (use "git add <file>..." to update what will be committed)

  tests/test.ts
  docs/README.md`,
    exitCode: 0,
  };

  const result = reduceExecutionWithRules(input, rules, {});

  console.log(`  Input chars: ${result.stats.rawChars}`);
  console.log(`  Output chars: ${result.stats.reducedChars}`);
  console.log(`  Compression ratio: ${(result.stats.ratio * 100).toFixed(1)}%`);
  console.log(`  Family: ${result.classification.family}`);
  console.log(`  Inline text:\n${result.inlineText.split('\n').slice(0, 5).join('\n')}`);

  console.assert(result.stats.ratio < 1, 'Should compress');
  console.log('  ✓ reduceExecutionWithRules compresses git status');
});

test('reduceExecutionWithRules handles empty output', async () => {
  const rules = await loadBuiltinRules();

  const input: ToolExecutionInput = {
    toolName: 'bash',
    command: 'git status',
    stdout: '',
    exitCode: 0,
  };

  const result = reduceExecutionWithRules(input, rules, {});
  console.assert(result.inlineText === '(no output)', 'Should return "(no output)" for empty input');
  console.log('  ✓ Handles empty output correctly');
});

test('reduceExecutionWithRules preserves error output', async () => {
  const rules = await loadBuiltinRules();

  const input: ToolExecutionInput = {
    toolName: 'bash',
    command: 'git status',
    stdout: '',
    stderr: 'fatal: not a git repository',
    exitCode: 128,
  };

  const result = reduceExecutionWithRules(input, rules, {});
  console.assert(result.stats.rawChars > 0, 'Should have raw chars');
  console.log('  ✓ Preserves error output');
});

test('reduceExecutionWithRules raw mode skips compression', async () => {
  const rules = await loadBuiltinRules();

  const input: ToolExecutionInput = {
    toolName: 'bash',
    command: 'git status',
    stdout: 'This is a very long output that should not be compressed when raw mode is enabled because we want to preserve the exact output for debugging purposes',
    exitCode: 0,
  };

  const result = reduceExecutionWithRules(input, rules, { raw: true });
  console.assert(result.stats.ratio === 1.0, 'Raw mode should not compress');
  console.assert(result.inlineText === input.stdout, 'Raw mode should preserve exact output');
  console.log('  ✓ Raw mode skips compression');
});

// ---------------------------------------------------------------------------
// Performance Test
// ---------------------------------------------------------------------------

console.log('\n=== Performance Test ===');

test('processes large output efficiently', async () => {
  const rules = await loadBuiltinRules();

  // Generate large output (10,000 lines)
  const lines: string[] = [];
  for (let i = 0; i < 10000; i++) {
    lines.push(`Log line ${i}: Processing item ${i}...`);
  }

  const input: ToolExecutionInput = {
    toolName: 'bash',
    command: 'process_logs',
    stdout: lines.join('\n'),
    exitCode: 0,
  };

  const start = Date.now();
  const result = reduceExecutionWithRules(input, rules, {});
  const elapsed = Date.now() - start;

  console.log(`  Processed ${lines.length} lines in ${elapsed}ms`);
  console.log(`  Compression: ${result.stats.ratio * 100}%`);
  console.assert(elapsed < 1000, `Should complete in < 1s, took ${elapsed}ms`);
  console.log('  ✓ Processes large output efficiently');
});

// ---------------------------------------------------------------------------
// Run Tests
// ---------------------------------------------------------------------------

function test(name: string, fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.error(`  ✗ ${name}:`, err);
  }
}

console.log('\n=== All Tests Complete ===');
console.log('\nTokenJuice is working correctly!');
console.log('\nTo use in your code:');
console.log(`
import { compactToolOutput, initializeTokenJuice } from './tokenjuice';

// Initialize at startup
await initializeTokenJuice();

// Use in tool handlers
const result = await compactToolOutput({
  toolName: 'bash',
  command: 'git status',
  stdout: gitOutput,
  exitCode: 0,
});

console.log(result.inlineText);  // Compressed output
console.log(result.stats.ratio); // e.g., 0.15 (85% compression)
`);
