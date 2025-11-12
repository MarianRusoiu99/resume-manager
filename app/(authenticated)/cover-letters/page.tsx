'use client';

/**
 * Cover Letters List Page
 * Displays all cover letters for the authenticated user
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileText, Trash2, Eye, ExternalLink } from 'lucide-react';

const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

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

export default function CoverLettersPage() {
  const router = useRouter();
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<CoverLetter | null>(null);

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  const fetchCoverLetters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/cover-letters');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cover letters');
      }

      const data = await response.json();
      setCoverLetters(data.coverLetters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cover letters');
      toast.error('Failed to load cover letters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (coverLetter: CoverLetter) => {
    setSelectedForDelete(coverLetter);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedForDelete) return;

    try {
      setDeletingId(selectedForDelete.id);
      
      const response = await fetch(`/api/cover-letters/${selectedForDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete cover letter');
      }

      toast.success('Cover letter deleted successfully');
      setCoverLetters(prev => prev.filter(cl => cl.id !== selectedForDelete.id));
      setDeleteDialogOpen(false);
      setSelectedForDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete cover letter');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedForDelete(null);
  };

  const getDisplayTitle = (coverLetter: CoverLetter): string => {
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
          title="My Cover Letters"
          description="Manage all your generated cover letters"
          breadcrumbs={[
            { label: "Cover Letters" },
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

  return (
    <>
      <PageHeader
        title="My Cover Letters"
        description="Manage all your generated cover letters"
        breadcrumbs={[
          { label: "Cover Letters" },
        ]}
      />
      <PageContainer>
        <div className="flex justify-end mb-6">
          <Link href="/cover-letter">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </Link>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {coverLetters.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Cover Letters Yet</h3>
            <p className="text-gray-600 mb-6">
              Start by generating your first cover letter for a job application
            </p>
            <Link href="/cover-letter">
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Generate Cover Letter
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {coverLetters.map((coverLetter) => (
              <Card key={coverLetter.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">
                        {getDisplayTitle(coverLetter)}
                      </h3>
                      {coverLetter.resumeId && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          Linked to Resume
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {coverLetter.content.substring(0, 200)}...
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Created {formatTimeAgo(coverLetter.createdAt)}
                      </span>
                      {coverLetter.metadata?.tokens && (
                        <span>{coverLetter.metadata.tokens} tokens</span>
                      )}
                      {coverLetter.metadata?.model && (
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {coverLetter.metadata.model}
                        </span>
                      )}
                    </div>

                    {coverLetter.resume && (
                      <div className="mt-3 flex items-center gap-2">
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                        <Link
                          href={`/resumes/${coverLetter.resume.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Associated Resume
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/cover-letters/${coverLetter.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coverLetter)}
                      disabled={deletingId === coverLetter.id}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          title="Delete Cover Letter"
          message={`Are you sure you want to delete the cover letter "${selectedForDelete ? getDisplayTitle(selectedForDelete) : ''}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </PageContainer>
    </>
  );
}
