'use client';

/**
 * Resume Preview with Actions Component
 * Reusable component that displays resume preview with action buttons
 * Used in: Generate page, Resume detail page, Resume edit page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Download, Copy, Trash2, Edit } from 'lucide-react';
import { PDFStylePreview } from './PDFStylePreview';

export interface ResumePreviewWithActionsProps {
  resumeId: string;
  /** Show edit button (hidden on edit page) */
  showEdit?: boolean;
  /** Show duplicate button */
  showDuplicate?: boolean;
  /** Show delete button */
  showDelete?: boolean;
  /** Show download PDF button */
  showDownload?: boolean;
  /** Callback after delete */
  onDelete?: () => void;
  /** Custom className for container */
  className?: string;
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
  const [pdfPreviewKey, setPdfPreviewKey] = useState(Date.now());

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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Resume Preview</h2>
            <Button
              onClick={() => setPdfPreviewKey(Date.now())}
              variant="secondary"
              size="sm"
            >
              Refresh Preview
            </Button>
          </div>
          
          {/* PDF-Style Preview with Pagination */}
          <PDFStylePreview 
            resumeId={resumeId} 
            previewKey={pdfPreviewKey}
          />
        </Card>
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
