import { readFile, writeFile, mkdir, appendFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, basename, extname, relative } from "node:path";
import { chatSend } from "../gateway/client.js";
import { logger } from "../utils/logger.js";
import { getKbBasePath, prepareKbBasePath, resolveKbPath } from "./paths.js";
import { extractTextFromFile } from "./extractors.js";
import { getDefaultIndexer } from "./indexer.js";
import { hybridSearch, HybridSearchResult } from "./search.js";
import { setOrganizeStatus } from "./lightrag-index-status.js";

const ORGANIZE_SESSION = "kb";

const DEFAULT_CLAUDE_MD = `# MineEcho 个人知识库 (Karpathy LLM Wiki 模式)

## 核心思想

大多数人的 LLM 文档体验是 RAG：上传文件 → 检索分块 → 生成答案。这有效，但 LLM 每次都要从零重新发现知识，没有知识积累。

这里的思路不同：LLM 不是仅在查询时从原始文档检索，而是**逐步构建并维护一个持久的 wiki** —— 一个结构化、相互链接的 Markdown 文件集合，位于你和原始资源之间。当你添加新资源时，LLM 不仅索引它，还会阅读、提取关键信息，并将其整合到现有 wiki 中 —— 更新实体页面、修改主题摘要、标记新数据与旧声明的矛盾之处、强化或挑战不断演变的综合结论。知识被编译一次，然后保持最新，而不是每次查询时重新推导。

关键区别：**wiki 是一个持久、复合的产物。** 交叉引用已经存在。矛盾已经被标记。综合结论已经反映了你阅读过的一切。wiki 随着你添加的每个资源和提出的每个问题而变得越来越丰富。

你很少（或从不）自己写 wiki —— LLM 负责所有撰写和维护工作。你的工作是资源策划、探索和提出正确的问题。LLM 做所有繁琐的工作：总结、交叉引用、归档和记账。

## 三层架构

**raw/** — 原始资源。文章、论文、数据文件。这些是不可变的 —— LLM 从中读取但从不修改。这是你信任的源头。

**wiki/** — LLM 生成的 Markdown 文件目录。摘要、实体页面、概念页面、比较、概述、综合。LLM 完全拥有这一层。它创建页面、在新资源到达时更新它们、维护交叉引用、保持一切一致。你阅读它；LLM 撰写它。

**claude.md** — 模式文档。告诉 LLM wiki 如何结构化、约定是什么、以及在摄取资源、回答问题或维护 wiki 时应遵循什么工作流程。这是关键的配置文件 —— 它使 LLM 成为一个有纪律的 wiki 维护者，而不是一个通用聊天机器人。你和 LLM 共同演化这个文档。

## 页面类型

- **概念 (concept)**：原理、方法论、抽象概念
- **实体 (entity)**：产品、公司、人物、项目
- **来源 (source)**：原始文档、报告、文章摘要
- **比较 (comparison)**：不同概念或实体的对比分析
- **综合 (synthesis)**：跨多个来源的主题综合

## 页面格式

每个 wiki 页面必须包含 YAML frontmatter：
\`\`\`yaml
---
title: "标题"
type: concept | entity | source | comparison | synthesis
tags: [标签1, 标签2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
\`\`\`

## 内部链接

使用 [[页面名]] 格式链接相关概念。这是 wiki 的命脉。

## 操作

### 入库 (Ingest)

当 raw/ 有新文件时：
1. 读取原始内容
2. 与用户讨论关键要点（如有必要）
3. 在 wiki/ 中写入摘要页面
4. 更新 index.md
5. 更新相关实体和概念页面
6. 追加 log.md 条目

单个来源可能触及 10-15 个 wiki 页面。建议一次摄取一个来源并保持参与 —— 阅读摘要、检查更新、指导 LLM 强调什么。

### 查询 (Query)

用户向 wiki 提问时：
1. 搜索相关 wiki 页面
2. 阅读并综合答案
3. 使用 [[页面名]] 引用来源
4. 优质的回答可以作为新页面归档回 wiki，这样探索也能像摄取的来源一样复合增长

### 整理 (Lint)

定期检查 wiki 健康状况：
- 查找页面之间的矛盾
- 标记被新来源取代的陈旧声明
- 查找没有入站链接的孤立页面
- 查找缺失自己页面的重要概念
- 查找缺失的交叉引用
- 建议填补数据空白的新问题

## 索引与日志

**index.md** 是内容导向的。它是 wiki 中所有内容的目录 —— 每个页面都列有链接、一行摘要和可选的元数据。按类别组织（实体、概念、来源、比较、综合）。LLM 在每次摄取时更新它。回答查询时，LLM 先阅读索引以找到相关页面。

**log.md** 是时间顺序的。它是只追加的演变记录 —— 入库、查询、整理。每个条目应以一致的格式开头，例如 \`## [YYYY-MM-DD] ingest | 文章标题\`，这样日志就可以用简单工具解析。日志提供了 wiki 演变的时间线。

## 为什么这有效

维护知识库中最繁琐的部分不是阅读或思考 —— 而是记账工作。更新交叉引用、保持摘要最新、标记矛盾、维护数十个页面之间的一致性。人类放弃 wiki 是因为维护负担增长得比价值快。LLM 不会感到无聊，不会忘记更新交叉引用，可以在一次通过中触及 15 个文件。wiki 保持维护是因为维护成本接近于零。

人类的工作是策划来源、指导分析、提出好问题、思考这一切意味着什么。LLM 的工作是其他一切。
`;

