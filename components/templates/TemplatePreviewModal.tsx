'use client';

/**
 * Template Preview Modal
 * Shows detailed template preview with sample content
 */

import { useEffect } from 'react';
import type { ResumeTemplate } from '@/types/template';
import { TemplateLivePreview } from './TemplateLivePreview';

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{template.name}</h2>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        {/* Template Details */}
        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                ATS Score:
              </span>
              <span className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold">
                {template.atsScore}/10
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Category:
              </span>
              <span className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-semibold capitalize">
                {template.category}
              </span>
            </div>
          </div>

          {/* Template Configuration */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Template Features</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Layout:</span>
                <span className="ml-2">
                  {template.definition.layout.columns === 1
                    ? 'Single Column'
                    : 'Two Column'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Font:</span>
                <span className="ml-2">
                  {template.definition.typography?.bodyFont || 'Default'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Paper Size:</span>
                <span className="ml-2 uppercase">
                  {template.definition.layout.paperSize}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Section Dividers:
                </span>
                <span className="ml-2">
                  {template.definition.sections.showDividers ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="border rounded-lg p-8 bg-gray-50">
            <TemplateLivePreview template={template} />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
