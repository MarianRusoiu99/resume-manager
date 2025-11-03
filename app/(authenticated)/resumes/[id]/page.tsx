'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TemplateDropdown } from '@/components/templates/TemplateDropdown';
import { Edit } from 'lucide-react';

interface Resume {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: {
    basics?: {
      name?: string;
      email?: string;
      phone?: string;
      url?: string;
      summary?: string;
      location?: {
        address?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        countryCode?: string;
      };
      profiles?: Array<{
        network?: string;
        username?: string;
        url?: string;
      }>;
    };
    work?: Array<{
      name?: string;
      position?: string;
      url?: string;
      startDate?: string;
      endDate?: string;
      summary?: string;
      highlights?: string[];
    }>;
    education?: Array<{
      institution?: string;
      url?: string;
      area?: string;
      studyType?: string;
      startDate?: string;
      endDate?: string;
      score?: string;
      courses?: string[];
    }>;
    skills?: Array<{
      name?: string;
      level?: string;
      keywords?: string[];
    }>;
    certificates?: Array<{
      name?: string;
      date?: string;
      issuer?: string;
      url?: string;
    }>;
    projects?: Array<{
      name?: string;
      description?: string;
      highlights?: string[];
      keywords?: string[];
      startDate?: string;
      endDate?: string;
      url?: string;
    }>;
    [key: string]: unknown;
  };
  templateId: string | null;
  customization: Record<string, unknown> | null;
  pdfUrl: string | null;
  coverLetter: string | null;
  isEdited: boolean;
  aiGeneratedContent?: Resume['content'];
  sectionOrder?: string[] | null;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isExportingCoverLetter, setIsExportingCoverLetter] = useState(false);
  const [pdfPreviewKey, setPdfPreviewKey] = useState(Date.now());

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/resumes/${resumeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Resume not found');
        }
        throw new Error('Failed to fetch resume');
      }

      const data = await response.json();
      console.log('Fetched resume data:', { templateId: data.templateId, pdfUrl: data.pdfUrl });
      setResume(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = async () => {
    console.log('Template change triggered');
    await fetchResume();
    const newKey = Date.now();
    console.log('Setting new PDF preview key:', newKey);
    setPdfPreviewKey(newKey);
  };

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
      // Redirect to resumes list
      router.push('/resumes');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resume');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      
      const response = await fetch(`/api/resumes/${resumeId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate resume');
      }

      const data = await response.json();
      toast.success('Resume duplicated successfully');
      
      // Redirect to the duplicated resume
      router.push(`/resumes/${data.resume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsDuplicating(false);
    }
  };

  // TODO: Re-enable handleRestoreVersion after VersionHistory is updated for JSON Resume format

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      setError(null);

      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export PDF';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCoverLetter = async () => {
    try {
      setIsExportingCoverLetter(true);
      setError(null);

      const response = await fetch(`/api/resumes/${resumeId}/export-cover-letter`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export cover letter PDF');
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Cover letter PDF exported successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export cover letter PDF';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsExportingCoverLetter(false);
    }
  };

  // TODO: Re-enable formatDate if needed after VersionHistory is updated for JSON Resume format

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resume...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Error Loading Resume</h2>
            <p className="text-gray-600 mb-6">{error || 'Resume not found'}</p>
            <Button onClick={() => router.push('/resumes')}>
              Back to Resumes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={resume.jobTitle || 'Untitled Resume'}
        description={resume.companyName || undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Resumes", href: "/resumes" },
          { label: resume.jobTitle || 'Resume' },
        ]}
      />
      <PageContainer className="resume-content max-w-5xl">
        <div className="no-print">
          <div className="flex justify-end gap-2 mb-6">
            <Link href={`/resumes/${resumeId}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Resume
              </Button>
            </Link>
  
            <TemplateDropdown
              currentTemplateId={resume.templateId}
              resumeId={resumeId}
              onTemplateChange={handleTemplateChange}
            />

            {/* TODO: Re-enable after VersionHistory is updated for JSON Resume format
            <Button
              onClick={() => setIsVersionHistoryOpen(true)}
              variant="secondary"
            >
              View History
            </Button>
            */}
            <Button
              onClick={handleDuplicate}
              variant="secondary"
              disabled={isDuplicating}
            >
              {isDuplicating ? 'Duplicating...' : 'Duplicate'}
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              {isExportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Resume HTML Preview */}
      <Card className="p-4 mb-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Resume Preview</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Template: {resume.templateId || 'Default'}
            </div>
            <Button
              onClick={() => setPdfPreviewKey(Date.now())}
              variant="secondary"
              size="sm"
            >
              Refresh Preview
            </Button>
          </div>
        </div>
        <div className="w-full border rounded-lg overflow-hidden bg-white" style={{ height: '800px' }}>
          <iframe
            src={`/api/resumes/${resumeId}/preview?v=${pdfPreviewKey}`}
            className="w-full h-full border-0"
            title="Resume Preview"
          />
        </div>
      </Card>

      {/* Job Description */}
      <Card className="p-6 mb-6 no-print">
        <h2 className="text-lg font-semibold mb-3">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{resume.jobDescription}</p>
      </Card>

      {/* Cover Letter (if generated) */}
      {resume.coverLetter && (
        <Card className="p-6 mb-6 no-print">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-semibold">Cover Letter</h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleExportCoverLetter}
                disabled={isExportingCoverLetter}
                size="sm"
              >
                {isExportingCoverLetter ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(resume.coverLetter || '');
                  toast.success('Cover letter copied to clipboard!');
                }}
                size="sm"
              >
                Copy
              </Button>
            </div>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {resume.coverLetter}
          </div>
        </Card>
      )}

      

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* TODO: Re-enable after VersionHistory is updated for JSON Resume format
      {isVersionHistoryOpen && resume.content && (
        <VersionHistory
          currentContent={resume.content}
          aiGeneratedContent={(resume.aiGeneratedContent || resume.content)}
          onClose={() => setIsVersionHistoryOpen(false)}
          onRestore={handleRestoreVersion}
        />
      )}
      */}

      </PageContainer>
    </>
  );
}
