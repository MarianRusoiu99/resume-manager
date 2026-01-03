'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button, Card } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CoverLetterEditor } from '@/components/cover-letter';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Edit, Copy, Trash2 } from 'lucide-react';
import { getResume, deleteResume, duplicateResume } from '@/app/actions/resume';
import { createComponentLogger } from '@/lib/utils/client-logger';
import type { Resume } from '@/lib/validations/jsonresume';

const logger = createComponentLogger('ResumeDetailPage');

interface ResumeData {
  id: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  content: Resume;
  coverLetter?: string;
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [pdfPreviewKey] = useState(Date.now());

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getResume(resumeId);

      if (!result.success || !result.data) {
        const errorResult = result as { error?: string };
        throw new Error(errorResult.error || 'Failed to fetch resume');
      }

      setResume(result.data as ResumeData);
    } catch (err) {
      logger.error('Failed to fetch resume', err);
      setError(err instanceof Error ? err.message : 'Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const result = await deleteResume(resumeId);

      if (!result.success) {
        const errorResult = result as { error?: string };
        throw new Error(errorResult.error || 'Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
      router.push('/resumes');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resume');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);

      const result = await duplicateResume(resumeId);

      if (!result.success || !result.data) {
        const errorResult = result as { error?: string };
        throw new Error(errorResult.error || 'Failed to duplicate resume');
      }

      toast.success('Resume duplicated successfully');
      const duplicatedResume = result.data as { id: string };
      router.push(`/resumes/${duplicatedResume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    try {
      setError(null);

      // In the new architecture, cover letter might be a separate action
      // For now, let's just use updateResumeContent if it was stored there
      // or implement a separate updateCoverLetter action if it's linked
      
      // Based on ResumeDetails type, cover letter is part of the resume object or linked
      // Let's assume for now we just want to update the resume content if it includes cover letter
      // Or check if we have a linked cover letter
      
      toast.error('Saving cover letter from this page is not yet implemented in Server Actions');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save cover letter';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading resume..." />;
  }

  if (error || !resume) {
    return (
      <ErrorState
        title="Error Loading Resume"
        message={error || 'Resume not found'}
        onRetry={() => router.push('/resumes')}
        retryText="Back to Resumes"
      />
    );
  }

  return (
    <Page
      title={resume.jobTitle || 'Untitled Resume'}
      description={resume.companyName || undefined}
      breadcrumbs={[
        { label: 'Resumes', href: '/resumes' },
        { label: resume.jobTitle || 'Resume' },
      ]}
      className="resume-content"
      toolbar={
        <div className="no-print flex justify-end gap-2">
          <Link href={`/resumes/${resumeId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      }
    >
        {/* Resume HTML Preview */}
        <ResumePreview
          resumeData={resume.content}
          resumeId={resumeId}
          showCard={true}
          showTemplateSelector={true}
          previewKey={pdfPreviewKey}
          className="mb-6 no-print"
          headerActions={
            <>
              <Button
                onClick={handleDuplicate}
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isDuplicating}
              >
                {isDuplicating ? <LoadingState message="" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </>
          }
        />

        {/* Job Description */}
        <Card className="p-6 mb-6 no-print">
          <h2 className="text-lg font-semibold mb-3">Job Description</h2>
          <p className=" whitespace-pre-wrap">{resume.jobDescription}</p>
        </Card>

        {/* Cover Letter (if generated) */}
        {resume.coverLetter && (
          <CoverLetterEditor
            content={resume.coverLetter}
            editable={true}
            resumeId={resumeId}
            onSave={handleSaveCoverLetter}
            className="mb-6 no-print"
          />
        )}



        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title="Delete Resume"
          message="Are you sure you want to delete this resume? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
    </Page>
  );
}
