'use client';

/**
 * AI Enhance Template Modal
 * Specialized modal for enhancing both HTML and CSS together with tabbed view
 * Uses the AI model configured in Settings → AI Models for the "template" feature
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, Check, X, Loader2, Code } from 'lucide-react';

interface AIEnhanceTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalHtml: string;
    originalCss: string;
    onAccept: (enhancedHtml: string, enhancedCss: string) => void;
}

export function AIEnhanceTemplateModal({
    open,
    onOpenChange,
    originalHtml,
    originalCss,
    onAccept,
}: Readonly<AIEnhanceTemplateModalProps>) {
    const [instructions, setInstructions] = useState('');
    const [enhancedHtml, setEnhancedHtml] = useState('');
    const [enhancedCss, setEnhancedCss] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setEnhancedHtml('');
            setEnhancedCss('');
            setInstructions('');
            setActiveTab('html');
        }
    }, [open]);

    const handleEnhance = async () => {
        if (!instructions.trim()) {
            toast.error('Please provide instructions for the AI');
            return;
        }

        try {
            setIsLoading(true);

            // Combine HTML and CSS for context
            const combinedContent = `=== HTML TEMPLATE ===
${originalHtml}

=== CSS STYLES ===
${originalCss}`;

            const response = await fetch('/api/ai/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: combinedContent,
                    instructions: `${instructions}

IMPORTANT: You must return both the HTML and CSS in this exact format:
=== HTML TEMPLATE ===
[enhanced HTML here]

=== CSS STYLES ===
[enhanced CSS here]

Make sure to preserve both sections and the exact separator format.`,
                    context: 'This is a resume template with Handlebars syntax ({{variable}}, {{#each}}, etc.)',
                    contentType: 'html',
                    // No modelId - will use settings-based model for 'template' feature
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Enhancement failed');
            }

            const data = await response.json();
            const enhanced = data.enhancedContent;

            // Parse the combined response
            const htmlMatch = enhanced.match(/=== HTML TEMPLATE ===\s*([\s\S]*?)(?:=== CSS STYLES ===|$)/);
            const cssMatch = enhanced.match(/=== CSS STYLES ===\s*([\s\S]*?)$/);

            setEnhancedHtml(htmlMatch ? htmlMatch[1].trim() : enhanced);
            setEnhancedCss(cssMatch ? cssMatch[1].trim() : originalCss);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Enhancement failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = () => {
        if (enhancedHtml || enhancedCss) {
            onAccept(enhancedHtml || originalHtml, enhancedCss || originalCss);
            onOpenChange(false);
            toast.success('Template enhanced successfully!');
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const hasEnhancement = enhancedHtml.length > 0 || enhancedCss.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Enhance Template with AI
                    </DialogTitle>
                    <DialogDescription>
                        AI will enhance both HTML and CSS together to improve structure, styling, and consistency.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Instructions */}
                    <div>
                        <Label htmlFor="instructions" className="text-sm font-medium">
                            Instructions
                        </Label>
                        <Textarea
                            id="instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Describe what you want the AI to do... (e.g., 'Make it more modern', 'Improve responsiveness', 'Add better typography')"
                            className="mt-1.5 min-h-[60px] resize-none"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Tabbed Side-by-side Comparison */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'html' | 'css')} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid grid-cols-2 w-48">
                            <TabsTrigger value="html">
                                <Code className="mr-2 h-3 w-3" />
                                HTML
                            </TabsTrigger>
                            <TabsTrigger value="css">
                                <Code className="mr-2 h-3 w-3" />
                                CSS
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="html" className="flex-1 grid grid-cols-2 gap-4 min-h-0 mt-2">
                            {/* Original HTML */}
                            <div className="flex flex-col border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Original HTML
                                    </Label>
                                </div>
                                <ScrollArea className="flex-1 p-3 h-[300px]">
                                    <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                                        {originalHtml || '(No content)'}
                                    </pre>
                                </ScrollArea>
                            </div>

                            {/* Enhanced HTML */}
                            <div className="flex flex-col border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Enhanced HTML
                                    </Label>
                                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                                <ScrollArea className="flex-1 p-3 h-[300px]">
                                    {enhancedHtml ? (
                                        <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                                            {enhancedHtml}
                                        </pre>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            {isLoading ? 'Generating...' : 'Click "Enhance" to generate'}
                                        </p>
                                    )}
                                </ScrollArea>
                            </div>
                        </TabsContent>

                        <TabsContent value="css" className="flex-1 grid grid-cols-2 gap-4 min-h-0 mt-2">
                            {/* Original CSS */}
                            <div className="flex flex-col border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Original CSS
                                    </Label>
                                </div>
                                <ScrollArea className="flex-1 p-3 h-[300px]">
                                    <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                                        {originalCss || '(No content)'}
                                    </pre>
                                </ScrollArea>
                            </div>

                            {/* Enhanced CSS */}
                            <div className="flex flex-col border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Enhanced CSS
                                    </Label>
                                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                                <ScrollArea className="flex-1 p-3 h-[300px]">
                                    {enhancedCss ? (
                                        <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                                            {enhancedCss}
                                        </pre>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            {isLoading ? 'Generating...' : 'Click "Enhance" to generate'}
                                        </p>
                                    )}
                                </ScrollArea>
                            </div>
                        </TabsContent>
                    </Tabs>
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
