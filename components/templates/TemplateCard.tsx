'use client';

/**
 * Template Card Component
 * Displays individual template with preview and ATS score
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResumeTemplate } from '@/types/template';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface TemplateCardProps {
  template: ResumeTemplate;
  showAdminActions?: boolean;
}

export function TemplateCard({ template, showAdminActions = false }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  // Category badge color - all neutral
  const getCategoryColor = () => {
    return 'bg-muted text-muted-foreground';
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card">
        {/* Preview Image Placeholder */}
        <div className="h-64 bg-linear-to-br from-muted/50 to-muted flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">📄</div>
            <p className="text-sm text-muted-foreground">Template Preview</p>
          </div>
        </div>

        {/* Template Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{template.name}</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor()}`}
            >
              {template.category}
            </span>

            <div className="flex gap-2">
              {showAdminActions && (
                <button
                  onClick={() => router.push(`/templates/${template.id}`)}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => setShowPreview(true)}
                className="text-sm text-foreground hover:text-foreground/80 font-medium"
              >
                Preview →
              </button>
            </div>
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
