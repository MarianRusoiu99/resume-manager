import { Suspense } from 'react';
import Link from 'next/link';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { CoverLetterListClient } from '@/components/cover-letter/CoverLetterListClient';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/shared/states';
import { ROUTES } from '@/lib/constants';
import { getCoverLetters, deleteCoverLetter } from '@/app/actions/cover-letter';
import { GallerySkeleton } from '@/components/shared/skeletons/GallerySkeleton';
import { FileText } from 'lucide-react';
import { revalidatePath } from 'next/cache';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CoverLettersPage({ searchParams }: Props) {
  const { q: searchTerm = '' } = await searchParams;

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
      <div className="mb-6">
        <SearchInput 
          placeholder="Search cover letters..." 
          defaultValue={searchTerm}
        />
      </div>

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

  const filteredLetters = coverLetters.filter(cl => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (cl.jobPosting?.title?.toLowerCase().includes(searchLower)) ||
      (cl.jobPosting?.company?.name?.toLowerCase().includes(searchLower)) ||
      (cl.content?.toLowerCase().includes(searchLower))
    );
  });

  const handleDelete = async (id: string) => {
    'use server';
    await deleteCoverLetter(id);
  };

  return (
    <CoverLetterListClient
      coverLetters={filteredLetters}
      onDelete={handleDelete}
      onGenerate={() => {}} // Handled via link in Page actions
      searchTerm={searchTerm}
    />
  );
}
