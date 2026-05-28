import { createHash } from "node:crypto";
import { extname } from "node:path";

export interface Chunk {
  id: string;
  content: string;
  metadata: {
    title: string;
    type: string;
    tags: string[];
    heading?: string;
    filePath: string;
    index: number;
  };
}

const MAX_CHUNK_CHARS = 4000; // ~2000 tokens, 20% margin for embedding models with 8K context

function hashFilePath(filePath: string): string {
  return createHash("md5").update(filePath).digest("hex").slice(0, 8);
}

function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const raw = match[1];
  const fm: Record<string, unknown> = {};
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();

      // Check if next lines are list items (YAML list format)
      if (value === "" && i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        const listItems: string[] = [];
        i++;
        while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
          const item = lines[i].replace(/^\s+-\s+/, "").trim().replace(/^["'](.*)["']$/, "$1");
          if (item) listItems.push(item);
          i++;
        }
        fm[key] = listItems;
        continue; // i already advanced
      }

      // Remove surrounding quotes
      value = value.replace(/^["'](.*)["']$/, "$1");
      // Parse arrays like [tag1, tag2]
      if (value.startsWith("[") && value.endsWith("]")) {
        fm[key] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["'](.*)["']$/, "$1"));
      } else {
        fm[key] = value;
      }
    }
    i++;
  }

  return { frontmatter: fm, body: content.slice(match[0].length) };
}

function extractH1(body: string): string | undefined {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : undefined;
}

/** 从文件扩展名推断文档类型 */
function inferTypeFromExtension(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  const typeMap: Record<string, string> = {
    ".pdf": "document",
    ".doc": "document",
    ".docx": "document",
    ".txt": "text",
    ".md": "markdown",
    ".xls": "spreadsheet",
    ".xlsx": "spreadsheet",
    ".csv": "spreadsheet",
    ".ppt": "presentation",
    ".pptx": "presentation",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".gif": "image",
    ".svg": "image",
    ".html": "webpage",
    ".htm": "webpage",
    ".json": "data",
    ".xml": "data",
    ".yaml": "data",
    ".yml": "data",
    ".js": "code",
    ".ts": "code",
    ".py": "code",
    ".java": "code",
    ".go": "code",
    ".rs": "code",
    ".cpp": "code",
    ".c": "code",
    ".sql": "code",
  };
  return typeMap[ext];
}

function inferTypeFromContent(content: string, title: string, filePath: string): string {
  const lower = (content + " " + title).toLowerCase();
  if (/产品|方案|架构|协议|标准|模型|方法|模式|原理|概念/.test(lower)) return "concept";
  if (/公司|团队|人名|客户|项目|工具|平台|系统|设备/.test(lower)) return "entity";
  // fallback: 从文件扩展名推断
  return inferTypeFromExtension(filePath) || "source";
}

/** 从文件扩展名推断标签 */
function inferTagsFromExtension(filePath: string): string[] {
  const ext = extname(filePath).toLowerCase();
  const tagMap: Record<string, string[]> = {
    ".pdf": ["PDF"],
    ".doc": ["Word"],
    ".docx": ["Word"],
    ".xls": ["Excel"],
    ".xlsx": ["Excel"],
    ".csv": ["CSV"],
    ".ppt": ["PPT"],
    ".pptx": ["PPT"],
    ".png": ["图片"],
    ".jpg": ["图片"],
    ".jpeg": ["图片"],
    ".gif": ["图片"],
    ".svg": ["图片"],
    ".html": ["网页"],
    ".htm": ["网页"],
    ".json": ["JSON"],
    ".xml": ["XML"],
    ".yaml": ["YAML"],
    ".yml": ["YAML"],
    ".js": ["JavaScript"],
    ".ts": ["TypeScript"],
    ".py": ["Python"],
    ".java": ["Java"],
    ".go": ["Go"],
    ".rs": ["Rust"],
    ".cpp": ["C++"],
    ".c": ["C"],
    ".sql": ["SQL"],
  };
  return tagMap[ext] || [];
}

function inferTagsFromContent(content: string, title: string, filePath: string): string[] {
  const tags: string[] = [];
  const text = content + " " + title;
  const lower = text.toLowerCase();

  // 1. Hardcoded keyword map (original 20 keywords)
  const keywordMap: Record<string, string> = {
    api: "API",
    http: "HTTP",
    rest: "REST",
    websocket: "WebSocket",
    数据库: "数据库",
    sql: "SQL",
    缓存: "缓存",
    redis: "Redis",
    安全: "安全",
    auth: "认证",
    部署: "部署",
    docker: "Docker",
    kubernetes: "K8s",
    前端: "前端",
    react: "React",
    vue: "Vue",
    算法: "算法",
    ai: "AI",
    llm: "LLM",
    机器学习: "机器学习",
  };
  for (const [kw, tag] of Object.entries(keywordMap)) {
    if (lower.includes(kw)) tags.push(tag);
  }

  // 2. Extract frequently appearing technical terms (capitalized words, 2-4 occurrences)
  const techTermCounts = new Map<string, number>();
  // English technical terms: PascalCase / ALL_CAPS words (2+ letters)
  const engTerms = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b|\b[A-Z]{2,}\b/g) || [];
  for (const term of engTerms) {
    const t = term.trim();
    if (t.length >= 2 && t.length <= 20) {
      techTermCounts.set(t, (techTermCounts.get(t) || 0) + 1);
    }
  }
  // Chinese compound terms: 4-8 char sequences that appear 2+ times
  const cjkChars = text.replace(/[^\u4e00-\u9fa5]/g, "");
  const chineseTerms = new Map<string, number>();
  for (let n = 4; n <= 8; n++) {
    for (let i = 0; i <= cjkChars.length - n; i++) {
      const term = cjkChars.slice(i, i + n);
      chineseTerms.set(term, (chineseTerms.get(term) || 0) + 1);
    }
  }

  // Add English terms that appear 2+ times (up to 3)
  const sortedEng = Array.from(techTermCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([term]) => term);
  for (const term of sortedEng) {
    if (!tags.some((t) => t.toLowerCase() === term.toLowerCase())) {
      tags.push(term);
    }
  }

  // Add Chinese terms that appear 3+ times (up to 2)
  const sortedCn = Array.from(chineseTerms.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([term]) => term);
  for (const term of sortedCn) {
    if (!tags.includes(term)) {
      tags.push(term);
    }
  }

  // 3. 从文件扩展名补充标签（raw 文件无 frontmatter 时的 fallback）
  const extTags = inferTagsFromExtension(filePath);
  for (const tag of extTags) {
    if (!tags.includes(tag)) tags.push(tag);
  }

  return tags.length > 0 ? tags : ["auto-generated"];
}

