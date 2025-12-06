'use client';

/**
 * AI Enhance Resume Modal (Refactored)
 * 
 * Modal for enhancing entire resume content with AI.
 * Features:
 * - ChatGPT-style prompt input with file attachments (e.g., job descriptions)
 * - Live resume preview comparison (original vs enhanced)
 * - Text comparison view
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, FileText, Eye } from 'lucide-react';
import { AIEnhanceBaseModal } from './AIEnhanceBaseModal';
import { PromptInput } from '../prompt/PromptInput';
import { ComparisonTabs } from '../preview/ComparisonTabs';
import { ResumePreviewComparison } from '../preview/ResumePreviewComparison';
import { RESUME_PRESETS } from '../types';
import type { AIEnhanceResumeModalProps } from '../types';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Convert resume to readable text format for display
 */
function resumeToText(resume: Resume): string {
  const sections: string[] = [];

  // Basics
  if (resume.basics) {
    sections.push(`=== PERSONAL INFO ===
Name: ${resume.basics.name || ''}
Label/Title: ${resume.basics.label || ''}
Email: ${resume.basics.email || ''}
Phone: ${resume.basics.phone || ''}
Location: ${resume.basics.location?.city || ''}, ${resume.basics.location?.region || ''}, ${resume.basics.location?.countryCode || ''}
Summary: ${resume.basics.summary || ''}`);
  }

  // Work Experience
  if (resume.work && resume.work.length > 0) {
    const workEntries = resume.work.map(w =>
      `- ${w.position || ''} at ${w.name || ''} (${w.startDate || ''} - ${w.endDate || 'Present'})
  ${w.summary || ''}
  Highlights: ${(w.highlights || []).join('; ')}`
    ).join('\n\n');
    sections.push(`=== WORK EXPERIENCE ===\n${workEntries}`);
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    const eduEntries = resume.education.map(e =>
      `- ${e.studyType || ''} in ${e.area || ''} from ${e.institution || ''} (${e.startDate || ''} - ${e.endDate || ''})`
    ).join('\n');
    sections.push(`=== EDUCATION ===\n${eduEntries}`);
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    const skillEntries = resume.skills.map(s =>
      `- ${s.name || ''}: ${(s.keywords || []).join(', ')}`
    ).join('\n');
    sections.push(`=== SKILLS ===\n${skillEntries}`);
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    const projEntries = resume.projects.map(p =>
      `- ${p.name || ''}: ${p.description || ''}`
    ).join('\n');
    sections.push(`=== PROJECTS ===\n${projEntries}`);
  }

  return sections.join('\n\n');
}

export function AIEnhanceResumeModalNew({
  open,
  onOpenChange,
  resume,
  onAccept,
  profileId,
  templateId,
  title = 'Enhance Resume with AI',
  description = 'AI will improve your entire resume: better wording, stronger impact, and professional tone.',
}: Readonly<AIEnhanceResumeModalProps>) {
  const [instructions, setInstructions] = useState('');
  const [enhancedResume, setEnhancedResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'text' | 'preview'>('preview');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setEnhancedResume(null);
      setInstructions('');
      setActiveView('preview');
    }
  }, [open]);

  const handleEnhance = useCallback(async (attachmentsContext?: string) => {
    if (!instructions.trim()) {
      toast.error('Please provide instructions for the AI');
      return;
    }

    try {
      setIsLoading(true);

      const resumeText = resumeToText(resume);
      const resumeJson = JSON.stringify(resume, null, 2);

      // Build context with any attached files (e.g., job descriptions)
      const contextParts = [
        'This is a JSON Resume format document',
        attachmentsContext,
      ].filter(Boolean);

      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `RESUME DATA (JSON format - you MUST return valid JSON in this exact structure):
${resumeJson}

RESUME CONTENT (for context):
${resumeText}`,
          instructions: `${instructions}

CRITICAL INSTRUCTIONS:
1. You MUST return ONLY valid JSON in the exact same structure as the input
2. Modify the content based on the instructions above
3. Preserve ALL required fields (name, email, etc.)
4. Improve text quality: better wording, stronger impact, professional tone
5. Keep dates, company names, and factual information unchanged unless asked
6. Return ONLY the JSON object, no explanations or markdown`,
          context: contextParts.join('\n\n'),
          contentType: 'text',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Enhancement failed');
      }

      const data = await response.json();
      let enhanced = data.enhancedContent.trim();

      // Remove markdown code blocks if present
      if (enhanced.startsWith('```')) {
        enhanced = enhanced.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      try {
        const parsedResume = JSON.parse(enhanced) as Resume;
        setEnhancedResume(parsedResume);
      } catch {
        throw new Error('AI returned invalid JSON. Please try again.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enhancement failed');
    } finally {
      setIsLoading(false);
    }
  }, [instructions, resume]);

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

  const hasEnhancement = enhancedResume !== null;
  const originalText = resumeToText(resume);
  const enhancedText = enhancedResume ? resumeToText(enhancedResume) : '';

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
          onSubmit={handleEnhance}
          presets={RESUME_PRESETS}
          isLoading={isLoading}
          hasExistingContent={hasEnhancement}
          showFileAttachment={true}
          placeholder="Describe what you want to improve... (e.g., 'Tailor for a senior developer role'). You can also attach a job description."
        />

        {/* View toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'text' | 'preview')}>
            <TabsList>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visual Preview
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Comparison
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Comparison views */}
        <div className="flex-1 min-h-0">
          {activeView === 'preview' ? (
            <ResumePreviewComparison
              originalResume={resume}
              enhancedResume={enhancedResume}
              templateId={templateId}
              isLoading={isLoading}
              className="h-full"
            />
          ) : (
            <ComparisonTabs
              originalContent={originalText}
              enhancedContent={enhancedText}
              contentType="text"
              isLoading={isLoading}
              mode="side-by-side"
              originalLabel="Original Resume"
              enhancedLabel="Enhanced Resume"
              className="h-full"
            />
          )}
        </div>
      </div>
    </AIEnhanceBaseModal>
  );
}
