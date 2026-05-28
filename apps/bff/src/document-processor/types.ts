/**
 * Document Processor - Document Text Extraction for TokenJuice
 *
 * Extracts and compresses text from various document formats:
 * - PDF files
 * - Word documents (.docx)
 * - Excel spreadsheets (.xlsx)
 * - PowerPoint presentations (.pptx)
 * - HTML web pages
 *
 * The extracted text is then processed through TokenJuice for
 * maximum compression before being sent to the LLM.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum DocumentType {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  PPTX = 'pptx',
  HTML = 'html',
  UNKNOWN = 'unknown',
}

export interface DocumentExtractionOptions {
  /** Maximum characters to extract (default: 10000) */
  maxChars?: number;
  /** Include metadata (title, author, dates) (default: true) */
  includeMetadata?: boolean;
  /** Page range for PDFs (e.g., { start: 0, end: 5 }) */
  pageRange?: { start: number; end: number };
  /** Sheet index for Excel (default: 0 = first sheet) */
  sheetIndex?: number;
  /** Slide range for PowerPoint */
  slideRange?: { start: number; end: number };
}

export interface DocumentMetadata {
  type: DocumentType;
  filename?: string;
  // PDF specific
  pageCount?: number;
  title?: string;
  author?: string;
  creationDate?: string;
  // Office specific
  sheetCount?: number;
  slideCount?: number;
  // HTML specific
  url?: string;
  language?: string;
}

export interface DocumentExtractionResult {
  /** Extracted text content */
  text: string;
  /** Document metadata */
  metadata: DocumentMetadata;
  /** Word/page count estimate */
  wordCount: number;
  /** Original size in bytes */
  originalSize: number;
  /** Extracted size in characters */
  extractedSize: number;
  /** Compression ratio achieved by extraction */
  compressionRatio: number;
  /** Any warnings or issues */
  warnings: string[];
}

export interface DocumentProcessor {
  /** Process a document from file path */
  processFile(filePath: string, options?: DocumentExtractionOptions): Promise<DocumentExtractionResult>;
  /** Process a document from buffer */
  processBuffer(buffer: Buffer, filename: string, options?: DocumentExtractionOptions): Promise<DocumentExtractionResult>;
  /** Check if this processor supports the given file type */
  supports(filename: string): boolean;
}

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}

export class UnsupportedFormatError extends DocumentProcessingError {
  constructor(format: string) {
    super(`Unsupported document format: ${format}`, 'UNSUPPORTED_FORMAT', { format });
  }
}

export class ExtractionError extends DocumentProcessingError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'EXTRACTION_ERROR', details);
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Detect document type from filename or MIME type.
 */
export function detectDocumentType(filename: string, mimeType?: string): DocumentType {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const mime = mimeType?.toLowerCase() || '';

  if (ext === 'pdf' || mime.includes('pdf')) return DocumentType.PDF;
  if (ext === 'docx' || ext === 'doc' || mime.includes('word')) return DocumentType.DOCX;
  if (ext === 'xlsx' || ext === 'xls' || mime.includes('excel') || mime.includes('spreadsheet')) {
    return DocumentType.XLSX;
  }
  if (ext === 'pptx' || ext === 'ppt' || mime.includes('powerpoint') || mime.includes('presentation')) {
    return DocumentType.PPTX;
  }
  if (ext === 'html' || ext === 'htm' || mime.includes('html')) return DocumentType.HTML;

  return DocumentType.UNKNOWN;
}

/**
 * Estimate reading time in seconds.
 */
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.round((words / wordsPerMinute) * 60);
}

/**
 * Truncate text to maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Clean extracted text by removing excessive whitespace.
 */
export function cleanText(text: string): string {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
