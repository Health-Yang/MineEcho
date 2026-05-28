/**
 * Memory Tree Content Store
 * Obsidian-compatible Markdown file storage with SHA256 integrity verification
 */

import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { logger } from "../../utils/logger.js";
import { getWorkspaceRoot } from "../../routes/workspace.js";
import type { L0Chunk, L1Summary, L2Summary, L3Summary, MemorySource } from "./types.js";

function getContentRoot(): string {
  const workspaceRoot = getWorkspaceRoot();
  return join(workspaceRoot, "memory", "content");
}

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// ============================================================================
// Path Generation
// ============================================================================

function getL0Dir(source: MemorySource): string {
  return join(getContentRoot(), "l0", source);
}

function getL0Path(source: MemorySource, chunkId: string): string {
  return join(getL0Dir(source), `${chunkId}.md`);
}

function getSummariesDir(level: 1 | 2 | 3): string {
  return join(getContentRoot(), "summaries", `l${level}`);
}

function getSummaryPath(level: 1 | 2 | 3, key: string): string {
  return join(getSummariesDir(level), `${key}.md`);
}

// ============================================================================
// YAML Front-matter Helpers
// ============================================================================

function escapeYaml(value: unknown): string {
  if (typeof value === "string") {
    // Escape special YAML characters and wrap in quotes if needed
    if (value.includes(":") || value.includes("#") || value.includes('"') || value.includes("'") || value.includes("\n")) {
      return `"${value.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => escapeYaml(v)).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

function composeYamlFrontMatter(data: Record<string, unknown>): string {
  const lines = Object.entries(data).map(([key, value]) => {
    return `${key}: ${escapeYaml(value)}`;
  });
  return `---\n${lines.join("\n")}\n---\n`;
}

function parseFrontMatter(content: string): { frontMatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontMatter: {}, body: content };
  }

  const [, frontMatterStr, body] = match;
  const frontMatter: Record<string, unknown> = {};

  // Simple YAML parser
  for (const line of frontMatterStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    // Parse arrays
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1);
      frontMatter[key] = arrayContent.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    }
    // Parse numbers
    else if (!isNaN(Number(value)) && value !== "") {
      frontMatter[key] = Number(value);
    }
    // Parse booleans
    else if (value === "true") {
      frontMatter[key] = true;
    } else if (value === "false") {
      frontMatter[key] = false;
    }
    // Remove quotes from strings
    else {
      frontMatter[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  return { frontMatter, body };
}

// ============================================================================
// SHA256 Integrity Verification
// ============================================================================

export interface SHA256Result {
  hash: string;
  algorithm: "sha256";
}

/**
 * Compute SHA256 hex digest of a string
 */
export function sha256Hex(text: string): string {
  const hash = createHash("sha256");
  hash.update(text, "utf8");
  return hash.digest("hex");
}

/**
 * Compute SHA256 hex digest of a Buffer
 */
export function sha256HexBuffer(buffer: Buffer): string {
  const hash = createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}

/**
 * Verify content integrity by comparing SHA256 hash
 * @param content The content to verify
 * @param expectedHash The expected SHA256 hash (64 hex chars)
 * @returns true if hash matches, false otherwise
 */
export function verifySHA256(content: string, expectedHash: string): boolean {
  const computed = sha256Hex(content);
  // Use timing-safe comparison to prevent timing attacks
  if (computed.length !== expectedHash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extract and verify SHA256 from YAML front-matter
 * @param frontMatter Front-matter object with content_sha256 field
 * @param body The body content to verify
 * @returns true if SHA256 matches or field is absent
 */
export function verifyFrontMatterSHA256(frontMatter: Record<string, unknown>, body: string): boolean {
  const storedHash = frontMatter.content_sha256 as string | undefined;
  if (!storedHash) {
    logger.debug("[ContentStore] No SHA256 in front-matter, skipping verification");
    return true;
  }
  return verifySHA256(body, storedHash);
}

/**
 * Add SHA256 to front-matter data
 */
export function addSHA256ToFrontMatter(frontMatter: Record<string, unknown>, body: string): Record<string, unknown> {
  return {
    ...frontMatter,
    content_sha256: sha256Hex(body),
    content_sha256_algorithm: "sha256",
  };
}

// ============================================================================
// L0 Chunk File Operations
// ============================================================================

export interface StoredL0File {
  chunk: L0Chunk;
  body: string;
}

export async function writeL0Chunk(chunk: L0Chunk): Promise<void> {
  const dir = getL0Dir(chunk.source);
  ensureDir(dir);

  const filePath = getL0Path(chunk.source, chunk.id);
  const bodyContent = chunk.content;
  const frontMatter = addSHA256ToFrontMatter({
    id: chunk.id,
    user_id: chunk.userId,
    source: chunk.source,
    token_count: chunk.tokenCount,
    created_at: new Date(chunk.createdAt).toISOString(),
    entity_tags: chunk.entityTags,
    importance: chunk.importance,
  }, bodyContent);

  if (chunk.sourceRef) {
    (frontMatter as any).source_ref = chunk.sourceRef;
  }

  const content = composeYamlFrontMatter(frontMatter) + bodyContent;
  await writeFile(filePath, content, "utf-8");
  logger.debug(`[ContentStore] Wrote L0 chunk: ${filePath}`);
}

export async function readL0Chunk(source: MemorySource, chunkId: string): Promise<StoredL0File | null> {
  const filePath = getL0Path(source, chunkId);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const { frontMatter, body } = parseFrontMatter(content);

    // Verify SHA256 integrity
    const storedHash = frontMatter.content_sha256 as string | undefined;
    if (storedHash) {
      if (!verifySHA256(body, storedHash)) {
        logger.error(`[ContentStore] SHA256 mismatch for L0 chunk: ${filePath}`);
        throw new Error(`SHA256 verification failed for chunk ${chunkId}`);
      }
      logger.debug(`[ContentStore] SHA256 verified for L0 chunk: ${chunkId}`);
    }

    const chunk: L0Chunk = {
      id: frontMatter.id as string,
      userId: frontMatter.user_id as string,
      source: frontMatter.source as MemorySource,
      content: body,
      tokenCount: frontMatter.token_count as number,
      createdAt: new Date(frontMatter.created_at as string).getTime(),
      entityTags: (frontMatter.entity_tags as string[]) || [],
      sourceRef: frontMatter.source_ref as any,
      importance: (frontMatter.importance as number) ?? 0.5,
    };

    return { chunk, body };
  } catch (err) {
    if (err instanceof Error && err.message.includes("SHA256")) {
      throw err; // Re-throw integrity errors
    }
    logger.error(`[ContentStore] Failed to read L0 chunk: ${filePath}`, err);
    return null;
  }
}

export async function deleteL0Content(source: MemorySource, chunkId: string): Promise<boolean> {
  const filePath = getL0Path(source, chunkId);

  if (!existsSync(filePath)) {
    return false;
  }

  try {
    await import("node:fs/promises").then(({ unlink }) => unlink(filePath));
    logger.debug(`[ContentStore] Deleted L0 chunk: ${filePath}`);
    return true;
  } catch (err) {
    logger.error(`[ContentStore] Failed to delete L0 chunk: ${filePath}`, err);
    return false;
  }
}

export async function listL0Chunks(source: MemorySource): Promise<string[]> {
  const dir = getL0Dir(source);

  if (!existsSync(dir)) {
    return [];
  }

  try {
    const files = await readdir(dir);
    return files.filter(f => f.endsWith(".md")).map(f => f.replace(".md", ""));
  } catch (err) {
    logger.error(`[ContentStore] Failed to list L0 chunks: ${dir}`, err);
    return [];
  }
}

// ============================================================================
// Summary File Operations
// ============================================================================

export async function writeL1Summary(summary: L1Summary): Promise<void> {
  const dir = getSummariesDir(1);
  ensureDir(dir);

  const filePath = getSummaryPath(1, summary.date);
  const frontMatter = {
    id: summary.id,
    user_id: summary.userId,
    date: summary.date,
    token_count: summary.tokenCount,
    child_ids: summary.childIds,
    created_at: new Date(summary.createdAt).toISOString(),
    level: 1,
  };

  const content = composeYamlFrontMatter(frontMatter) + summary.summary;
  await writeFile(filePath, content, "utf-8");
  logger.debug(`[ContentStore] Wrote L1 summary: ${filePath}`);
}

export async function readL1Summary(date: string): Promise<L1Summary | null> {
  const filePath = getSummaryPath(1, date);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const { frontMatter, body } = parseFrontMatter(content);

    return {
      id: frontMatter.id as string,
      userId: frontMatter.user_id as string,
      date: frontMatter.date as string,
      summary: body,
      tokenCount: frontMatter.token_count as number,
      childIds: (frontMatter.child_ids as string[]) || [],
      createdAt: new Date(frontMatter.created_at as string).getTime(),
    };
  } catch (err) {
    logger.error(`[ContentStore] Failed to read L1 summary: ${filePath}`, err);
    return null;
  }
}

export async function writeL2Summary(summary: L2Summary): Promise<void> {
  const dir = getSummariesDir(2);
  ensureDir(dir);

  const filePath = getSummaryPath(2, summary.weekStart);
  const frontMatter = {
    id: summary.id,
    user_id: summary.userId,
    week_start: summary.weekStart,
    token_count: summary.tokenCount,
    child_ids: summary.childIds,
    created_at: new Date(summary.createdAt).toISOString(),
    level: 2,
  };

  const content = composeYamlFrontMatter(frontMatter) + summary.summary;
  await writeFile(filePath, content, "utf-8");
  logger.debug(`[ContentStore] Wrote L2 summary: ${filePath}`);
}

export async function readL2Summary(weekStart: string): Promise<L2Summary | null> {
  const filePath = getSummaryPath(2, weekStart);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const { frontMatter, body } = parseFrontMatter(content);

    return {
      id: frontMatter.id as string,
      userId: frontMatter.user_id as string,
      weekStart: frontMatter.week_start as string,
      summary: body,
      tokenCount: frontMatter.token_count as number,
      childIds: (frontMatter.child_ids as string[]) || [],
      createdAt: new Date(frontMatter.created_at as string).getTime(),
    };
  } catch (err) {
    logger.error(`[ContentStore] Failed to read L2 summary: ${filePath}`, err);
    return null;
  }
}

export async function writeL3Summary(summary: L3Summary): Promise<void> {
  const dir = getSummariesDir(3);
  ensureDir(dir);

  const filePath = getSummaryPath(3, summary.month);
  const frontMatter = {
    id: summary.id,
    user_id: summary.userId,
    month: summary.month,
    token_count: summary.tokenCount,
    child_ids: summary.childIds,
    created_at: new Date(summary.createdAt).toISOString(),
    level: 3,
  };

  const content = composeYamlFrontMatter(frontMatter) + summary.summary;
  await writeFile(filePath, content, "utf-8");
  logger.debug(`[ContentStore] Wrote L3 summary: ${filePath}`);
}

export async function readL3Summary(month: string): Promise<L3Summary | null> {
  const filePath = getSummaryPath(3, month);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const { frontMatter, body } = parseFrontMatter(content);

    return {
      id: frontMatter.id as string,
      userId: frontMatter.user_id as string,
      month: frontMatter.month as string,
      summary: body,
      tokenCount: frontMatter.token_count as number,
      childIds: (frontMatter.child_ids as string[]) || [],
      createdAt: new Date(frontMatter.created_at as string).getTime(),
    };
  } catch (err) {
    logger.error(`[ContentStore] Failed to read L3 summary: ${filePath}`, err);
    return null;
  }
}

// ============================================================================
// Obsidian Integration
// ============================================================================

export interface ObsidianVault {
  root: string;
  sources: string[];
}

export function getObsidianVaultPath(): string {
  const workspaceRoot = getWorkspaceRoot();
  return join(workspaceRoot, "memory", "obsidian");
}

export async function initializeObsidianVault(): Promise<ObsidianVault> {
  const vaultPath = getObsidianVaultPath();

  // Create directory structure
  ensureDir(vaultPath);
  ensureDir(join(vaultPath, "conversation"));
  ensureDir(join(vaultPath, "daily"));
  ensureDir(join(vaultPath, "weekly"));
  ensureDir(join(vaultPath, "monthly"));
  ensureDir(join(vaultPath, "entities"));
  ensureDir(join(vaultPath, "projects"));

  // Create index files
  const indexPath = join(vaultPath, "README.md");
  if (!existsSync(indexPath)) {
    await writeFile(indexPath, `# MineEcho Memory Vault

This is an Obsidian-compatible vault for your memory.

## Structure

- \`conversation/\` - Conversation summaries
- \`daily/\` - Daily memory summaries
- \`weekly/\` - Weekly summaries
- \`monthly/\` - Monthly summaries
- \`entities/\` - Entity notes
- \`projects/\` - Project notes

## Usage

You can open this folder in Obsidian to browse and edit your memories.
`, "utf-8");
  }

  return {
    root: vaultPath,
    sources: ["conversation", "daily", "weekly", "monthly", "entities", "projects"],
  };
}

