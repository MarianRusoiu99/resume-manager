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
import { CoverLetterCard } from '@/components/cover-letter/CoverLetterCard';
import { FileText } from 'lucide-react';

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

  const handleDelete = (id: string) => {
    // Remove from local state - deletion is handled in CoverLetterCard
    setCoverLetters((prev) => prev.filter((cl) => cl.id !== id));
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map((coverLetter) => (
              <CoverLetterCard
                key={coverLetter.id}
                id={coverLetter.id}
                jobTitle={coverLetter.jobTitle}
                companyName={coverLetter.companyName}
                content={coverLetter.content}
                createdAt={coverLetter.createdAt}
                onView={(id) => router.push(`/cover-letter/${id}`)}
                onEdit={(id) => router.push(`/cover-letter/${id}/edit`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
