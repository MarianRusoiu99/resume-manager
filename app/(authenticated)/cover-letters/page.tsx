'use client';

/**
 * Cover Letters List Page
 * Displays all cover letters for the authenticated user
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { CoverLetterList, type CoverLetterListItem } from '@/components/cover-letter/CoverLetterList';
import { ErrorState } from '@/components/shared/states';
import { FileText } from 'lucide-react';

interface CoverLetter extends CoverLetterListItem {
  jobDescription: string;
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
  updatedAt: string;
}

export default function CoverLettersPage() {
  const router = useRouter();
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoverLetters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/cover-letter');

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

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  // Auto-refresh when page becomes visible (e.g., after navigating back from generation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCoverLetters();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleDelete = (id: string) => {
    // Remove from local state - deletion is handled in CoverLetterCard
    setCoverLetters((prev) => prev.filter((cl) => cl.id !== id));
  };

  return (
    <Page
      title="My Cover Letters"
      description="Manage all your generated cover letters"
      breadcrumbs={[{ label: "Cover Letters" }]}
    >
      <div className="flex justify-end mb-6">
        <Link href="/generate?tab=cover-letter">
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </Link>
      </div>

      {error && (
        <ErrorState
          message={error}
          onRetry={fetchCoverLetters}
          variant="inline"
          className="mb-6"
        />
      )}

      <CoverLetterList
        coverLetters={coverLetters}
        isLoading={isLoading}
        onDelete={handleDelete}
        onGenerate={() => router.push('/generate?tab=cover-letter')}
      />
    </Page>
  );
}
