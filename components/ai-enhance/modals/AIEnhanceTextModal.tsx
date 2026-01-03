'use client';

/**
 * AI Enhance Text Modal
 *
 * Modal for AI-powered text enhancement with ChatGPT-style input
 * and side-by-side comparison.
 */

import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { ComparisonTabs } from '../preview/ComparisonTabs';
import { TEXT_PRESETS } from '../types';
import type { AIEnhanceTextModalProps } from '../types';
import { useAITask } from '../hooks/useAITask';
import { useFileAttachments } from '../hooks/useFileAttachments';
import { ModelSelector } from '@/components/shared/ModelSelector';

export function AIEnhanceTextModal({
  open,
  onOpenChange,
  originalContent,
  onAccept,
  contentType = 'text',
  context,
  title = 'Enhance with AI',
  description = 'Use AI to improve, rephrase, or modify your content.',
  showModelSelector = true,
}: Readonly<AIEnhanceTextModalProps>) {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [instructions, setInstructions] = useState('');

  const {
    runTask,
    reset,
    partialOutput,
    isLoading,
    output,
    hasOutput,
  } = useAITask({
    mode: 'text-enhancement',
  });

  const enhancedContent = (output as string) || partialOutput;

  const {
    attachments,
    addFiles,
    removeFile,
    isProcessing: attachmentsLoading,
  } = useFileAttachments();

  const handleEnhance = useCallback(() => {
    const message = `${instructions}

--- CONTENT TO ENHANCE ---
${originalContent}`;

    runTask({
      message,
      attachments: attachments?.map((a) => ({
        type: a.type.startsWith('image/') ? 'image' : 'document',
        content: a.content,
        name: a.name,
        mimeType: a.type,
      })) as any,
      modelId: selectedModel,
      context: {
        personalInstructions: context,
      }
    });
  }, [instructions, originalContent, runTask, attachments, selectedModel, context]);

  // Initialize enhancement options when modal opens
  useEffect(() => {
    if (!open) return;
    reset();
    setInstructions('');
  }, [open, reset]);

  const handleAccept = useCallback(() => {
    if (!enhancedContent) return;

    onAccept(enhancedContent);
    onOpenChange(false);
    toast.success('Content enhanced successfully!');
  }, [enhancedContent, onAccept, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const footer = (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={handleCancel}
        disabled={isLoading}
        className="h-9 px-4 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>

      <Button
        type="button"
        onClick={handleAccept}
        disabled={!hasOutput || isLoading}
        className="h-9 px-6 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
      >
        <Check className="h-4 w-4 mr-2" />
        Accept Changes
      </Button>
    </>
  );

  const rightAction = showModelSelector && (
    <ModelSelector
      value={selectedModel}
      onValueChange={setSelectedModel}
    />
  );

  return (
    <AIEnhanceBaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      rightAction={rightAction}
      size="large"
    >
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* ChatGPT-style prompt input */}
        <PromptInput
          value={instructions}
          onChange={setInstructions}
          onSubmit={handleEnhance}
          presets={TEXT_PRESETS}
          isLoading={isLoading || attachmentsLoading}
          hasExistingContent={hasOutput}
          className="flex-shrink-0"
          placeholder="Describe what you want the AI to do... (e.g., 'Make this more professional', 'Fix grammar')"
        />

        {/* Side-by-side comparison */}
        <div className="flex-1 min-h-0 rounded-2xl border border-muted/20 bg-muted/5 overflow-hidden shadow-inner">
          <ComparisonTabs
            originalContent={originalContent}
            enhancedContent={enhancedContent ?? ''}
            contentType={contentType}
            isLoading={isLoading}
            mode="side-by-side"
            className="h-full"
          />
        </div>
      </div>
    </AIEnhanceBaseModal>
  );
}
