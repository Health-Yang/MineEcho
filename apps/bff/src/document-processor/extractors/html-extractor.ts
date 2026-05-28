/**
 * HTML Extractor - Extract and clean content from HTML web pages
 *
 * Converts HTML to Markdown-like format for efficient LLM processing.
 */

import { DocumentExtractionOptions, DocumentExtractionResult, DocumentMetadata } from '../types.js';
import { ExtractionError, DocumentType } from '../types.js';
import { cleanText, truncateText } from '../types.js';

interface HtmlExtractionOptions extends DocumentExtractionOptions {
  /** Extract main content only (skip nav, footer, sidebar) */
  mainContentOnly?: boolean;
  /** Convert relative URLs to absolute */
  baseUrl?: string;
}

/**
 * Extract clean text content from HTML.
 * Note: This is a lightweight extractor without external dependencies.
 * For production use, consider adding cheerio.
 */
export async function extractFromHtml(
  html: string,
  url: string,
  options: HtmlExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  const {
    maxChars = 10000,
    includeMetadata = true,
    mainContentOnly = true,
    baseUrl,
  } = options;

  const warnings: string[] = [];
  let metadata: DocumentMetadata = {
    type: DocumentType.HTML,
    filename: url,
    url,
  };

  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      metadata.title = decodeHtmlEntities(titleMatch[1].trim());
      if (includeMetadata) {
        warnings.push(`Page title: "${metadata.title}"`);
      }
    }

    // Extract language
    const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
    if (langMatch) {
      metadata.language = langMatch[1];
    }

    // Extract main content
    let text: string;

    if (mainContentOnly) {
      text = extractMainContent(html);
    } else {
      text = htmlToText(html);
    }

    // Clean and truncate
    text = cleanText(text);

    const originalSize = Buffer.byteLength(html, 'utf-8');
    const extractedSize = text.length;

    if (text.length > maxChars) {
      text = truncateText(text, maxChars);
      warnings.push(`Content truncated to ${maxChars} characters`);
    }

    // Word count
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    return {
      text,
      metadata,
      wordCount,
      originalSize,
      extractedSize: text.length,
      compressionRatio: extractedSize / originalSize,
      warnings,
    };
  } catch (error) {
    throw new ExtractionError(`Failed to parse HTML: ${(error as Error).message}`, {
      url,
    });
  }
}

/**
 * Extract main content from HTML, removing nav, footer, sidebar, etc.
 */
function extractMainContent(html: string): string {
  let text = html;

  // Remove script and style blocks
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove common non-content elements
  const skipTags = ['nav', 'header', 'footer', 'aside', 'menu', 'sidebar', 'menuitem'];
  for (const tag of skipTags) {
    text = text.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
  }

  // Try to find main content areas
  const mainPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*(?:content|main|post|article|body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of mainPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 100) {
      text = match[1];
      break;
    }
  }

  // Convert to plain text
  return htmlToText(text);
}

/**
 * Convert HTML to plain text.
 */
function htmlToText(html: string): string {
  let text = html;

  // Decode HTML entities first
  text = decodeHtmlEntities(text);

  // Replace block elements with newlines
  const blockElements = ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'section', 'article'];
  for (const tag of blockElements) {
    text = text.replace(new RegExp(`</${tag}>`, 'gi'), '\n');
    text = text.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
  }

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Clean up whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return text;
}

/**
 * Decode common HTML entities.
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '...',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ldquo;': '“',
    '&rdquo;': '”',
  };

  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'gi'), replacement);
  }

  // Handle numeric entities
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return text;
}

/**
 * Fetch and extract content from a URL.
 */
export async function extractFromUrl(
  url: string,
  options: HtmlExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MineEcho-DocumentProcessor/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new ExtractionError(`HTTP ${response.status}: ${response.statusText}`, {
        url,
        status: response.status,
      });
    }

    const html = await response.text();
    return extractFromHtml(html, url, {
      ...options,
      baseUrl: options.baseUrl || url,
    });
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }
    throw new ExtractionError(`Failed to fetch URL: ${(error as Error).message}`, {
      url,
    });
  }
}
