import { readFile } from "node:fs/promises";
import { extname, basename } from "node:path";

const TEXT_EXTS = new Set([
  ".md",
  ".txt",
  ".json",
  ".csv",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".py",
  ".html",
  ".css",
  ".yaml",
  ".yml",
  ".xml",
  ".sh",
  ".go",
  ".java",
  ".rb",
  ".php",
  ".c",
  ".cpp",
  ".h",
  ".rs",
  ".swift",
  ".kt",
  ".scala",
  ".sql",
  ".log",
]);

// Extensions that our extractors can handle for text extraction
const EXTRACTABLE_EXTS = new Set([
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx",
]);

export interface ExtractionResult {
  markdown: string;
  metadata: {
    title?: string;
    type?: string;
    tags?: string[];
  };
}

// --- File type detection ---

async function detectFileType(filePath: string, ext: string): Promise<string> {
  // 1. Extension-based
  if (ext) return ext;

  // 2. Magic number detection for extensionless files
  try {
    const header = await readFile(filePath);
    const buf = header.slice(0, 8);
    if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
      return ".pdf";
    }
    if (
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      buf[2] === 0x03 &&
      buf[3] === 0x04
    ) {
      // ZIP-based: could be docx/xlsx/pptx, need deeper inspection
      return await detectZipBasedType(filePath);
    }
  } catch {
    // ignore
  }

  return "";
}

async function detectZipBasedType(filePath: string): Promise<string> {
  try {
    const buffer = await readFile(filePath);
    const content = buffer.toString("utf-8", 0, Math.min(buffer.length, 4096));
    if (content.includes("word/")) return ".docx";
    if (content.includes("xl/")) return ".xlsx";
    if (content.includes("ppt/")) return ".pptx";
  } catch {
    // ignore
  }
  return ".zip";
}

// --- Extractors ---

async function extractFromText(filePath: string): Promise<string> {
  return await readFile(filePath, "utf-8");
}

async function extractFromPdf(filePath: string): Promise<string> {
  // Try pdf2md first for structured markdown (optional dependency)
  try {
    const pdf2md = await import("@opendoc/pdf2md");
    if (pdf2md && typeof pdf2md.convert === "function") {
      const buffer = await readFile(filePath);
      const result = await pdf2md.convert(buffer);
      if (result && typeof result === "string" && result.trim().length > 0) {
        return result;
      }
    }
  } catch {
    // pdf2md not installed or failed, fallback to pdf-parse
  }

  // Fallback: pdf-parse with heuristic paragraph segmentation
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = (pdfParseModule as unknown as { PDFParse: typeof pdfParseModule.PDFParse }).PDFParse;
  const buffer = await readFile(filePath);
  const parser = new pdfParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text || "";
    return segmentPdfText(text);
  } finally {
    await parser.destroy?.();
  }
}

function segmentPdfText(text: string): string {
  // Heuristic: split by 2+ consecutive newlines into paragraphs
  // Detect potential headings (short lines followed by blank line)
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let currentParagraph: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    const trimmed = line.trim();

    if (trimmed === "") {
      if (currentParagraph.length > 0) {
        result.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
      continue;
    }

    // Heuristic heading: short line (< 80 chars), no punctuation at end, followed by blank or next short line
    const isHeading =
      trimmed.length < 80 &&
      !/[.!?;:,。！？；：，]$/.test(trimmed) &&
      (!nextLine || nextLine.trim() === "" || nextLine.trim().length < 80);

    if (isHeading && currentParagraph.length === 0) {
      result.push(`## ${trimmed}`);
      // Skip the next blank line if it exists
      if (nextLine && nextLine.trim() === "") {
        i++;
      }
      continue;
    }

    currentParagraph.push(trimmed);
  }

  if (currentParagraph.length > 0) {
    result.push(currentParagraph.join(" "));
  }

  return result.join("\n\n");
}

