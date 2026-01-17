'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { FileText, Send } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { ResumeGenerator } from './ResumeGenerator';
import { CoverLetterGenerator } from './CoverLetterGenerator';
import type { ProfileListItem } from '@/lib/actions/types';

interface GenerateContentProps {
  initialProfiles: ProfileListItem[];
  hasAIProviders: boolean;
  defaultProfileId: string;
}

export function GenerateContent({
  initialProfiles,
  hasAIProviders,
  defaultProfileId,
}: GenerateContentProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  return (
    <Page
      title="Generate Content"
      description="Create tailored resumes and cover letters with AI"
    >
      <Tabs defaultValue={tabParam === 'cover-letter' ? 'cover-letter' : 'resume'} className="w-full">
        <div className="flex items-center justify-end mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="resume" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Send className="w-4 h-4" />
              Cover Letter
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-2">
          <TabsContent value="resume" className="m-0">
            <ResumeGenerator 
              profiles={initialProfiles}
              hasAIProviders={hasAIProviders}
              isLoadingMetadata={false}
              defaultProfileId={defaultProfileId}
            />
          </TabsContent>

          <TabsContent value="cover-letter" className="m-0">
            <CoverLetterGenerator 
              profiles={initialProfiles}
              hasAIProviders={hasAIProviders}
              defaultProfileId={defaultProfileId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  );
}
