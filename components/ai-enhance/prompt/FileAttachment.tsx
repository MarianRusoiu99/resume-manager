'use client';

/**
 * File Attachment Component
 * 
 * Displays attached files with preview and removal functionality.
 */

import { X, FileText, Image, FileJson, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FileAttachment as FileAttachmentType } from '../types';

interface FileAttachmentProps {
  attachment: FileAttachmentType;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/**
 * Get icon for file type
 */
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('json')) return FileJson;
  if (type.includes('html') || type.includes('css') || type.includes('javascript')) return FileCode;
  return FileText;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachment({
  attachment,
  onRemove,
  disabled = false,
}: Readonly<FileAttachmentProps>) {
  const Icon = getFileIcon(attachment.type);
  const isImage = attachment.type.startsWith('image/');

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-lg border bg-muted/50 p-2',
        'transition-colors hover:bg-muted',
        disabled && 'opacity-50'
      )}
    >
      {/* Preview or Icon */}
      <div className="flex-shrink-0">
        {isImage && attachment.previewUrl ? (
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6 flex-shrink-0 opacity-0 transition-opacity',
          'group-hover:opacity-100 focus:opacity-100'
        )}
        onClick={() => onRemove(attachment.id)}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove {attachment.name}</span>
      </Button>
    </div>
  );
}

interface FileAttachmentListProps {
  attachments: FileAttachmentType[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function FileAttachmentList({
  attachments,
  onRemove,
  disabled = false,
}: Readonly<FileAttachmentListProps>) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <FileAttachment
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
