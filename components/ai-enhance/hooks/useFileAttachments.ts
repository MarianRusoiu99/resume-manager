/**
 * useFileAttachments Hook
 * 
 * Manages file attachments for AI enhancement context.
 * Supports reading file content for text-based files (txt, pdf, docx, md)
 * and images (png, jpg, webp) - similar to ChatGPT file handling.
 */

import { parseDocumentAction } from '@/app/actions/document-parser';
import { useState, useCallback } from 'react';
import type { FileAttachment } from '../types';

/** Maximum number of files that can be attached */
const MAX_FILES = 3;

/** Maximum file size in bytes (10MB for PDFs, 5MB for others) */
const MAX_FILE_SIZE_DEFAULT = 5 * 1024 * 1024;
const MAX_FILE_SIZE_PDF = 10 * 1024 * 1024;

/** 
 * Allowed MIME types for upload
 * Includes documents, images, and text-based files
 */
const ALLOWED_TYPES: Record<string, { label: string; maxSize: number }> = {
  // Documents
  'application/pdf': { label: 'PDF', maxSize: MAX_FILE_SIZE_PDF },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word Document', maxSize: MAX_FILE_SIZE_DEFAULT },
  'application/msword': { label: 'Word Document', maxSize: MAX_FILE_SIZE_DEFAULT },
  // Text files
  'text/plain': { label: 'Text file', maxSize: MAX_FILE_SIZE_DEFAULT },
  'text/markdown': { label: 'Markdown', maxSize: MAX_FILE_SIZE_DEFAULT },
  'text/html': { label: 'HTML', maxSize: MAX_FILE_SIZE_DEFAULT },
  'text/css': { label: 'CSS', maxSize: MAX_FILE_SIZE_DEFAULT },
  'application/json': { label: 'JSON', maxSize: MAX_FILE_SIZE_DEFAULT },
  // Images
  'image/png': { label: 'PNG Image', maxSize: MAX_FILE_SIZE_DEFAULT },
  'image/jpeg': { label: 'JPEG Image', maxSize: MAX_FILE_SIZE_DEFAULT },
  'image/webp': { label: 'WebP Image', maxSize: MAX_FILE_SIZE_DEFAULT },
  'image/gif': { label: 'GIF Image', maxSize: MAX_FILE_SIZE_DEFAULT },
};

/** Types that need server-side parsing */
const SERVER_PARSED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/html',
]);

interface UseFileAttachmentsReturn {
  attachments: FileAttachment[];
  isProcessing: boolean;
  error: string | null;
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearAll: () => void;
  getAttachmentsAsContext: () => string;
  /** Get image attachments for vision API */
  getImageAttachments: () => FileAttachment[];
  /** Get text attachments for context */
  getTextAttachments: () => FileAttachment[];
  /** Check if we have any images (for vision API) */
  hasImages: boolean;
  /** Maximum allowed files */
  maxFiles: number;
  /** Remaining slots available */
  remainingSlots: number;
}

/**
 * Generate unique ID for attachments
 */
function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Read file content based on type
 */
async function readFileContent(file: File): Promise<{ content: string; error?: string }> {
  const mimeType = file.type || 'application/octet-stream';
  
  // For images, use FileReader to get base64 data URL
  if (mimeType.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ content: reader.result as string });
      reader.onerror = () => resolve({ 
        content: '', 
        error: `Failed to read image: ${file.name}` 
      });
      reader.readAsDataURL(file);
    });
  }

  // For server-parsed types (PDF, DOCX, HTML), use server action
  if (SERVER_PARSED_TYPES.has(mimeType)) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await parseDocumentAction(formData);

      if (!result.success) {
        return { 
          content: '', 
          error: result.error || `Failed to parse ${file.name}` 
        };
      }

      return { content: result.data.text };
    } catch (err) {
      return { 
        content: '', 
        error: err instanceof Error ? err.message : `Failed to parse ${file.name}` 
      };
    }
  }

  // For text-like formats, use Blob.text()
  try {
    const content = await file.text();
    return { content };
  } catch {
    return { 
      content: '', 
      error: `Failed to read ${file.name}` 
    };
  }
}

/**
 * Validate a file before processing
 */
