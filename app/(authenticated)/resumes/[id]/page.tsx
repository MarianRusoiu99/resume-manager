'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CoverLetterEditor } from '@/components/cover-letter';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Edit } from 'lucide-react';
import { apiFetch, apiJson } from '@/lib/utils/api-client';
import { API_V1 } from '@/lib/constants';
import { createComponentLogger } from '@/lib/utils/client-logger';
import type { GeneratedResume } from '@/lib/types';

const logger = createComponentLogger('ResumeDetailPage');

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;

  const [resume, setResume] = useState<GeneratedResume | null>(null);
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

      const result = await apiJson<GeneratedResume>(API_V1.RESUME.GET(resumeId));

      if (result.error || !result.data) {
        if (result.status === 404) {
          throw new Error('Resume not found');
        }
        throw new Error(result.error || 'Failed to fetch resume');
      }

      logger.debug('Fetched resume data', {
        templateId: result.data.templateId,
        pdfUrl: result.data.pdfUrl,
      });
      setResume(result.data);
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

      const response = await apiFetch(API_V1.RESUME.GET(resumeId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
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

      const result = await apiJson<{ resume: { id: string } }>(API_V1.RESUME.DUPLICATE(resumeId), {
        method: 'POST',
      });

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

      const result = await apiJson<{ resume: { coverLetter: string; updatedAt: string } }>(API_V1.RESUME.COVER_LETTER(resumeId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter: markdown,
        }),
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resume...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Error Loading Resume</h2>
            <p className="text-gray-600 mb-6">{error || 'Resume not found'}</p>
            <Button onClick={() => router.push('/resumes')}>
              Back to Resumes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={resume.jobTitle || 'Untitled Resume'}
        description={resume.companyName || undefined}
        breadcrumbs={[
          { label: "Resumes", href: "/resumes" },
          { label: resume.jobTitle || 'Resume' },
        ]}
      />
      <PageContainer className="resume-content max-w-5xl">
        <div className="no-print">
          <div className="flex justify-end gap-2 mb-6">
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
        </div>

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
      </PageContainer>
    </>
  );
}
