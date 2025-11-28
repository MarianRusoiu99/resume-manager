/**
 * Preview Header Component
 * Single Responsibility: Display template selector and action buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { Download, Maximize2, RefreshCw } from 'lucide-react';

interface PreviewHeaderProps {
  showTemplateSelector: boolean;
  templateHtml?: string;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  resumeId?: string;
  isExportingPDF: boolean;
  onExportPDF: () => void;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
}

export function PreviewHeader({
  showTemplateSelector,
  templateHtml,
  selectedTemplateId,
  onTemplateChange,
  resumeId,
  isExportingPDF,
  onExportPDF,
  onToggleFullscreen,
  onRefresh,
}: Readonly<PreviewHeaderProps>) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {showTemplateSelector && !templateHtml && (
          <PreviewTemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={onTemplateChange}
            variant="outline"
            size="sm"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        {resumeId && !templateHtml && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={isExportingPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingPDF ? 'Exporting...' : 'Download PDF'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          title="View in modal"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Expand
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
