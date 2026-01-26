'use client';

/**
 * AI Enhance Text Modal
 *
 * Modal for AI-powered text enhancement with ChatGPT-style input
 * and side-by-side comparison.
 */

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { ComparisonTabs } from '../preview/ComparisonTabs';
import { TEXT_PRESETS } from '../components/types';
import type { AIEnhanceTextModalProps } from '../components/types';
import { useAITask } from '../hooks/useAITask';
import { ModelSelector } from '@/components/ai/ModelSelector';
import type { TextEnhancementOutput } from '@/lib/ai/modes/types';
import { useBaseModal } from '@/hooks';

import type { ConversationAttachment } from '../hooks/useConversation';

/** Simple attachment interface matching PromptInput's onSubmit callback */
interface AttachmentInput {
  type: string;
  content: string;
  name: string;
}

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
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [instructions, setInstructions] = useState('');

  const handleModelChange = useCallback((newModelId: string) => {
    setSelectedModelId(newModelId);
  }, []);

  const {
    runTask,
    reset: resetAITask,
    partialOutput,
    isLoading,
    output,
    hasOutput,
  } = useAITask<TextEnhancementOutput>({
    mode: 'text-enhancement',
  });

  const modal = useBaseModal({
    initialOpen: open,
    onOpen: () => {
      resetAITask();
      setInstructions('');
    },
    onClose: () => onOpenChange(false),
  });

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    modal.onOpenChange(nextOpen);
    onOpenChange(nextOpen);
  }, [modal, onOpenChange]);

  const enhancedContent = (output?.content || (partialOutput as any)?.content) ?? '';

  // Handle enhance with attachments from PromptInput
  const handleEnhance = useCallback((inputAttachments?: AttachmentInput[]) => {
    const message = `${instructions}

--- CONTENT TO ENHANCE ---
${originalContent}`;

    // Map attachments from PromptInput to ConversationAttachment format
    const mappedAttachments: ConversationAttachment[] | undefined = inputAttachments?.map((a) => ({
      type: a.type.startsWith('image/') ? 'image' as const : 'document' as const,
      content: a.content,
      name: a.name,
      mimeType: a.type,
    }));

    runTask({
      message,
      attachments: mappedAttachments,
      modelId: selectedModelId,
      context: {
        personalInstructions: context,
      }
    });
  }, [instructions, originalContent, runTask, selectedModelId, context]);

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
        value={selectedModelId}
        onValueChange={handleModelChange}
        feature="enhance"
        className="h-9"
      />
  );

  return (
    <AIEnhanceBaseModal
      open={open}
      onOpenChange={handleOpenChange}
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
          isLoading={isLoading}
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
