'use client';

/**
 * AI Enhance Resume Modal (Unified)
 * 
 * A clean, unified modal for AI-powered resume enhancement with:
 * - Side-by-side visual preview (default)
 * - Side-by-side text comparison view
 * - ChatGPT-style prompt input with file attachments
 * - Centralized enhancement logic via useResumeEnhancement hook
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Eye, FileText } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { ResumeVisualComparison } from '../preview/ResumeVisualComparison';
import { ResumeTextComparison } from '../preview/ResumeTextComparison';
import { useAITask } from '../hooks/useAITask';
import { RESUME_PRESETS } from '../types';
import type { Resume } from '@/lib/validations/jsonresume';
import { ModelSelector } from '@/components/ai/ModelSelector';
import type { ResumeEnhancementOutput } from '@/lib/ai/modes/types';

import type { ConversationAttachment } from '../hooks/useConversation';

interface AttachmentInput {
  type: string;
  content: string;
  name: string;
}

export interface AIEnhanceResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume;
  onAccept: (enhancedResume: Resume) => void;
  /** Optional template ID for visual preview */
  templateId?: string | null;
  /** Optional profile ID (for future use) */
  profileId?: string;
  title?: string;
  description?: string;
}

type ViewMode = 'visual' | 'text';

export function AIEnhanceResumeModal({
  open,
  onOpenChange,
  resume,
  onAccept,
  templateId,
  title = 'Enhance Resume with AI',
  description = 'AI will improve your entire resume: better wording, stronger impact, and professional tone.',
}: Readonly<AIEnhanceResumeModalProps>) {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [instructions, setInstructions] = useState('');

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  // Use centralized enhancement hook
  const {
    runTask,
    isLoading,
    output,
  } = useAITask<ResumeEnhancementOutput>({
    mode: 'resume-enhancement',
  });

  // Extract resume from structured output
  const enhancedResume = output?.resume || null;
  const hasEnhancement = !!enhancedResume;

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  const handleAccept = useCallback(() => {
    if (enhancedResume) {
      onAccept(enhancedResume as Resume);
      onOpenChange(false);
      toast.success('Resume enhanced successfully!');
    }
  }, [enhancedResume, onAccept, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleEnhance = useCallback((attachments?: AttachmentInput[]) => {
    const mappedAttachments: ConversationAttachment[] | undefined = attachments?.map((a) => ({
      type: a.type.startsWith('image/') ? 'image' as const : 'document' as const,
      content: a.content,
      name: a.name,
      mimeType: a.type,
    }));

    runTask({
      message: instructions,
      attachments: mappedAttachments,
      modelId: selectedModel,
      context: {
        currentResume: resume,
      }
    });
  }, [instructions, runTask, resume, selectedModel]);

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
          Visual
        </TabsTrigger>
        <TabsTrigger value="text" className="flex items-center gap-2 text-xs">
          <FileText className="h-3.5 w-3.5" />
          Text View
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const rightAction = (
    <ModelSelector
      value={selectedModel}
      onValueChange={handleModelChange}
      feature="enhance"
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
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* ChatGPT-style prompt input with file support */}
        <PromptInput
          value={instructions}
          onChange={setInstructions}
          onSubmit={handleEnhance}
          presets={RESUME_PRESETS}
          isLoading={isLoading}
          hasExistingContent={hasEnhancement}
          showFileAttachment={true}
          className="flex-shrink-0"
          placeholder="Describe how you want to improve your resume... (e.g., 'Make it more impactful', 'Tailor for a senior role'). You can also attach a job description."
        />

        {/* Side-by-side comparison (both views are always side-by-side) */}
        <div className="flex-1 min-h-0 rounded-2xl border border-muted/20 bg-muted/5 overflow-hidden shadow-inner flex flex-col">
          {viewMode === 'visual' ? (
            <ResumeVisualComparison
              originalResume={resume}
              enhancedResume={enhancedResume as Resume}
              templateId={templateId}
              isEnhancing={isLoading}
              className="h-full"
            />
          ) : (
            <ResumeTextComparison
              originalResume={resume}
              enhancedResume={enhancedResume as Resume}
              isEnhancing={isLoading}
              className="h-full"
            />
          )}
        </div>
      </div>
    </AIEnhanceBaseModal>
  );
}
