'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import { ResumeEditor } from '@/components/resume/ResumeEditor';
import { VersionHistory } from '@/components/resume/VersionHistory';
import { SectionOrderManager } from '@/components/resume/SectionOrderManager';

interface Resume {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      links?: string[];
    };
    summary: string;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate: string | null;
      description: string;
      bulletPoints: string[];
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string | null;
      gpa?: string;
    }>;
    skills: {
      technical: string[];
      soft: string[];
    };
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isExportingCoverLetter, setIsExportingCoverLetter] = useState(false);
  const [pdfPreviewKey, setPdfPreviewKey] = useState(Date.now());
  const [isSectionOrderOpen, setIsSectionOrderOpen] = useState(false);

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

  const handleRestoreVersion = async () => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/content`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resume?.aiGeneratedContent || resume?.content),
      });

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      toast.success('AI-generated version restored successfully');
      setIsVersionHistoryOpen(false);
      fetchResume();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore version');
    }
  };

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

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
    <div className="container mx-auto px-4 py-8 max-w-5xl resume-content">
      {/* Header */}
      <div className="mb-8 no-print">
        <Button
          variant="ghost"
          onClick={() => router.push('/resumes')}
          className="mb-4"
        >
          ← Back to Resumes
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {resume.jobTitle || 'Untitled Resume'}
            </h1>
            {resume.companyName && (
              <p className="text-lg text-gray-600">{resume.companyName}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditorOpen(true)}
              variant="secondary"
            >
              Edit Content
            </Button>
            <Button
              onClick={() => setIsSectionOrderOpen(true)}
              variant="secondary"
            >
              Reorder Sections
            </Button>
            <Button
              onClick={() => setIsVersionHistoryOpen(true)}
              variant="secondary"
            >
              View History
            </Button>
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
      </div>

      {/* PDF Preview - Always Visible */}
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
        <div className="w-full h-96 border rounded-lg overflow-hidden">
          <iframe
            src={`/api/resumes/${resumeId}/preview?v=${pdfPreviewKey}`}
            className="w-full h-full border-0"
            title="Resume PDF Preview"
          />
        </div>
      </Card>

      {/* Job Description */}
      <Card className="p-6 mb-6 no-print">
        <h2 className="text-lg font-semibold mb-3">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{resume.jobDescription}</p>
      </Card>

      {/* Template Selector */}
      <div className="mb-6 no-print">
        <TemplateSelector
          currentTemplateId={resume.templateId}
          resumeId={resumeId}
          onTemplateChange={handleTemplateChange}
        />
      </div>

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

      {/* Resume Content */}
      <Card className="p-8 print-card print-no-break">
        {/* Personal Info */}
        <div className="mb-8 print-no-break">
          <h1 className="text-3xl font-bold mb-2">{resume.content.personalInfo.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {resume.content.personalInfo.email && (
              <span>{resume.content.personalInfo.email}</span>
            )}
            {resume.content.personalInfo.phone && (
              <span>{resume.content.personalInfo.phone}</span>
            )}
            {resume.content.personalInfo.location && (
              <span>{resume.content.personalInfo.location}</span>
            )}
          </div>
          {resume.content.personalInfo.links && resume.content.personalInfo.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {resume.content.personalInfo.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {link}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Professional Summary */}
        {resume.content.summary && (
          <div className="mb-8 print-no-break">
            <h2 className="text-xl font-bold mb-3 border-b-2 border-gray-200 pb-2">
              Professional Summary
            </h2>
            <p className="text-gray-700">{resume.content.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resume.content.experience && resume.content.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2">
              Professional Experience
            </h2>
            {resume.content.experience.map((exp, idx) => (
              <div key={idx} className="mb-6 last:mb-0 print-no-break">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{exp.position}</h3>
                    <p className="text-gray-700">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-gray-700 mb-2">{exp.description}</p>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {exp.bulletPoints.map((bullet, bulletIdx) => (
                      <li key={bulletIdx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.content.education && resume.content.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2">
              Education
            </h2>
            {resume.content.education.map((edu, idx) => (
              <div key={idx} className="mb-4 last:mb-0 print-no-break">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                    <p className="text-gray-700">{edu.institution}</p>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.gpa && (
                  <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resume.content.skills && (
          <div className="print-no-break">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2">
              Skills
            </h2>
            {resume.content.skills.technical && resume.content.skills.technical.length > 0 && (
              <div className="mb-3">
                <h3 className="font-semibold mb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.content.skills.technical.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {resume.content.skills.soft && resume.content.skills.soft.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.content.skills.soft.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 no-print">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Generated: {new Date(resume.metadata.generatedAt).toLocaleString()}</span>
              <span>Model: {resume.metadata.model}</span>
            </div>
            <div className="flex justify-between">
              <span>Tokens: {resume.metadata.totalTokens.toLocaleString()}</span>
              <span>Processing: {(resume.metadata.processingTime / 1000).toFixed(2)}s</span>
            </div>
            {resume.isEdited && (
              <div className="text-blue-600 font-medium">
                ✏️ This resume has been edited
              </div>
            )}
          </div>
        </div>
      </Card>

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

      {/* Resume Editor */}
      {isEditorOpen && resume.content && (
        <ResumeEditor
          resumeId={resumeId}
          initialContent={resume.content}
          aiGeneratedContent={
            (resume.metadata as unknown as { aiGeneratedContent?: typeof resume.content })
              ?.aiGeneratedContent || resume.content
          }
          onSave={() => {
            fetchResume();
            setIsEditorOpen(false);
          }}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

      {/* Version History */}
      {isVersionHistoryOpen && resume.content && (
        <VersionHistory
          currentContent={resume.content}
          aiGeneratedContent={resume.aiGeneratedContent || resume.content}
          onClose={() => setIsVersionHistoryOpen(false)}
          onRestore={handleRestoreVersion}
        />
      )}

      {/* Section Order Manager */}
      {isSectionOrderOpen && (
        <SectionOrderManager
          resumeId={resumeId}
          initialOrder={resume.sectionOrder as string[] | undefined}
          onClose={() => setIsSectionOrderOpen(false)}
          onSave={fetchResume}
        />
      )}
    </div>
  );
}
