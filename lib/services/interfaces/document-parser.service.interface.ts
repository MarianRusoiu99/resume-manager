import { ServiceResult } from "@/lib/types/service-result";

export interface IDocumentParserService {
  /**
   * Parses a PDF or DOCX file and returns the extracted text.
   * @param buffer The file content as a Buffer
   * @param mimeType The MIME type of the file
   */
  parseDocument(buffer: Buffer, mimeType: string): Promise<ServiceResult<string>>;
}
