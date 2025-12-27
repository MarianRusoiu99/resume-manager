'use client';

/**
 * AI Enhance Text Modal
 *
 * Modal for AI-powered text enhancement with ChatGPT-style input
 * and side-by-side comparison.
 */

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { useAIModels } from '@/hooks';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { ComparisonTabs } from '../preview/ComparisonTabs';
import { TEXT_PRESETS } from '../types';
import type { AIEnhanceTextModalProps } from '../types';
import { useTextEnhancement } from '../hooks/useAIEnhancement';
import { useFileAttachments } from '../hooks/useFileAttachments';

export function AIEnhanceTextModal({
  open,
  onOpenChange,
  originalContent,
  onAccept,
  contentType = 'text',
  context,
  title = 'Enhance with AI',
  description = 'Use AI to improve, rephrase, or modify your content.',
  showModelSelector = false,
}: Readonly<AIEnhanceTextModalProps>) {
  const {
    enhancedContent,
    isLoading,
    enhance,
    reset,
    hasEnhancement,
    setOptions,
    setInstructions,
    instructions,
  } = useTextEnhancement();

  const {
    attachments,
    addFiles,
    removeFile,
    isProcessing: attachmentsLoading,
  } = useFileAttachments();

  const handleEnhance = useCallback(() => {
    enhance(attachments);
  }, [enhance, attachments]);

  // Model selection (optional)
  const {
    models,
    selectedModel,
    setSelectedModel,
    isLoading: modelsLoading,
    fetchModels,
  } = useAIModels();

  // Fetch models when modal opens if model selector is shown
  useEffect(() => {
    if (open && showModelSelector) {
      fetchModels();
    }
  }, [open, showModelSelector, fetchModels]);

  // Initialize enhancement options when modal opens
  useEffect(() => {
    if (!open) return;

    reset();
    setOptions({
      content: originalContent,
      context,
      contentType,
      ...(showModelSelector && selectedModel ? { modelId: selectedModel } : {}),
    });
  }, [open, originalContent, context, contentType, showModelSelector, selectedModel, setOptions, reset]);

  // Keep options in sync if inputs change while open
  useEffect(() => {
    if (!open) return;

    setOptions({
      content: originalContent,
      context,
      contentType,
      ...(showModelSelector && selectedModel ? { modelId: selectedModel } : {}),
    });
  }, [open, originalContent, context, contentType, showModelSelector, selectedModel, setOptions]);

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
        variant="outline"
        onClick={handleCancel}
        disabled={isLoading}
      >
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>

      <Button
        type="button"
        onClick={handleAccept}
        disabled={!hasEnhancement || isLoading}
      >
        <Check className="h-4 w-4 mr-2" />
        Accept
      </Button>
    </>
  );

  return (
    <AIEnhanceBaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      size="large"
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Model selector (optional) */}
        {showModelSelector && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Label className="text-sm text-muted-foreground">Model:</Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={modelsLoading || isLoading}
            >
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <SelectValue placeholder={modelsLoading ? 'Loading...' : 'Select model'} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ChatGPT-style prompt input */}
        <PromptInput
          value={instructions}
          onChange={setInstructions}
          onSubmit={handleEnhance}
          presets={TEXT_PRESETS}
          isLoading={isLoading || attachmentsLoading}
          hasExistingContent={hasEnhancement}
          placeholder="Describe what you want the AI to do... (e.g., 'Make this more professional', 'Fix grammar')"
        />

        {/* Side-by-side comparison */}
        <ComparisonTabs
          originalContent={originalContent}
          enhancedContent={enhancedContent ?? ''}
          contentType={contentType}
          isLoading={isLoading}
          mode="side-by-side"
          className="flex-1"
        />
      </div>
    </AIEnhanceBaseModal>
  );
}
