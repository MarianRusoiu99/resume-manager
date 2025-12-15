'use client';

/**
 * AI Enhance Template Modal
 * Specialized modal for enhancing both HTML and CSS together with tabbed view
 * Features:
 * - ChatGPT-style prompt input with file attachments
 * - Preview tabs: Code (HTML/CSS) and Visual Preview
 * - Original vs Enhanced comparison
 * Uses the AI model configured in Settings → AI Models for the "template" feature
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2, Code, Eye, FileText } from 'lucide-react';
import { PromptInput } from './prompt/PromptInput';
import { sampleResume } from '@/lib/utils/sample-resume';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import { API_V1 } from '@/lib/constants';
import { parseApiJson, readApiErrorMessage } from '@/lib/utils/api-response';

interface AIEnhanceTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalHtml: string;
    originalCss: string;
    onAccept: (enhancedHtml: string, enhancedCss: string) => void;
}

type ViewMode = 'code' | 'preview';
type CodeTab = 'html' | 'css';

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
    const [viewMode, setViewMode] = useState<ViewMode>('preview');
    const [codeTab, setCodeTab] = useState<CodeTab>('html');

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setEnhancedHtml('');
            setEnhancedCss('');
            setInstructions('');
            setViewMode('preview');
            setCodeTab('html');
        }
    }, [open]);

    // Generate preview HTML
    const originalPreviewHtml = useCallback(() => {
        try {
            return renderTemplateClientSide({
                htmlTemplate: originalHtml,
                cssStyles: originalCss,
                resumeData: sampleResume,
            });
        } catch {
            return null;
        }
    }, [originalHtml, originalCss]);

    const enhancedPreviewHtml = useCallback(() => {
        if (!enhancedHtml) return null;
        try {
            return renderTemplateClientSide({
                htmlTemplate: enhancedHtml,
                cssStyles: enhancedCss || originalCss,
                resumeData: sampleResume,
            });
        } catch {
            return null;
        }
    }, [enhancedHtml, enhancedCss, originalCss]);

    const handleEnhance = useCallback(async (attachmentsContext?: string) => {
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

            const contextParts = [
                'This is a resume template with Handlebars syntax ({{variable}}, {{#each}}, etc.)',
                attachmentsContext,
            ].filter(Boolean);

            const response = await fetch(API_V1.AI.ENHANCE, {
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
                    context: contextParts.join('\n\n'),
                    contentType: 'html',
                }),
            });

            if (!response.ok) {
                throw new Error(await readApiErrorMessage(response, 'Enhancement failed'));
            }

            const data = await parseApiJson<{ enhancedContent?: string }>(response);
            const enhanced = data.enhancedContent ?? '';

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
    }, [instructions, originalHtml, originalCss]);

    const handleAccept = useCallback(() => {
        if (enhancedHtml || enhancedCss) {
            onAccept(enhancedHtml || originalHtml, enhancedCss || originalCss);
            onOpenChange(false);
            toast.success('Template enhanced successfully!');
        }
    }, [enhancedHtml, enhancedCss, originalHtml, originalCss, onAccept, onOpenChange]);

    const handleCancel = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    const hasEnhancement = enhancedHtml.length > 0 || enhancedCss.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Enhance Template with AI
                    </DialogTitle>
                    <DialogDescription>
                        AI will enhance both HTML and CSS together to improve structure, styling, and consistency.
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
                        placeholder="Describe how you want to improve the template... (e.g., 'Make it more modern', 'Improve typography')"
                    />

                    {/* View Mode Toggle */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                            <TabsList>
                                <TabsTrigger value="preview" className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    Visual Preview
                                </TabsTrigger>
                                <TabsTrigger value="code" className="gap-2">
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

                    {/* Main Content Area */}
                    <div className="flex-1 min-h-0">
                        {viewMode === 'preview' ? (
                            <PreviewComparison
                                originalHtml={originalPreviewHtml()}
                                enhancedHtml={enhancedPreviewHtml()}
                                isLoading={isLoading}
                                hasEnhancement={hasEnhancement}
                            />
                        ) : (
                            <CodeComparison
                                codeTab={codeTab}
                                originalHtml={originalHtml}
                                originalCss={originalCss}
                                enhancedHtml={enhancedHtml}
                                enhancedCss={enhancedCss}
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

/**
 * Render the enhanced preview content
 */
function EnhancedPreviewContent({
    isLoading,
    enhancedHtml,
    hasEnhancement,
}: Readonly<{
    isLoading: boolean;
    enhancedHtml: string | null;
    hasEnhancement: boolean;
}>) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (enhancedHtml) {
        return (
            <iframe
                srcDoc={enhancedHtml}
                className="w-full h-full bg-white"
                title="Enhanced Template Preview"
                sandbox="allow-same-origin"
            />
        );
    }

    return (
        <div className="flex items-center justify-center h-full text-muted-foreground italic">
            {hasEnhancement ? 'Preview error' : 'Enter instructions and click Enhance'}
        </div>
    );
}

/**
 * Visual preview comparison component
 */
function PreviewComparison({
    originalHtml,
    enhancedHtml,
    isLoading,
    hasEnhancement,
}: Readonly<{
    originalHtml: string | null;
    enhancedHtml: string | null;
    isLoading: boolean;
    hasEnhancement: boolean;
}>) {
    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {/* Original Preview */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground">Original Template</Label>
                </div>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    {originalHtml ? (
                        <iframe
                            srcDoc={originalHtml}
                            className="w-full h-full bg-white"
                            title="Original Template Preview"
                            sandbox="allow-same-origin"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No preview available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Enhanced Preview */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">Enhanced Template</Label>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <EnhancedPreviewContent
                        isLoading={isLoading}
                        enhancedHtml={enhancedHtml}
                        hasEnhancement={hasEnhancement}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Code comparison component
 */
function CodeComparison({
    codeTab,
    originalHtml,
    originalCss,
    enhancedHtml,
    enhancedCss,
    isLoading,
}: Readonly<{
    codeTab: CodeTab;
    originalHtml: string;
    originalCss: string;
    enhancedHtml: string;
    enhancedCss: string;
    isLoading: boolean;
}>) {
    const originalCode = codeTab === 'html' ? originalHtml : originalCss;
    const enhancedCode = codeTab === 'html' ? enhancedHtml : enhancedCss;
    const label = codeTab === 'html' ? 'HTML' : 'CSS';

    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {/* Original Code */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground">Original {label}</Label>
                </div>
                <ScrollArea className="flex-1">
                    <pre className="p-3 text-xs whitespace-pre-wrap break-words font-mono">
                        {originalCode || '(No content)'}
                    </pre>
                </ScrollArea>
            </Card>

            {/* Enhanced Code */}
            <Card className="flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">Enhanced {label}</Label>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <ScrollArea className="flex-1">
                    {enhancedCode ? (
                        <pre className="p-3 text-xs whitespace-pre-wrap break-words font-mono">
                            {enhancedCode}
                        </pre>
                    ) : (
                        <p className="p-3 text-sm text-muted-foreground italic">
                            {isLoading ? 'Generating...' : 'Click "Enhance" to generate'}
                        </p>
                    )}
                </ScrollArea>
            </Card>
        </div>
    );
}
