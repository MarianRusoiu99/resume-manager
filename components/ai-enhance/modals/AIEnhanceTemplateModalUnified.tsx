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

export interface AIEnhanceTemplateModalUnifiedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalHtml: string;
  originalCss: string;
  onAccept: (enhancedHtml: string, enhancedCss: string) => void;
  title?: string;
  description?: string;
}

type ViewMode = 'visual' | 'code';
type CodeTab = 'html' | 'css';

export function AIEnhanceTemplateModalUnified({
  open,
  onOpenChange,
  originalHtml,
  originalCss,
  onAccept,
  title = 'Enhance Template with AI',
  description = 'AI will enhance both HTML and CSS together to improve structure, styling, and consistency.',
}: Readonly<AIEnhanceTemplateModalUnifiedProps>) {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [codeTab, setCodeTab] = useState<CodeTab>('html');

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

  // Set template data when modal opens
  useEffect(() => {
    if (open) {
      setTemplate(originalHtml, originalCss);
      reset();
      setViewMode('visual');
      setCodeTab('html');
    }
  }, [open, originalHtml, originalCss, setTemplate, reset]);

  const handleAccept = useCallback(() => {
    if (enhancedContent) {
      onAccept(enhancedContent.html || originalHtml, enhancedContent.css || originalCss);
      onOpenChange(false);
      toast.success('Template enhanced successfully!');
    }
  }, [enhancedContent, originalHtml, originalCss, onAccept, onOpenChange]);

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
      onOpenChange={onOpenChange}
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

          {/* Code sub-tabs (only visible in code view) */}
          {viewMode === 'code' && (
            <Tabs value={codeTab} onValueChange={(v) => setCodeTab(v as CodeTab)}>
              <TabsList>
                <TabsTrigger value="html" className="gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="css" className="gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  CSS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Side-by-side comparison (both views are always side-by-side) */}
        <div className="flex-1 min-h-0">
          {viewMode === 'visual' ? (
            <TemplateVisualComparison
              originalHtml={originalHtml}
              originalCss={originalCss}
              enhancedHtml={enhancedContent?.html ?? null}
              enhancedCss={enhancedContent?.css ?? null}
              isEnhancing={isLoading}
              className="h-full"
            />
          ) : (
            <TemplateCodeComparison
              originalCode={codeTab === 'html' ? originalHtml : originalCss}
              enhancedCode={codeTab === 'html' ? (enhancedContent?.html ?? null) : (enhancedContent?.css ?? null)}
              codeType={codeTab === 'html' ? 'HTML' : 'CSS'}
              isEnhancing={isLoading}
              className="h-full"
            />
          )}
        </div>
      </div>
    </AIEnhanceBaseModal>
  );
}
