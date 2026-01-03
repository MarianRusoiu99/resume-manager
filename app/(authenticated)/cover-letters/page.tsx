import { Suspense } from 'react';
import Link from 'next/link';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { CoverLetterListClient } from '@/components/cover-letter/CoverLetterListClient';
import { ErrorState } from '@/components/shared/states';
import { ROUTES } from '@/lib/constants';
import { getCoverLetters } from '@/app/actions/cover-letter';
import { GallerySkeleton } from '@/components/shared/skeletons/GallerySkeleton';
import { FileText } from 'lucide-react';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CoverLettersPage({ searchParams }: Props) {
  const { q: searchTerm = '' } = await searchParams;

  return (
    <Page
      title="My Cover Letters"
      description="Manage all your generated cover letters"
      actions={
        <Link href={ROUTES.GENERATE_COVER_LETTER}>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </Link>
      }
    >
      <Suspense fallback={<GallerySkeleton columns={{ sm: 1, md: 2, lg: 4, xl: 4 }} />}>
        <CoverLettersContent searchTerm={searchTerm} />
      </Suspense>
    </Page>
  );
}

async function CoverLettersContent({ searchTerm }: { searchTerm: string }) {
  const result = await getCoverLetters();

  if (!result.success) {
    return (
      <ErrorState
        message={result.error}
        variant="inline"
        className="mb-6"
      />
    );
  }

  const coverLetters = (result.data || []).map(cl => ({
    ...cl,
    createdAt: cl.createdAt.toISOString()
  }));

  return (
    <CoverLetterListClient
      coverLetters={coverLetters}
      searchTerm={searchTerm}
    />
  );
}