export async function ensureKbInitialized(): Promise<void> {
  const basePath = prepareKbBasePath();
  const dirs = [
    join(basePath, "raw"),
    join(basePath, "wiki"),
    join(basePath, "wiki", "concepts"),
    join(basePath, "wiki", "entities"),
    join(basePath, "wiki", "sources"),
    join(basePath, "wiki", "comparisons"),
    join(basePath, "wiki", "syntheses"),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }

  const claudeMdPath = join(basePath, "claude.md");
  if (!existsSync(claudeMdPath)) {
    await writeFile(claudeMdPath, DEFAULT_CLAUDE_MD, "utf-8");
  }

  const indexMdPath = join(basePath, "wiki", "index.md");
  if (!existsSync(indexMdPath)) {
    await writeFile(indexMdPath, "# 知识库索引\n\n## 概念\n\n## 实体\n\n## 来源\n", "utf-8");
  }

  const logMdPath = join(basePath, "log.md");
  if (!existsSync(logMdPath)) {
    await writeFile(logMdPath, "# 知识库日志\n\n", "utf-8");
  }
}

export function isBinaryExt(ext: string | undefined): boolean {
  if (!ext) return false;
  const binaryExts = new Set([
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
    "zip", "rar", "7z", "png", "jpg", "jpeg", "gif", "bmp", "webp",
    "mp4", "mp3", "mov", "avi", "exe", "dll", "so", "dylib",
  ]);
  return binaryExts.has(ext.toLowerCase());
}

interface WikiPage {
  path: string;
  content: string;
}

interface OrganizeResult {
  success: boolean;
  pages: WikiPage[];
  wikiPath?: string;
  summary?: string;
  error?: string;
}

async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function inferTitleFromContent(content: string, fallback: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const firstLine = content.split(/\r?\n/).find((l) => l.trim());
  if (firstLine && firstLine.length < 100) return firstLine.trim();
  return fallback;
}

export function inferTypeFromContent(content: string, title: string): "concept" | "entity" | "source" | "comparison" | "synthesis" {
  const lower = (content + " " + title).toLowerCase();
  if (/对比|比较|差异|vs|versus|区别|优劣|选型/.test(lower)) return "comparison";
  if (/综合|综述|总结|synthesis|overview|全景|梳理/.test(lower)) return "synthesis";
  if (/产品|方案|架构|协议|标准|模型|方法|模式|原理|概念/.test(lower)) return "concept";
  if (/公司|团队|人名|客户|项目|工具|平台|系统|设备/.test(lower)) return "entity";
  return "source";
}

function buildOrganizePrompt(rawContent: string, fileName: string, claudeMd: string, indexMd: string): string {
  const today = new Date().toISOString().split("T")[0];

  return `你是一位顶级知识工程师。你的任务是将原始素材转化为一个相互关联的 wiki 知识网络。

## 核心原则
不是"把原文套个模板"，而是：
1. 提取素材中的核心概念、关键实体、方法论
2. 为每个概念/实体创建独立的 wiki 页面
3. 用 [[页面名]] 建立页面间的交叉引用
4. 让知识可以复利增长（新素材到来时能叠加到已有知识上）

## 原始素材信息
- 文件名：${fileName}
- 整理日期：${today}

## 原始内容
\`\`\`
${rawContent.slice(0, 30000)}
\`\`\`

## 知识库说明（claude.md）
\`\`\`
${claudeMd.slice(0, 5000)}
\`\`\`

## 现有索引（wiki/index.md）
\`\`\`
${indexMd.slice(0, 5000)}
\`\`\`

## 整理要求

1. **必须生成多个 wiki 页面**（至少 3 个，复杂素材可生成 5-10 个）：
   - **source**：当前素材的摘要/提炼页面（1个）
   - **concept**：素材中涉及的核心概念、原理、方法论（1-3个）
   - **entity**：素材中涉及的重要产品、公司、人物、项目（1-3个）
   - **comparison**：如果素材对比了不同方案，生成对比页面（可选）
   - **synthesis**：如果素材综合了多个观点，生成综合页面（可选）

2. **每个页面必须包含 YAML frontmatter**：
\`\`\`yaml
---
title: "标题"
type: concept | entity | source | comparison | synthesis
tags: [标签1, 标签2]
created: ${today}
updated: ${today}
---
\`\`\`

3. **内容要求**：
   - 不要复制原文！用自己的语言提炼、总结、结构化
   - source 页面不超过 800 字，是素材的精华摘要
   - concept/entity 页面不超过 500 字，聚焦定义和核心特征
   - 在相关位置插入 [[页面名]] 链接，建立知识网络

4. **文件路径约定**：
   - wiki/concepts/概念名.md
   - wiki/entities/实体名.md
   - wiki/sources/来源摘要.md
   - wiki/comparisons/对比主题.md
   - wiki/syntheses/综合主题.md

5. **交叉引用要求**：
   - source 页面必须引用从中提取的 concept 和 entity
   - concept 页面必须引用相关的 entity 和其他 concept
   - 不要创造索引中没有的全新概念，除非素材确实引入了

## 输出格式（极其重要）

必须使用以下多文件分隔格式。每个页面用 === FILE: 路径 === 开始，用 === END FILE === 结束：

=== FILE: wiki/sources/素材摘要.md ===
---
title: "素材摘要"
type: source
tags: [标签1, 标签2]
created: ${today}
updated: ${today}
---

# 素材摘要

这是 source 页面，提炼了素材的核心内容。涉及 [[某个概念]] 和 [[某个实体]]。
=== END FILE ===

=== FILE: wiki/concepts/某个概念.md ===
---
title: "某个概念"
type: concept
tags: [标签1, 标签2]
created: ${today}
updated: ${today}
---

# 某个概念

这是概念定义页面。可以参考 [[某个实体]] 和 [[素材摘要]]。
=== END FILE ===

（继续输出其他 concept/entity 页面...）

请确保：
- 每个页面都用 === FILE: 路径 === 和 === END FILE === 包裹
- 只返回文件内容，不要添加额外说明
- 路径必须正确（concepts/ entities/ sources/ comparisons/ syntheses/）
- 页面之间必须有 [[交叉引用]]`;
}

