'use client';

/**
 * ChatGPT-style Prompt Input Component
 * 
 * A rich prompt input with file attachments, presets, and send button.
 * Built with shadcn/ui components for consistent styling.
 */

import { useRef, useCallback, KeyboardEvent } from 'react';
import { Paperclip, Loader2, Sparkles, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useFileAttachments } from '../hooks/useFileAttachments';
import { FileAttachmentList } from './FileAttachment';
import { PromptPresets } from './PromptPresets';
import type { InstructionPreset } from '../types';

interface FileAttachment {
  type: string;
  content: string;
  name: string;
}

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (attachments?: FileAttachment[]) => void;
  placeholder?: string;
  presets?: InstructionPreset[];
  isLoading?: boolean;
  disabled?: boolean;
  showFileAttachment?: boolean;
  className?: string;
  /** Label for the submit button */
  submitLabel?: string;
  /** Show regenerate label when content exists */
  hasExistingContent?: boolean;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Describe what you want the AI to do...',
  presets = [],
  isLoading = false,
  disabled = false,
  showFileAttachment = true,
  className,
  submitLabel = 'Enhance',
  hasExistingContent = false,
}: Readonly<PromptInputProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    attachments,
    isProcessing,
    error: fileError,
    addFiles,
    removeFile,
  } = useFileAttachments();

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
        // Reset input so same file can be selected again
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const handleSubmit = useCallback(() => {
    if (!value.trim() && attachments.length === 0) return;
    onSubmit(attachments);
  }, [onSubmit, attachments, value]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Cmd/Ctrl + Enter
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if ((value.trim() || attachments.length > 0) && !isLoading && !disabled) {
          handleSubmit();
        }
      }
    },
    [value, attachments.length, isLoading, disabled, handleSubmit]
  );

  const handlePresetSelect = useCallback(
    (preset: string) => {
      onChange(preset);
    },
    [onChange]
  );

  const isSubmitDisabled = (!value.trim() && attachments.length === 0) || isLoading || disabled || isProcessing;
  const buttonLabel = hasExistingContent ? 'Regenerate' : submitLabel;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Presets */}
      {presets.length > 0 && (
        <PromptPresets
          presets={presets}
          onSelect={handlePresetSelect}
          disabled={isLoading || disabled}
        />
      )}

      {/* Main input card - ChatGPT style */}
      <Card className="shadow-lg shadow-black/5 border-muted/30 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 transition-all duration-300 overflow-hidden rounded-2xl bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Attachments inside the card */}
          {attachments.length > 0 && (
            <div className="px-3 pt-3">
              <FileAttachmentList
                attachments={attachments}
                onRemove={removeFile}
                disabled={isLoading || disabled}
              />
            </div>
          )}

          {/* File error */}
          {fileError && (
            <div className="px-3 pt-2">
              <Badge variant="destructive" className="text-xs">
                {fileError}
              </Badge>
            </div>
          )}

          {/* Textarea */}
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className={cn(
              'min-h-[100px] max-h-[200px] resize-none border-0',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'px-4 py-3',
              'placeholder:text-muted-foreground/60',
              'text-base'
            )}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
            {/* Left side - file attachment */}
            <div className="flex items-center gap-2">
              {showFileAttachment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                        onClick={handleFileSelect}
                        disabled={isLoading || disabled || isProcessing}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">Attach</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attach files (job description, etc.)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".txt,.md,.json,.html,.css,.pdf,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />

              {/* Keyboard hint */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>↵
                </kbd>
                <span>to send</span>
              </div>
            </div>

            {/* Right side - submit button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    className="gap-2 h-8"
                  >
                    <SubmitButtonIcon isLoading={isLoading} hasExistingContent={hasExistingContent} />
                    <span className="hidden sm:inline">{buttonLabel}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{buttonLabel} with AI</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Submit button icon component to avoid nested ternary
 */
function SubmitButtonIcon({ isLoading, hasExistingContent }: Readonly<{ isLoading: boolean; hasExistingContent: boolean }>) {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  if (hasExistingContent) {
    return <Sparkles className="h-4 w-4" />;
  }
  return <ArrowUp className="h-4 w-4" />;
}
