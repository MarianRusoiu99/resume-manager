import mammoth from 'mammoth';
import { IDocumentParserService } from '../interfaces/document-parser.service.interface';
import { ServiceResult } from '@/lib/types/service-result';
import { withServiceError, ServiceErrors } from '../utils/service-wrapper';

export class DocumentParserService implements IDocumentParserService {
  /**
   * Parses a PDF or DOCX file and returns the extracted text.
   */
  async parseDocument(buffer: Buffer, mimeType: string): Promise<ServiceResult<string>> {
    return withServiceError('parse document', async () => {
      if (mimeType === 'application/pdf') {
        return this.parsePdf(buffer);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        return this.parseDocx(buffer);
      } else if (mimeType === 'text/plain') {
        return buffer.toString('utf-8');
      } else if (mimeType === 'text/html') {
        return this.parseHtml(buffer);
      } else {
        throw ServiceErrors.validation(`Unsupported file type: ${mimeType}`);
      }
    });
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty buffer provided');
      }

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjs.getDocument({
        data: uint8Array,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF JS Parse Error:', error);
      throw ServiceErrors.externalService('Failed to parse PDF. The file might be encrypted or corrupted.', error);
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw ServiceErrors.externalService('Failed to parse DOCX', error);
    }
  }

  private parseHtml(buffer: Buffer): string {
    const html = buffer.toString('utf-8');
    // Simple regex to strip HTML tags and normalize whitespace
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const documentParserService = new DocumentParserService();
