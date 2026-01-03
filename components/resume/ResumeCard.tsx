/**
 * Resume Card Component
 * Displays resume information with preview using EntityCard
 */

'use client';

import { Edit, Eye, Download } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import type { GalleryCardAction } from "@/components/shared/GalleryCard";
import type { Resume } from '@/lib/validations/jsonresume';
import { useCardPreview, useExportPdf } from '@/hooks/useCardPreview';
import { ROUTES } from '@/lib/constants';
import { useResumeOperations } from '@/hooks/features/useResumeOperations';

interface ResumeCardProps {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string | null;
  content: Resume;
  templateId: string | null;
  createdAt?: string;
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
  onView,
  onEdit,
  onDelete,
}: Readonly<ResumeCardProps>) {
  const { handleDelete: handleDeleteOp } = useResumeOperations();

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
    await exportPdf();
  };

  const handleDelete = async () => {
    const success = await handleDeleteOp(id, title);
    if (success) {
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
