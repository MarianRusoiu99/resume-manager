/**
 * Cover Letter Card Component
 * Displays cover letter information using EntityCard
 */

'use client';

import { useTransition } from 'react';
import { Edit, Download, Eye, FileText, Briefcase } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import { toast } from 'sonner';
import { deleteCoverLetter } from '@/app/actions/cover-letter';
import { formatDate } from '@/lib/utils';
import { API, ROUTES } from '@/lib/constants';

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
  const [isPending, startTransition] = useTransition();

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
    try {
      const response = await fetch(API.COVER_LETTER.EXPORT(id), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export cover letter');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${jobTitle || companyName || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Cover letter exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export cover letter');
    }
  };

  const handleDelete = async () => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const result = await deleteCoverLetter(id);
        if (result.success) {
          toast.success('Cover letter deleted successfully');
          onDelete(id);
          resolve();
        } else {
          toast.error(result.error || 'Failed to delete cover letter');
          reject(new Error(result.error || 'Failed to delete'));
        }
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
