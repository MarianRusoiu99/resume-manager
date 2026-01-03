'use client';

/**
 * Cover Letter Detail Page
 * View and edit a specific cover letter
 */

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CoverLetterEditor, type CoverLetterEditorRef } from '@/components/cover-letter';
import { Trash2, Download, Copy, Sparkles, Edit, Save } from 'lucide-react';
import { useExportPDF, useCoverLetterOperations } from '@/hooks';
import { useCoverLetterDetail } from '@/hooks/features/useCoverLetterDetail';
import { CoverLetterSidebar } from '@/components/cover-letter/detail/CoverLetterSidebar';

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

  const {
    coverLetter,
    isLoading,
    error,
    isSaving,
    saveCoverLetter
  } = useCoverLetterDetail(coverLetterId);

  const { handleDelete: deleteAction } = useCoverLetterOperations();
  const { isExportingPDF, handleExportCoverLetter } = useExportPDF();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveCoverLetter = async (content: string, contentJson: string) => {
    const success = await saveCoverLetter(content, contentJson);
    if (success) {
      setIsEditing(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const success = await deleteAction(coverLetterId);
    if (success) {
      router.push('/cover-letters');
    } else {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
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
                onClick={() => setDeleteDialogOpen(true)}
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
            <CoverLetterSidebar
              resumeId={coverLetter.resumeId}
              jobDescription={coverLetter.jobPosting?.description ?? coverLetter.resume?.jobPosting?.description}
              metadata={getMetadata()}
              createdAt={coverLetter.createdAt}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Delete Cover Letter"
        message={`Are you sure you want to delete this cover letter? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Page>
  );
}
