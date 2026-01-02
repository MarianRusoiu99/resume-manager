/**
 * Preview Header Component
 * Single Responsibility: Display template selector and action buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { Download, Loader2 } from 'lucide-react';

interface PreviewHeaderProps {
  showTemplateSelector: boolean;
  templateHtml?: string;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  isExportingPDF: boolean;
  onExportPDF: () => void;
  actions?: React.ReactNode;
}

export function PreviewHeader({
  showTemplateSelector,
  templateHtml,
  selectedTemplateId,
  onTemplateChange,
  isExportingPDF,
  onExportPDF,
  actions,
}: Readonly<PreviewHeaderProps>) {
  // No early return for templateHtml - we want a unified header now

  return (
    <div className="px-6 py-2 bg-muted/20 flex items-center justify-between shrink-0 border-b">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview</span>
      </div>

      <div className="flex items-center gap-2">
        {showTemplateSelector && !templateHtml && (
          <>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-70">Template</span>
            <PreviewTemplateSelector
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={onTemplateChange}
              variant="ghost"
              size="sm"
              className="h-7 border-none bg-background rounded-md px-3 py-1 shadow-sm font-medium focus:ring-1 focus:ring-primary outline-none"
            />
          </>
        )}

        {actions}

        {actions && <div className="w-px h-4 bg-muted-foreground/20 mx-1" />}

        <Button
          variant="ghost"
          size="sm"
          onClick={onExportPDF}
          disabled={isExportingPDF}
          className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
        >
          {isExportingPDF ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : (
            <Download className="h-3 w-3 mr-2" />
          )}
          {isExportingPDF ? 'Exporting...' : 'Export'}
        </Button>
      </div>
    </div>
  );
}
