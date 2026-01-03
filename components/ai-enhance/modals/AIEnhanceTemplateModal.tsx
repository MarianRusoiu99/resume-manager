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
import { Check, X, Eye, Code } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { TemplateVisualComparison } from '../preview/TemplateVisualComparison';
import { TemplateCodeComparison } from '../preview/TemplateCodeComparison';
import { useTemplateEnhancement } from '../hooks/useTemplateEnhancement';
import { ModelSelector } from '@/components/ai/ModelSelector';
import type { ConversationAttachment } from '../hooks/useConversation';

// Local file attachment type to match PromptInput's expected type
interface PromptFileAttachment {
  type: string;
  content: string;
  name: string;
}

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
  const [selectedModel, setSelectedModel] = useState<string>('');

  const handleModelChange = useCallback((modelId: string, _providerId: string) => {
    setSelectedModel(modelId);
  }, []);

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

  const handleEnhance = useCallback((fileAttachments?: PromptFileAttachment[]) => {
    const mappedAttachments: ConversationAttachment[] | undefined = fileAttachments?.map((a) => ({
      type: a.type.startsWith('image/') ? 'image' as const : 'document' as const,
      content: a.content,
      name: a.name,
      mimeType: a.type,
    }));
    enhance(mappedAttachments, selectedModel);
  }, [enhance, selectedModel]);

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
        disabled={!hasEnhancement || isLoading}
        className="h-9 px-6 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
      >
        <Check className="h-4 w-4 mr-2" />
        Accept Changes
      </Button>
    </>
  );

  const centerAction = (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-[300px]">
      <TabsList className="grid w-full grid-cols-2 h-9">
        <TabsTrigger value="visual" className="flex items-center gap-2 text-xs">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className="flex items-center gap-2 text-xs">
          <Code className="h-3.5 w-3.5" />
          Code View
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const rightAction = (
    <ModelSelector
      value={selectedModel}
      onValueChange={handleModelChange}
      feature="template"
      requiresStructuredOutput={true}
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
      centerAction={centerAction}
      rightAction={rightAction}
      size="fullscreen"
    >
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        {/* ChatGPT-style prompt input with file support */}
        <PromptInput
          value={instructions}
          onChange={setInstructions}
          onSubmit={handleEnhance}
          isLoading={isLoading}
          hasExistingContent={hasEnhancement}
          showFileAttachment={true}
          className="flex-shrink-0"
          placeholder="Describe how you want to improve the template... (e.g., 'Make it more modern', 'Improve typography')"
        />

        {/* Side-by-side comparison (both views are always side-by-side) */}
        <div className="flex-1 min-h-0 rounded-2xl border border-muted/20 bg-muted/5 overflow-hidden shadow-inner flex flex-col">
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