export function parseWikiPages(replyText: string): WikiPage[] {
  const pages: WikiPage[] = [];
  const pattern = /===\s*FILE:\s*([^=]+?)\s*===(.+?)===\s*END\s*FILE\s*===/gs;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(replyText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();
    // Skip index.md — it's a special file managed separately, not a wiki page
    if (filePath && content && !filePath.toLowerCase().endsWith("index.md")) {
      pages.push({ path: toPosixPath(filePath), content });
    }
  }

  // Fallback: if no pages parsed, treat the whole response as a single page
  if (pages.length === 0 && replyText.trim()) {
    const cleanText = replyText
      .replace(/===\s*FILE:/g, "")
      .replace(/===\s*END\s*FILE\s*===/g, "")
      .trim();
    if (cleanText) {
      pages.push({ path: "", content: cleanText });
    }
  }

  return pages;
}

function generateDefaultPage(rawContent: string, fileName: string): WikiPage {
  const today = new Date().toISOString().split("T")[0];
  const title = inferTitleFromContent(rawContent, basename(fileName, extname(fileName)));
  const type = inferTypeFromContent(rawContent, title);
  const slug = slugify(title) || "untitled";
  const dir =
    type === "concept" ? "wiki/concepts" :
    type === "entity" ? "wiki/entities" :
    type === "comparison" ? "wiki/comparisons" :
    type === "synthesis" ? "wiki/syntheses" :
    "wiki/sources";
  const filePath = `${dir}/${slug}.md`;

  const MAX_FALLBACK_CONTENT = 3000;
  const truncatedContent = rawContent.length > MAX_FALLBACK_CONTENT
    ? rawContent.slice(0, MAX_FALLBACK_CONTENT) + "\n\n..."
    : rawContent;
  const content = `---
title: "${title}"
type: ${type}
tags: [auto-generated]
created: ${today}
updated: ${today}
---

# ${title}

${truncatedContent.split("\n").map((l) => "> " + l).join("\n")}
`;

  return { path: filePath, content };
}

/**
 * Remove auto-imported source pages that correspond to a raw file before AI organizing.
 * This prevents stale low-quality source pages from coexisting with AI-organized pages.
 */
