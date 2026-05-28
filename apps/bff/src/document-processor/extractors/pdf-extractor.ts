/**
 * PDF Extractor - Extract text from PDF documents
 *
 * Uses pdf-parse library to extract text content from PDFs.
 */

import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import type { DocumentExtractionOptions, DocumentExtractionResult, DocumentMetadata } from '../types.js';
import { DocumentProcessingError, ExtractionError } from '../types.js';
import { DocumentType } from '../types.js';
import { cleanText, truncateText } from '../types.js';

interface PdfParseResult {
  numpages: number;
  numrendered: number;
  info: Record<string, unknown>;
  text: string;
  version: string;
}

/**
 * Extract text content from a PDF file.
 */
export async function extractFromPdf(
  buffer: Buffer,
  filename: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  const {
    maxChars = 10000,
    includeMetadata = true,
    pageRange,
  } = options;

  const warnings: string[] = [];
  const metadata: DocumentMetadata = {
    type: DocumentType.PDF,
    filename,
  };

  try {
    // Dynamic import for pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule: any = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;

    // Parse PDF
    const data: PdfParseResult = await pdfParse(buffer);

    // Extract metadata
    if (includeMetadata && data.info) {
      const info = data.info;
      metadata.pageCount = data.numpages;
      metadata.title = (info.Title as string) || undefined;
      metadata.author = (info.Author as string) || undefined;
      metadata.creationDate = (info.CreationDate as string) || undefined;

      if (data.numpages > 10) {
        warnings.push(`Large PDF with ${data.numpages} pages. Consider using pageRange option.`);
      }
    } else {
      metadata.pageCount = data.numpages;
    }

    // Extract text
    let text = data.text || '';

    // If page range specified, extract only those pages
    if (pageRange) {
      const pages = text.split(/\f/); // Form feed separates pages
      const start = Math.max(0, pageRange.start);
      const end = Math.min(pages.length, pageRange.end);
      text = pages.slice(start, end).join('\n\n');
      warnings.push(`Extracted pages ${start + 1} to ${end} of ${pages.length}`);
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
    if (error instanceof DocumentProcessingError) {
      throw error;
    }
    throw new ExtractionError(`Failed to parse PDF: ${(error as Error).message}`, {
      filename,
      error: (error as Error).message,
    });
  }
}

/**
 * Extract text from a PDF file path.
 */
export async function extractPdfFromPath(
  filePath: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  try {
    const buffer = await readFile(filePath);
    const stats = await stat(filePath);
    const result = await extractFromPdf(buffer, filePath.split('/').pop() || 'unknown.pdf', {
      ...options,
    });
    result.originalSize = stats.size;
    return result;
  } catch (error) {
    throw new ExtractionError(`Failed to read PDF file: ${(error as Error).message}`, {
      filePath,
    });
  }
}
