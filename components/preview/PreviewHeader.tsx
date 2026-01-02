/**
 * Preview Header Component
 * Single Responsibility: Display template selector and action buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { Download} from 'lucide-react';

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
  return (
    <div className="flex items-center justify-between mb-2 px-6">
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
        {actions}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={isExportingPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExportingPDF ? 'Exporting...' : 'Download PDF'}
        </Button>
      </div>
    </div>
  );
}
