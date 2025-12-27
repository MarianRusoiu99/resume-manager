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

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Eye, FileText } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { ResumeVisualComparison } from '../preview/ResumeVisualComparison';
import { ResumeTextComparison } from '../preview/ResumeTextComparison';
import { useResumeEnhancement } from '../hooks/useAIEnhancement';
import { RESUME_PRESETS } from '../types';
import type { Resume } from '@/lib/validations/jsonresume';

export interface AIEnhanceResumeModalUnifiedProps {
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

export function AIEnhanceResumeModalUnified({
  open,
  onOpenChange,
  resume,
  onAccept,
  templateId,
  title = 'Enhance Resume with AI',
  description = 'AI will improve your entire resume: better wording, stronger impact, and professional tone.',
}: Readonly<AIEnhanceResumeModalUnifiedProps>) {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');

  // Use centralized enhancement hook
  const {
    enhancedContent: enhancedResume,
    isLoading,
    enhance,
    reset,
    hasEnhancement,
    setResume,
    setInstructions,
    instructions,
  } = useResumeEnhancement<Resume>();

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      setResume(resume);
      reset();
      setViewMode('visual');
    }
  }, [onOpenChange, resume, setResume, reset]);

  // Keep the resume in sync if the prop changes while open.
  useEffect(() => {
    if (!open) return;
    setResume(resume);
  }, [open, resume, setResume]);

  const handleAccept = useCallback(() => {
    if (enhancedResume) {
      onAccept(enhancedResume);
      onOpenChange(false);
      toast.success('Resume enhanced successfully!');
    }
  }, [enhancedResume, onAccept, onOpenChange]);

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
          presets={RESUME_PRESETS}
          isLoading={isLoading}
          hasExistingContent={hasEnhancement}
          showFileAttachment={true}
          placeholder="Describe how you want to improve your resume... (e.g., 'Make it more impactful', 'Tailor for a senior role'). You can also attach a job description."
        />

        {/* View toggle */}
        <div className="flex items-center flex-shrink-0">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visual Preview
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Side-by-side comparison (both views are always side-by-side) */}
        <div className="flex-1 min-h-0">
          {viewMode === 'visual' ? (
            <ResumeVisualComparison
              originalResume={resume}
              enhancedResume={enhancedResume}
              templateId={templateId}
              isEnhancing={isLoading}
              className="h-full"
            />
          ) : (
            <ResumeTextComparison
              originalResume={resume}
              enhancedResume={enhancedResume}
              isEnhancing={isLoading}
              className="h-full"
            />
          )}
        </div>
      </div>
    </AIEnhanceBaseModal>
  );
}
