'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { ResumeCard } from '@/components/resume/ResumeCard';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';

interface Resume {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string | null;
  content: JsonResume;
  templateId: string | null;
  customization: Record<string, unknown> | null;
  pdfUrl: string | null;
  isEdited: boolean;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  createdAt: string;
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

      const response = await fetch('/api/resumes/generate');
      
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your resumes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Resumes"
        description="Manage your AI-generated resumes"
        breadcrumbs={[
          { label: "Resumes" },
        ]}
      />
      <PageContainer>
        <div className="flex justify-end mb-6">
          <Button onClick={() => router.push('/generate')}>
            Generate New Resume
          </Button>
        </div>

        {/* Search Bar */}
        {resumes.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by job title, company, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-background dark:border-border"
            />
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {resumes.length === 0 && !error && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No resumes yet</h2>
            <p className="text-gray-600 mb-6">
              Generate your first AI-optimized resume by providing a job description
            </p>
            <Button onClick={() => router.push('/generate')}>
              Generate Your First Resume
            </Button>
          </div>
        </Card>
      )}

      {/* Resume Grid */}
      {filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              id={resume.id}
              jobTitle={resume.jobTitle}
              companyName={resume.companyName}
              content={resume.content}
              templateId={resume.templateId}
              createdAt={resume.createdAt}
              onView={(id) => router.push(`/resumes/${id}`)}
              onEdit={(id) => router.push(`/resumes/${id}/edit`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : null}
      
      {searchTerm && resumes.length > 0 && filteredResumes.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600">
            No resumes found matching &quot;{searchTerm}&quot;
          </p>
        </Card>
      )}

      {/* Results Count */}
      {resumes.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredResumes.length} of {resumes.length} resume{resumes.length === 1 ? '' : 's'}
        </div>
      )}
      </PageContainer>
    </>
  );
}
