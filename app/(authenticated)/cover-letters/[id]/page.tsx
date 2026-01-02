'use client';

/**
 * Cover Letter Detail Page
 * View and edit a specific cover letter
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { Callout } from '@/components/shared';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CoverLetterEditor, type CoverLetterEditorRef } from '@/components/cover-letter';
import { Trash2, ExternalLink, Download, Copy, Sparkles, Edit, Save } from 'lucide-react';
import { apiV1 } from '@/lib/client';
import { useExportPDF } from '@/hooks';
import type { CoverLetterWithResume } from '@/lib/types/cover-letter';

type CoverLetterMetadata = {
  model?: string;
  tokens?: number;
  generationTime?: number;
  personalInstructions?: string;
  contentJson?: string;
};

export default function CoverLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coverLetterId = params?.id as string;
  const editorRef = useRef<CoverLetterEditorRef>(null);

  const [coverLetter, setCoverLetter] = useState<CoverLetterWithResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isExportingPDF, handleExportCoverLetter } = useExportPDF();

  const fetchCoverLetter = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await apiV1.COVER_LETTER.GET(coverLetterId).get<CoverLetterWithResume>();

      if (result.error || !result.data) {
        if (result.status === 404) {
          throw new Error('Cover letter not found');
        }
        throw new Error(result.error || 'Failed to fetch cover letter');
      }

      setCoverLetter(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cover letter');
      toast.error(err instanceof Error ? err.message : 'Failed to load cover letter');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (coverLetterId) {
      fetchCoverLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLetterId]);

  const handleSaveCoverLetter = async (content: string, contentJson: string) => {
    try {
      setIsSaving(true);
      const result = await apiV1.COVER_LETTER.GET(coverLetterId).put<CoverLetterWithResume>({
        content,
        contentJson,
      });

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to save cover letter');
      }

      setCoverLetter(result.data);
      setIsEditing(false);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save cover letter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const result = await apiV1.COVER_LETTER.GET(coverLetterId).delete<{ success: boolean }>();

      if (result.error) {
        throw new Error(result.error || 'Failed to delete cover letter');
      }

      toast.success('Cover letter deleted successfully');
      router.push('/cover-letters');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete cover letter');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleExport = async () => {
    if (!coverLetter) return;
    const jobTitle = coverLetter.jobPosting?.title ?? null;
    const companyName = coverLetter.jobPosting?.company?.name ?? null;
    await handleExportCoverLetter(coverLetterId, jobTitle || companyName || 'cover-letter');
  };

  const getMetadata = (): CoverLetterMetadata => {
    if (!coverLetter) return {};
    if (coverLetter.metadata && typeof coverLetter.metadata === 'object' && !Array.isArray(coverLetter.metadata)) {
      return coverLetter.metadata as unknown as CoverLetterMetadata;
    }
    return {};
  };

  const getPageTitle = (): string => {
    if (!coverLetter) return 'Cover Letter';

    const jobTitle = coverLetter.jobPosting?.title ?? null;
    const companyName = coverLetter.jobPosting?.company?.name ?? null;

    if (jobTitle && companyName) {
      return `${jobTitle} at ${companyName}`;
    }
    if (jobTitle) {
      return jobTitle;
    }
    if (companyName) {
      return `Cover Letter for ${companyName}`;
    }
    return 'Cover Letter';
  };

  if (isLoading) {
    return (
      <Page
        title="Loading..."
        description="Fetching cover letter details"
        breadcrumbs={[
          { label: 'Cover Letters', href: '/cover-letters' },
          { label: '...' },
        ]}
      >
        <LoadingState message="Loading cover letter..." />
      </Page>
    );
  }

  if (error || !coverLetter) {
    return (
      <Page
        title="Error"
        description="Failed to load cover letter"
        breadcrumbs={[
          { label: 'Cover Letters', href: '/cover-letters' },
          { label: 'Error' },
        ]}
      >
        <ErrorState
          title="Cover Letter Not Found"
          message={error || 'Cover letter not found'}
          variant="full"
          onRetry={() => router.push('/cover-letters')}
          retryText="Back to Cover Letters"
        />
      </Page>
    );
  }

  return (
    <Page
      title={getPageTitle()}
      description="View and edit your cover letter"
      scrollable={false}
      breadcrumbs={[
        { label: 'Cover Letters', href: '/cover-letters' },
        { label: getPageTitle() },
      ]}
      actions={
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  editorRef.current?.setIsEditing(true);
                }}
                className="h-8 rounded-none border-px"
              >
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.copyToClipboard()}
                className="h-8 rounded-none border-px"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.enhance()}
                className="h-8 rounded-none border-px"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                AI Enhance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExportingPDF}
                className="h-8 rounded-none border-px"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                {isExportingPDF ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 rounded-none border-px text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  editorRef.current?.setIsEditing(false);
                }}
                disabled={isSaving}
                className="h-8 rounded-none border-px"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => editorRef.current?.save()}
                disabled={isSaving}
                className="h-8 rounded-none border-px"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full gap-px bg-border border-b">
            {/* Editor Pane */}
            <div className="bg-background flex flex-col">
              <div className="p-4 border-b bg-muted/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Cover Letter Content
                </span>
              </div>
              <CoverLetterEditor
                ref={editorRef}
                content={coverLetter.content}
                contentJson={getMetadata().contentJson}
                editable={true}
                onSave={handleSaveCoverLetter}
                className="flex-1"
              />
            </div>

            {/* Sidebar Pane */}
            <div className="bg-background flex flex-col gap-px overflow-y-auto">
              {/* Linked Resume */}
              <div className="p-6 border-b">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
                  Context & Links
                </span>
                {coverLetter.resumeId ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 border border-dashed rounded-none">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked Resume</p>
                        <Link
                          href={`/resumes/${coverLetter.resumeId}`}
                          className="text-sm font-medium hover:text-primary transition-colors block truncate"
                        >
                          View Source Resume →
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No linked resume found.</p>
                )}
              </div>

              {/* Job Description */}
              <div className="p-6 border-b flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
                  Target Job Description
                </span>
                <div className="p-4 bg-muted/20 border text-sm text-muted-foreground leading-relaxed max-h-[300px] overflow-y-auto font-mono text-[11px]">
                  {coverLetter.jobPosting?.description ?? coverLetter.resume?.jobPosting?.description ?? 'No job description available.'}
                </div>
              </div>

              {/* AI Metadata */}
              <div className="p-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
                  AI Generation Details
                </span>
                <div className="space-y-4">
                  {getMetadata().personalInstructions && (
                    <div className="p-4 bg-primary/5 border-l-2 border-primary">
                      <p className="text-xs italic text-muted-foreground leading-relaxed">
                        &quot;{getMetadata().personalInstructions}&quot;
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">Model</span>
                      <span className="font-mono">{getMetadata().model || 'gpt-4o'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">Tokens</span>
                      <span className="font-mono">{getMetadata().tokens || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">Created</span>
                      <span className="font-mono">{new Date(coverLetter.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Cover Letter"
        message={`Are you sure you want to delete this cover letter? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Page>
  );
}
