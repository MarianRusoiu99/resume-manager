'use client';

/**
 * AI Enhance Modal
 * Modal for AI-powered text enhancement with side-by-side comparison
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
import { cn } from '@/lib/utils';

interface AIModel {
    id: string;
    name: string;
    provider: string;
}

interface AIEnhanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalContent: string;
    onAccept: (enhancedContent: string) => void;
    contentType?: 'text' | 'html' | 'css' | 'markdown';
    context?: string;
    title?: string;
    description?: string;
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
}: Readonly<AIEnhanceModalProps>) {
    const [instructions, setInstructions] = useState('');
    const [enhancedContent, setEnhancedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [modelsLoading, setModelsLoading] = useState(false);

    // Fetch available models when modal opens
    useEffect(() => {
        if (open) {
            fetchModels();
            // Reset state when modal opens
            setEnhancedContent('');
            setInstructions('');
        }
    }, [open]);

    const fetchModels = async () => {
        try {
            setModelsLoading(true);
            const response = await fetch('/api/settings/api-providers/models');
            if (response.ok) {
                const data = await response.json();
                // API returns { allModels: [...], byProvider: {...} }
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
            const response = await fetch('/api/ai/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: originalContent,
                    instructions,
                    context,
                    contentType,
                    modelId: selectedModel,
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
                                placeholder="Describe what you want the AI to do... (e.g., 'Make this more professional', 'Fix grammar', 'Simplify the language')"
                                className="mt-1.5 min-h-[80px] resize-none"
                                disabled={isLoading}
                            />
                        </div>
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
                                {enhancedContent ? (
                                    <pre
                                        className={cn(
                                            'text-sm whitespace-pre-wrap break-words font-mono',
                                            contentType === 'text' && 'font-sans'
                                        )}
                                    >
                                        {enhancedContent}
                                    </pre>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        {isLoading
                                            ? 'Generating enhanced content...'
                                            : 'Enter instructions and click "Enhance" to generate'}
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
