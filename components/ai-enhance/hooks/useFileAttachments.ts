/**
 * useFileAttachments Hook
 * 
 * Manages file attachments for AI enhancement context.
 * Supports reading file content for text-based files (txt, pdf, docx, md).
 */

import { useState, useCallback } from 'react';
import type { FileAttachment } from '../types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'text/css',
  'application/json',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

interface UseFileAttachmentsReturn {
  attachments: FileAttachment[];
  isProcessing: boolean;
  error: string | null;
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearAll: () => void;
  getAttachmentsAsContext: () => string;
}

/**
 * Generate unique ID for attachments
 */
function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Read file content as text or base64
 */
async function readFileContent(file: File): Promise<string> {
  // For images, use FileReader to get base64 data URL
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }
  
  // For text files, use Blob.text()
  try {
    return await file.text();
  } catch {
    throw new Error(`Failed to read file: ${file.name}`);
  }
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
    
    // Check file count limit
    if (attachments.length + fileArray.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const newAttachments: FileAttachment[] = [];

      for (const file of fileArray) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          setError(`File "${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
          continue;
        }

        // Check file type
        if (!ALLOWED_TYPES.has(file.type) && !file.type.startsWith('text/')) {
          setError(`File type "${file.type}" is not supported`);
          continue;
        }

        const content = await readFileContent(file);
        const attachment: FileAttachment = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          previewUrl: file.type.startsWith('image/') ? content : undefined,
        };

        newAttachments.push(attachment);
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setIsProcessing(false);
    }
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
   * Get attachments formatted as context for AI
   */
  const getAttachmentsAsContext = useCallback(() => {
    if (attachments.length === 0) return '';

    const contextParts = attachments
      .filter(a => !a.type.startsWith('image/')) // Text files only
      .map(a => `--- File: ${a.name} ---\n${a.content}`);

    return contextParts.length > 0
      ? `\n\nATTACHED FILES:\n${contextParts.join('\n\n')}`
      : '';
  }, [attachments]);

  return {
    attachments,
    isProcessing,
    error,
    addFiles,
    removeFile,
    clearAll,
    getAttachmentsAsContext,
  };
}
