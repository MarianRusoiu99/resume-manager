/**
 * Resume Card Component
 * Displays resume information with preview using EntityCard
 */

'use client';

import { Edit, Eye, Download } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import type { GalleryCardAction } from "@/components/shared/GalleryCard";
import { useToastAction } from '@/hooks';
import type { Resume } from '@/lib/validations/jsonresume';
import { useCardPreview, useExportPdf } from '@/hooks/useCardPreview';
import { deleteResume } from '@/app/actions/resume';
import { formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface ResumeCardProps {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string | null;
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
  jobDescription,
  content,
  templateId,
  createdAt,
  onView,
  onEdit,
  onDelete,
}: Readonly<ResumeCardProps>) {
  const { runWithToast } = useToastAction();

  const title = jobTitle || 'Untitled Resume';
  const subtitle = companyName || 'No company specified';

  // Use shared hooks for preview and export
  const { previewHtml, isLoading: isLoadingPreview } = useCardPreview({
    content,
    templateId,
    enabled: !!content,
  });

  const { exportPdf } = useExportPdf({
    content,
    templateId,
    fileName: jobTitle || 'resume',
  });

  const handleExport = async () => {
    await runWithToast(
      async () => {
        await exportPdf();
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
      () => deleteResume(id),
      {
        successMessage: 'Resume deleted successfully',
        errorMessage: 'Failed to delete resume',
      },
    );

    if (result?.success) {
      onDelete(id);
    }
  };

  const actions: GalleryCardAction[] = [
    createCardAction.view(() => onView(id), <Eye className="h-4 w-4" />),
    createCardAction.edit(() => onEdit(id), <Edit className="h-4 w-4" />),
    createCardAction.export(handleExport, <Download className="h-4 w-4" />),
  ];

  return (
    <EntityCard
      id={id}
      title={title}
      subtitle={jobDescription || subtitle}
      href={ROUTES.RESUME(id)}
      previewHtml={previewHtml}
      isPreviewLoading={isLoadingPreview}
      actions={actions}
      onDelete={handleDelete}
      deleteDialog={{
        title: "Delete Resume",
        message: "Are you sure you want to delete this resume? This action cannot be undone.",
      }}
    />
  );
}
