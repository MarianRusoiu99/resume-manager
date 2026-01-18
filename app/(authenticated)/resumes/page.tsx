import { Suspense } from 'react';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { ResumeListClient } from '@/modules/resume/components/ResumeListClient';
import { ErrorState } from '@/components/core/feedback/states';
import { ROUTES } from '@/lib/constants';
import { getResumes } from '@/app/actions/resume';
import { GallerySkeleton } from '@/components/core/data-display/skeletons/GallerySkeleton';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ResumesPage({ searchParams }: Props) {
  const { q: searchTerm = '' } = await searchParams;

  return (
    <Page
      title="My Resumes"
      description="Manage your AI-generated resumes"
      actions={
        <Button asChild>
          <Link href={ROUTES.GENERATE}>
            Generate New Resume
          </Link>
        </Button>
      }
    >
      <Suspense fallback={<GallerySkeleton columns={{ sm: 1, md: 2, lg: 4, xl: 4 }} />}>
        <ResumesContent searchTerm={searchTerm} />
      </Suspense>
    </Page>
  );
}

async function ResumesContent({ searchTerm }: { searchTerm: string }) {
  const result = await getResumes();

  if (!result.success) {
    return (
      <ErrorState
        message={result.error}
        variant="inline"
        className="mb-6"
      />
    );
  }

  const resumes = result.data || [];

  return (
    <ResumeListClient
      resumes={resumes}
      searchTerm={searchTerm}
    />
  );
}