function validateFile(
  file: File, 
  currentCount: number
): { valid: boolean; error?: string } {
  // Check file count
  if (currentCount >= MAX_FILES) {
    return { 
      valid: false, 
      error: `Maximum ${MAX_FILES} files allowed. Remove a file before adding more.` 
    };
  }

  const mimeType = file.type || 'application/octet-stream';
  const typeConfig = ALLOWED_TYPES[mimeType];

  // Check file type
  if (!typeConfig && !mimeType.startsWith('text/')) {
    return { 
      valid: false, 
      error: `File type "${mimeType}" is not supported. Supported: PDF, Word, images, and text files.` 
    };
  }

  // Check file size
  const maxSize = typeConfig?.maxSize || MAX_FILE_SIZE_DEFAULT;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `"${file.name}" (${formatFileSize(file.size)}) exceeds ${formatFileSize(maxSize)} limit` 
    };
  }

  return { valid: true };
}

/**
 * Hook for managing file attachments in AI enhancement
 */
export function useFileAttachments(): UseFileAttachmentsReturn {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add files to attachments
   */
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;

    // Check total file count
    if (attachments.length + fileArray.length > MAX_FILES) {
      setError(
        `Cannot add ${fileArray.length} file(s). Maximum ${MAX_FILES} files allowed. ` +
        `You have ${MAX_FILES - attachments.length} slot(s) remaining.`
      );
      return;
    }

    setIsProcessing(true);
    setError(null);

    const newAttachments: FileAttachment[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      // Validate each file
      const validation = validateFile(file, attachments.length + newAttachments.length);
      if (!validation.valid) {
        errors.push(validation.error!);
        continue;
      }

      // Read file content
      const { content, error: readError } = await readFileContent(file);
      
      if (readError) {
        errors.push(readError);
        continue;
      }

      if (!content) {
        errors.push(`No content extracted from "${file.name}"`);
        continue;
      }

      const attachment: FileAttachment = {
        id: generateId(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        content,
        previewUrl: file.type.startsWith('image/') ? content : undefined,
      };

      newAttachments.push(attachment);
    }

    // Update state
    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }

    // Set error if any files failed
    if (errors.length > 0) {
      setError(errors.join('. '));
    }

    setIsProcessing(false);
  }, [attachments.length]);

  /**
   * Remove a file by ID
   */
  const removeFile = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    setError(null);
  }, []);

  /**
   * Clear all attachments
   */
  const clearAll = useCallback(() => {
    setAttachments([]);
    setError(null);
  }, []);

  /**
   * Get image attachments for vision API
   */
  const getImageAttachments = useCallback(() => {
    return attachments.filter(a => a.type.startsWith('image/'));
  }, [attachments]);

  /**
   * Get text attachments (non-image files)
   */
  const getTextAttachments = useCallback(() => {
    return attachments.filter(a => !a.type.startsWith('image/'));
  }, [attachments]);

  /**
   * Get attachments formatted as context for AI
   */
  const getAttachmentsAsContext = useCallback(() => {
    const textAttachments = attachments.filter(a => !a.type.startsWith('image/'));
    
    if (textAttachments.length === 0) return '';

    const contextParts = textAttachments.map(a => {
      // Truncate very long content
      const MAX_CHARS_PER_FILE = 15000;
      const content = a.content.length > MAX_CHARS_PER_FILE
        ? `${a.content.slice(0, MAX_CHARS_PER_FILE)}\n...[content truncated at ${MAX_CHARS_PER_FILE} characters]`
        : a.content;
      
      return `--- ATTACHED FILE: ${a.name} ---\n${content}`;
    });

    return `\n\n### ATTACHED FILES ###\n${contextParts.join('\n\n')}`;
  }, [attachments]);

  // Computed values
  const hasImages = attachments.some(a => a.type.startsWith('image/'));
  const remainingSlots = MAX_FILES - attachments.length;

  return {
    attachments,
    isProcessing,
    error,
    addFiles,
    removeFile,
    clearAll,
    getAttachmentsAsContext,
    getImageAttachments,
    getTextAttachments,
    hasImages,
    maxFiles: MAX_FILES,
    remainingSlots,
  };
}