async function extractFromDocx(filePath: string, toMarkdown = false): Promise<string> {
  const mammoth = await import("mammoth");
  if (toMarkdown) {
    // @ts-expect-error mammoth types don't declare convertToMarkdown but the function exists at runtime
    const result = await mammoth.convertToMarkdown({ path: filePath });
    return result.value || "";
  }
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

async function extractFromXlsx(filePath: string): Promise<string> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const parts: string[] = [];

  workbook.eachSheet((worksheet) => {
    const sheetName = worksheet.name;
    const rows: unknown[][] = [];
    worksheet.eachRow((row) => {
      rows.push(row.values as unknown[]);
    });
    if (rows.length === 0) return;

    parts.push(`## ${sheetName}`);

    // Build markdown table
    const mdRows = rows.map((row) =>
      (row as unknown[]).slice(1).map((cell) => {
        const str = String(cell ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
        return str;
      })
    );

    if (mdRows.length > 0) {
      // Header
      parts.push("| " + mdRows[0].join(" | ") + " |");
      // Separator
      parts.push("| " + mdRows[0].map(() => "---").join(" | ") + " |");
      // Data rows
      for (let i = 1; i < mdRows.length; i++) {
        parts.push("| " + mdRows[i].join(" | ") + " |");
      }
    }

    parts.push("");
  });

  return parts.join("\n").trim();
}

async function extractFromPptx(filePath: string): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const buffer = await readFile(filePath);
    const zip = await JSZip.loadAsync(buffer);

    // Parse presentation metadata
    let title = basename(filePath, extname(filePath));
    const appXml = zip.file("docProps/app.xml");
    if (appXml) {
      const appContent = await appXml.async("text");
      const titleMatch = appContent.match(/<Title>([^<]*)<\/Title>/);
      if (titleMatch && titleMatch[1].trim()) {
        title = titleMatch[1].trim();
      }
    }

    // Parse slide relationships to get slide order
    const relsFile = zip.file("ppt/_rels/presentation.xml.rels");
    const slideRels: { id: string; target: string }[] = [];
    if (relsFile) {
      const relsContent = await relsFile.async("text");
      const relMatches = relsContent.matchAll(
        /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+slide\d+\.xml)"[^>]*Type="[^"]*slide"[^>]*\/>/gi
      );
      for (const match of relMatches) {
        slideRels.push({ id: match[1], target: match[2] });
      }
    }

    // Sort slides by target name (slide1.xml, slide2.xml, ...)
    slideRels.sort((a, b) => {
      const numA = parseInt(a.target.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
      const numB = parseInt(b.target.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
      return numA - numB;
    });

    const parts: string[] = [];
    parts.push(`# ${title}\n`);

    for (let i = 0; i < slideRels.length; i++) {
      const rel = slideRels[i];
      const slidePath = `ppt/${rel.target}`;
      const slideFile = zip.file(slidePath);
      if (!slideFile) continue;

      const slideContent = await slideFile.async("text");
      parts.push(`## 第${i + 1}页`);

      // Extract text from slide XML
      // PowerPoint slide XML has text in <a:t> elements within <a:p> (paragraph) elements
      const texts: string[] = [];
      const paragraphMatches = slideContent.matchAll(/<a:p[^>]*>(.*?)<\/a:p>/gs);

      for (const pMatch of paragraphMatches) {
        const paragraphXml = pMatch[1];
        // Extract all text runs
        const textRuns: string[] = [];
        const textMatches = paragraphXml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g);
        for (const tMatch of textMatches) {
          if (tMatch[1]) textRuns.push(tMatch[1]);
        }

        if (textRuns.length > 0) {
          const fullText = textRuns.join("").trim();
          if (fullText) {
            // Check if it's a bullet point (has <a:buChar> or <a:buAutoNum> in the paragraph)
            const isBullet = /<a:buChar|<a:buAutoNum|<a:buNone/.test(paragraphXml);
            if (isBullet && !texts.includes(fullText)) {
              texts.push(`- ${fullText}`);
            } else {
              texts.push(fullText);
            }
          }
        }
      }

      if (texts.length > 0) {
        parts.push(texts.join("\n"));
      }
      parts.push("");
    }

    return parts.join("\n").trim();
  } catch {
    return `<!-- PPTX 解析失败: ${basename(filePath)} -->`;
  }
}

// --- Metadata inference ---

