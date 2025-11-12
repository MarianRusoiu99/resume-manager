'use client';

/**
 * Template Preview Modal
 * Shows detailed template preview with sample content
 */

import { useEffect } from 'react';
import type { ResumeTemplate } from '@/types/template';
import { sampleResume } from '@/lib/utils/sample-resume';
import { UnifiedResumePreview } from '../resume/UnifiedResumePreview';

interface TemplatePreviewModalProps {
  template: ResumeTemplate;
  onClose: () => void;
}

export function TemplatePreviewModal({
  template,
  onClose,
}: TemplatePreviewModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
          <div>
            <h2 className="text-2xl font-bold">{template.name}</h2>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        {/* Template Details */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Category:</span>
              <span className="px-3 py-1 rounded-md bg-muted text-muted-foreground text-sm font-medium capitalize">
                {template.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Version:</span>
              <span className="text-sm text-muted-foreground">{template.version}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Visibility:</span>
              <span className="text-sm text-muted-foreground">
                {template.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            {(() => {
              const templateProps: { templateHtml?: string; templateCss?: string } = {
                templateHtml: template.htmlTemplate,
                templateCss: template.cssStyles,
              };
              return (
                <UnifiedResumePreview
                  resumeData={sampleResume}
                  {...templateProps}
                />
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-card flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
