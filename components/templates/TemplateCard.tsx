'use client';

/**
 * Template Card Component
 * Displays individual template with preview and ATS score
 */

import { useState } from 'react';
import type { ResumeTemplate } from '@/types/template';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface TemplateCardProps {
  template: ResumeTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  // ATS Score badge color
  const getScoreBadgeColor = (score: number) => {
    if (score >= 9) return 'bg-green-100 text-green-800';
    if (score >= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  // Category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      professional: 'bg-blue-100 text-blue-800',
      modern: 'bg-purple-100 text-purple-800',
      creative: 'bg-pink-100 text-pink-800',
      'ats-optimized': 'bg-green-100 text-green-800',
      minimal: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
        {/* Preview Image Placeholder */}
        <div className="h-64 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">📄</div>
            <p className="text-sm text-gray-500">Template Preview</p>
          </div>
        </div>

        {/* Template Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getScoreBadgeColor(
                template.atsScore
              )}`}
            >
              ATS {template.atsScore}/10
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3">{template.description}</p>

          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                template.category
              )}`}
            >
              {template.category}
            </span>

            <button
              onClick={() => setShowPreview(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Preview →
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <TemplatePreviewModal
          template={template}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