function inferTitle(markdown: string, fallback: string): string {
  // Try H1
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  // Try first non-empty line if short
  const firstLine = markdown.split(/\r?\n/).find((l) => l.trim());
  if (firstLine && firstLine.length < 100) return firstLine.trim().replace(/^#+\s*/, "");
  return fallback;
}

function inferType(content: string, title: string): string {
  const lower = (content + " " + title).toLowerCase();
  if (/产品|方案|架构|协议|标准|模型|方法|模式|原理|概念/.test(lower)) return "concept";
  if (/公司|团队|客户|项目|工具|平台|系统|设备/.test(lower)) return "entity";
  return "source";
}

function inferTags(content: string): string[] {
  const tags = new Set<string>();

  // Extract from YAML frontmatter if present
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatter) {
    const fm = frontmatter[1];
    const tagMatch = fm.match(/tags:\s*\[?([^\]]+)\]?/);
    if (tagMatch) {
      tagMatch[1]
        .split(/[,，]/)
        .map((t) => t.trim().replace(/^["']|["']$/g, ""))
        .filter((t) => t.length > 0)
        .forEach((t) => tags.add(t));
    }
  }

  // Extract Chinese words (2-6 chars)
  const chineseWords = content.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  const chineseFreq = new Map<string, number>();
  for (const w of chineseWords) {
    // Skip common stop words
    if (
      /^(的|了|在|是|我|有|和|就|不|人|都|一|一个|上|也|很|到|说|要|去|你|会|着|没有|看|好|自己|这|那|可以|但是|因为|所以|如果|然后|现在|今天|明天|昨天|我们|他们|你们|这个|那个|这里|那里|这样|那样|什么|怎么|为什么|如何|一些|这些|那些|需要|进行|使用|通过|作为|已经|开始|结束|完成|进行|进行|进行)$/.test(
        w
      )
    )
      continue;
    chineseFreq.set(w, (chineseFreq.get(w) || 0) + 1);
  }

  // Extract English words (3+ chars)
  const englishWords = content.match(/[a-zA-Z]{3,}/g) || [];
  const englishFreq = new Map<string, number>();
  for (const w of englishWords) {
    const lower = w.toLowerCase();
    if (
      /^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use|with|have|this|will|your|from|they|know|want|been|good|much|some|time|very|when|come|here|just|like|long|make|many|over|such|take|than|them|well|were)$/.test(
        lower
      )
    )
      continue;
    englishFreq.set(lower, (englishFreq.get(lower) || 0) + 1);
  }

  // Sort by frequency and take top meaningful words
  const sortedChinese = Array.from(chineseFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const sortedEnglish = Array.from(englishFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  // Combine: frontmatter tags first, then Chinese, then English
  const combined = [...tags, ...sortedChinese, ...sortedEnglish];
  return combined.slice(0, 5);
}

// --- Public API ---

/**
 * Unified document extraction interface.
 * Returns structured Markdown with inferred metadata.
 */
export async function extractDocument(filePath: string): Promise<ExtractionResult> {
  const rawExt = extname(filePath).toLowerCase();
  const detectedExt = await detectFileType(filePath, rawExt);
  const ext = detectedExt || rawExt;
  const fallbackTitle = basename(filePath, extname(filePath));

  let markdown: string;

  if (TEXT_EXTS.has(ext)) {
    markdown = await extractFromText(filePath);
  } else if (ext === ".pdf") {
    markdown = await extractFromPdf(filePath);
  } else if (ext === ".docx") {
    markdown = await extractFromDocx(filePath, true);
  } else if (ext === ".xlsx") {
    markdown = await extractFromXlsx(filePath);
  } else if (ext === ".pptx") {
    markdown = await extractFromPptx(filePath);
  } else {
    throw new Error(
      `不支持的文件格式: ${ext}，请转换为 Markdown 或纯文本后上传`
    );
  }

  const title = inferTitle(markdown, fallbackTitle);
  const type = inferType(markdown, title);
  const tags = inferTags(markdown);

  return {
    markdown,
    metadata: { title, type, tags },
  };
}

/**
 * Legacy text extraction interface (backward compatible).
 * Returns plain text / markdown string.
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  const result = await extractDocument(filePath);
  return result.markdown;
}

/**
 * Legacy markdown extraction interface (backward compatible).
 * Same as extractTextFromFile for most formats, but ensures DOCX is converted to Markdown.
 */
export async function extractContentToMarkdown(filePath: string): Promise<string> {
  const rawExt = extname(filePath).toLowerCase();
  const detectedExt = await detectFileType(filePath, rawExt);
  const ext = detectedExt || rawExt;

  if (TEXT_EXTS.has(ext)) {
    return await extractFromText(filePath);
  }

  if (ext === ".pdf") {
    return await extractFromPdf(filePath);
  }

  if (ext === ".docx") {
    return await extractFromDocx(filePath, true);
  }

  if (ext === ".xlsx") {
    return await extractFromXlsx(filePath);
  }

  if (ext === ".pptx") {
    return await extractFromPptx(filePath);
  }

  throw new Error(
    `不支持的文件格式: ${ext}，请转换为 Markdown 或纯文本后上传`
  );
}

// Re-export for consumers that need the extension list
export { TEXT_EXTS, EXTRACTABLE_EXTS };
