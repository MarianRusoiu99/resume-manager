/**
 * Template Card Component
 * Displays template information with preview using GalleryCard
 */

'use client';

import { useState, useEffect, memo } from 'react';
import { apiFetch } from '@/lib/utils/api-client';
import { ExternalServiceError } from "@/lib/errors";
import { Edit, Eye, Copy, Download } from 'lucide-react';
import { EntityCard, createCardAction } from '@/components/core/surfaces/EntityCard';
import type { GalleryCardAction } from '@/components/core/data-display/GalleryCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { deleteTemplate, duplicateTemplate } from '@/app/actions/template';
import { useToastAction, useComponentLogger } from '@/hooks';
import { useExportPDF } from '@/components/preview/useExportPDF';
import type { ResumeTemplate } from '@/lib/templates/template';
import { renderTemplateServerSide } from '@/components/core/data-display/rendering/client-renderer';
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

export const TemplateCard = memo(function TemplateCard({
  template,
  showAdminActions = false,
  onDelete,
  onDuplicate,
}: Readonly<TemplateCardProps>) {
  const log = useComponentLogger('TemplateCard');
  const { runWithToast } = useToastAction();
  const { handleExportPDF } = useExportPDF();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | undefined>(undefined);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Generate preview HTML when component mounts
  useEffect(() => {
    async function generatePreview() {
      try {
        setIsLoadingPreview(true);

        // Render preview server-side with sample data to avoid CSP issues
        const html = await renderTemplateServerSide({
          htmlTemplate: template.htmlTemplate,
          resumeData: SAMPLE_RESUME,
        });

        setPreviewHtml(html);
      } catch (error) {
        log.error('Failed to generate preview', error);
      } finally {
        setIsLoadingPreview(false);
      }
    }

    generatePreview();
  }, [template, log]);

  const onExportPDF = async () => {
    await handleExportPDF({
      resume: SAMPLE_RESUME,
      templateHtml: template.htmlTemplate,
      fileName: `${template.name.replaceAll(/\s+/g, '_')}_preview.pdf`,
    });
  };

  const handleDelete = async () => {
    const result = await runWithToast(
      async () => {
        const res = await deleteTemplate(template.id);
        if (!res.success) {
          throw new ExternalServiceError('Template API', res.error);
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
        const res = await duplicateTemplate(template.id);
        if (!res.success) {
          throw new ExternalServiceError('Template API', res.error);
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
    createCardAction.export(onExportPDF, <Download className="h-4 w-4" />),
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
        subtitle={template.description ?? undefined}
        href={showAdminActions ? `/templates/${template.id}` : '#'}
        disableNavigation={!showAdminActions}
        previewHtml={previewHtml}
        isPreviewLoading={isLoadingPreview}
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
});
