/**
 * TokenJuice - Text Processing Utilities
 *
 * Ported from the Rust TokenJuice text implementation.
 * MIT License - Copyright (c) 2026 Vincent Koc
 */

import { CompiledRule } from '../types/index.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Output shorter than this many chars is returned verbatim (passthrough). */
export const TINY_OUTPUT_MAX_CHARS = 240;

/** Default max inline characters for LLM context. */
export const DEFAULT_MAX_INLINE_CHARS = 1200;

// ---------------------------------------------------------------------------
// ANSI Stripping
// ---------------------------------------------------------------------------

/** Regex to match ANSI escape codes. */
const ANSI_REGEX = /\x1B\[[0-9;]*[a-zA-Z]|\x1B\([A-Z]|\x1B\][^\x07]*\x07/g;

/**
 * Remove ANSI escape codes from text.
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

// ---------------------------------------------------------------------------
// Line Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize lines by splitting on newlines and removing trailing empty lines.
 */
export function normalizeLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/**
 * Trim empty lines from the beginning and end of a line array.
 */
export function trimEmptyEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') {
    start++;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end--;
  }

  return lines.slice(start, end);
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Remove consecutive duplicate lines.
 */
export function dedupeAdjacent(lines: string[]): string[] {
  if (lines.length === 0) return [];

  const result: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] !== lines[i - 1]) {
      result.push(lines[i]);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Character Counting
// ---------------------------------------------------------------------------

/**
 * Count characters in text, excluding ANSI codes.
 */
export function countTextChars(text: string): number {
  return stripAnsi(text).length;
}

// ---------------------------------------------------------------------------
// Head/Tail Summarization
// ---------------------------------------------------------------------------

/**
 * Extract head and tail lines from an array.
 * Used for summarizing long outputs while keeping context.
 */
export function headTail(lines: string[], head: number, tail: number): string[] {
  if (lines.length <= head + tail) {
    return lines;
  }

  const result: string[] = [];

  // Add head
  for (let i = 0; i < Math.min(head, lines.length); i++) {
    result.push(lines[i]);
  }

  // Add ellipsis if there's a gap
  if (head > 0 && head < lines.length - tail) {
    result.push(`... (${lines.length - head - tail} lines omitted) ...`);
  }

  // Add tail
  for (let i = Math.max(lines.length - tail, head); i < lines.length; i++) {
    result.push(lines[i]);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Text Clamping
// ---------------------------------------------------------------------------

/**
 * Clamp text to max characters from the end (for error messages, etc.).
 */
export function clampText(text: string, maxChars: number): string {
  const stripped = stripAnsi(text);
  if (stripped.length <= maxChars) {
    return text;
  }

  let result = '';
  let charCount = 0;
  let inAnsi = false;

  for (let i = 0; i < text.length && charCount < maxChars; i++) {
    const char = text[i];

    if (char === '\x1B') {
      inAnsi = true;
      result += char;
      continue;
    }

    if (inAnsi) {
      result += char;
      if (char === 'm' || char === 'a' || char === 'b' || char === 'c' ||
          char === 'd' || char === 'f' || char === 'g' || char === 'h' ||
          char === 'l' || char === 'n' || char === 'r' || char === 's' ||
          char === 'u') {
        inAnsi = false;
      }
      continue;
    }

    result += char;
    charCount++;
  }

  // Close any open ANSI sequences
  if (inAnsi) {
    result += '\x1B[0m';
  }

  return result + '...';
}

/**
 * Clamp text from middle (keep head and tail, remove middle).
 * Used for help output and multi-line text.
 */
export function clampTextMiddle(text: string, maxChars: number): string {
  const stripped = stripAnsi(text);
  if (stripped.length <= maxChars) {
    return text;
  }

  const lines = normalizeLines(text);
  const linesStripped = normalizeLines(stripped);

  if (lines.length <= 1) {
    return clampText(text, maxChars);
  }

  // Calculate how many lines we can fit
  const avgLineLen = stripped.length / linesStripped.length;
  const maxLines = Math.floor(maxChars / avgLineLen);

  if (linesStripped.length <= maxLines) {
    return text;
  }

  // Keep head and tail
  const headLines = Math.ceil(maxLines / 2);
  const tailLines = Math.floor(maxLines / 2);

  const result: string[] = [];

  // Head
  for (let i = 0; i < headLines && i < lines.length; i++) {
    result.push(lines[i]);
  }

  // Ellipsis
  const omitted = lines.length - headLines - tailLines;
  if (omitted > 0) {
    result.push(`... (${omitted} lines omitted) ...`);
  }

  // Tail
  for (let i = lines.length - tailLines; i < lines.length; i++) {
    result.push(lines[i]);
  }

  return result.join('\n');
}

// ---------------------------------------------------------------------------
// JSON Pretty Print
// ---------------------------------------------------------------------------

/**
 * Try to pretty-print JSON text if it looks like JSON.
 */
export function prettyPrintJsonIfPossible(text: string): string {
  const trimmed = text.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return text;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null) {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    // Not valid JSON, return original
  }

  return text;
}

// ---------------------------------------------------------------------------
// Shell Tokenization
// ---------------------------------------------------------------------------

/**
 * Simple shell tokenizer - splits command string into tokens.
 * Mirrors the Rust tokenizeCommand function.
 */
export function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: string | null = null;
  let escaping = false;

  const trimmed = command.trim();

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }

    if (ch === '\\') {
      escaping = true;
      continue;
    }

    if (quote !== null) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (escaping) {
    current += '\\';
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Pluralization
// ---------------------------------------------------------------------------

/**
 * Simple pluralization helper.
 * "1 modified" vs "2 modified"
 */
export function pluralize(count: number, singular: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${singular}s`;
}

// ---------------------------------------------------------------------------
// Regex Pattern Matching
// ---------------------------------------------------------------------------

const patternCache = new Map<string, RegExp>();

/**
 * Compile a regex pattern with caching.
 * Adds 'u' (unicode) flag by default.
 */
export function getOrCompile(pattern: string): RegExp {
  const cached = patternCache.get(pattern);
  if (cached) {
    return cached;
  }

  try {
    const regex = new RegExp(pattern, 'u');
    patternCache.set(pattern, regex);
    return regex;
  } catch {
    // Return a never-matching regex on invalid pattern
    const fallback = new RegExp('(?!)', 'u');
    patternCache.set(pattern, fallback);
    return fallback;
  }
}

/**
 * Match a pattern against text.
 */
export function regexMatch(pattern: string, text: string): boolean {
  const regex = getOrCompile(pattern);
  return regex.test(text);
}

/**
 * Replace pattern in text.
 */
export function regexReplace(pattern: string, text: string, replacement: string): string {
  const regex = getOrCompile(pattern);
  return text.replace(regex, replacement);
}

/**
 * Extract regex captures from text.
 */
export function regexCaptures(pattern: string, text: string): string[] | null {
  const regex = getOrCompile(pattern);
  const match = regex.exec(text);
  if (!match) return null;

  const captures: string[] = [];
  for (let i = 1; i < match.length; i++) {
    if (match[i] !== undefined) {
      captures.push(match[i]);
    }
  }
  return captures;
}

// ---------------------------------------------------------------------------
// Git Status Formatting
// ---------------------------------------------------------------------------

/**
 * Format a single git status line.
 */
export function rewriteGitStatusLine(line: string): string {
  const trimmed = line.trim();

  if (trimmed === '') {
    return '';
  }

  // Skip branch info lines
  if (trimmed.startsWith('On branch ')) {
    return '';
  }
  if (/^and have \d+ and \d+ different commits each/.test(trimmed)) {
    return '';
  }
  if (/^(no changes added to commit|nothing added to commit but untracked files present)/.test(trimmed)) {
    return '';
  }
  if (/^\(use "git .+"\)$/.test(trimmed) || /^use "git .+" to .+/.test(trimmed)) {
    return '';
  }

  // Rewrite section headers
  if (trimmed === 'Changes not staged for commit:') {
    return 'Changes not staged:';
  }
  if (trimmed === 'Changes to be committed:') {
    return 'Staged changes:';
  }
  if (trimmed === 'Untracked files:') {
    return 'Untracked files:';
  }

  // Parse file status
  if (/^\s*modified:\s+/.test(line)) {
    const path = line.replace(/^\s*modified:\s+/, '').trim();
    return `M: ${path}`;
  }
  if (/^\s*new file:\s+/.test(line)) {
    const path = line.replace(/^\s*new file:\s+/, '').trim();
    return `A: ${path}`;
  }
  if (/^\s*deleted:\s+/.test(line)) {
    const path = line.replace(/^\s*deleted:\s+/, '').trim();
    return `D: ${path}`;
  }
  if (/^\s*renamed:\s+/.test(line)) {
    const path = line.replace(/^\s*renamed:\s+/, '').trim();
    return `R: ${path}`;
  }
  if (/^\?\?\s+/.test(trimmed)) {
    const path = trimmed.replace(/^\?\?\s+/, '').trim();
    return `?? ${path}`;
  }

  // Porcelain format: two status chars + space + path
  const porcelainMatch = /^([ MADRCU?!]{2})\s+(.+)$/.exec(trimmed);
  if (porcelainMatch) {
    const statusChars = porcelainMatch[1];
    const path = porcelainMatch[2];

    let code = 'M';
    if (statusChars.startsWith('??')) {
      code = '??';
    } else if (statusChars[0] === 'D') {
      code = 'D';
    } else if (statusChars[0] === 'A') {
      code = 'A';
    } else if (statusChars[0] === 'R') {
      code = 'R';
    }

    return `${code}: ${path}`;
  }

  return trimmed;
}

/**
 * Format git status lines with section awareness.
 */
export function rewriteGitStatusLines(lines: string[]): string[] {
  let section: 'staged' | 'unstaged' | 'untracked' | null = null;
  const result: string[] = [];
  let lastEmpty = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track section headers
    if (trimmed === 'Changes not staged for commit:') {
      section = 'unstaged';
    } else if (trimmed === 'Changes to be committed:') {
      section = 'staged';
    } else if (trimmed === 'Untracked files:') {
      section = 'untracked';
    }

    // In untracked section, indented lines become "?? "
    if (section === 'untracked' && /^\s{2,}\S/.test(line) && !/^\s*(modified:|new file:|deleted:|renamed:)/.test(line)) {
      result.push(`?? ${trimmed}`);
      lastEmpty = false;
      continue;
    }

    const formatted = rewriteGitStatusLine(line);

    // Skip empty lines but collapse consecutive empties
    if (formatted === '') {
      if (!lastEmpty && result.length > 0) {
        result.push('');
        lastEmpty = true;
      }
      continue;
    }

    result.push(formatted);
    lastEmpty = false;
  }

  // Remove trailing empty line
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }

  return result;
}

// ---------------------------------------------------------------------------
// GH Output Formatting
// ---------------------------------------------------------------------------

/**
 * Compact whitespace in a string.
 */
export function compactWhitespace(text: string): string {
  return text.split(/\s+/).filter(s => s.length > 0).join(' ');
}

/**
 * Format a GH table line.
 */
export function formatGhTableLine(line: string): string {
  const trimmed = line.trim();
  if (trimmed === '') return '';

  // Split on 2+ spaces or tabs
  const columns = trimmed.split(/\s{2,}|\t+/).map(compactWhitespace).filter(s => s.length > 0);

  if (columns.length >= 2 && /^\d+$/.test(columns[0])) {
    const number = columns[0];
    const title = columns[1];
    const state = columns.length >= 4 ? columns[columns.length - 1] : null;
    const context = columns.length >= 3 ? columns.slice(2, state ? -1 : undefined).join(' ') : null;

    const parts: string[] = [`#${number}`, title];
    if (state) parts.push(`[${state}]`);
    if (context) parts.push(`(${context})`);

    return parts.join(' ');
  }

  return compactWhitespace(trimmed);
}

/**
 * Parse and format GH JSON records.
 */
export function formatGhJsonRecord(record: unknown): string | null {
  if (typeof record !== 'object' || record === null) return null;

  const obj = record as Record<string, unknown>;

  // Extract title
  const title = (obj.title as string) ||
    (obj.displayTitle as string) ||
    (obj.name as string) ||
    (obj.workflowName as string);

  if (!title) return null;

  const parts: string[] = [];

  // Number
  const number = obj.number as number | undefined;
  if (number) parts.push(`#${number}`);

  parts.push(compactWhitespace(String(title)));

  // Status/conclusion
  const status = (obj.state as string) || (obj.status as string) || (obj.conclusion as string);
  if (status) parts.push(`[${status}]`);

  // Branch
  const branch = (obj.headBranch as string) || (obj.headRefName as string);
  if (branch) parts.push(`(${compactWhitespace(branch)})`);

  // Comments count
  const comments = obj.comments;
  if (typeof comments === 'number' && comments > 0) {
    parts.push(`${comments}c`);
  }

  // Labels
  const labels = obj.labels;
  if (Array.isArray(labels)) {
    const labelNames = labels
      .slice(0, 3)
      .map(l => typeof l === 'string' ? l : (l as Record<string, unknown>).name as string)
      .filter(Boolean);

    if (labelNames.length > 0) {
      parts.push(`{${labelNames.join(', ')}}`);
    }
  }

  // Updated at
  const updatedAt = obj.updatedAt as string | undefined;
  if (updatedAt) {
    parts.push(updatedAt.substring(0, 10));
  }

  return parts.join(' ');
}
