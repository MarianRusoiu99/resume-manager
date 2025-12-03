'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { ResumeList, type ResumeListItem } from '@/components/resume/ResumeList';
import { Input } from '@/components/ui/input';
import { ErrorState } from '@/components/shared/states';

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
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/resume/generate');

      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const data = await response.json();
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  // Refetch when page becomes visible (e.g., after navigating back from detail page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchResumes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleDelete = (id: string) => {
    // Remove from local state - deletion is handled in ResumeCard
    // The optimistic update provides instant feedback
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  // Filter resumes based on search term
  const filteredResumes = resumes.filter(resume => {
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
        <Button onClick={() => router.push('/generate')}>
          Generate New Resume
        </Button>
      </div>

      {/* Search Bar */}
      {resumes.length > 0 && (
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
          onRetry={fetchResumes}
          variant="inline"
          className="mb-6"
        />
      )}

      <ResumeList
        resumes={filteredResumes}
        isLoading={isLoading}
        onDelete={handleDelete}
        onGenerate={() => router.push('/generate')}
        searchTerm={searchTerm}
      />

      {/* Results Count */}
      {resumes.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredResumes.length} of {resumes.length} resume{resumes.length === 1 ? '' : 's'}
        </div>
      )}
    </Page>
  );
}