async function removeAutoImportedSourcePage(rawRelativePath: string, basePath: string): Promise<void> {
  try {
    const sourcesDir = join(basePath, "wiki", "sources");
    if (!existsSync(sourcesDir)) return;

    const entries = await readdir(sourcesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const filePath = join(sourcesDir, entry.name);
      const content = await safeReadFile(filePath);
      if (!content.trim()) continue;

      // Check if this is an auto-imported page linked to the raw file
      const isAutoImported = /tags:\s*\[\s*["']?auto-imported["']?\s*\]/.test(content);
      const sourceMatch = content.match(/source:\s*["']([^"']+)["']/);
      const sourceRef = sourceMatch ? sourceMatch[1] : "";

      if (isAutoImported && (sourceRef === rawRelativePath || sourceRef === toPosixPath(rawRelativePath))) {
        await rm(filePath, { force: true });
        logger.info("[KnowledgeBase] Removed stale auto-imported source page:", entry.name);

        // Also remove from index.md
        const indexPath = join(basePath, "wiki", "index.md");
        let indexContent = await safeReadFile(indexPath);
        const pageName = basename(entry.name, ".md");
        const linkPattern = new RegExp(`- \\[\\\[${pageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\\]\\]\\n?`, "g");
        indexContent = indexContent.replace(linkPattern, "");
        await writeFile(indexPath, indexContent, "utf-8");
        break; // Only one source page per raw file
      }
    }
  } catch (err) {
    logger.warn("[KnowledgeBase] Failed to remove auto-imported source page:", err);
  }
}

async function updateIndexMd(pages: WikiPage[], basePath: string): Promise<void> {
  const indexPath = join(basePath, "wiki", "index.md");
  let indexContent = await safeReadFile(indexPath);

  if (!indexContent.trim()) {
    indexContent = "# 知识库索引\n\n## 概念\n\n## 实体\n\n## 来源\n\n## 对比\n\n## 综合\n";
  }

  for (const page of pages) {
    const pageName = basename(page.path, ".md");
    const link = `- [[${pageName}]]`;
    // Use regex to match the exact link line to avoid partial matches
    const linkPattern = new RegExp(`^${link}$`, "m");

    if (page.path.includes("/concepts/")) {
      if (!linkPattern.test(indexContent)) {
        indexContent = indexContent.replace(
          /## 概念\n/,
          `## 概念\n${link}\n`
        );
      }
    } else if (page.path.includes("/entities/")) {
      if (!linkPattern.test(indexContent)) {
        indexContent = indexContent.replace(
          /## 实体\n/,
          `## 实体\n${link}\n`
        );
      }
    } else if (page.path.includes("/sources/")) {
      if (!linkPattern.test(indexContent)) {
        indexContent = indexContent.replace(
          /## 来源\n/,
          `## 来源\n${link}\n`
        );
      }
    } else if (page.path.includes("/comparisons/")) {
      if (!linkPattern.test(indexContent)) {
        indexContent = indexContent.replace(
          /## 对比\n/,
          `## 对比\n${link}\n`
        );
      }
    } else if (page.path.includes("/syntheses/")) {
      if (!linkPattern.test(indexContent)) {
        indexContent = indexContent.replace(
          /## 综合\n/,
          `## 综合\n${link}\n`
        );
      }
    }
  }

  await writeFile(indexPath, indexContent, "utf-8");
}

async function appendLogMd(fileName: string, pages: WikiPage[], basePath: string): Promise<void> {
  const logPath = join(basePath, "log.md");
  const now = new Date().toISOString();
  const entries = pages.map((p) => `- 创建 [[${basename(p.path, ".md")}]]`).join("\n");
  const logEntry = `\n## ${now.split("T")[0]} ${now.split("T")[1].slice(0, 5)}\n\n整理来源：**${fileName}**\n\n${entries}\n`;
  await appendFile(logPath, logEntry, "utf-8");
}

// --- Large file chunking support ---

interface ChunkExtraction {
  chapterSummary: string;
  concepts: Array<{ name: string; definition: string; importance: number }>;
  entities: Array<{ name: string; description: string; importance: number }>;
  facts: string[];
  relationships: Array<{ from: string; to: string; relation: string }>;
}

interface OutlineItem {
  level: number;
  title: string;
}

interface OutlineAnalysis {
  keySections: string[];
  skipSections: string[];
  overallTheme: string;
  mainConcepts: string[];
  mainEntities: string[];
}

function extractOutline(text: string): OutlineItem[] {
  const outline: OutlineItem[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      outline.push({ level: match[1].length, title: match[2].trim() });
    }
  }
  return outline;
}

function buildOutlinePrompt(outline: OutlineItem[], fileName: string): string {
  const outlineText = outline.map((o) => `${"  ".repeat(o.level - 1)}- ${o.title}`).join("\n");
  return `你是一位知识工程师。以下是文档《${fileName}》的目录结构：

${outlineText}

请分析：
1. 哪些章节包含核心知识（值得生成 concept/entity 页面）
2. 哪些章节可以跳过（如附录、参考文献、免责声明、致谢）
3. 文档的整体主题是什么

请用 JSON 返回（不要加 markdown 代码块标记）：
{
  "keySections": ["值得整理的章节标题"],
  "skipSections": ["可以跳过的章节标题"],
  "overallTheme": "文档整体主题",
  "mainConcepts": ["预计会出现的核心概念"],
  "mainEntities": ["预计会出现的关键实体"]
}

只返回纯 JSON，不要任何额外文字。`;
}

async function parseOutlineAnalysis(replyText: string): Promise<OutlineAnalysis> {
  const defaultResult: OutlineAnalysis = {
    keySections: [],
    skipSections: [],
    overallTheme: "",
    mainConcepts: [],
    mainEntities: [],
  };
  if (!replyText.trim()) return defaultResult;

  const jsonMatch = replyText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return defaultResult;

  try {
    const data = JSON.parse(jsonMatch[0]) as Partial<OutlineAnalysis>;
    return {
      keySections: Array.isArray(data.keySections) ? data.keySections.filter((s) => typeof s === "string") : [],
      skipSections: Array.isArray(data.skipSections) ? data.skipSections.filter((s) => typeof s === "string") : [],
      overallTheme: typeof data.overallTheme === "string" ? data.overallTheme : "",
      mainConcepts: Array.isArray(data.mainConcepts) ? data.mainConcepts.filter((s) => typeof s === "string") : [],
      mainEntities: Array.isArray(data.mainEntities) ? data.mainEntities.filter((s) => typeof s === "string") : [],
    };
  } catch {
    return defaultResult;
  }
}

function splitIntoChunks(
  text: string,
  options: { maxChunkSize?: number; preserveBoundaries?: boolean } = {}
): string[] {
  const { maxChunkSize = 6000, preserveBoundaries = true } = options;

  // Try to split by h1/h2 headings first
  const headingPattern = /^(#{1,2}\s+.+)$/gm;
  const sections: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      sections.push(text.slice(lastIndex, match.index).trim());
    }
    lastIndex = match.index;
  }
  if (lastIndex < text.length) {
    sections.push(text.slice(lastIndex).trim());
  }

  // If no headings found, fall back to paragraph splitting
  if (sections.length <= 1) {
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let current = "";
    for (const p of paragraphs) {
      if (current.length + p.length + 2 > maxChunkSize && current.length > 0) {
        chunks.push(current.trim());
        current = p;
      } else {
        current = current ? current + "\n\n" + p : p;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text];
  }

  if (preserveBoundaries) {
    // Keep each heading section as its own chunk (never merge across headings)
    // If a single section exceeds maxChunkSize, split it internally by paragraphs
    const result: string[] = [];
    for (const section of sections) {
      if (!section.trim()) continue;
      if (section.length <= maxChunkSize) {
        result.push(section);
      } else {
        const paragraphs = section.split(/\n\n+/);
        let current = "";
        for (const p of paragraphs) {
          if (current.length + p.length + 2 > maxChunkSize && current.length > 0) {
            result.push(current.trim());
            current = p;
          } else {
            current = current ? current + "\n\n" + p : p;
          }
        }
        if (current.trim()) result.push(current.trim());
      }
    }
    return result.length > 0 ? result : [text];
  }

  // Merge small sections (legacy behavior)
  const merged: string[] = [];
  let current = "";
  for (const section of sections) {
    if (!section.trim()) continue;
    if (current.length + section.length + 2 > maxChunkSize && current.length > 0) {
      merged.push(current.trim());
      current = section;
    } else {
      current = current ? current + "\n\n" + section : section;
    }
  }
  if (current.trim()) merged.push(current.trim());
  return merged.length > 0 ? merged : [text];
}

function buildChunkExtractionPrompt(
  chunk: string,
  fileName: string,
  chunkIndex: number,
  totalChunks: number,
  outlineContext?: string
): string {
  const headingMatch = chunk.match(/^(#{1,2})\s+(.+)$/m);
  const chunkTitle = headingMatch ? headingMatch[2].trim() : `第 ${chunkIndex + 1} 部分`;

  return `你是一位知识工程师。请为以下文档章节生成深度分析。

来源文件：${fileName}
章节：${chunkTitle}（${chunkIndex + 1}/${totalChunks}）${outlineContext ? "\n\n文档整体主题：" + outlineContext : ""}

内容：
\`\`\`
${chunk.slice(0, 6000)}
\`\`\`

请完成以下任务（JSON 格式返回，不要加 markdown 代码块）：

1. **chapterSummary**：用 2-3 句话概括本章核心内容
2. **concepts**：本章涉及的概念（name, definition, importance 1-10）
3. **entities**：本章涉及的实体（name, description, importance 1-10）
4. **facts**：关键事实（字符串列表）
5. **relationships**：概念/实体间的关系（from, to, relation）

如果本章属于参考文献、附录、免责声明、致谢等次要内容，请返回空结果。

JSON 格式：
{
  "chapterSummary": "...",
  "concepts": [{"name": "...", "definition": "...", "importance": 8}],
  "entities": [{"name": "...", "description": "...", "importance": 7}],
  "facts": ["..."],
  "relationships": [{"from": "...", "to": "...", "relation": "..."}]
}

只返回纯 JSON，不要任何额外文字。`;
}

function buildSynthesisPrompt(
  extractions: ChunkExtraction[],
  fileName: string,
  claudeMd: string,
  indexMd: string,
  outlineAnalysis: OutlineAnalysis
): string {
  const today = new Date().toISOString().split("T")[0];

  // Build chapter summaries with important items
  const chapterSummaries = extractions
    .map((e, i) => {
      const topConcepts = e.concepts
        .filter((c) => c.importance >= 6)
        .map((c) => c.name)
        .join(", ");
      const topEntities = e.entities
        .filter((e) => e.importance >= 6)
        .map((e) => e.name)
        .join(", ");
      return `## 第 ${i + 1} 章\n${e.chapterSummary}${topConcepts ? "\n核心概念：" + topConcepts : ""}${topEntities ? "\n关键实体：" + topEntities : ""}`;
    })
    .join("\n\n");

  // Deduplicate and sort by importance
  const allConcepts = extractions.flatMap((e) => e.concepts);
  const allEntities = extractions.flatMap((e) => e.entities);
  const allFacts = extractions.flatMap((e) => e.facts);
  const allRelationships = extractions.flatMap((e) => e.relationships);

  const uniqueConcepts = Array.from(new Map(allConcepts.map((c) => [c.name, c])).values())
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12);
  const uniqueEntities = Array.from(new Map(allEntities.map((e) => [e.name, e])).values())
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12);

  const conceptsJson = JSON.stringify(uniqueConcepts, null, 2);
  const entitiesJson = JSON.stringify(uniqueEntities, null, 2);

  // Sort facts by their originating chunk's concept/entity importance
  const factsWithImportance = allFacts.map((fact, idx) => {
    const chunkIdx = Math.min(idx, extractions.length - 1);
    const maxImp = Math.max(
      ...extractions[chunkIdx]?.concepts.map((c) => c.importance) || [0],
      ...extractions[chunkIdx]?.entities.map((e) => e.importance) || [0]
    );
    return { fact, importance: maxImp };
  });
  const topFacts = factsWithImportance
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15)
    .map((f) => f.fact);
  const factsText = topFacts.join("\n- ");

  const relsText = allRelationships.slice(0, 12).map((r) => `- ${r.from} → ${r.to}: ${r.relation}`).join("\n");

  return `你是一位顶级知识工程师。请根据以下从文档《${fileName}》中提取的章节分析，生成一个相互关联的 wiki 知识网络。

## 文档主题
${outlineAnalysis.overallTheme || "（未指定）"}

## 各章节摘要
${chapterSummaries}

## 核心概念（按重要性排序）
${conceptsJson}

## 关键实体（按重要性排序）
${entitiesJson}

## 关键事实
- ${factsText}

## 关系网络
${relsText}

## 知识库说明
\`\`\`
${claudeMd.slice(0, 3000)}
\`\`\`

## 现有索引
\`\`\`
${indexMd.slice(0, 3000)}
\`\`\`

## 整理要求

1. **必须生成多个 wiki 页面**（至少 3 个，最多 8 个）：
   - **source**：文档的整体摘要（1个，不超过 600 字）
   - **concept**：核心概念/原理页面（1-3个，每个不超过 400 字）
   - **entity**：重要实体页面（1-3个，每个不超过 400 字）
   - **comparison**：如有对比内容（可选）
   - **synthesis**：如有综合内容（可选）

2. **每个页面必须包含 YAML frontmatter**：
\`\`\`yaml
---
title: "标题"
type: concept | entity | source | comparison | synthesis
tags: [标签1, 标签2]
created: ${today}
updated: ${today}
---
\`\`\`

3. **用 [[页面名]] 建立交叉引用**
4. **不要编造提取信息中没有的内容**
5. **优先整理 importance ≥ 7 的概念和实体**
6. **路径约定**：wiki/concepts/、wiki/entities/、wiki/sources/、wiki/comparisons/、wiki/syntheses/

## 输出格式

每个页面用 === FILE: 路径 === 开始，用 === END FILE === 结束：

=== FILE: wiki/sources/文档摘要.md ===
---
title: "文档摘要"
type: source
...
=== END FILE ===

（继续输出其他页面...）

只返回文件内容，不要添加额外说明。`;
}

