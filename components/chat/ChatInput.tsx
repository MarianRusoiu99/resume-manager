'use client';

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Paperclip, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ai/ModelSelector';
import { ReferenceSelectionModal } from '@/components/chat/ReferenceSelectionModal';
import { FileAttachmentList } from '@/modules/ai-enhance/prompt/FileAttachment';
import { useFileAttachments } from '@/modules/ai-enhance/hooks/useFileAttachments';
import { useFeatureModelPreference } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ConversationAttachment } from '@/modules/ai-enhance/hooks/useConversation';
import type { AIFeature } from '@/lib/types/ai-settings';

interface ChatInputSubmitPayload {
  message: string;
  attachments?: ConversationAttachment[];
  modelId?: string;
}

interface ChatInputReferenceOption {
  value: string;
  label: string;
  group?: 'profiles' | 'templates' | 'artifacts';
}

interface ChatInputProps {
  onSend: (payload: ChatInputSubmitPayload) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  feature?: AIFeature;
  requireModelSelection?: boolean;
  referenceValues?: string[];
  referenceOptions?: ChatInputReferenceOption[];
  referencePlaceholder?: string;
  referenceNoneLabel?: string;
  onReferenceChange?: (values: string[]) => void;
  isReferenceLoading?: boolean;
}

function mapToConversationAttachment(
  file: { name: string; type: string; content: string }
): ConversationAttachment {
  const attachmentType: ConversationAttachment['type'] = file.type.startsWith('image/')
    ? 'image'
    : file.type.includes('resume')
      ? 'resume'
      : file.type.includes('template') || file.type.includes('html') || file.type.includes('css')
        ? 'template'
        : 'document';

  return {
    type: attachmentType,
    name: file.name,
    content: file.content,
    mimeType: file.type,
  };
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  feature,
  requireModelSelection = false,
  referenceValues = [],
  referenceOptions = [],
  referencePlaceholder = 'Reference',
  referenceNoneLabel = 'No reference',
  onReferenceChange,
  isReferenceLoading = false,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [referenceModalOpen, setReferenceModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { modelId, isLoading: isModelLoading, updatePreference } = useFeatureModelPreference(feature);
  const {
    attachments,
    isProcessing,
    error: fileError,
    addFiles,
    removeFile,
    clearAll,
  } = useFileAttachments();

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    const maxLines = 4;
    const maxHeight = lineHeight * maxLines;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled || isProcessing) return;

    const mappedAttachments = attachments.map(mapToConversationAttachment);

    await onSend({
      message: trimmed,
      attachments: mappedAttachments.length > 0 ? mappedAttachments : undefined,
      modelId: modelId || undefined,
    });

    setValue('');
    clearAll();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, attachments, disabled, isProcessing, onSend, modelId, clearAll]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      adjustHeight();
    },
    [adjustHeight]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        void addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const canSend = (value.trim().length > 0 || attachments.length > 0)
    && !disabled
    && !isProcessing
    && (!requireModelSelection || !!modelId);

  return (
      <div className="rounded-xl bg-background p-2 space-y-2">
      {attachments.length > 0 && (
        <FileAttachmentList attachments={attachments} onRemove={removeFile} disabled={disabled || isProcessing} />
      )}

      {onReferenceChange && referenceValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {referenceValues.map((value) => {
            const option = referenceOptions.find((opt) => opt.value === value);
            if (!option) return null;
            return (
              <span
                key={value}
                className="inline-flex max-w-[220px] items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[11px] text-foreground"
                title={option.label}
              >
                <span className="truncate">{option.label}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onReferenceChange(referenceValues.filter((v) => v !== value))}
                  aria-label={`Remove ${option.label}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {fileError && <p className="text-xs text-destructive">{fileError}</p>}

      <div className="flex items-center gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 min-h-8 resize-none rounded-md border border-border/30 bg-transparent px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground/80',
            'focus-visible:outline-none focus-visible:ring-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'max-h-[calc(4*1.5rem+1rem)]'
          )}
        />

        <ModelSelector
          value={modelId || ''}
          onValueChange={updatePreference}
          feature={feature}
          requiresStructuredOutput
          isLoading={isModelLoading}
          className="h-8 w-8"
          showProvider={false}
          compact
        />

        {onReferenceChange && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-md border border-border/40 bg-background/40 hover:bg-accent/60"
              onClick={() => setReferenceModalOpen(true)}
              disabled={disabled || isReferenceLoading}
              aria-label="Choose reference"
              title={referencePlaceholder}
            >
              <Link2 className="size-4" />
            </Button>

            <ReferenceSelectionModal
              open={referenceModalOpen}
              onOpenChange={setReferenceModalOpen}
              values={referenceValues}
              options={referenceOptions}
              onChange={onReferenceChange}
              noneLabel={referenceNoneLabel}
              title={referencePlaceholder}
            />
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 rounded-md border border-border/40 bg-background/40 hover:bg-accent/60"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          aria-label="Attach files"
        >
          {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </Button>

        <Button
          type="button"
          size="icon-sm"
          onClick={() => void handleSubmit()}
          disabled={!canSend}
          aria-label="Send message"
          className="h-8 w-8 shrink-0 rounded-md"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>


      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".txt,.md,.json,.html,.css,.pdf,.docx,.png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
      />
    </div>
  );
}
