/**
 * Document Processing Module
 *
 * Unified document processing for AI conversations.
 * @module lib/ai/documents
 */

// Types
export type {
  DocumentType,
  DocumentInput,
  ProcessedDocument,
  ProcessingOptions,
  BatchProcessingResult,
} from './types';

// Processor functions
export {
  detectDocumentType,
  isImageMimeType,
  processDocument,
  processDocuments,
  toAttachments,
  formatDocumentsAsContext,
  extractTextContent,
  getImageDocuments,
  getTextDocuments,
} from './processor';