async function parseChunkExtraction(replyText: string): Promise<ChunkExtraction> {
  const defaultResult: ChunkExtraction = {
    chapterSummary: "",
    concepts: [],
    entities: [],
    facts: [],
    relationships: [],
  };
  if (!replyText.trim()) return defaultResult;

  const jsonMatch = replyText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return defaultResult;

  try {
    const data = JSON.parse(jsonMatch[0]) as Partial<ChunkExtraction>;
    return {
      chapterSummary: typeof data.chapterSummary === "string" ? data.chapterSummary : "",
      concepts: Array.isArray(data.concepts)
        ? data.concepts
            .filter((c) => c?.name)
            .map((c) => ({
              name: String(c.name),
              definition: typeof c.definition === "string" ? c.definition : "",
              importance: typeof c.importance === "number" ? Math.min(10, Math.max(1, c.importance)) : 5,
            }))
        : [],
      entities: Array.isArray(data.entities)
        ? data.entities
            .filter((e) => e?.name)
            .map((e) => ({
              name: String(e.name),
              description: typeof e.description === "string" ? e.description : "",
              importance: typeof e.importance === "number" ? Math.min(10, Math.max(1, e.importance)) : 5,
            }))
        : [],
      facts: Array.isArray(data.facts) ? data.facts.filter((f) => typeof f === "string") : [],
      relationships: Array.isArray(data.relationships)
        ? data.relationships.filter((r) => r?.from && r?.to)
        : [],
    };
  } catch {
    return defaultResult;
  }
}

