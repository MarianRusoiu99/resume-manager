'use client';

/**
 * Cover Letters List Page
 * Displays all cover letters for the authenticated user
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { CoverLetterList, type CoverLetterListItem } from '@/components/cover-letter/CoverLetterList';
import { ErrorState } from '@/components/shared/states';
import { useFetch } from '@/hooks/useDataFetching';
import { ROUTES } from '@/lib/constants';
import { apiV1 } from '@/lib/client';
import { FileText } from 'lucide-react';

interface CoverLetter extends CoverLetterListItem {
  resumeId: string | null;
  jobPostingId: string | null;
  jobPosting: {
    title: string | null;
    company: { name: string } | null;
  } | null;
  metadata: {
    model?: string;
    tokens?: number;
    generationTime?: number;
    personalInstructions?: string;
  };
  updatedAt: string;
}

interface CoverLettersResponse {
  coverLetters: CoverLetter[];
}

export default function CoverLettersPage() {
  const router = useRouter();

  // Use the data fetching hook
  const {
    data,
    isLoading,
    error,
    refetch,
    mutate,
  } = useFetch<CoverLettersResponse>(apiV1.COVER_LETTER.LIST.url);

  const coverLetters = data?.coverLetters ?? [];

  const handleDelete = (id: string) => {
    // Optimistic update - remove from local state
    mutate((prev) => ({
      coverLetters: (prev?.coverLetters ?? []).filter((cl) => cl.id !== id),
    }));
  };

  return (
    <Page
      title="My Cover Letters"
      description="Manage all your generated cover letters"
      breadcrumbs={[{ label: "Cover Letters" }]}
      actions={
        <Link href={ROUTES.GENERATE_COVER_LETTER}>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </Link>
      }
    >

      {error && (
        <ErrorState
          message={error}
          onRetry={refetch}
          variant="inline"
          className="mb-6"
        />
      )}

      <div className="space-y-6">
        <CoverLetterList
          coverLetters={coverLetters}
          isLoading={isLoading}
          onDelete={handleDelete}
          onGenerate={() => router.push(ROUTES.GENERATE_COVER_LETTER)}
        />
      </div>
    </Page>
  );
}
