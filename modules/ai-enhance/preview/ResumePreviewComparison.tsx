'use client';

/**
 * Resume Preview Comparison Component
 * 
 * Shows live resume preview for both original and enhanced versions.
 * Integrates with the existing ResumePreview component.
 */

import { useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplatePreview } from '@/hooks';
import type { Resume } from '@/lib/validations/jsonresume';

interface ResumePreviewComparisonProps {
  originalResume: Resume;
  enhancedResume: Resume | null;
  templateId?: string | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * Single resume preview iframe
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
      <div className="flex items-center justify-center h-full bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <p className="text-sm text-muted-foreground italic">
          No preview available
        </p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={htmlContent}
      className="w-full h-full bg-transparent"
      title="Resume Preview"
      sandbox="allow-same-origin"
    />
  );
}

export function ResumePreviewComparison({
  originalResume,
  enhancedResume,
  templateId,
  isLoading = false,
  className,
}: Readonly<ResumePreviewComparisonProps>) {
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

  const showEnhancedLoading = isLoading || enhancedLoading;

  return (
    <Tabs defaultValue="enhanced" className={cn('flex-1 flex flex-col min-h-0', className)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="original">Original Preview</TabsTrigger>
        <TabsTrigger value="enhanced" className="flex items-center gap-2">
          Enhanced Preview
          {showEnhancedLoading && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="original" className="flex-1 mt-4 border rounded-lg overflow-hidden bg-transparent">
        <ResumePreviewIframe
          htmlContent={originalHtml}
          isLoading={originalLoading}
        />
      </TabsContent>

      <TabsContent value="enhanced" className="flex-1 mt-4 border rounded-lg overflow-hidden bg-transparent">
        <ResumePreviewIframe
          htmlContent={enhancedResume ? enhancedHtml : null}
          isLoading={showEnhancedLoading}
        />
      </TabsContent>
    </Tabs>
  );
}

/**
 * Side-by-side resume preview
 */
export function ResumePreviewSideBySide({
  originalResume,
  enhancedResume,
  templateId,
  isLoading = false,
  className,
}: Readonly<ResumePreviewComparisonProps>) {
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
    <div className={cn('grid grid-cols-2 gap-4 min-h-0 flex-1', className)}>
      {/* Original Preview */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
          <Label className="text-sm font-medium text-muted-foreground">
            Original Preview
          </Label>
        </div>
        <div className="flex-1 bg-transparent">
          <ResumePreviewIframe
            htmlContent={originalHtml}
            isLoading={originalLoading}
          />
        </div>
      </div>

      {/* Enhanced Preview */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground">
            Enhanced Preview
          </Label>
          {(isLoading || enhancedLoading) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 bg-transparent">
          <ResumePreviewIframe
            htmlContent={enhancedResume ? enhancedHtml : null}
            isLoading={isLoading || enhancedLoading}
          />
        </div>
      </div>
    </div>
  );
}
