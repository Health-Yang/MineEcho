import { compactToolOutput } from "../tokenjuice/index.js";
import { logger } from "../utils/logger.js";

export interface CleanUrlImportResult {
  text: string;
  stats: {
    rawChars: number;
    cleanedChars: number;
    tokenJuiceChars: number;
    reductionRatio: number;
  };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCodePoint(value) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const value = Number.parseInt(code, 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : "";
    });
}

function extractReadableHtml(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(nav|footer|aside|form|iframe|svg|canvas|header)\b[\s\S]*?<\/\1>/gi, "");

  const title = withoutNoise.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const mainMatch =
    withoutNoise.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
    withoutNoise.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
    withoutNoise.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const body = mainMatch?.[1] || withoutNoise;

  const withStructure = body
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, "\n#### $1\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|tr|blockquote)>/gi, "\n")
    .replace(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "");

  const text = decodeHtmlEntities(withStructure)
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(cookie|cookies|privacy policy|terms of use|sign in|log in|subscribe)$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const cleanTitle = title ? decodeHtmlEntities(title).replace(/\s+/g, " ").trim() : "";
  if (cleanTitle && !text.startsWith("# ")) {
    return `# ${cleanTitle}\n\n${text}`.trim();
  }
  return text;
}

function normalizePlainText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n")
    .trim();
}

export async function cleanUrlImportContent(input: {
  rawText: string;
  contentType?: string;
  url?: string;
}): Promise<CleanUrlImportResult> {
  const contentType = input.contentType || "";
  const isHtml = contentType.includes("text/html") || /<html[\s>]|<body[\s>]|<article[\s>]|<main[\s>]/i.test(input.rawText);
  const readable = isHtml ? extractReadableHtml(input.rawText) : normalizePlainText(input.rawText);

  let tokenJuiceText = readable;
  try {
    const compacted = await compactToolOutput(
      {
        toolName: isHtml ? "web_fetch" : "fetch_url",
        command: input.url ? `fetch_url ${input.url}` : "fetch_url",
        stdout: readable,
        exitCode: 0,
      },
      { maxInlineChars: Math.max(12000, readable.length) }
    );
    tokenJuiceText = compacted.inlineText;
  } catch (error) {
    logger.warn("[KnowledgeBase] TokenLess URL cleanup failed:", { error: (error as Error).message });
  }

  return {
    text: tokenJuiceText,
    stats: {
      rawChars: input.rawText.length,
      cleanedChars: readable.length,
      tokenJuiceChars: tokenJuiceText.length,
      reductionRatio: input.rawText.length > 0 ? tokenJuiceText.length / input.rawText.length : 1,
    },
  };
}
