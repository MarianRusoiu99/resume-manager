'use client';

/**
 * Resume Preview with Actions Component
 * Reusable component that displays resume preview with action buttons
 * Used in: Generate page, Resume detail page, Resume edit page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Download, Copy, Trash2, Edit } from 'lucide-react';
import { UnifiedResumePreview } from './UnifiedResumePreview';
import type { Resume } from '@/lib/validations/jsonresume';

export interface ResumePreviewWithActionsProps {
  readonly resumeId: string;
  /** Show edit button (hidden on edit page) */
  readonly showEdit?: boolean;
  /** Show duplicate button */
  readonly showDuplicate?: boolean;
  /** Show delete button */
  readonly showDelete?: boolean;
  /** Show download PDF button */
  readonly showDownload?: boolean;
  /** Callback after delete */
  readonly onDelete?: () => void;
  /** Custom className for container */
  readonly className?: string;
}

export function ResumePreviewWithActions({
  resumeId,
  showEdit = true,
  showDuplicate = true,
  showDelete = true,
  showDownload = true,
  onDelete,
  className = '',
}: ResumePreviewWithActionsProps) {
  const router = useRouter();
  
  // Action states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeData, setResumeData] = useState<Resume | null>(null);

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`);
        if (response.ok) {
          const data = await response.json();
          setResumeData(data.content as Resume);
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
      }
    };
    fetchResume();
  }, [resumeId]);

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);

      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleEdit = () => {
    router.push(`/resumes/${resumeId}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      
      const response = await fetch(`/api/resumes/${resumeId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate resume');
      }

      const data = await response.json();
      toast.success('Resume duplicated successfully');
      
      // Navigate to the duplicated resume
      router.push(`/resumes/${data.resume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
      setDeleteDialogOpen(false);
      
      // Call onDelete callback if provided
      if (onDelete) {
        onDelete();
      } else {
        // Default: redirect to resumes list
        router.push('/resumes');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resume');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className={className}>
        {/* Action Buttons */}
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-2 justify-end">
            {showEdit && (
              <Button
                onClick={handleEdit}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Resume
              </Button>
            )}
            {showDownload && (
              <Button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExportingPDF ? 'Exporting...' : 'Download PDF'}
              </Button>
            )}
            {showDuplicate && (
              <Button
                onClick={handleDuplicate}
                variant="secondary"
                disabled={isDuplicating}
              >
                <Copy className="w-4 h-4 mr-2" />
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </Button>
            )}
            {showDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </Card>

        {/* Resume Preview */}
        {resumeData && (
          <UnifiedResumePreview
            resumeData={resumeData}
            resumeId={resumeId}
            showCard={false}
            showTemplateSelector={true}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action is irreversible and cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