export async function organizeFile(relativePath: string): Promise<OrganizeResult> {
  setOrganizeStatus(relativePath, [], { status: "processing", progress: 10 });
  try {
    const basePath = getKbBasePath();
    const rawFilePath = resolveKbPath(relativePath);
    const rawContent = await extractTextFromFile(rawFilePath);
    const fileName = basename(relativePath);

    // Remove old auto-imported source page(s) for this raw file before re-organizing
    await removeAutoImportedSourcePage(relativePath, basePath);

    const claudeMdPath = join(basePath, "claude.md");
    const indexMdPath = join(basePath, "wiki", "index.md");

    const claudeMd = await safeReadFile(claudeMdPath);
    const indexMd = await safeReadFile(indexMdPath);

    let pages: WikiPage[] = [];
    const LARGE_FILE_THRESHOLD = 15000;

    if (rawContent.length > LARGE_FILE_THRESHOLD) {
      // --- Large file: two-phase chunking approach with outline analysis ---
      logger.info(`[KnowledgeBase] Large file detected (${rawContent.length} chars), using chunking strategy`);

      // Step 1: Extract and analyze outline
      let outlineAnalysis: OutlineAnalysis = {
        keySections: [],
        skipSections: [],
        overallTheme: "",
        mainConcepts: [],
        mainEntities: [],
      };
      const outline = extractOutline(rawContent);
      if (outline.length > 0) {
        logger.info(`[KnowledgeBase] Document has ${outline.length} outline items, analyzing...`);
        const outlinePrompt = buildOutlinePrompt(outline, fileName);
        const outlineResult = await chatSend(ORGANIZE_SESSION, outlinePrompt);
        if (!outlineResult.error) {
          outlineAnalysis = await parseOutlineAnalysis(outlineResult.content || "");
          logger.info(
            `[KnowledgeBase] Outline analysis: theme="${outlineAnalysis.overallTheme.slice(0, 50)}", keySections=${outlineAnalysis.keySections.length}, skipSections=${outlineAnalysis.skipSections.length}`
          );
        }
      }

      // Step 2: Split with preserve-boundaries (never merge across headings)
      const MAX_CHUNKS = 20;
      let chunks = splitIntoChunks(rawContent, { maxChunkSize: 6000, preserveBoundaries: true });
      if (chunks.length > MAX_CHUNKS) {
        logger.warn(`[KnowledgeBase] Too many chunks (${chunks.length}), truncating to ${MAX_CHUNKS}`);
        chunks = chunks.slice(0, MAX_CHUNKS);
      }
      logger.info(`[KnowledgeBase] Split into ${chunks.length} chunks (preserve-boundaries)`);

      // Step 3: Organize each chapter independently
      const extractions: ChunkExtraction[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkPrompt = buildChunkExtractionPrompt(chunks[i], fileName, i, chunks.length, outlineAnalysis.overallTheme);
        logger.info(`[KnowledgeBase] Organizing chunk ${i + 1}/${chunks.length}`);

        let chunkResult = await chatSend(ORGANIZE_SESSION, chunkPrompt);
        if (chunkResult.error) {
          logger.warn(`[KnowledgeBase] Chunk ${i + 1} failed, retrying...`, chunkResult.error);
          await new Promise((r) => setTimeout(r, 2000)); // 2s backoff
          chunkResult = await chatSend(ORGANIZE_SESSION, chunkPrompt);
          if (chunkResult.error) {
            logger.warn(`[KnowledgeBase] Chunk ${i + 1} retry failed:`, chunkResult.error);
            continue;
          }
        }
        const extraction = await parseChunkExtraction(chunkResult.content || "");
        if (!extraction.chapterSummary && extraction.concepts.length === 0 && extraction.entities.length === 0) {
          logger.info(`[KnowledgeBase] Chunk ${i + 1} is a skip-section (no meaningful content)`);
          continue;
        }
        extractions.push(extraction);
        logger.info(
          `[KnowledgeBase] Chunk ${i + 1} organized: summary="${extraction.chapterSummary.slice(0, 40)}...", ${extraction.concepts.length} concepts, ${extraction.entities.length} entities`
        );
      }

      if (extractions.length === 0) {
        logger.warn("[KnowledgeBase] All chunks returned empty, falling back to default page");
        const defaultPage = generateDefaultPage(rawContent, fileName);
        pages = [defaultPage];
      } else {
        const synthesisPrompt = buildSynthesisPrompt(extractions, fileName, claudeMd, indexMd, outlineAnalysis);
        logger.info("[KnowledgeBase] Synthesizing wiki pages from chapter analyses...");

        const synthResult = await chatSend(ORGANIZE_SESSION, synthesisPrompt);
        if (synthResult.error) {
          logger.error("[KnowledgeBase] Synthesis failed:", synthResult.error);
          const defaultPage = generateDefaultPage(rawContent, fileName);
          pages = [defaultPage];
        } else {
          pages = parseWikiPages(synthResult.content || "");
          if (pages.length === 0) {
            logger.warn("[KnowledgeBase] Synthesis returned no pages, falling back");
            const defaultPage = generateDefaultPage(rawContent, fileName);
            pages = [defaultPage];
          }
        }
      }
    } else {
      // --- Small file: single-pass approach ---
      const prompt = buildOrganizePrompt(rawContent, fileName, claudeMd, indexMd);
      logger.info("[KnowledgeBase] Starting AI organize for:", fileName);

      const aiResult = await chatSend(ORGANIZE_SESSION, prompt);

      if (aiResult.error) {
        logger.error("[KnowledgeBase] AI organize failed:", aiResult.error);
        const defaultPage = generateDefaultPage(rawContent, fileName);
        pages = [defaultPage];
      } else {
        const replyText = aiResult.content || "";
        pages = parseWikiPages(replyText);

        if (pages.length === 0 && replyText.trim()) {
          const defaultPage = generateDefaultPage(replyText, fileName);
          pages = [defaultPage];
        }
      }
    }

    if (pages.length === 0) {
      const defaultPage = generateDefaultPage(rawContent, fileName);
      pages = [defaultPage];
    }

    // Resolve empty paths (fallback pages)
    for (const page of pages) {
      if (!page.path) {
        const title = inferTitleFromContent(page.content, "untitled");
        const type = inferTypeFromContent(page.content, title);
        const slug = slugify(title) || "untitled";
        const dir =
          type === "concept" ? "wiki/concepts" :
          type === "entity" ? "wiki/entities" :
          type === "comparison" ? "wiki/comparisons" :
          type === "synthesis" ? "wiki/syntheses" :
          "wiki/sources";
        page.path = `${dir}/${slug}.md`;
      }
    }

    // Write all pages
    for (const page of pages) {
      const destPath = resolveKbPath(page.path);
      await mkdir(dirname(destPath), { recursive: true });
      await writeFile(destPath, page.content, "utf-8");
      logger.info("[KnowledgeBase] Written wiki page:", page.path);

      // Trigger vector index build asynchronously (fire-and-forget but with error logging)
      try {
        const indexer = getDefaultIndexer();
        const pageTitle = inferTitleFromContent(page.content, basename(page.path, ".md"));
        const pageType = inferTypeFromContent(page.content, pageTitle);
        indexer.indexFile(page.path, page.content, {
          title: pageTitle,
          type: pageType,
          tags: ["ai-organized"],
        }).then((job) => {
          logger.info(`[KnowledgeBase] Vector index job ${job.id} started for ${page.path}`);
        }).catch((err) => {
          logger.warn("[KnowledgeBase] Failed to trigger vector index for page:", page.path, err);
        });
      } catch (err) {
        logger.warn("[KnowledgeBase] Failed to trigger vector index for page:", page.path, err);
      }
    }

    await updateIndexMd(pages, basePath);
    await appendLogMd(fileName, pages, basePath);

    // Persist organize status so frontend can show "已整理" for raw files
    const wikiPaths = pages.map((p) => p.path).filter(Boolean) as string[];
    setOrganizeStatus(relativePath, wikiPaths, { status: "completed", progress: 100 });

    return {
      success: true,
      pages,
      wikiPath: pages[0]?.path,
      summary: `已整理为 ${pages.length} 个 wiki 页面` + (rawContent.length > LARGE_FILE_THRESHOLD ? "（大文件分块处理）" : ""),
    };
  } catch (error) {
    logger.error("[KnowledgeBase] Organize error:", error);
    setOrganizeStatus(relativePath, [], {
      status: "failed",
      progress: 0,
      errorMessage: error instanceof Error ? error.message : "未知错误",
    });
    return {
      success: false,
      pages: [],
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

// --- KB Query Support ---

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
        files.push(relative(basePath, fullPath));
      }
    }
  } catch {
    // ignore
  }
  return files;
}

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function scoreRelevance(filePath: string, content: string, keywords: string[]): number {
  const basenameLower = basename(filePath, ".md").toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (basenameLower.includes(kw)) score += 10;
    if (content.toLowerCase().includes(kw)) score += 1;
  }
  return score;
}

