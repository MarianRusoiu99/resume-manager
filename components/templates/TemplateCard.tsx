/**
 * Template Card Component
 * Displays template information with preview using GalleryCard
 */

'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Copy, Download } from 'lucide-react';
import { GalleryCard, type GalleryCardAction } from '@/components/ui/GalleryCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { toast } from 'sonner';
import type { ResumeTemplate } from '@/lib/templates/template';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import type { Resume } from '@/lib/validations/jsonresume';

interface TemplateCardProps {
  template: ResumeTemplate;
  showAdminActions?: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

// Sample resume data for preview
const SAMPLE_RESUME: Resume = {
  basics: {
    name: 'John Doe',
    label: 'Software Engineer',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    url: 'https://johndoe.com',
    summary: 'Experienced software engineer with expertise in full-stack development.',
    location: {
      city: 'San Francisco',
      region: 'CA',
      countryCode: 'US',
    },
    profiles: [],
  },
  work: [
    {
      name: 'Tech Company',
      position: 'Senior Developer',
      startDate: '2020-01',
      endDate: '2024-01',
      summary: 'Led development of key features',
      highlights: ['Improved performance by 40%', 'Mentored junior developers'],
      url: 'https://techcompany.com',
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      area: 'Computer Science',
      studyType: 'Bachelor',
      startDate: '2016-09',
      endDate: '2020-05',
    },
  ],
  skills: [
    {
      name: 'Programming',
      keywords: ['JavaScript', 'TypeScript', 'Python', 'React'],
    },
  ],
};

export function TemplateCard({
  template,
  showAdminActions = false,
  onDelete,
  onDuplicate,
}: Readonly<TemplateCardProps>) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | undefined>(undefined);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Generate preview HTML when component mounts
  useEffect(() => {
    async function generatePreview() {
      try {
        setIsLoadingPreview(true);

        // Render preview client-side with sample data
        const html = renderTemplateClientSide({
          htmlTemplate: template.htmlTemplate,
          cssStyles: template.cssStyles,
          resumeData: SAMPLE_RESUME,
        });

        setPreviewHtml(html);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    }

    generatePreview();
  }, [template]);

  const handleExportPDF = async () => {
    try {
      // Use universal PDF export endpoint with sample data
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: SAMPLE_RESUME,
          template: {
            htmlTemplate: template.htmlTemplate,
            cssStyles: template.cssStyles,
          },
          fileName: `${template.name.replaceAll(/\s+/g, '_')}_preview.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replaceAll(/\s+/g, '_')}_preview.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();

      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export PDF');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/template/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast.success('Template deleted successfully');
      onDelete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/template/${template.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate template');
      }

      toast.success('Template duplicated successfully');
      onDuplicate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate template');
    }
  };

  const actions: GalleryCardAction[] = [
    {
      label: 'Preview',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setShowPreviewModal(true),
    },
    {
      label: 'Export PDF',
      icon: <Download className="h-4 w-4" />,
      onClick: handleExportPDF,
    },
    ...(showAdminActions
      ? [
          {
            label: 'Edit',
            icon: <Edit className="h-4 w-4" />,
            onClick: () => {
              globalThis.location.href = `/templates/${template.id}`;
            },
          },
          {
            label: 'Duplicate',
            icon: <Copy className="h-4 w-4" />,
            onClick: handleDuplicate,
          },
          {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setShowDeleteDialog(true),
            variant: 'destructive' as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <GalleryCard
        id={template.id}
        title={template.name}
        subtitle={template.description}
        href={showAdminActions ? `/templates/${template.id}` : '#'}
        disableNavigation={!showAdminActions}
        previewHtml={previewHtml}
        isPreviewLoading={isLoadingPreview}
        badges={[
          {
            label: template.category,
            variant: 'outline',
          },
        ]}
        actions={actions}
      />

      {showPreviewModal && (
        <TemplatePreviewModal
          template={template}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
