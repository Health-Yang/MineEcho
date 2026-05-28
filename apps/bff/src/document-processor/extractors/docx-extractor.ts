/**
 * DOCX Extractor - Extract text from Word documents
 *
 * Uses mammoth library to convert Word documents to Markdown.
 */

import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import type { DocumentExtractionOptions, DocumentExtractionResult, DocumentMetadata } from '../types.js';
import { ExtractionError, DocumentType } from '../types.js';
import { cleanText, truncateText } from '../types.js';

interface MammothMessages {
  messages: Array<{ type: string; message: string }>;
}

/**
 * Extract text content from a DOCX file.
 * Uses mammoth to convert to Markdown for better structure.
 */
export async function extractFromDocx(
  buffer: Buffer,
  filename: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  const {
    maxChars = 10000,
    includeMetadata = true,
  } = options;

  const warnings: string[] = [];
  const metadata: DocumentMetadata = {
    type: DocumentType.DOCX,
    filename,
  };

  try {
    // Dynamic import for mammoth
    const mammoth = await import('mammoth');

    // Extract raw text (returns { value: string, messages: [] })
    const result = await mammoth.extractRawText({ buffer });

    // Collect messages
    for (const msg of result.messages) {
      if (msg.type === 'warning') {
        warnings.push(msg.message);
      }
    }

    // Extract text
    let text: string = result.value;

    // Try to get title from first line if it's a heading
    if (includeMetadata) {
      const firstLine = text.split('\n')[0]?.trim();
      if (firstLine && firstLine.length < 200 && firstLine.length > 0) {
        // Likely a title
        metadata.title = firstLine;
      }

      // Estimate content structure
      const headings = text.split('\n').filter((line: string) => line.startsWith('#'));
      if (headings.length > 0) {
        warnings.push(`Document has ${headings.length} headings/sections`);
      }
    }

    // Clean and truncate
    text = cleanText(text);

    const originalSize = buffer.length;
    const extractedSize = text.length;

    // Truncate if necessary
    if (text.length > maxChars) {
      text = truncateText(text, maxChars);
      warnings.push(`Text truncated to ${maxChars} characters`);
    }

    // Word count
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;

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
    if (error instanceof Error && error.message.includes('Could not find')) {
      throw new ExtractionError('Invalid or corrupted DOCX file', { filename });
    }
    throw new ExtractionError(`Failed to parse DOCX: ${(error as Error).message}`, {
      filename,
    });
  }
}

/**
 * Extract text from a DOCX file path.
 */
export async function extractDocxFromPath(
  filePath: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  try {
    const buffer = await readFile(filePath);
    const stats = await stat(filePath);
    const result = await extractFromDocx(buffer, filePath.split('/').pop() || 'unknown.docx', {
      ...options,
    });
    result.originalSize = stats.size;
    return result;
  } catch (error) {
    throw new ExtractionError(`Failed to read DOCX file: ${(error as Error).message}`, {
      filePath,
    });
  }
}
