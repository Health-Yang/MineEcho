/**
 * LightRAG One-time Migration Script
 *
 * Scans the existing wiki/ directory for all .md files and inserts them
 * into the LightRAG service. Can be run directly or imported.
 *
 * Usage:
 *   npx tsx apps/bff/src/knowledge-base/lightrag-init.ts
 *   # or from project root:
 *   node --loader ts-node/esm apps/bff/src/knowledge-base/lightrag-init.ts
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { lightragClient } from "./lightrag-client.js";
import { getKbBasePath } from "./paths.js";

async function listMarkdownFiles(dirPath: string, basePath: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await listMarkdownFiles(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
        files.push(relative(basePath, fullPath));
      }
    }
  } catch {
    // ignore unreadable dirs
  }
  return files;
}

export async function migrateWikiToLightRAG(): Promise<{
  total: number;
  success: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}> {
  const basePath = getKbBasePath();
  const wikiDir = join(basePath, "wiki");

  console.log(`[LightRAG Init] Scanning ${wikiDir} ...`);

  const mdFiles = await listMarkdownFiles(wikiDir, basePath);
  console.log(`[LightRAG Init] Found ${mdFiles.length} markdown files.`);

  const result = {
    total: mdFiles.length,
    success: 0,
    failed: 0,
    errors: [] as Array<{ file: string; error: string }>,
  };

  for (let i = 0; i < mdFiles.length; i++) {
    const relPath = mdFiles[i];
    const absPath = join(basePath, relPath);
    const docId = relPath.replace(/\//g, "_");

    try {
      const content = await readFile(absPath, "utf-8");
      await lightragClient.insert(content, docId);
      result.success++;
      console.log(`[LightRAG Init] [${i + 1}/${mdFiles.length}] OK  ${relPath}`);
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ file: relPath, error: message });
      console.error(`[LightRAG Init] [${i + 1}/${mdFiles.length}] FAIL ${relPath}: ${message}`);
    }
  }

  console.log(
    `[LightRAG Init] Done. Total: ${result.total}, Success: ${result.success}, Failed: ${result.failed}`
  );
  return result;
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateWikiToLightRAG()
    .then((result) => {
      if (result.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("[LightRAG Init] Fatal error:", err);
      process.exit(1);
    });
}
