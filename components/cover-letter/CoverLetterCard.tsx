/**
 * Cover Letter Card Component
 * Displays cover letter information using GalleryCard
 */

'use client';

import { useState } from 'react';
import { Edit, Trash2, Download, Eye, FileText, Briefcase } from 'lucide-react';
import { GalleryCard, type GalleryCardAction } from '@/components/ui/GalleryCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      const response = await fetch(`/api/cover-letters/${id}/export`, {
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
    try {
      const response = await fetch(`/api/cover-letters/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete cover letter');
      }

      toast.success('Cover letter deleted successfully');
      onDelete(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete cover letter');
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

  // Preview fallback for cover letters (no HTML template)
  const previewFallback = (
    <div className="text-center">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">Cover Letter</p>
    </div>
  );

  return (
    <>
      <GalleryCard
        id={id}
        title={getDisplayTitle()}
        subtitle={content.substring(0, 100) + '...'}
        href={`/cover-letter/${id}`}
        previewFallbackIcon={previewFallback}
        metadata={[
          { label: 'Created', value: formatDate(createdAt) },
        ]}
        actions={actions}
        badges={[
          {
            label: 'Cover Letter',
            variant: 'secondary',
            icon: <Briefcase className="h-3 w-3" />,
          },
        ]}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Cover Letter"
        message={`Are you sure you want to delete the cover letter "${getDisplayTitle()}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
