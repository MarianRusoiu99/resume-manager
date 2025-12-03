'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { ResumeList, type ResumeListItem } from '@/components/resume/ResumeList';
import { Input } from '@/components/ui/input';
import { ErrorState } from '@/components/shared/states';
import { useFetch } from '@/hooks/useDataFetching';
import { API, ROUTES } from '@/lib/constants';

// Define Resume type locally or import if available shared
interface Resume extends ResumeListItem {
  userId: string;
  jobDescription: string | null;
  customization: Record<string, unknown> | null;
  pdfUrl: string | null;
  isEdited: boolean;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  updatedAt: string;
}

export default function ResumesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Use the data fetching hook
  const { 
    data: resumes, 
    isLoading, 
    error, 
    refetch,
    mutate 
  } = useFetch<Resume[]>(API.RESUME.LIST, {
    initialData: [],
    refetchOnFocus: true,
  });

  const handleDelete = (id: string) => {
    // Optimistic update - remove from local state
    mutate((prev) => (prev ?? []).filter((r) => r.id !== id));
  };

  // Filter resumes based on search term
  const filteredResumes = (resumes ?? []).filter(resume => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (resume.jobTitle?.toLowerCase().includes(searchLower)) ||
      (resume.companyName?.toLowerCase().includes(searchLower)) ||
      (resume.jobDescription?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Page
      title="My Resumes"
      description="Manage your AI-generated resumes"
      breadcrumbs={[{ label: "Resumes" }]}
    >
      <div className="flex justify-end mb-6">
        <Button onClick={() => router.push(ROUTES.GENERATE)}>
          Generate New Resume
        </Button>
      </div>

      {/* Search Bar */}
      {(resumes?.length ?? 0) > 0 && (
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by job title, company, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <ErrorState
          message={error}
          onRetry={refetch}
          variant="inline"
          className="mb-6"
        />
      )}

      <ResumeList
        resumes={filteredResumes}
        isLoading={isLoading}
        onDelete={handleDelete}
        onGenerate={() => router.push(ROUTES.GENERATE)}
        searchTerm={searchTerm}
      />

      {/* Results Count */}
      {(resumes?.length ?? 0) > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredResumes.length} of {resumes?.length ?? 0} resume{(resumes?.length ?? 0) === 1 ? '' : 's'}
        </div>
      )}
    </Page>
  );
}
