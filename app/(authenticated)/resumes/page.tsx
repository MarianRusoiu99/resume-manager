import { Suspense } from 'react';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { ResumeListClient } from '@/components/resume/ResumeListClient';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/shared/states';
import { ROUTES } from '@/lib/constants';
import { getResumes } from '@/app/actions/resume';
import { GallerySkeleton } from '@/components/shared/skeletons/GallerySkeleton';
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
      breadcrumbs={[{ label: "Resumes" }]}
      actions={
        <Button asChild>
          <Link href={ROUTES.GENERATE}>
            Generate New Resume
          </Link>
        </Button>
      }
    >
      <div className="mb-6">
        <SearchInput 
          placeholder="Search by job title, company, or description..." 
          defaultValue={searchTerm}
        />
      </div>

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

  const resumes = (result.data || []).map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString()
  }));

  // Filter resumes based on search term (Server-side filtering for simplicity now, 
  // could be moved to database query later)
  const filteredResumes = resumes.filter(resume => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (resume.jobTitle?.toLowerCase().includes(searchLower)) ||
      (resume.companyName?.toLowerCase().includes(searchLower)) ||
      (resume.jobDescription?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <ResumeListClient
        resumes={filteredResumes}
        onGenerate={() => {}} // Not used in client component anymore for routing
        searchTerm={searchTerm}
      />

      {resumes.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground pb-8">
          Showing {filteredResumes.length} of {resumes.length} resume{resumes.length === 1 ? '' : 's'}
        </div>
      )}
    </>
  );
}
