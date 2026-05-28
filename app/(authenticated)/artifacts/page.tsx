import { Suspense } from 'react';
import { Page } from '@/components/layout/Page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { ErrorState } from '@/components/core/feedback/states';
import { GallerySkeleton } from '@/components/core/data-display/skeletons/GallerySkeleton';
import { ResumeListClient } from '@/modules/resume/components/ResumeListClient';
import { CoverLetterListClient } from '@/modules/cover-letter/components/CoverLetterListClient';
import { TemplateGallery } from '@/modules/templates/components/TemplateGallery';
import { getResumes } from '@/app/actions/resume';
import { getCoverLetters } from '@/app/actions/cover-letter';
import { templateRepository } from '@/lib/repositories/templates.repository';
import { getSession } from '@/lib/auth/dal';

interface Props {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

type ArtifactTab = 'generated-resumes' | 'cover-letters' | 'templates';

function normalizeTab(tab?: string): ArtifactTab {
  if (tab === 'cover-letters') return 'cover-letters';
  if (tab === 'templates') return 'templates';
  return 'generated-resumes';
}

export default async function ArtifactsPage({ searchParams }: Props) {
  const { q: searchTerm = '', tab } = await searchParams;
  const defaultTab = normalizeTab(tab);

  return (
    <Page
      title="Artifacts"
      description="Manage your generated artifacts: resumes, cover letters, and templates"
    >
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex items-center justify-end mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-xl bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="generated-resumes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Generated Resumes
            </TabsTrigger>
            <TabsTrigger value="cover-letters" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Cover Letters
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generated-resumes" className="m-0">
          <Suspense fallback={<GallerySkeleton columns={{ sm: 1, md: 2, lg: 4, xl: 4 }} />}>
            <GeneratedResumesPanel searchTerm={searchTerm} />
          </Suspense>
        </TabsContent>

        <TabsContent value="cover-letters" className="m-0">
          <Suspense fallback={<GallerySkeleton columns={{ sm: 1, md: 2, lg: 4, xl: 4 }} />}>
            <CoverLettersPanel searchTerm={searchTerm} />
          </Suspense>
        </TabsContent>

        <TabsContent value="templates" className="m-0">
          <Suspense fallback={<GallerySkeleton columns={{ sm: 1, md: 2, lg: 3, xl: 3 }} />}>
            <TemplatesPanel />
          </Suspense>
        </TabsContent>
      </Tabs>
    </Page>
  );
}

async function GeneratedResumesPanel({ searchTerm }: { searchTerm: string }) {
  const result = await getResumes();

  if (!result.success) {
    return <ErrorState message={result.error} variant="inline" className="mb-6" />;
  }

  return <ResumeListClient resumes={result.data || []} searchTerm={searchTerm} />;
}

async function CoverLettersPanel({ searchTerm }: { searchTerm: string }) {
  const result = await getCoverLetters();

  if (!result.success) {
    return <ErrorState message={result.error} variant="inline" className="mb-6" />;
  }

  const coverLetters = (result.data || []).map((cl) => ({
    ...cl,
    createdAt: cl.createdAt.toISOString(),
  }));

  return <CoverLetterListClient coverLetters={coverLetters} searchTerm={searchTerm} />;
}

async function TemplatesPanel() {
  const templates = await templateRepository.findAllPublic();
  const session = await getSession();
  const showAdminActions = !!session?.userId;

  return <TemplateGallery templates={templates} showAdminActions={showAdminActions} />;
}
