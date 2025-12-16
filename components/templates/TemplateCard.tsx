/**
 * Template Card Component
 * Displays template information with preview using GalleryCard
 */

'use client';

import { useState, useEffect } from 'react';
import { Edit, Eye, Copy, Download } from 'lucide-react';
import { EntityCard, createCardAction } from '@/components/shared/EntityCard';
import type { GalleryCardAction } from '@/components/shared/GalleryCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { useToastAction } from '@/hooks';
import type { ResumeTemplate } from '@/lib/templates/template';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { API_V1 } from '@/lib/constants';

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
  const { runWithToast } = useToastAction();
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
    await runWithToast(
      async () => {
        // Use universal PDF export endpoint with sample data
        const response = await fetch(API_V1.EXPORT.PDF, {
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
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${template.name.replaceAll(/\s+/g, '_')}_preview.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        globalThis.URL.revokeObjectURL(url);
        anchor.remove();

        return true;
      },
      {
        successMessage: 'PDF exported successfully',
        errorMessage: 'Failed to export PDF',
      },
    );
  };

  const handleDelete = async () => {
    const result = await runWithToast(
      async () => {
        const response = await fetch(API_V1.TEMPLATE.GET(template.id), {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete template');
        }

        return true;
      },
      {
        successMessage: 'Template deleted successfully',
        errorMessage: 'Failed to delete template',
      },
    );

    if (result) {
      onDelete?.();
    }
  };

  const handleDuplicate = async () => {
    const result = await runWithToast(
      async () => {
        const response = await fetch(API_V1.TEMPLATE.DUPLICATE(template.id), {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to duplicate template');
        }

        return true;
      },
      {
        successMessage: 'Template duplicated successfully',
        errorMessage: 'Failed to duplicate template',
      },
    );

    if (result) {
      onDuplicate?.();
    }
  };

  const actions: GalleryCardAction[] = [
    {
      label: 'Preview',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setShowPreviewModal(true),
    },
    createCardAction.export(handleExportPDF, <Download className="h-4 w-4" />),
    ...(showAdminActions
      ? [
          createCardAction.edit(() => {
            globalThis.location.href = `/templates/${template.id}`;
          }, <Edit className="h-4 w-4" />),
          {
            label: 'Duplicate',
            icon: <Copy className="h-4 w-4" />,
            onClick: handleDuplicate,
          },
        ]
      : []),
  ];

  return (
    <>
      <EntityCard
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
        onDelete={showAdminActions ? handleDelete : undefined}
        deleteDialog={{
          title: 'Delete Template',
          message: 'Are you sure you want to delete this template? This action cannot be undone.',
        }}
      />

      {showPreviewModal && (
        <TemplatePreviewModal
          template={template}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </>
  );
}
