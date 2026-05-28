/**
 * Document Processor - Main Entry Point
 *
 * Unified interface for extracting text from various document formats.
 * Extracts text and prepares it for TokenJuice compression.
 */

export * from './types.js';

// Re-export extractors
export { extractFromPdf, extractPdfFromPath } from './extractors/pdf-extractor.js';
export { extractFromDocx, extractDocxFromPath } from './extractors/docx-extractor.js';
export { extractFromExcel, extractExcelFromPath } from './extractors/xlsx-extractor.js';
export { extractFromPptx, extractPptxFromPath } from './extractors/pptx-extractor.js';
export { extractFromHtml, extractFromUrl } from './extractors/html-extractor.js';

// Import types for convenience
import type { DocumentExtractionOptions, DocumentExtractionResult } from './types.js';
import { detectDocumentType, DocumentType } from './types.js';
import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';

// ---------------------------------------------------------------------------
// Unified Document Processor
// ---------------------------------------------------------------------------

export interface ProcessDocumentOptions extends DocumentExtractionOptions {
  /** Auto-detect file type from extension */
  autoDetect?: boolean;
}

/**
 * Process any supported document format.
 * Automatically detects file type and applies appropriate extractor.
 */
export async function processDocument(
  input: string | Buffer,
  filename: string,
  options: ProcessDocumentOptions = {}
): Promise<DocumentExtractionResult> {
  const { autoDetect = true, ...extractorOptions } = options;

  // Detect document type
  let docType = DocumentType.UNKNOWN;

  if (autoDetect) {
    docType = detectDocumentType(filename);
  }

  if (docType === DocumentType.UNKNOWN) {
    throw new Error(`Unsupported document format: ${filename}`);
  }

  // Get buffer from input
  let buffer: Buffer;
  if (typeof input === 'string') {
    buffer = await readFile(input);
  } else {
    buffer = input;
  }

  // Apply appropriate extractor
  switch (docType) {
    case DocumentType.PDF:
      return (await import('./extractors/pdf-extractor.js')).extractFromPdf(
        buffer,
        filename,
        extractorOptions
      );

    case DocumentType.DOCX:
      return (await import('./extractors/docx-extractor.js')).extractFromDocx(
        buffer,
        filename,
        extractorOptions
      );

    case DocumentType.XLSX:
      return (await import('./extractors/xlsx-extractor.js')).extractFromExcel(
        buffer,
        filename,
        extractorOptions
      );

    case DocumentType.PPTX:
      return (await import('./extractors/pptx-extractor.js')).extractFromPptx(
        buffer,
        filename,
        extractorOptions
      );

    case DocumentType.HTML:
      return (await import('./extractors/html-extractor.js')).extractFromHtml(
        buffer.toString('utf-8'),
        filename,
        extractorOptions
      );

    default:
      throw new Error(`Unsupported document format: ${docType}`);
  }
}

/**
 * Process document from file path.
 */
export async function processDocumentFromPath(
  filePath: string,
  options: ProcessDocumentOptions = {}
): Promise<DocumentExtractionResult> {
  const filename = filePath.split('/').pop() || 'unknown';
  const buffer = await readFile(filePath);
  const stats = await stat(filePath);

  const result = await processDocument(buffer, filename, options);
  result.originalSize = stats.size;

  return result;
}

// ---------------------------------------------------------------------------
// Document Type Utilities
// ---------------------------------------------------------------------------

/**
 * Get file extension from filename.
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || '';
}

/**
 * Check if a file extension is supported.
 */
export function isSupportedDocument(filename: string): boolean {
  const supportedExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'html', 'htm'];
  const ext = getFileExtension(filename);
  return supportedExtensions.includes(ext);
}

/**
 * Get MIME type for a document.
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    html: 'text/html',
    htm: 'text/html',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

export interface BatchProcessResult {
  success: DocumentExtractionResult[];
  failed: Array<{ filename: string; error: string }>;
}

/**
 * Process multiple documents in batch.
 */
export async function processDocumentsBatch(
  files: Array<{ path: string; filename: string }>,
  options: ProcessDocumentOptions = {}
): Promise<BatchProcessResult> {
  const result: BatchProcessResult = {
    success: [],
    failed: [],
  };

  for (const file of files) {
    try {
      const docResult = await processDocumentFromPath(file.path, options);
      result.success.push(docResult);
    } catch (error) {
      result.failed.push({
        filename: file.filename,
        error: (error as Error).message,
      });
    }
  }

  return result;
}
