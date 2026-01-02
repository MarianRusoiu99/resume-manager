/**
 * Cover Letter Card Component
 * Displays cover letter information using EntityCard
 */

'use client';

import { useTransition } from 'react';
import { Download, FileText, Briefcase } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import { useToastAction, useExportPDF } from '@/hooks';
import { deleteCoverLetter } from '@/app/actions/cover-letter';
import { formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { apiV1 } from '@/lib/client';

interface CoverLetterCardProps {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  content: string;
  createdAt: string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CoverLetterCard({
  id,
  jobTitle,
  companyName,
  content,
  createdAt,
  onView,
  onEdit,
  onDelete,
}: Readonly<CoverLetterCardProps>) {
  const { runWithToast } = useToastAction();
  const { isExportingPDF, handleExportCoverLetter } = useExportPDF();
  const [, startTransition] = useTransition();

  const getDisplayTitle = (): string => {
    if (jobTitle && companyName) {
      return `${jobTitle} at ${companyName}`;
    }
    if (jobTitle) {
      return jobTitle;
    }
    if (companyName) {
      return `Cover Letter for ${companyName}`;
    }
    return 'Cover Letter';
  };

  const handleExport = async () => {
    await handleExportCoverLetter(id, jobTitle || companyName || 'download');
  };

  const handleDelete = async () => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const result = await runWithToast(
          () => deleteCoverLetter(id),
          {
            successMessage: 'Cover letter deleted successfully',
            errorMessage: 'Failed to delete cover letter',
          },
        );

        if (result?.success) {
          onDelete(id);
          resolve();
          return;
        }

        reject(new Error('Failed to delete'));
      });
    });
  };

  // Preview fallback for cover letters (no HTML template)
  const previewFallback = (
    <div className="text-center">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">Cover Letter</p>
    </div>
  );

  return (
    <EntityCard
      id={id}
      title={getDisplayTitle()}
      subtitle={content.substring(0, 100) + '...'}
      href={ROUTES.COVER_LETTER(id)}
      previewFallbackIcon={previewFallback}
      metadata={[{ label: 'Created', value: formatDate(createdAt) }]}
      badges={[
        {
          label: 'Cover Letter',
          variant: 'secondary',
          icon: <Briefcase className="h-3 w-3" />,
        },
      ]}
      actions={[
        createCardAction.view(() => onView(id)),
        createCardAction.edit(() => onEdit(id)),
        {
          label: 'Export PDF',
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport,
          disabled: isExportingPDF,
        },
      ]}
      onDelete={handleDelete}
      deleteDialog={{
        title: 'Delete Cover Letter',
        message: `Are you sure you want to delete the cover letter "${getDisplayTitle()}"? This action cannot be undone.`,
      }}
    />
  );
}
