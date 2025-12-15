'use client';

/**
 * AI Enhance Modal
 * Modal for AI-powered text enhancement with side-by-side comparison
 * 
 * Features:
 * - ChatGPT-style prompt input with file attachments
 * - Side-by-side original vs enhanced content with Card components
 * - Model selection (optional - defaults to user's settings)
 * - Loading states
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIModels } from '@/hooks';
import { PromptInput } from './prompt/PromptInput';
import type { ContentType } from '@/lib/validations/settings';
import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

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
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div className="flex items-center justify-center h-full text-muted-foreground italic">
            Enter instructions and click Enhance to generate
        </div>
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

    const handleEnhance = useCallback(async (attachmentsContext?: string) => {
        if (!instructions.trim()) {
            toast.error('Please provide instructions for the AI');
            return;
        }

        try {
            setIsLoading(true);

            const contextParts = [
                context,
                attachmentsContext,
            ].filter(Boolean);

            const result = await apiJson<{ enhancedContent?: string }>(API_V1.AI.ENHANCE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: originalContent,
                    instructions,
                    context: contextParts.join('\n\n'),
                    contentType,
                    // Only send modelId if explicitly selected
                    ...(showModelSelector && selectedModel ? { modelId: selectedModel } : {}),
                }),
            });

            if (result.error) {
                throw new Error(result.error);
            }

            setEnhancedContent(result.data?.enhancedContent ?? '');
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {title}
                        </DialogTitle>
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
                    <DialogDescription>{description}</DialogDescription>
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
                        placeholder="Describe what you want the AI to do... (e.g., 'Make this more professional', 'Fix grammar')"
                    />

                    {/* Side-by-side Comparison */}
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                        {/* Original Content */}
                        <Card className="flex flex-col overflow-hidden">
                            <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Original
                                </Label>
                            </div>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-full p-3">
                                    <pre
                                        className={cn(
                                            'text-sm whitespace-pre-wrap break-words font-mono',
                                            contentType === 'text' && 'font-sans'
                                        )}
                                    >
                                        {originalContent || '(No content)'}
                                    </pre>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Enhanced Content */}
                        <Card className="flex flex-col overflow-hidden">
                            <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Enhanced
                                </Label>
                                {isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-full p-3">
                                    <EnhancedContentDisplay
                                        isLoading={isLoading}
                                        enhancedContent={enhancedContent}
                                        contentType={contentType}
                                    />
                                </ScrollArea>
                            </CardContent>
                        </Card>
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
