/**
 * 批量重索引知识库中的所有 wiki 文件
 * 用法: npx tsx scripts/reindex-kb.ts [--dry-run]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 动态导入以支持 ESM
const { getKbBasePath, resolveKbPath } = await import(
  join(__dirname, "../src/knowledge-base/paths.js")
);
const { getDefaultIndexer } = await import(
  join(__dirname, "../src/knowledge-base/indexer.js")
);
const { isEmbeddingAvailable } = await import(
  join(__dirname, "../src/knowledge-base/embedding.js")
);

async function listWikiFiles(dirPath: string, basePath: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await listWikiFiles(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(relative(basePath, fullPath).replace(/\\/g, "/"));
      }
    }
  } catch {
    // ignore
  }
  return files;
}

function parseFrontmatter(content: string): { title?: string; type?: string; tags?: string[] } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};
  const raw = match[1];
  const result: { title?: string; type?: string; tags?: string[] } = {};
  const titleMatch = raw.match(/^title:\s*"?([^"\n]+)"?\s*$/m);
  if (titleMatch) result.title = titleMatch[1].trim();
  const typeMatch = raw.match(/^type:\s*(\S+)\s*$/m);
  if (typeMatch) result.type = typeMatch[1].trim();
  const tagsMatch = raw.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsMatch) {
    result.tags = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  } else {
    const tagsListMatch = raw.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (tagsListMatch) {
      result.tags = tagsListMatch[1]
        .split("\n")
        .map((l) => l.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }
  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("========================================");
  console.log("  知识库批量重索引工具");
  console.log("========================================\n");

  const embeddingAvailable = isEmbeddingAvailable();
  console.log(`Embedding provider: ${embeddingAvailable ? "已启用" : "未启用（将使用关键词索引）"}`);

  const basePath = getKbBasePath();
  const wikiDir = join(basePath, "wiki");

  if (!existsSync(wikiDir)) {
    console.log(`\n知识库 wiki 目录不存在: ${wikiDir}`);
    console.log("请先上传并整理文件。");
    process.exit(1);
  }

  console.log(`\n扫描 wiki 目录: ${wikiDir}`);
  const files = await listWikiFiles(wikiDir, basePath);
  console.log(`找到 ${files.length} 个 markdown 文件\n`);

  if (files.length === 0) {
    console.log("没有需要索引的文件。");
    process.exit(0);
  }

  if (dryRun) {
    console.log("[DRY RUN] 以下文件将被索引:");
    for (const f of files) {
      console.log(`  - ${f}`);
    }
    console.log(`\n共 ${files.length} 个文件，实际运行请去掉 --dry-run`);
    process.exit(0);
  }

  const indexer = getDefaultIndexer();
  let success = 0;
  let failed = 0;
  const jobs: Array<{ filePath: string; jobId: string }> = [];

  console.log("开始索引...\n");
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    try {
      const content = await readFile(resolveKbPath(filePath), "utf-8");
      const fm = parseFrontmatter(content);
      const title = fm.title || basename(filePath, ".md");
      const type = fm.type || "source";
      const tags = fm.tags || [];

      const job = await indexer.indexFile(filePath, content, {
        title,
        type,
        tags,
      });
      jobs.push({ filePath, jobId: job.id });
      success++;
      process.stdout.write(`\r[${i + 1}/${files.length}] 索引中... ${filePath.slice(0, 60)}`);
    } catch (err) {
      failed++;
      console.error(`\n  失败: ${filePath} - ${(err as Error).message}`);
    }
  }

  console.log(`\n\n========================================`);
  console.log(`  索引任务提交完成`);
  console.log(`========================================`);
  console.log(`  总计: ${files.length} 个文件`);
  console.log(`  成功: ${success}`);
  console.log(`  失败: ${failed}`);
  console.log(`\n注意: 索引是异步进行的，请查看 BFF 日志观察实际进度。`);
  console.log(`      使用 --dry-run 可预览将要索引的文件列表。`);
}

main().catch((err) => {
  console.error("错误:", err);
  process.exit(1);
});
