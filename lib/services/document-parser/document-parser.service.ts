const pdf = require('pdf-parse');
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
      } else {
        throw ServiceErrors.validation(`Unsupported file type: ${mimeType}`);
      }
    });
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw ServiceErrors.externalService('Failed to parse PDF', error);
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
}

export const documentParserService = new DocumentParserService();
