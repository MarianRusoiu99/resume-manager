'use client';

/**
 * Cover Letter Detail Page
 * View and edit a specific cover letter
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CoverLetterEditor } from '@/components/cover-letter';
import { ArrowLeft, Trash2, ExternalLink, FileText } from 'lucide-react';

interface CoverLetter {
  id: string;
  content: string;
  jobDescription: string;
  jobTitle: string | null;
  companyName: string | null;
  resumeId: string | null;
  resume: {
    id: string;
    jobDescription: string;
    resume: unknown;
    createdAt: string;
  } | null;
  metadata: {
    model?: string;
    tokens?: number;
    generationTime?: number;
    personalInstructions?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CoverLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coverLetterId = params?.id as string;

  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchCoverLetter = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/cover-letters/${coverLetterId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Cover letter not found');
        }
        throw new Error('Failed to fetch cover letter');
      }

      const data = await response.json();
      setCoverLetter(data);
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

  const handleSaveCoverLetter = async (content: string) => {
    try {
      const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save cover letter');
      }

      const data = await response.json();
      setCoverLetter(data);
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
      
      const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete cover letter');
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
      <>
        <PageHeader
          title="Loading..."
          description="Fetching cover letter details"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Cover Letters", href: "/cover-letters" },
            { label: "..." },
          ]}
        />
        <PageContainer>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !coverLetter) {
    return (
      <>
        <PageHeader
          title="Error"
          description="Failed to load cover letter"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Cover Letters", href: "/cover-letters" },
            { label: "Error" },
          ]}
        />
        <PageContainer>
          <Card className="p-6">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-red-300" />
              <h3 className="text-xl font-semibold mb-2 text-red-600">Cover Letter Not Found</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/cover-letters">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cover Letters
                </Button>
              </Link>
            </div>
          </Card>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={getPageTitle()}
        description="View and edit your cover letter"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Cover Letters", href: "/cover-letters" },
          { label: getPageTitle() },
        ]}
      />
      <PageContainer>
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
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

        {/* Metadata Card */}
        {(coverLetter.resume || coverLetter.metadata?.model) && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {coverLetter.resume && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Linked to Resume</span>
                    <Link
                      href={`/resumes/${coverLetter.resume.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Resume →
                    </Link>
                  </div>
                )}
                {coverLetter.metadata?.model && (
                  <div className="text-xs text-blue-700">
                    Generated with {coverLetter.metadata.model}
                    {coverLetter.metadata.tokens && ` • ${coverLetter.metadata.tokens} tokens`}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Cover Letter Editor */}
        <CoverLetterEditor
          content={coverLetter.content}
          editable={true}
          onSave={handleSaveCoverLetter}
          title="Cover Letter"
        />

        {/* Job Description Card */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Original Job Description</h3>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {coverLetter.jobDescription}
            </pre>
          </div>
          {coverLetter.metadata?.personalInstructions && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Personal Instructions</h4>
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm text-gray-700">{coverLetter.metadata.personalInstructions}</p>
              </div>
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
      </PageContainer>
    </>
  );
}
