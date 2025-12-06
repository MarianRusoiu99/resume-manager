'use client';

/**
 * Template Code Comparison Component
 * 
 * Displays side-by-side code views of original and enhanced template code (HTML/CSS).
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { SideBySideComparison } from './SideBySideComparison';

export interface TemplateCodeComparisonProps {
  originalCode: string;
  enhancedCode: string | null;
  /** Code language label (e.g., "HTML", "CSS") */
  codeType?: string;
  /** AI enhancement is in progress */
  isEnhancing?: boolean;
  className?: string;
}

/**
 * Code content renderer for scrollable code
 */
function CodeContent({
  code,
  isLoading = false,
  emptyMessage = 'No content',
}: Readonly<{
  code: string | null;
  isLoading?: boolean;
  emptyMessage?: string;
}>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-3 text-xs whitespace-pre-wrap break-words font-mono">
        {code}
      </pre>
    </ScrollArea>
  );
}

/**
 * Side-by-side code comparison of original and enhanced template code
 */
export function TemplateCodeComparison({
  originalCode,
  enhancedCode,
  codeType = 'Code',
  isEnhancing = false,
  className,
}: Readonly<TemplateCodeComparisonProps>) {
  return (
    <SideBySideComparison
      originalLabel={`Original ${codeType}`}
      enhancedLabel={`Enhanced ${codeType}`}
      originalContent={
        <CodeContent code={originalCode || '(No content)'} />
      }
      enhancedContent={
        <CodeContent
          code={enhancedCode}
          isLoading={isEnhancing}
          emptyMessage="Enter instructions and click Enhance to generate"
        />
      }
      isLoading={isEnhancing}
      className={className}
    />
  );
}
