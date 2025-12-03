/**
 * Resume Card Component
 * Displays resume information with preview using EntityCard
 */

'use client';

import { Edit, Eye, Download } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import type { GalleryCardAction } from "@/components/shared/GalleryCard";
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';
import { useCardPreview, useExportPdf } from '@/hooks/useCardPreview';
import { deleteResume } from '@/app/actions/resume';

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
    try {
      await exportPdf();
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const handleDelete = async () => {
    const result = await deleteResume(id);
    if (result.success) {
      toast.success('Resume deleted successfully');
      onDelete(id);
    } else {
      toast.error(result.error || 'Failed to delete resume');
    }
  };

  const actions: GalleryCardAction[] = [
    createCardAction.view(() => onView(id), <Eye className="h-4 w-4" />),
    createCardAction.edit(() => onEdit(id), <Edit className="h-4 w-4" />),
    createCardAction.export(handleExport, <Download className="h-4 w-4" />),
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
    <EntityCard
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
      onDelete={handleDelete}
      deleteDialog={{
        title: "Delete Resume",
        message: "Are you sure you want to delete this resume? This action cannot be undone.",
      }}
    />
  );
}
