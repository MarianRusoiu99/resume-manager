'use client';

/**
 * AI Enhance Modal
 * Modal for AI-powered text enhancement with side-by-side comparison
 * 
 * Features:
 * - Side-by-side original vs enhanced content
 * - Model selection (optional - defaults to user's settings)
 * - Quick instruction presets
 * - Loading states with skeleton
 * 
 * Uses the AI model configured in Settings → AI Models for the "enhance" feature
 * if no model is explicitly selected.
 */

import { useState, useEffect, useCallback } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIModels } from '@/hooks';
import type { ContentType } from '@/lib/validations/settings';

/**
 * Quick instruction presets for common enhancement tasks
 */
const INSTRUCTION_PRESETS = [
    { label: 'Professional', value: 'Make this more professional and polished' },
    { label: 'Concise', value: 'Make this more concise without losing key information' },
    { label: 'Grammar', value: 'Fix grammar, spelling, and punctuation errors' },
    { label: 'Impactful', value: 'Make this more impactful and compelling' },
    { label: 'ATS-Friendly', value: 'Optimize for ATS (Applicant Tracking Systems) while keeping it readable' },
] as const;

interface AIEnhanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalContent: string;
    onAccept: (enhancedContent: string) => void;
    contentType?: ContentType;
    context?: string;
    title?: string;
    description?: string;
    /** Show model selector (default: false - uses user's saved settings) */
    showModelSelector?: boolean;
}

/**
 * Enhanced content display component
 * Extracted to avoid nested ternary in JSX
 */
function EnhancedContentDisplay({
    isLoading,
    enhancedContent,
    contentType,
}: Readonly<{
    isLoading: boolean;
    enhancedContent: string;
    contentType: ContentType;
}>) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[85%]" />
            </div>
        );
    }

    if (enhancedContent) {
        return (
            <pre
                className={cn(
                    'text-sm whitespace-pre-wrap break-words font-mono',
                    contentType === 'text' && 'font-sans'
                )}
            >
                {enhancedContent}
            </pre>
        );
    }

    return (
        <p className="text-sm text-muted-foreground italic">
            Enter instructions and click &quot;Enhance&quot; to generate
        </p>
    );
}

export function AIEnhanceModal({
    open,
    onOpenChange,
    originalContent,
    onAccept,
    contentType = 'text',
    context,
    title = 'Enhance with AI',
    description = 'Use AI to improve, rephrase, or modify your content.',
    showModelSelector = false,
}: Readonly<AIEnhanceModalProps>) {
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

    const handlePresetClick = useCallback((preset: string) => {
        setInstructions(preset);
    }, []);

    const handleEnhance = async () => {
        if (!instructions.trim()) {
            toast.error('Please provide instructions for the AI');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/ai/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: originalContent,
                    instructions,
                    context,
                    contentType,
                    // Only send modelId if explicitly selected
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
    };

    const handleAccept = () => {
        if (enhancedContent) {
            onAccept(enhancedContent);
            onOpenChange(false);
            toast.success('Content enhanced successfully!');
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const hasEnhancement = enhancedContent.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Instructions with presets */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="instructions" className="text-sm font-medium">
                                Instructions
                            </Label>
                            {/* Model selector (optional) */}
                            {showModelSelector && (
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground">Model:</Label>
                                    <Select
                                        value={selectedModel}
                                        onValueChange={setSelectedModel}
                                        disabled={modelsLoading || isLoading}
                                    >
                                        <SelectTrigger className="w-[180px] h-8 text-xs">
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
                        </div>
                        
                        {/* Quick presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {INSTRUCTION_PRESETS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handlePresetClick(preset.value)}
                                    disabled={isLoading}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        
                        <Textarea
                            id="instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Describe what you want the AI to do... (e.g., 'Make this more professional', 'Fix grammar', 'Simplify the language')"
                            className="min-h-[80px] resize-none"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Side-by-side Comparison */}
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                        {/* Original Content */}
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-muted/50 border-b">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Original
                                </Label>
                            </div>
                            <ScrollArea className="flex-1 p-3">
                                <pre
                                    className={cn(
                                        'text-sm whitespace-pre-wrap break-words font-mono',
                                        contentType === 'text' && 'font-sans'
                                    )}
                                >
                                    {originalContent || '(No content)'}
                                </pre>
                            </ScrollArea>
                        </div>

                        {/* Enhanced Content */}
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Enhanced
                                </Label>
                                {isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <ScrollArea className="flex-1 p-3">
                                <EnhancedContentDisplay
                                    isLoading={isLoading}
                                    enhancedContent={enhancedContent}
                                    contentType={contentType}
                                />
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
                        disabled={isLoading || !instructions.trim()}
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
