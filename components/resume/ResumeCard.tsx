/**
 * Resume Card Component
 * Displays resume information with preview using GalleryCard
 */

'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Download, Eye } from 'lucide-react';
import { GalleryCard, type GalleryCardAction } from '@/components/ui/GalleryCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';

interface ResumeCardProps {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  content: Resume;
  templateId: string | null;
  createdAt: string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ResumeCard({
  id,
  jobTitle,
  companyName,
  content,
  templateId,
  createdAt,
  onView,
  onEdit,
  onDelete,
}: Readonly<ResumeCardProps>) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | undefined>(undefined);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const title = jobTitle || 'Untitled Resume';
  const subtitle = companyName || 'No company specified';

  // Generate preview HTML when component mounts
  useEffect(() => {
    async function generatePreview() {
      if (!content) return;

      try {
        setIsLoadingPreview(true);

        // Fetch template (use templateId if available, otherwise get default)
        let template;
        if (templateId) {
          const templateResponse = await fetch(`/api/template/${templateId}`);
          if (templateResponse.ok) {
            template = await templateResponse.json();
          }
        }

        // Fallback to default template
        if (!template) {
          const templatesResponse = await fetch('/api/template?limit=1');
          if (!templatesResponse.ok) return;

          const { templates } = await templatesResponse.json();
          if (!templates || templates.length === 0) return;
          template = templates[0];
        }

        // Render preview client-side
        const html = renderTemplateClientSide({
          htmlTemplate: template.htmlTemplate,
          cssStyles: template.cssStyles,
          resumeData: content,
        });

        setPreviewHtml(html);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    }

    generatePreview();
  }, [content, templateId]);

  const handleExport = async () => {
    try {
      // Fetch the template
      let template;
      if (templateId) {
        const templateResponse = await fetch(`/api/template/${templateId}`);
        if (templateResponse.ok) {
          template = await templateResponse.json();
        }
      }

      // Fallback to default template
      if (!template) {
        const templatesResponse = await fetch('/api/template?limit=1');
        if (!templatesResponse.ok) {
          throw new Error('Failed to load template');
        }

        const { templates } = await templatesResponse.json();
        if (!templates || templates.length === 0) {
          throw new Error('No templates available');
        }
        template = templates[0];
      }

      // Use universal PDF export endpoint
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: content,
          template: {
            htmlTemplate: template.htmlTemplate,
            cssStyles: template.cssStyles,
          },
          fileName: `${jobTitle || 'resume'}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${jobTitle || 'download'}.pdf`;
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
      const response = await fetch(`/api/resume/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
      onDelete(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const actions: GalleryCardAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => onView(id),
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => onEdit(id),
    },
    {
      label: 'Export PDF',
      icon: <Download className="h-4 w-4" />,
      onClick: handleExport,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setShowDeleteDialog(true),
      variant: 'destructive',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <GalleryCard
        id={id}
        title={title}
        subtitle={subtitle}
        href={`/resumes/${id}`}
        previewHtml={previewHtml}
        isPreviewLoading={isLoadingPreview}
        metadata={[
          { label: 'Created', value: formatDate(createdAt) },
        ]}
        actions={actions}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
