/**
 * PPTX Extractor - Extract text from PowerPoint presentations
 *
 * Uses JSZip to parse PPTX (which is a ZIP file) and extract slide text.
 */

import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import type { DocumentExtractionOptions, DocumentExtractionResult, DocumentMetadata } from '../types.js';
import { ExtractionError, DocumentType } from '../types.js';
import { cleanText, truncateText } from '../types.js';

interface SlideContent {
  slideNumber: number;
  title?: string;
  content: string[];
}

/**
 * Extract text content from a PowerPoint file.
 */
export async function extractFromPptx(
  buffer: Buffer,
  filename: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  const {
    maxChars = 10000,
    includeMetadata = true,
    slideRange,
  } = options;

  const warnings: string[] = [];
  let metadata: DocumentMetadata = {
    type: DocumentType.PPTX,
    filename,
  };

  try {
    const JSZip = await import('jszip');

    const zip = await JSZip.loadAsync(buffer);

    // Find all slide XML files
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort();

    metadata.slideCount = slideFiles.length;

    if (slideFiles.length === 0) {
      throw new ExtractionError('No slides found in PowerPoint file');
    }

    // Determine which slides to process
    let slidesToProcess = slideFiles;
    if (slideRange) {
      const start = Math.max(0, slideRange.start - 1);
      const end = Math.min(slideFiles.length, slideRange.end);
      slidesToProcess = slideFiles.slice(start, end);
      warnings.push(`Processing slides ${slideRange.start} to ${slideRange.end} of ${slideFiles.length}`);
    }

    // Extract text from each slide
    const slides: SlideContent[] = [];

    for (let i = 0; i < slidesToProcess.length; i++) {
      const slideFile = slidesToProcess[i];
      const slideNumber = i + 1 + (slideRange ? slideRange.start - 1 : 0);

      try {
        const slideXml = await zip.file(slideFile)?.async('string');
        if (!slideXml) continue;

        const slideContent = parseSlideXml(slideXml, slideNumber);
        if (slideContent.content.length > 0 || slideContent.title) {
          slides.push(slideContent);
        }
      } catch {
        warnings.push(`Failed to parse slide ${slideNumber}`);
      }
    }

    // Generate Markdown output
    let text = generatePptxSummary(slides, {
      includeMetadata,
      slideCount: metadata.slideCount!,
    });

    // Clean
    text = cleanText(text);

    const originalSize = buffer.length;
    const extractedSize = text.length;

    // Truncate if necessary
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
    if (error instanceof ExtractionError) {
      throw error;
    }
    throw new ExtractionError(`Failed to parse PPTX: ${(error as Error).message}`, {
      filename,
    });
  }
}

/**
 * Parse slide XML to extract text content.
 */
function parseSlideXml(xml: string, slideNumber: number): SlideContent {
  const content: SlideContent = {
    slideNumber,
    title: undefined,
    content: [],
  };

  // Extract text between <a:t> tags
  const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];

  for (const match of textMatches) {
    // Extract text content
    const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
    if (textMatch && textMatch[1]) {
      const text = textMatch[1].trim();
      if (text.length > 0) {
        // First substantial text is likely the title
        if (!content.title && text.length < 100) {
          content.title = text;
        } else {
          content.content.push(text);
        }
      }
    }
  }

  return content;
}

/**
 * Generate a Markdown summary from slide content.
 */
function generatePptxSummary(
  slides: SlideContent[],
  options: { includeMetadata: boolean; slideCount: number }
): string {
  const parts: string[] = [];

  // Header
  parts.push(`## Presentation (${options.slideCount} slides)\n`);

  // Overview
  if (options.includeMetadata) {
    parts.push(`**Total Slides:** ${options.slideCount}`);
    parts.push(`**Extracted:** ${slides.length} slides\n`);
  }

  // Slides overview
  parts.push('### Slide Overview\n');

  for (const slide of slides.slice(0, 20)) {
    const title = slide.title || '(No title)';
    const bulletPoints = slide.content.slice(0, 3);
    const bulletText = bulletPoints.length > 0
      ? ': ' + bulletPoints.join(' | ')
      : '';

    parts.push(`**Slide ${slide.slideNumber}:** ${title}${bulletText}`);
  }

  if (slides.length > 20) {
    parts.push(`\n*... and ${slides.length - 20} more slides*`);
  }

  // Detailed content for first few slides
  if (slides.length > 0) {
    parts.push('\n### Detailed Content\n');

    for (const slide of slides.slice(0, 5)) {
      parts.push(`#### Slide ${slide.slideNumber}: ${slide.title || 'Untitled'}\n`);

      if (slide.content.length > 0) {
        for (const bullet of slide.content) {
          parts.push(`- ${bullet}`);
        }
      } else {
        parts.push('*(No text content)*');
      }

      parts.push('');
    }

    if (slides.length > 5) {
      parts.push(`*... ${slides.length - 5} more slides with detailed content*`);
    }
  }

  return parts.join('\n');
}

/**
 * Extract text from a PPTX file path.
 */
export async function extractPptxFromPath(
  filePath: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  try {
    const buffer = await readFile(filePath);
    const stats = await stat(filePath);
    const result = await extractFromPptx(buffer, filePath.split('/').pop() || 'unknown.pptx', {
      ...options,
    });
    result.originalSize = stats.size;
    return result;
  } catch (error) {
    throw new ExtractionError(`Failed to read PPTX file: ${(error as Error).message}`, {
      filePath,
    });
  }
}
