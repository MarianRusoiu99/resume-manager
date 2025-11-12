/**
 * Preview Controls Component
 * Responsible for template selection and action buttons
 * Single Responsibility: Handle preview control actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { RefreshCw, Download, Maximize2 } from 'lucide-react';

interface PreviewControlsProps {
  /** Show template selector */
  showTemplateSelector: boolean;
  /** Selected template ID */
  selectedTemplateId: string | null;
  /** Template change callback */
  onTemplateChange: (templateId: string | null) => void;
  /** Export PDF callback */
  onExportPDF: () => void;
  /** Toggle fullscreen callback */
  onToggleFullscreen: () => void;
  /** Refresh callback */
  onRefresh: () => void;
  /** Is currently exporting PDF */
  isExporting: boolean;
}

export function PreviewControls({
  showTemplateSelector,
  selectedTemplateId,
  onTemplateChange,
  onExportPDF,
  onToggleFullscreen,
  onRefresh,
  isExporting,
}: Readonly<PreviewControlsProps>) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {showTemplateSelector && (
          <PreviewTemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={onTemplateChange}
            variant="outline"
            size="sm"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Download PDF'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          title="View in modal"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Expand
        </Button>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