async function buildKbContextFallback(query: string): Promise<string | null> {
  try {
    const basePath = getKbBasePath();
    const keywords = extractKeywords(query);
    if (keywords.length === 0) return null;

    // 1. 先搜索 wiki
    const wikiDir = join(basePath, "wiki");
    let topMatches: { filePath: string; content: string; score: number }[] = [];

    if (existsSync(wikiDir)) {
      const wikiFiles = await listWikiFiles(wikiDir, basePath);
      if (wikiFiles.length > 0) {
        const scored = await Promise.all(
          wikiFiles.map(async (filePath) => {
            const content = await safeReadFile(resolveKbPath(filePath));
            const score = scoreRelevance(filePath, content, keywords);
            return { filePath, content, score };
          })
        );
        topMatches = scored
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
      }
    }

    // 2. wiki 无结果时兜底搜索 raw/
    if (topMatches.length === 0) {
      const rawDir = join(basePath, "raw");
      if (existsSync(rawDir)) {
        const rawFiles = await listWikiFiles(rawDir, basePath);
        if (rawFiles.length > 0) {
          const scored = await Promise.all(
            rawFiles.map(async (filePath) => {
              let content = "";
              try {
                content = await extractTextFromFile(resolveKbPath(filePath));
              } catch {
                content = "";
              }
              const score = scoreRelevance(filePath, content.slice(0, 2000), keywords);
              return { filePath, content: content.slice(0, 2000), score };
            })
          );
          topMatches = scored
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

          if (topMatches.length > 0) {
            const contextParts = topMatches.map((m) => {
              const title = basename(m.filePath, ".md") || m.filePath;
              return `--- 原始文件: ${title} ---\n${m.content.slice(0, 3000)}`;
            });
            return `[知识库上下文 - 基于用户问题检索到的相关原始文件]\n\n${contextParts.join("\n\n")}\n\n[知识库上下文结束]`;
          }
        }
      }
      return null;
    }

    const contextParts = topMatches.map((m) => {
      const title = basename(m.filePath, ".md");
      return `--- 知识库页面: ${title} ---\n${m.content.slice(0, 3000)}`;
    });

    return `[知识库上下文 - 基于用户问题检索到的相关页面，回答时请优先参考这些内容]\n\n${contextParts.join("\n\n")}\n\n[知识库上下文结束]`;
  } catch (error) {
    logger.error("[KnowledgeBase] buildKbContextFallback error:", error);
    return null;
  }
}

// Extract [[PageName]] links from wiki content
function extractWikiLinks(content: string): string[] {
  const links: string[] = [];
  const pattern = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const linkName = match[1].trim();
    if (linkName && !links.includes(linkName)) {
      links.push(linkName);
    }
  }
  return links;
}

// Find wiki file by page name (case-insensitive, across all wiki subdirs)
async function findWikiFileByName(pageName: string, basePath: string): Promise<string | null> {
  const wikiDir = join(basePath, "wiki");
  if (!existsSync(wikiDir)) return null;

  const allFiles = await listWikiFiles(wikiDir, basePath);
  const lowerName = pageName.toLowerCase();

  for (const filePath of allFiles) {
    const fileBase = basename(filePath, ".md").toLowerCase();
    if (fileBase === lowerName) {
      return filePath;
    }
  }
  return null;
}

