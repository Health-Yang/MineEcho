/**
 * Excel Extractor - Extract and summarize data from Excel spreadsheets
 *
 * Uses exceljs to read Excel files and generates intelligent summaries.
 */

import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import type { DocumentExtractionOptions, DocumentExtractionResult, DocumentMetadata } from '../types.js';
import { ExtractionError, DocumentType } from '../types.js';
import { cleanText } from '../types.js';

/**
 * Extract data from an Excel file with intelligent summarization.
 */
export async function extractFromExcel(
  buffer: Buffer,
  filename: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  const {
    maxChars = 10000,
    includeMetadata = true,
    sheetIndex = 0,
  } = options;

  const warnings: string[] = [];
  const metadata: DocumentMetadata = {
    type: DocumentType.XLSX,
    filename,
  };

  try {
    const ExcelJS = await import('exceljs');

    const workbook = new ExcelJS.Workbook();
    // Create ArrayBuffer from buffer for exceljs
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    await workbook.xlsx.load(arrayBuffer as ArrayBuffer);

    metadata.sheetCount = workbook.worksheets.length;

    if (workbook.worksheets.length === 0) {
      throw new ExtractionError('Excel file has no worksheets');
    }

    // Get specified sheet or first sheet
    const sheet = workbook.worksheets[sheetIndex] || workbook.worksheets[0];
    const sheetName = sheet.name;

    // Get dimensions
    const lastRow = sheet.rowCount || 0;
    const lastCol = sheet.columnCount || 0;

    warnings.push(`Processing sheet "${sheetName}": ${lastRow} rows x ${lastCol} columns`);

    // Extract headers (first row)
    const headers: string[] = [];
    const headerRow = sheet.getRow(1);
    for (let i = 1; i <= lastCol; i++) {
      const cell = headerRow.getCell(i);
      const value = cell.text?.trim() || `Column ${i}`;
      headers.push(value);
    }

    // Extract data rows
    const dataRows: Record<string, unknown>[] = [];
    const maxDataRows = Math.min(lastRow - 1, 100); // Limit to first 100 data rows

    for (let rowNum = 2; rowNum <= maxDataRows + 1; rowNum++) {
      const row = sheet.getRow(rowNum);
      const rowData: Record<string, unknown> = {};

      for (let colNum = 1; colNum <= lastCol; colNum++) {
        const header = headers[colNum - 1] || `Column ${colNum}`;
        const cell = row.getCell(colNum);
        rowData[header] = cell.text || cell.value;
      }

      // Only add rows that have at least one non-empty value
      if (Object.values(rowData).some(v => v !== null && v !== undefined && v !== '')) {
        dataRows.push(rowData);
      }
    }

    // Generate summary
    let text = generateExcelSummary(sheetName, headers, dataRows, lastRow, {
      maxChars,
      includeMetadata,
    });

    // Clean
    text = cleanText(text);

    const originalSize = buffer.length;
    const extractedSize = text.length;

    // Truncate if necessary
    if (text.length > maxChars) {
      text = text.substring(0, maxChars - 3) + '...';
      warnings.push(`Summary truncated to ${maxChars} characters`);
    }

    // Word count (rough estimate for structured data)
    const wordCount = headers.length + dataRows.length * headers.length;

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
    throw new ExtractionError(`Failed to parse Excel: ${(error as Error).message}`, {
      filename,
    });
  }
}

/**
 * Generate an intelligent summary from Excel data.
 */
function generateExcelSummary(
  sheetName: string,
  headers: string[],
  dataRows: Record<string, unknown>[],
  totalRows: number,
  options: { maxChars: number; includeMetadata: boolean }
): string {
  const parts: string[] = [];

  // Header
  parts.push(`## ${sheetName}\n`);

  // Metadata summary
  if (options.includeMetadata) {
    parts.push(`**Total Rows:** ${totalRows}`);
    parts.push(`**Columns:** ${headers.length} (${headers.slice(0, 5).join(', ')}${headers.length > 5 ? ', ...' : ''})\n`);
  }

  // Column types and sample values
  if (dataRows.length > 0) {
    parts.push('### Column Overview');
    const sampleRow = dataRows[0];

    for (const header of headers.slice(0, 10)) {
      const sampleValue = sampleRow[header];
      const sampleStr = String(sampleValue ?? '(empty)').substring(0, 50);
      const type = detectColumnType(dataRows, header);
      parts.push(`- **${header}** (${type}): "${sampleStr}"`);
    }

    if (headers.length > 10) {
      parts.push(`- ... and ${headers.length - 10} more columns`);
    }

    parts.push('\n### Sample Data\n');

    // Show first 5 rows as Markdown table
    parts.push('| ' + headers.slice(0, 6).join(' | ') + ' |');
    parts.push('| ' + headers.slice(0, 6).map(() => '---').join(' | ') + ' |');

    for (const row of dataRows.slice(0, 5)) {
      const cells = headers.slice(0, 6).map(h => {
        const value = row[h];
        const str = String(value ?? '').substring(0, 30);
        return str.replace(/\|/g, '\\|').replace(/\n/g, ' ');
      });
      parts.push('| ' + cells.join(' | ') + ' |');
    }

    // Statistical summary for numeric columns
    const numericStats = generateNumericStats(dataRows, headers);
    if (numericStats.length > 0) {
      parts.push('\n### Statistical Summary');
      for (const statItem of numericStats.slice(0, 5)) {
        parts.push(statItem);
      }
    }

    // If there are more rows
    if (totalRows > dataRows.length + 1) {
      parts.push(`\n*Note: Showing first ${dataRows.length} of ${totalRows - 1} data rows*`);
    }
  }

  return parts.join('\n');
}

/**
 * Detect the type of a column based on its values.
 */
function detectColumnType(rows: Record<string, unknown>[], header: string): string {
  let numericCount = 0;
  let dateCount = 0;
  let emptyCount = 0;
  let total = 0;

  for (const row of rows.slice(0, 20)) {
    const value = row[header];
    if (value === null || value === undefined || value === '') {
      emptyCount++;
    } else {
      total++;
      if (typeof value === 'number') {
        numericCount++;
      } else if (typeof value === 'string') {
        // Check if it looks like a date
        if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(value) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(value)) {
          dateCount++;
        }
      }
    }
  }

  if (total === 0) return 'empty';
  if (numericCount / total > 0.8) return 'number';
  if (dateCount / total > 0.8) return 'date';
  return 'text';
}

/**
 * Generate statistical summary for numeric columns.
 */
function generateNumericStats(rows: Record<string, unknown>[], headers: string[]): string[] {
  const stats: string[] = [];

  for (const header of headers) {
    const values = rows
      .map(row => row[header])
      .filter(v => typeof v === 'number') as number[];

    if (values.length < 3) continue;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    stats.push(
      `- **${header}**: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)} (n=${values.length})`
    );
  }

  return stats;
}

/**
 * Extract text from an Excel file path.
 */
export async function extractExcelFromPath(
  filePath: string,
  options: DocumentExtractionOptions = {}
): Promise<DocumentExtractionResult> {
  try {
    const buffer = await readFile(filePath);
    const stats = await stat(filePath);
    const result = await extractFromExcel(buffer, filePath.split('/').pop() || 'unknown.xlsx', {
      ...options,
    });
    result.originalSize = stats.size;
    return result;
  } catch (error) {
    throw new ExtractionError(`Failed to read Excel file: ${(error as Error).message}`, {
      filePath,
    });
  }
}