export async function exportChunkToObsidian(chunk: L0Chunk): Promise<string> {
  const vaultPath = getObsidianVaultPath();
  const dir = join(vaultPath, "conversation");
  ensureDir(dir);

  const date = new Date(chunk.createdAt).toISOString().split("T")[0];
  const filename = `${date}_${chunk.id}.md`;
  const filePath = join(dir, filename);

  const frontMatter = {
    tags: ["conversation", ...chunk.entityTags],
    created: new Date(chunk.createdAt).toISOString(),
    importance: chunk.importance,
    source: chunk.source,
  };

  const content = composeYamlFrontMatter(frontMatter) + `# Conversation\n\n${chunk.content}`;
  await writeFile(filePath, content, "utf-8");

  return filePath;
}

// ============================================================================
// Batch Operations
// ============================================================================

export async function pruneOldFiles(daysToKeep: number = 90): Promise<number> {
  const contentRoot = getContentRoot();
  let deletedCount = 0;

  try {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    // Prune L0 chunks
    for (const source of ["conversation", "document", "skill", "knowledge", "manual", "meeting"] as MemorySource[]) {
      const dir = getL0Dir(source);
      if (!existsSync(dir)) continue;

      const files = await readdir(dir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const filePath = join(dir, file);
        const stat = await import("node:fs/promises").then(({ stat }) => stat(filePath));

        if (stat.mtimeMs < cutoff) {
          await import("node:fs/promises").then(({ unlink }) => unlink(filePath));
          deletedCount++;
        }
      }
    }

    logger.info(`[ContentStore] Pruned ${deletedCount} old files`);
  } catch (err) {
    logger.error("[ContentStore] Failed to prune old files:", err);
  }

  return deletedCount;
}

export async function getStorageStats(): Promise<{
  l0Count: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  totalSize: number;
}> {
  const contentRoot = getContentRoot();

  const countDir = async (dir: string): Promise<number> => {
    if (!existsSync(dir)) return 0;
    const files = await readdir(dir);
    return files.filter(f => f.endsWith(".md")).length;
  };

  const getDirSize = async (dir: string): Promise<number> => {
    if (!existsSync(dir)) return 0;
    let total = 0;
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const filePath = join(dir, file.name);
      if (file.isFile()) {
        const stat = await import("node:fs/promises").then(({ stat }) => stat(filePath));
        total += stat.size;
      } else if (file.isDirectory()) {
        total += await getDirSize(filePath);
      }
    }
    return total;
  };

  const [l0Count, l1Count, l2Count, l3Count, totalSize] = await Promise.all([
    countDir(join(contentRoot, "l0")),
    countDir(getSummariesDir(1)),
    countDir(getSummariesDir(2)),
    countDir(getSummariesDir(3)),
    getDirSize(contentRoot),
  ]);

  return { l0Count, l1Count, l2Count, l3Count, totalSize };
}
