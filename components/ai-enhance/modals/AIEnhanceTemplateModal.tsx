'use client';

/**
 * AI Enhance Template Modal (Unified)
 * 
 * A clean, unified modal for AI-powered template enhancement with:
 * - Side-by-side visual preview (default)
 * - Side-by-side code comparison view (HTML/CSS)
 * - ChatGPT-style prompt input with file attachments
 * - Centralized enhancement logic via useTemplateEnhancement hook
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Eye, Code, FileText } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { TemplateVisualComparison } from '../preview/TemplateVisualComparison';
import { TemplateCodeComparison } from '../preview/TemplateCodeComparison';
import { useTemplateEnhancement } from '../hooks/useAIEnhancement';

export interface AIEnhanceTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalHtml: string;
  onAccept: (enhancedHtml: string) => void;
  title?: string;
  description?: string;
}

type ViewMode = 'visual' | 'code';

export function AIEnhanceTemplateModal({
  open,
  onOpenChange,
  originalHtml,
  onAccept,
  title = 'Enhance Template with AI',
  description = 'AI will enhance the HTML template and its styles to improve structure, styling, and consistency.',
}: Readonly<AIEnhanceTemplateModalProps>) {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');

  // Use centralized enhancement hook
  const {
    enhancedContent,
    isLoading,
    enhance,
    reset,
    hasEnhancement,
    setTemplate,
    setInstructions,
    instructions,
  } = useTemplateEnhancement();

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      setTemplate(originalHtml);
      reset();
      setViewMode('visual');
    }
  }, [onOpenChange, originalHtml, setTemplate, reset]);

  // Keep template inputs in sync if props change while open.
  useEffect(() => {
    if (!open) return;
    setTemplate(originalHtml);
  }, [open, originalHtml, setTemplate]);

  const handleAccept = useCallback(() => {
    if (enhancedContent) {
      onAccept(enhancedContent.html || originalHtml);
      onOpenChange(false);
      toast.success('Template enhanced successfully!');
    }
  }, [enhancedContent, originalHtml, onAccept, onOpenChange]);

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
        Accept Changes
      </Button>
    </>
  );

  return (
    <AIEnhanceBaseModal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      footer={footer}
      size="fullscreen"
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* ChatGPT-style prompt input with file support */}
        <PromptInput
          value={instructions}
          onChange={setInstructions}
          onSubmit={enhance}
          isLoading={isLoading}
          hasExistingContent={hasEnhancement}
          showFileAttachment={true}
          placeholder="Describe how you want to improve the template... (e.g., 'Make it more modern', 'Improve typography')"
        />

        {/* View toggle */}
        <div className="flex items-center justify-between flex-shrink-0">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visual Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Side-by-side comparison (both views are always side-by-side) */}
        <div className="flex-1 min-h-0">
          {viewMode === 'visual' ? (
            <TemplateVisualComparison
              originalHtml={originalHtml}
              enhancedHtml={enhancedContent?.html ?? null}
              isEnhancing={isLoading}
              className="h-full"
            />
          ) : (
            <TemplateCodeComparison
              originalCode={originalHtml}
              enhancedCode={enhancedContent?.html ?? null}
              codeType={'HTML'}
              isEnhancing={isLoading}
              className="h-full"
            />
          )}
        </div>
      </div>
    </AIEnhanceBaseModal>
  );
}
