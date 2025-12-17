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
import { Edit } from 'lucide-react';
import { apiV1 } from '@/lib/client';
import { createComponentLogger } from '@/lib/utils/client-logger';
import type { ResumeDetails } from '@/lib/services/resume-crud';

type ResumeDetailsClient = Omit<ResumeDetails, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type ResumeCoverLetterResponse = {
  coverLetter: string | null;
  metadata: unknown;
};

type DuplicateResumeResponse = {
  resume: { id: string };
};

type DeleteResumeResponse = {
  message: string;
};

type UpdateCoverLetterResponse = {
  resume: { coverLetter: string; updatedAt: string };
};

const logger = createComponentLogger('ResumeDetailPage');

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;

  const [resume, setResume] = useState<(ResumeDetailsClient & { coverLetter: string | null }) | null>(null);
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

      const [resumeResult, coverLetterResult] = await Promise.all([
        apiV1.RESUME.GET(resumeId).get<ResumeDetailsClient>(),
        apiV1.RESUME.COVER_LETTER(resumeId).get<ResumeCoverLetterResponse>(),
      ]);

      if (resumeResult.error || !resumeResult.data) {
        if (resumeResult.status === 404) {
          throw new Error('Resume not found');
        }
        throw new Error(resumeResult.error || 'Failed to fetch resume');
      }

      if (coverLetterResult.error) {
        logger.warn('Failed to fetch resume cover letter', { error: coverLetterResult.error });
      }

      logger.debug('Fetched resume data', {
        templateId: resumeResult.data.templateId,
      });

      setResume({
        ...resumeResult.data,
        coverLetter: coverLetterResult.data?.coverLetter ?? null,
      });
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

      const result = await apiV1.RESUME.GET(resumeId).delete<DeleteResumeResponse>();

      if (result.error) {
        throw new Error(result.error || 'Failed to delete resume');
      }

      toast.success(result.data?.message ?? 'Resume deleted successfully');
      // Redirect to resumes list
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

      const result = await apiV1.RESUME.DUPLICATE(resumeId).post<DuplicateResumeResponse>();

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to duplicate resume');
      }

      toast.success('Resume duplicated successfully');
      router.push(`/resumes/${result.data.resume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsDuplicating(false);
    }
  };



  const handleSaveCoverLetter = async (markdown: string) => {
    try {
      setError(null);

      const result = await apiV1.RESUME.COVER_LETTER(resumeId).put<UpdateCoverLetterResponse>({
        coverLetter: markdown,
      });

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to save cover letter');
      }

      if (resume) {
        setResume({
          ...resume,
          coverLetter: result.data.resume.coverLetter,
          updatedAt: result.data.resume.updatedAt,
        });
      }

      toast.success('Cover letter saved successfully');
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
      maxWidth="2xl"
      className="resume-content max-w-5xl"
      toolbar={
        <div className="no-print flex justify-end gap-2">
          <Link href={`/resumes/${resumeId}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Resume
            </Button>
          </Link>

          <Button
            onClick={handleDuplicate}
            variant="secondary"
            disabled={isDuplicating}
          >
            {isDuplicating ? 'Duplicating...' : 'Duplicate'}
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
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
