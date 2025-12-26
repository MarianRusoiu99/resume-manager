/**
 * Document Processing Types
 *
 * Types for unified document processing in AI conversations
 */

import type { AttachmentType } from '../chat/message';

/**
 * Supported document types for parsing
 */
export type DocumentType = 'pdf' | 'docx' | 'image' | 'text' | 'html';

/**
 * Input for document processing
 */
export interface DocumentInput {
  /** Base64 encoded content or raw text */
  content: string;
  /** File name */
  name: string;
  /** MIME type */
  mimeType: string;
  /** Whether content is base64 encoded */
  isBase64?: boolean;
}

/**
 * Processed document result
 */
export interface ProcessedDocument {
  /** Extracted text content */
  text: string;
  /** Original file name */
  name: string;
  /** Document type that was processed */
  type: DocumentType;
  /** MIME type */
  mimeType: string;
  /** Page count (for PDFs) */
  pageCount?: number;
  /** Whether this is an image (needs vision API) */
  isImage: boolean;
  /** Original base64 content (preserved for images) */
  imageData?: string;
  /** Any metadata extracted */
  metadata?: Record<string, unknown>;
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  /** Maximum text length to extract (default: 50000) */
  maxTextLength?: number;
  /** Whether to preserve images for vision API */
  preserveImages?: boolean;
  /** Target attachment type for classification */
  targetType?: AttachmentType;
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  /** Successfully processed documents */
  documents: ProcessedDocument[];
  /** Documents that failed processing */
  errors: Array<{
    name: string;
    error: string;
  }>;
}
