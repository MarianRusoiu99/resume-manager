'use client';

/**
 * Comparison Tabs Component
 * 
 * Tabs for switching between original and enhanced content views.
 * Supports both side-by-side and tabbed layouts.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentPreview } from './ContentPreview';
import type { ContentType } from '@/lib/validations/settings';


interface ComparisonTabsProps {
  originalContent: string;
  enhancedContent: string;
  contentType?: ContentType;
  isLoading?: boolean;
  mode?: 'tabs' | 'side-by-side';
  className?: string;
  originalLabel?: string;
  enhancedLabel?: string;
}

/**
 * Side-by-side comparison layout
 */
function SideBySideComparison({
  originalContent,
  enhancedContent,
  contentType = 'text',
  isLoading = false,
  originalLabel = 'Original',
  enhancedLabel = 'Enhanced',
}: Readonly<Omit<ComparisonTabsProps, 'mode' | 'className'>>) {
  return (
    <div className="grid grid-cols-2 gap-4 min-h-0 flex-1">
      {/* Original Content */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0">
          <Label className="text-sm font-medium text-muted-foreground">
            {originalLabel}
          </Label>
        </div>
        <ContentPreview
          content={originalContent}
          contentType={contentType}
          emptyMessage="(No content)"
          className="flex-1"
        />
      </div>

      {/* Enhanced Content */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-muted/50 border-b flex-shrink-0 flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground">
            {enhancedLabel}
          </Label>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <ContentPreview
          content={enhancedContent}
          contentType={contentType}
          isLoading={isLoading}
          emptyMessage="Click 'Enhance' to generate"
          className="flex-1"
        />
      </div>
    </div>
  );
}

/**
 * Tabbed comparison layout
 */
function TabbedComparison({
  originalContent,
  enhancedContent,
  contentType = 'text',
  isLoading = false,
  originalLabel = 'Original',
  enhancedLabel = 'Enhanced',
}: Readonly<Omit<ComparisonTabsProps, 'mode' | 'className'>>) {
  return (
    <Tabs defaultValue="enhanced" className="flex-1 flex flex-col min-h-0">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="original">{originalLabel}</TabsTrigger>
        <TabsTrigger value="enhanced" className="flex items-center gap-2">
          {enhancedLabel}
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="original" className="flex-1 mt-4 border rounded-lg overflow-hidden">
        <ContentPreview
          content={originalContent}
          contentType={contentType}
          emptyMessage="(No content)"
          className="h-full"
          maxHeight="100%"
        />
      </TabsContent>

      <TabsContent value="enhanced" className="flex-1 mt-4 border rounded-lg overflow-hidden">
        <ContentPreview
          content={enhancedContent}
          contentType={contentType}
          isLoading={isLoading}
          emptyMessage="Click 'Enhance' to generate"
          className="h-full"
          maxHeight="100%"
        />
      </TabsContent>
    </Tabs>
  );
}

export function ComparisonTabs({
  mode = 'side-by-side',
  className,
  ...props
}: Readonly<ComparisonTabsProps>) {
  const Component = mode === 'tabs' ? TabbedComparison : SideBySideComparison;

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      <Component {...props} />
    </div>
  );
}
