'use client';

/**
 * AI Enhance Resume Modal
 * Modal for enhancing entire resume content with AI
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import type { Resume } from '@/lib/validations/jsonresume';

interface AIModel {
    id: string;
    name: string;
    provider: string;
}

interface AIEnhanceResumeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resume: Resume;
    onAccept: (enhancedResume: Resume) => void;
}

/**
 * Convert resume to readable text format for AI
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

export function AIEnhanceResumeModal({
    open,
    onOpenChange,
    resume,
    onAccept,
}: Readonly<AIEnhanceResumeModalProps>) {
    const [instructions, setInstructions] = useState('');
    const [enhancedPreview, setEnhancedPreview] = useState('');
    const [enhancedResume, setEnhancedResume] = useState<Resume | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [modelsLoading, setModelsLoading] = useState(false);

    // Fetch available models when modal opens
    useEffect(() => {
        if (open) {
            fetchModels();
            setEnhancedPreview('');
            setEnhancedResume(null);
            setInstructions('');
        }
    }, [open]);

    const fetchModels = async () => {
        try {
            setModelsLoading(true);
            const response = await fetch('/api/settings/api-providers/models');
            if (response.ok) {
                const data = await response.json();
                const allModels = (data.allModels || []).map((m: { id: string; name: string; providerId: string }) => ({
                    id: m.id,
                    name: m.name,
                    provider: m.providerId,
                }));
                setModels(allModels);
                if (allModels.length > 0 && !selectedModel) {
                    setSelectedModel(allModels[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setModelsLoading(false);
        }
    };

    const handleEnhance = async () => {
        if (!instructions.trim()) {
            toast.error('Please provide instructions for the AI');
            return;
        }

        if (!selectedModel) {
            toast.error('Please select an AI model');
            return;
        }

        try {
            setIsLoading(true);

            const resumeText = resumeToText(resume);
            const resumeJson = JSON.stringify(resume, null, 2);

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
                    context: 'This is a JSON Resume format document',
                    contentType: 'text',
                    modelId: selectedModel,
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
                setEnhancedPreview(resumeToText(parsedResume));
            } catch {
                throw new Error('AI returned invalid JSON. Please try again.');
            }

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Enhancement failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = () => {
        if (enhancedResume) {
            onAccept(enhancedResume);
            onOpenChange(false);
            toast.success('Resume enhanced successfully!');
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const hasEnhancement = enhancedResume !== null;
    const originalPreview = resumeToText(resume);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Enhance Resume with AI
                    </DialogTitle>
                    <DialogDescription>
                        AI will improve your entire resume: better wording, stronger impact, and professional tone.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Model Selection & Instructions */}
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-48">
                            <Label htmlFor="model-select" className="text-sm font-medium">
                                AI Model
                            </Label>
                            <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                disabled={modelsLoading || isLoading}
                            >
                                <SelectTrigger id="model-select" className="mt-1.5">
                                    <SelectValue placeholder={modelsLoading ? 'Loading...' : 'Select model'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            <span className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground uppercase">
                                                    {model.provider}
                                                </span>
                                                {model.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                    {models.length === 0 && !modelsLoading && (
                                        <SelectItem value="none" disabled>
                                            No models available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Label htmlFor="instructions" className="text-sm font-medium">
                                Instructions
                            </Label>
                            <Textarea
                                id="instructions"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Describe what you want the AI to do... (e.g., 'Make it more impactful', 'Tailor for a senior developer role', 'Improve summary and highlights')"
                                className="mt-1.5 min-h-[60px] resize-none"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Side-by-side Comparison */}
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                        {/* Original */}
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-muted/50 border-b">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Original Resume
                                </Label>
                            </div>
                            <ScrollArea className="flex-1 p-3 h-[350px]">
                                <pre className="text-xs whitespace-pre-wrap break-words font-sans">
                                    {originalPreview || '(No content)'}
                                </pre>
                            </ScrollArea>
                        </div>

                        {/* Enhanced */}
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Enhanced Resume
                                </Label>
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                            <ScrollArea className="flex-1 p-3 h-[350px]">
                                {enhancedPreview ? (
                                    <pre className="text-xs whitespace-pre-wrap break-words font-sans">
                                        {enhancedPreview}
                                    </pre>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        {isLoading ? 'Enhancing resume...' : 'Click "Enhance" to generate'}
                                    </p>
                                )}
                            </ScrollArea>
                        </div>
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
                        variant="outline"
                        onClick={handleEnhance}
                        disabled={isLoading || !instructions.trim() || !selectedModel}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        {hasEnhancement ? 'Regenerate' : 'Enhance'}
                    </Button>

                    <Button
                        type="button"
                        onClick={handleAccept}
                        disabled={!hasEnhancement || isLoading}
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