// Build expanded KB context with wiki link graph traversal
async function buildExpandedKbContext(
  topResults: HybridSearchResult[],
  basePath: string
): Promise<string[]> {
  const contextParts: string[] = [];
  const visitedPages = new Set<string>(); // Track by title to avoid duplicates
  const maxLinkedPages = 3; // Max additional linked pages to include
  let linkedCount = 0;

  for (const r of topResults) {
    const meta = r.metadata as Record<string, unknown>;
    const title = (meta?.title as string) || (meta?.heading as string) || "未知";
    const type = (meta?.type as string) || "source";
    const tags = Array.isArray(meta?.tags) ? (meta.tags as string[]).join(", ") : "";
    const content = (r.content || "").slice(0, 2000);
    const tagsStr = tags ? `, 标签: ${tags}` : "";

    contextParts.push(`--- 知识库片段 [${title}] (类型: ${type}${tagsStr}) ---\n${content}`);
    visitedPages.add(title.toLowerCase());

    // Extract and traverse wiki links
    if (r.content) {
      const links = extractWikiLinks(r.content);
      for (const linkName of links) {
        if (visitedPages.has(linkName.toLowerCase())) continue;
        if (linkedCount >= maxLinkedPages) break;

        const linkedFile = await findWikiFileByName(linkName, basePath);
        if (linkedFile) {
          const linkedContent = await safeReadFile(resolveKbPath(linkedFile));
          if (linkedContent.trim()) {
            const linkedTitle = basename(linkedFile, ".md");
            contextParts.push(
              `--- 关联知识 [${linkedTitle}]（由 [[${linkName}]] 链接发现）---\n${linkedContent.slice(0, 1500)}`
            );
            visitedPages.add(linkName.toLowerCase());
            linkedCount++;
          }
        }
      }
    }
  }

  return contextParts;
}

export interface KbContextResult {
  context: string | null;
  sources: HybridSearchResult[];
}

export async function buildKbContextWithSources(query: string): Promise<KbContextResult> {
  const startTime = Date.now();
  try {
    logger.info(`[KBContext] Searching knowledge base for: "${query.slice(0, 60)}..."`);

    // Use hybrid search (vector + BM25) for primary retrieval
    const { hybridSearch } = await import("./search.js");
    const results = await hybridSearch(query);

    if (results.length > 0) {
      // Build expanded context with wiki link traversal
      const expanded = await buildExpandedKbContext(results, getKbBasePath());
      const sourcesText = results
        .map((r) => `[来源: ${(r.metadata as any)?.filePath || "unknown"}]`)
        .join(", ");
      logger.info(`[KBContext] Wiki search found ${results.length} results in ${Date.now() - startTime}ms (${sourcesText})`);
      return {
        context: `[知识库上下文 - 基于4层混合检索（向量+BM25+结构化+图谱）生成，回答时请优先参考这些内容]\n\n${expanded.join("\n\n")}\n\n[知识库上下文结束]`,
        sources: results,
      };
    }

    // Fallback: keyword search over raw files
    const fallback = await buildKbContextFallback(query);
    if (fallback) {
      logger.info(`[KBContext] Fallback search found results in ${Date.now() - startTime}ms`);
      return { context: fallback, sources: [] };
    }

    logger.info(`[KBContext] No results found, took ${Date.now() - startTime}ms`);
    return { context: null, sources: [] };
  } catch (error) {
    logger.warn("[KBContext] Search failed:", error);
    return { context: null, sources: [] };
  }
}

export async function buildKbContext(query: string): Promise<string | null> {
  const result = await buildKbContextWithSources(query);
  return result.context;
}

async function buildKbTree(dirPath: string, basePath: string): Promise<any[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes = [];

  for (const entry of entries) {
    const entryPath = join(dirPath, entry.name);
    const relPath = relative(basePath, entryPath).replace(/\\/g, "/");
    const node: any = {
      key: relPath,
      title: entry.name,
      path: relPath,
      isDirectory: entry.isDirectory(),
    };

    if (entry.isDirectory()) {
      node.children = await buildKbTree(entryPath, basePath);
    }

    nodes.push(node);
  }

  nodes.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.title.localeCompare(b.title);
    }
    return a.isDirectory ? -1 : 1;
  });

  return nodes;
}

export async function createSourcePageFromRaw(relativePath: string): Promise<string> {
  const basePath = getKbBasePath();
  const rawFilePath = resolveKbPath(relativePath);
  const rawContent = await extractTextFromFile(rawFilePath);
  const title = basename(relativePath, extname(relativePath));
  const slug = slugify(title) || "untitled";
  const today = new Date().toISOString().split("T")[0];
  const targetPath = `wiki/sources/${slug}.md`;
  const absTargetPath = resolveKbPath(targetPath);

  const content = `---
title: "${title}"
type: source
tags: [auto-imported]
created: ${today}
updated: ${today}
source: "${toPosixPath(relativePath)}"
---

# ${title}

> 该页面由系统自动导入原始文件生成。

${rawContent.slice(0, 8000)}
`;

  await mkdir(dirname(absTargetPath), { recursive: true });
  await writeFile(absTargetPath, content, "utf-8");
  await updateIndexMd([{ path: targetPath, content }], basePath);

  // Trigger vector index build asynchronously (fire-and-forget)
  try {
    const indexer = getDefaultIndexer();
    indexer.indexFile(targetPath, content, {
      title,
      type: "source",
      tags: ["auto-imported"],
    });
  } catch (err) {
    logger.warn("[KnowledgeBase] Failed to trigger vector index:", err);
  }

  return toPosixPath(targetPath);
}

export async function getKbTree(): Promise<any[]> {
  await ensureKbInitialized();
  const basePath = getKbBasePath();
  return buildKbTree(basePath, basePath);
}
