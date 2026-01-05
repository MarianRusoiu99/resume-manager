/**
 * Document Processor
 *
 * Unified document processing for AI conversations.
 * Extracts text from PDFs, DOCX, images, and other documents.
 */

import { documentParserService } from '@/lib/services';
import { ValidationError, ExternalServiceError } from "@/lib/errors";
import { logger } from '@/lib/utils/logger';
import type {
  DocumentInput,
  ProcessedDocument,
  ProcessingOptions,
  BatchProcessingResult,
  DocumentType,
} from './types';
import type { Attachment, AttachmentType } from '../chat/message';

/**
 * MIME type to document type mapping
 */
const MIME_TYPE_MAP: Record<string, DocumentType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'text/plain': 'text',
  'text/html': 'html',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
};

/**
 * Image MIME types
 */
const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

/**
 * Detect document type from MIME type
 */
export function detectDocumentType(mimeType: string): DocumentType {
  const normalized = mimeType.toLowerCase().trim();
  return MIME_TYPE_MAP[normalized] || 'text';
}

/**
 * Check if MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType.toLowerCase().trim());
}

/**
 * Process a single document
 */
export async function processDocument(
  input: DocumentInput,
  options: ProcessingOptions = {}
): Promise<ProcessedDocument> {
  const { maxTextLength = 50000, preserveImages = true } = options;

  const mimeType = input.mimeType.toLowerCase().trim();
  const documentType = detectDocumentType(mimeType);
  const isImage = isImageMimeType(mimeType);

  // Handle images - preserve for vision API
  if (isImage) {
    return {
      text: `[Image: ${input.name}]`,
      name: input.name,
      type: 'image',
      mimeType,
      isImage: true,
      imageData: preserveImages ? input.content : undefined,
    };
  }

  // Handle text content that's not base64
  if (documentType === 'text' && !input.isBase64) {
    const text = input.content.slice(0, maxTextLength);
    return {
      text,
      name: input.name,
      type: 'text',
      mimeType,
      isImage: false,
    };
  }

  // Handle base64 encoded documents
  try {
    const buffer = Buffer.from(input.content, 'base64');
    const result = await documentParserService.parseDocument(buffer, mimeType);

    if (!result.success) {
      throw new ExternalServiceError('Document Parser', result.error || 'Failed to parse document');
    }

    const text = (result.data || '').slice(0, maxTextLength);

    return {
      text,
      name: input.name,
      type: documentType,
      mimeType,
      isImage: false,
      metadata: {
        originalLength: result.data?.length || 0,
        wasTruncated: (result.data?.length || 0) > maxTextLength,
      },
    };
  } catch (error) {
    logger.error('Document processing failed', { name: input.name, mimeType, error });
    throw error;
  }
}

/**
 * Process multiple documents in batch
 */
export async function processDocuments(
  inputs: DocumentInput[],
  options: ProcessingOptions = {}
): Promise<BatchProcessingResult> {
  const documents: ProcessedDocument[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  await Promise.all(
    inputs.map(async (input) => {
      try {
        const doc = await processDocument(input, options);
        documents.push(doc);
      } catch (error) {
        errors.push({
          name: input.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })
  );

  return { documents, errors };
}

/**
 * Convert processed documents to conversation attachments
 */
export function toAttachments(
  documents: ProcessedDocument[],
  targetType?: AttachmentType
): Attachment[] {
  return documents.map((doc, index) => ({
    id: `doc-${Date.now()}-${index}`,
    type: targetType || (doc.isImage ? 'image' : 'document'),
    name: doc.name,
    content: doc.isImage && doc.imageData ? doc.imageData : doc.text,
    mimeType: doc.mimeType,
    metadata: doc.metadata,
  }));
}

/**
 * Format processed documents as context string for prompts
 */
export function formatDocumentsAsContext(documents: ProcessedDocument[]): string {
  const parts: string[] = [];

  for (const doc of documents) {
    if (doc.isImage) {
      parts.push(`--- ATTACHED IMAGE: ${doc.name} ---`);
      parts.push('[Image will be processed via vision API]');
    } else {
      parts.push(`--- DOCUMENT: ${doc.name} (${doc.type.toUpperCase()}) ---`);
      parts.push(doc.text);
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Extract text content from documents (excluding images)
 */
export function extractTextContent(documents: ProcessedDocument[]): string {
  return documents
    .filter((doc) => !doc.isImage)
    .map((doc) => doc.text)
    .join('\n\n');
}

/**
 * Get image documents only
 */
export function getImageDocuments(documents: ProcessedDocument[]): ProcessedDocument[] {
  return documents.filter((doc) => doc.isImage);
}

/**
 * Get text documents only
 */
export function getTextDocuments(documents: ProcessedDocument[]): ProcessedDocument[] {
  return documents.filter((doc) => !doc.isImage);
}
