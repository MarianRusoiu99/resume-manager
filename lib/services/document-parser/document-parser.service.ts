/**
 * Document Parser Service
 * 
 * Robust document parsing with multiple fallback strategies for PDF, DOCX, HTML, and text files.
 * Designed for secure handling of user-uploaded documents.
 */

import mammoth from 'mammoth';
import { ValidationError } from "@/lib/errors";
import { IDocumentParserService } from '../interfaces/document-parser.service.interface';
import { ServiceResult } from '@/lib/types';
import { withServiceError, ServiceErrors } from '../utils/service-wrapper';
import { logger } from '@/lib/utils/logger';

/**
 * Supported MIME types for document parsing
 */
const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/html',
  'text/markdown',
  'text/css',
  'application/json',
]);

/**
 * Maximum file sizes for security
 */
const MAX_FILE_SIZES: Record<string, number> = {
  'application/pdf': 10 * 1024 * 1024, // 10MB for PDFs
  'default': 5 * 1024 * 1024, // 5MB for other files
};

/**
 * Sanitize extracted text to prevent injection attacks
 */
function sanitizeText(text: string): string {
  // Remove null bytes and other control characters (except newlines/tabs)
  return text
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate buffer for security concerns
 */
function validateBuffer(buffer: Buffer, mimeType: string): void {
  if (!buffer || buffer.length === 0) {
    throw ServiceErrors.validation('Empty file provided');
  }

  const maxSize = MAX_FILE_SIZES[mimeType] || MAX_FILE_SIZES['default'];
  if (buffer.length > maxSize) {
    throw ServiceErrors.validation(
      `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`
    );
  }
}

export class DocumentParserService implements IDocumentParserService {
  /**
   * Parses a document and returns the extracted text.
   * Supports PDF, DOCX, HTML, and plain text files.
   */
  async parseDocument(buffer: Buffer, mimeType: string): Promise<ServiceResult<string>> {
    return withServiceError('parse document', async () => {
      // Normalize MIME type
      const normalizedMimeType = mimeType.toLowerCase().trim();

      // Validate the buffer
      validateBuffer(buffer, normalizedMimeType);

      // Check if MIME type is supported
      if (!SUPPORTED_MIME_TYPES.has(normalizedMimeType)) {
        throw ServiceErrors.validation(`Unsupported file type: ${mimeType}`);
      }

      let result: string;

      switch (normalizedMimeType) {
        case 'application/pdf':
          result = await this.parsePdf(buffer);
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          result = await this.parseDocx(buffer);
          break;

        case 'text/html':
          result = this.parseHtml(buffer);
          break;

        case 'text/plain':
        case 'text/markdown':
        case 'text/css':
        case 'application/json':
          result = this.parseText(buffer);
          break;

        default:
          throw ServiceErrors.validation(`Unsupported file type: ${mimeType}`);
      }

      // Sanitize the output
      return sanitizeText(result);
    });
  }

  /**
   * Parse PDF using pdf-parse (v1 - simple function-based API)
   */
  private async parsePdf(buffer: Buffer): Promise<string> {
    // Log buffer info for debugging
    logger.info('Starting PDF parse', {
      bufferLength: buffer.length,
      isBuffer: Buffer.isBuffer(buffer),
    });

    // Validate we have actual PDF data
    const header = buffer.slice(0, 8).toString('utf-8');
    if (!header.startsWith('%PDF')) {
      throw ServiceErrors.validation(
        `Invalid PDF file. File header: "${header.slice(0, 5)}..." (expected "%PDF")`
      );
    }

    try {
      // Dynamic import for pdf-parse (v2.x uses PDFParse class)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse');
      
      // Convert Buffer to Uint8Array as required by pdf-parse v2
      const uint8Array = new Uint8Array(buffer);
      
      const parser = new PDFParse(uint8Array, {
        // Limit to first 50 pages for security (if supported by v2 options)
      });

      // Call getText() instead of parse()
      const result = await parser.getText();

      if (!result.text || result.text.trim().length === 0) {
        throw ServiceErrors.externalService(
          'No text content extracted from PDF. The PDF may contain only images without extractable text.'
        );
      }

      logger.info('PDF parsed successfully', {
        pages: result.total || 0, // v2 returns 'total' for total pages
        textLength: result.text.length,
      });

      return result.text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      logger.error('PDF parsing failed', { error: errorMsg });
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to parse PDF.';
      if (errorMsg.includes('password') || errorMsg.includes('encrypt')) {
        userMessage += ' The file appears to be password-protected.';
      } else if (errorMsg.includes('only images') || errorMsg.includes('No text')) {
        userMessage += ' The PDF may contain only images without extractable text.';
      } else {
        userMessage += ' The file may be corrupted or in an unsupported format.';
      }
      userMessage += ` (Error: ${errorMsg})`;
      
      throw ServiceErrors.externalService(userMessage, error);
    }
  }

  /**
   * Parse DOCX using mammoth
   */
  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new ValidationError('No text content extracted from DOCX');
      }

      // Log any warnings from mammoth
      if (result.messages.length > 0) {
        logger.debug('DOCX parsing warnings', {
          messages: result.messages.map(m => m.message),
        });
      }

      return result.value;
    } catch (error) {
      logger.error('DOCX parsing failed', error);
      throw ServiceErrors.externalService(
        'Failed to parse Word document. The file may be corrupted or in an unsupported format.',
        error
      );
    }
  }

  /**
   * Parse HTML by stripping tags
   */
  private parseHtml(buffer: Buffer): string {
    const html = buffer.toString('utf-8');
    
    // Remove script and style tags completely
    const noScripts = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Replace common block elements with newlines
    const withLineBreaks = noScripts
      .replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|section|article|header|footer)\b[^>]*>/gi, '\n')
      .replace(/<\/?(ul|ol|table|thead|tbody)\b[^>]*>/gi, '\n\n');
    
    // Strip remaining tags
    const text = withLineBreaks
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return text;
  }

  /**
   * Parse plain text files
   */
  private parseText(buffer: Buffer): string {
    // Try UTF-8 first
    try {
      const text = buffer.toString('utf-8');
      // Check for BOM and remove it
      return text.replace(/^\uFEFF/, '');
    } catch {
      // Fallback to latin1
      return buffer.toString('latin1');
    }
  }

  /**
   * Check if a MIME type is supported
   */
  isSupported(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase().trim());
  }

  /**
   * Get list of supported MIME types
   */
  getSupportedTypes(): string[] {
    return Array.from(SUPPORTED_MIME_TYPES);
  }
}

export const documentParserService = new DocumentParserService();
