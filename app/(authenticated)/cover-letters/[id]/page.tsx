'use client';

/**
 * Cover Letter Detail Page
 * View and edit a specific cover letter
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button, Card } from '@/components/ui';
import { Callout } from '@/components/shared';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CoverLetterEditor } from '@/components/cover-letter';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { apiV1 } from '@/lib/client';
import type { CoverLetterWithResume } from '@/lib/types/cover-letter';

type CoverLetterMetadata = {
  model?: string;
  tokens?: number;
  generationTime?: number;
  personalInstructions?: string;
  contentJson?: string;
};

export default function CoverLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coverLetterId = params?.id as string;

  const [coverLetter, setCoverLetter] = useState<CoverLetterWithResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchCoverLetter = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await apiV1.COVER_LETTER.GET(coverLetterId).get<CoverLetterWithResume>();

      if (result.error || !result.data) {
        if (result.status === 404) {
          throw new Error('Cover letter not found');
        }
        throw new Error(result.error || 'Failed to fetch cover letter');
      }

      setCoverLetter(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cover letter');
      toast.error(err instanceof Error ? err.message : 'Failed to load cover letter');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (coverLetterId) {
      fetchCoverLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLetterId]);

  const handleSaveCoverLetter = async (content: string, contentJson: string) => {
    try {
      const result = await apiV1.COVER_LETTER.GET(coverLetterId).put<CoverLetterWithResume>({
        content,
        contentJson,
      });

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to save cover letter');
      }

      setCoverLetter(result.data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save cover letter');
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const result = await apiV1.COVER_LETTER.GET(coverLetterId).delete<{ success: boolean }>();

      if (result.error) {
        throw new Error(result.error || 'Failed to delete cover letter');
      }

      toast.success('Cover letter deleted successfully');
      router.push('/cover-letters');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete cover letter');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const getMetadata = (): CoverLetterMetadata => {
    if (!coverLetter) return {};
    if (coverLetter.metadata && typeof coverLetter.metadata === 'object' && !Array.isArray(coverLetter.metadata)) {
      return coverLetter.metadata as unknown as CoverLetterMetadata;
    }
    return {};
  };

  const getPageTitle = (): string => {
    if (!coverLetter) return 'Cover Letter';
    if (coverLetter.jobTitle && coverLetter.companyName) {
      return `${coverLetter.jobTitle} at ${coverLetter.companyName}`;
    }
    if (coverLetter.jobTitle) {
      return coverLetter.jobTitle;
    }
    if (coverLetter.companyName) {
      return `Cover Letter for ${coverLetter.companyName}`;
    }
    return 'Cover Letter';
  };

  if (isLoading) {
    return (
      <Page
        title="Loading..."
        description="Fetching cover letter details"
        breadcrumbs={[
          { label: 'Cover Letters', href: '/cover-letters' },
          { label: '...' },
        ]}
      >
        <LoadingState message="Loading cover letter..." />
      </Page>
    );
  }

  if (error || !coverLetter) {
    return (
      <Page
        title="Error"
        description="Failed to load cover letter"
        breadcrumbs={[
          { label: 'Cover Letters', href: '/cover-letters' },
          { label: 'Error' },
        ]}
      >
        <ErrorState
          title="Cover Letter Not Found"
          message={error || 'Cover letter not found'}
          variant="full"
          onRetry={() => router.push('/cover-letters')}
          retryText="Back to Cover Letters"
        />
      </Page>
    );
  }

  return (
    <Page
      title={getPageTitle()}
      description="View and edit your cover letter"
      breadcrumbs={[
        { label: 'Cover Letters', href: '/cover-letters' },
        { label: getPageTitle() },
      ]}
      toolbar={
        <div className="flex justify-between items-center">
          <Link href="/cover-letters">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cover Letters
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2 text-red-600" />
            Delete
          </Button>
        </div>
      }
    >
        {/* Metadata Card */}
        {(() => {
          const metadata = getMetadata();
          return coverLetter.generatedResume || metadata.model ? (
            <Callout className="mb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {coverLetter.generatedResume && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Linked to Resume</span>
                      <Link
                        href={`/resumes/${coverLetter.generatedResume.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Resume →
                      </Link>
                    </div>
                  )}

                  {metadata.model && (
                    <div className="text-xs text-blue-700">
                      Generated with {metadata.model}
                      {metadata.tokens && ` • ${metadata.tokens} tokens`}
                    </div>
                  )}
                </div>
              </div>
            </Callout>
          ) : null;
        })()}

        {/* Cover Letter Editor */}
        <CoverLetterEditor
          content={coverLetter.content}
          contentJson={getMetadata().contentJson}
          editable={true}
          onSave={handleSaveCoverLetter}
          title="Cover Letter"
        />

        {/* Job Description Card */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Original Job Description</h3>
          <div className="p-4 rounded-md border  max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-foreground  font-sans">
              {coverLetter.jobDescription}
            </pre>
          </div>
          {getMetadata().personalInstructions && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Personal Instructions</h4>
               <Callout tone="soft" className="p-3">
                 <p className="text-sm">{getMetadata().personalInstructions}</p>
               </Callout>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          title="Delete Cover Letter"
          message={`Are you sure you want to delete this cover letter? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
    </Page>
  );
}