function splitByH2(body: string): Array<{ heading: string | undefined; text: string }> {
  const lines = body.split("\n");
  const sections: Array<{ heading: string | undefined; text: string }> = [];
  let currentHeading: string | undefined;
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, text: currentLines.join("\n").trim() });
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || sections.length === 0) {
    sections.push({ heading: currentHeading, text: currentLines.join("\n").trim() });
  }

  return sections;
}

function splitByParagraphs(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // If any single paragraph exceeds maxChars, force-split by sentences
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > maxChars) {
      const sentences = chunk.split(/(?<=[。！？.!?])\s*/);
      let buf = "";
      for (const s of sentences) {
        if (buf.length + s.length > maxChars && buf.length > 0) {
          result.push(buf.trim());
          buf = s;
        } else {
          buf += s;
        }
      }
      if (buf.trim()) result.push(buf.trim());
    } else {
      result.push(chunk);
    }
  }

  return result.length > 0 ? result : [text];
}

export function chunkDocument(
  filePath: string,
  markdown: string,
  metadata: { title?: string; type?: string; tags?: string[] } = {}
): Chunk[] {
  const { frontmatter, body } = parseFrontmatter(markdown);

  const title =
    metadata.title ||
    (typeof frontmatter.title === "string" ? frontmatter.title : undefined) ||
    extractH1(body) ||
    "Untitled";

  const type =
    metadata.type ||
    (typeof frontmatter.type === "string" ? frontmatter.type : undefined) ||
    inferTypeFromContent(body, title, filePath);

  const tags =
    metadata.tags ||
    (Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : undefined) ||
    inferTagsFromContent(body, title, filePath);

  const filePathHash = hashFilePath(filePath);
  const h2Sections = splitByH2(body);

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of h2Sections) {
    if (!section.text.trim() && section.heading) {
      // Heading-only section: include minimal context
      const content = section.heading ? `## ${section.heading}\n` : "";
      chunks.push({
        id: `${filePathHash}#${chunkIndex}`,
        content: content.trim(),
        metadata: { title, type, tags, heading: section.heading, filePath, index: chunkIndex },
      });
      chunkIndex++;
      continue;
    }

    const sectionText = section.heading
      ? `## ${section.heading}\n\n${section.text}`
      : section.text;

    if (sectionText.length <= MAX_CHUNK_CHARS) {
      chunks.push({
        id: `${filePathHash}#${chunkIndex}`,
        content: sectionText.trim(),
        metadata: { title, type, tags, heading: section.heading, filePath, index: chunkIndex },
      });
      chunkIndex++;
    } else {
      const subChunks = splitByParagraphs(sectionText, MAX_CHUNK_CHARS);
      for (const sub of subChunks) {
        chunks.push({
          id: `${filePathHash}#${chunkIndex}`,
          content: sub.trim(),
          metadata: { title, type, tags, heading: section.heading, filePath, index: chunkIndex },
        });
        chunkIndex++;
      }
    }
  }

  return chunks;
}
