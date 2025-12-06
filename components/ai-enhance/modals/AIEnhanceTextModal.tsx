'use client';

/**
 * AI Enhance Text Modal
 * 
 * Modal for AI-powered text enhancement with ChatGPT-style input
 * and side-by-side comparison.
 */

import { useState, useEffect, useCallback } from 'react';
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
  const [instructions, setInstructions] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setEnhancedContent('');
      setInstructions('');
    }
  }, [open]);

  const handleEnhance = useCallback(async (attachmentsContext?: string) => {
    if (!instructions.trim()) {
      toast.error('Please provide instructions for the AI');
      return;
    }

    try {
      setIsLoading(true);

      // Combine context with attachments
      const fullContext = [context, attachmentsContext]
        .filter(Boolean)
        .join('\n\n');

      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: originalContent,
          instructions,
          context: fullContext || undefined,
          contentType,
          ...(showModelSelector && selectedModel ? { modelId: selectedModel } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Enhancement failed');
      }

      const data = await response.json();
      setEnhancedContent(data.enhancedContent);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enhancement failed');
    } finally {
      setIsLoading(false);
    }
  }, [instructions, originalContent, context, contentType, showModelSelector, selectedModel]);

  const handleAccept = useCallback(() => {
    if (enhancedContent) {
      onAccept(enhancedContent);
      onOpenChange(false);
      toast.success('Content enhanced successfully!');
    }
  }, [enhancedContent, onAccept, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const hasEnhancement = enhancedContent.length > 0;

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
          isLoading={isLoading}
          hasExistingContent={hasEnhancement}
          placeholder="Describe what you want the AI to do... (e.g., 'Make this more professional', 'Fix grammar')"
        />

        {/* Side-by-side comparison */}
        <ComparisonTabs
          originalContent={originalContent}
          enhancedContent={enhancedContent}
          contentType={contentType}
          isLoading={isLoading}
          mode="side-by-side"
          className="flex-1"
        />
      </div>
    </AIEnhanceBaseModal>
  );
}
