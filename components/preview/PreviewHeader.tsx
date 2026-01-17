/**
 * Preview Header Component
 * Single Responsibility: Display template selector and action buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { Download, Loader2, LayoutGrid, Maximize2, Minimize2, X } from 'lucide-react';
import type { Template } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewHeaderProps {
  showTemplateSelector: boolean;
  templateHtml?: string;
  template?: Template | null;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  isExportingPDF: boolean;
  onExportPDF: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  actions?: React.ReactNode;
  title?: React.ReactNode;
}

export function PreviewHeader({
  showTemplateSelector,
  templateHtml,
  template,
  selectedTemplateId,
  onTemplateChange,
  isExportingPDF,
  onExportPDF,
  onToggleFullscreen,
  isFullscreen,
  actions,
  title,
}: Readonly<PreviewHeaderProps>) {
  const templateName = templateHtml ? 'Custom Template' : (template?.name || 'Loading...');

  return (
    <div className="px-6 py-2 bg-muted/40 border-b border-border/5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        {title ? (
          title
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[150px]">
              {templateName}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {showTemplateSelector && (
          <PreviewTemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={onTemplateChange}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 border-none bg-background rounded-md shadow-sm hover:text-primary transition-all flex items-center justify-center"
          >
            <LayoutGrid className="h-4 w-4" />
          </PreviewTemplateSelector>
        )}

        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}

        <div className="w-px h-4 bg-muted-foreground/20 mx-1" />

        <div className="flex items-center gap-1">
          {onToggleFullscreen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFullscreen}
                    className="h-8 w-8 text-muted-foreground hover:text-primary transition-all"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportPDF}
                  disabled={isExportingPDF}
                  className="h-8 w-8 text-muted-foreground hover:text-primary transition-all"
                >
                  {isExportingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="sr-only">Export PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1">
          {isFullscreen && onToggleFullscreen && (
            <>
              <div className="w-px h-4 bg-muted-foreground/20 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-all"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
