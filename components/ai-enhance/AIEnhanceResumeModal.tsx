'use client';

/**
 * AI Enhance Resume Modal
 * Modal for enhancing entire resume content with AI
 * 
 * Features:
 * - ChatGPT-style prompt input with file attachments
 * - Visual resume preview (iframe-based) like template modal
 * - Toggle between Text and Visual preview modes
 * - Card-based UI matching template modal style
 * 
 * Uses the AI model configured in Settings → AI Models for the "enhance" feature
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2, Eye, FileText } from 'lucide-react';
import { PromptInput } from './prompt/PromptInput';
import { useTemplatePreview } from '@/hooks/useTemplatePreview';
import type { Resume } from '@/lib/validations/jsonresume';
import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

interface AIEnhanceResumeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resume: Resume;
    onAccept: (enhancedResume: Resume) => void;
    /** Optional template ID for visual preview */
    templateId?: string | null;
}

type ViewMode = 'visual' | 'text';

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

/**
 * Resume preview iframe component
 */
function ResumePreviewIframe({
    htmlContent,
    isLoading = false,
}: Readonly<{
    htmlContent: string | null;
    isLoading?: boolean;
}>) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!htmlContent) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">
                No preview available
            </div>
        );
    }

    return (
        <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            className="w-full h-full bg-white"
            title="Resume Preview"
            sandbox="allow-same-origin"
        />
    );
}

/**
 * Visual preview comparison component
 */
function VisualPreviewComparison({
    originalResume,
    enhancedResume,
    templateId,
    isLoading,
    hasEnhancement,
}: Readonly<{
    originalResume: Resume;
    enhancedResume: Resume | null;
    templateId?: string | null;
    isLoading: boolean;
    hasEnhancement: boolean;
}>) {
    // Fetch preview for original resume
    const {
        htmlContent: originalHtml,
        isLoading: originalLoading,
    } = useTemplatePreview({
        templateId,
        resumeData: originalResume,
    });

    // Fetch preview for enhanced resume
    const {
        htmlContent: enhancedHtml,
        isLoading: enhancedLoading,
    } = useTemplatePreview({
        templateId,
        resumeData: enhancedResume || originalResume,
    });

    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {/* Original Preview */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground">Original Resume</Label>
                </div>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ResumePreviewIframe
                        htmlContent={originalHtml}
                        isLoading={originalLoading}
                    />
                </CardContent>
            </Card>

            {/* Enhanced Preview */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">Enhanced Resume</Label>
                    {(isLoading || enhancedLoading) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <EnhancedVisualContent
                        isLoading={isLoading}
                        enhancedHtml={hasEnhancement ? enhancedHtml : null}
                        enhancedLoading={enhancedLoading}
                        hasEnhancement={hasEnhancement}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Enhanced visual content display - extracted to avoid nested ternary
 */
function EnhancedVisualContent({
    isLoading,
    enhancedHtml,
    enhancedLoading,
    hasEnhancement,
}: Readonly<{
    isLoading: boolean;
    enhancedHtml: string | null;
    enhancedLoading: boolean;
    hasEnhancement: boolean;
}>) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (hasEnhancement && enhancedHtml) {
        return (
            <ResumePreviewIframe
                htmlContent={enhancedHtml}
                isLoading={enhancedLoading}
            />
        );
    }

    return (
        <div className="flex items-center justify-center h-full text-muted-foreground italic">
            Enter instructions and click Enhance to generate
        </div>
    );
}

/**
 * Text preview comparison component
 */
function TextPreviewComparison({
    originalText,
    enhancedText,
    isLoading,
}: Readonly<{
    originalText: string;
    enhancedText: string;
    isLoading: boolean;
}>) {
    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {/* Original Text */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground">Original Resume</Label>
                </div>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-3">
                        <pre className="text-xs whitespace-pre-wrap break-words font-sans">
                            {originalText || '(No content)'}
                        </pre>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Enhanced Text */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">Enhanced Resume</Label>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-3">
                        <EnhancedTextContent isLoading={isLoading} enhancedText={enhancedText} />
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Enhanced text content display - extracted to avoid nested ternary
 */
function EnhancedTextContent({
    isLoading,
    enhancedText,
}: Readonly<{
    isLoading: boolean;
    enhancedText: string;
}>) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (enhancedText) {
        return (
            <pre className="text-xs whitespace-pre-wrap break-words font-sans">
                {enhancedText}
            </pre>
        );
    }

    return (
        <div className="flex items-center justify-center h-full text-muted-foreground italic">
            Enter instructions and click Enhance to generate
        </div>
    );
}

export function AIEnhanceResumeModal({
    open,
    onOpenChange,
    resume,
    onAccept,
    templateId,
}: Readonly<AIEnhanceResumeModalProps>) {
    const [instructions, setInstructions] = useState('');
    const [enhancedResume, setEnhancedResume] = useState<Resume | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('visual');

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setEnhancedResume(null);
            setInstructions('');
            setViewMode('visual');
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

            const contextParts = [
                'This is a JSON Resume format document',
                attachmentsContext,
            ].filter(Boolean);

            const result = await apiJson<{ enhancedContent?: string }>(API_V1.AI.ENHANCE, {
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

            if (result.error) {
                throw new Error(result.error);
            }

            let enhanced = (result.data?.enhancedContent ?? '').trim();

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Enhance Resume with AI
                    </DialogTitle>
                    <DialogDescription>
                        AI will improve your entire resume: better wording, stronger impact, and professional tone.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
                    {/* ChatGPT-style Prompt Input */}
                    <PromptInput
                        value={instructions}
                        onChange={setInstructions}
                        onSubmit={handleEnhance}
                        isLoading={isLoading}
                        hasExistingContent={hasEnhancement}
                        showFileAttachment={true}
                        placeholder="Describe how you want to improve your resume... (e.g., 'Make it more impactful', 'Tailor for a senior role')"
                    />

                    {/* View Mode Toggle */}
                    <div className="flex items-center flex-shrink-0">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                            <TabsList>
                                <TabsTrigger value="visual" className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    Visual Preview
                                </TabsTrigger>
                                <TabsTrigger value="text" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Text View
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-h-0">
                        {viewMode === 'visual' ? (
                            <VisualPreviewComparison
                                originalResume={resume}
                                enhancedResume={enhancedResume}
                                templateId={templateId}
                                isLoading={isLoading}
                                hasEnhancement={hasEnhancement}
                            />
                        ) : (
                            <TextPreviewComparison
                                originalText={originalText}
                                enhancedText={enhancedText}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
