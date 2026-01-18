'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/core/feedback/states';
import { ConfirmDialog } from "@/components/core/feedback/ConfirmDialog";
import { Edit2, Info, Trash2, Download, Copy, Save, Share2 } from 'lucide-react';
import { getResume, updateResumeContent } from '@/app/actions/resume';
import { ExternalServiceError } from "@/lib/errors";
import type { Resume } from '@/lib/validations/jsonresume';
import { ResumeEditor, type ResumeEditorRef } from "@/modules/editor/components/ResumeEditor";
import { EditorProvider } from "@/lib/contexts";
import { useResumeDetail } from '@/modules/resume/hooks/useResumeDetail';
import { ResumeMetadataModals } from '@/modules/resume/components/ResumeMetadataModals';
import { FeatureErrorBoundary } from '@/components/error-boundaries';

type ResumeMetadata = {
  modelId?: string;
  usage?: {
    totalTokens?: number;
  };
  matchScore?: number;
  suggestions?: string[];
  personalInstructions?: string;
};

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;
  const editorRef = useRef<ResumeEditorRef>(null);

  const {
    resume,
    isLoading,
    error,
    isDeleting,
    isDuplicating,
    handleDelete,
    handleDuplicate,
    updateMetadata,
    setResume,
  } = useResumeDetail(resumeId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleLoad = async (): Promise<Resume | null> => {
    if (resume?.content) return resume.content;
    const result = await getResume(resumeId);
    if (result.success && result.data) {
      return result.data.content as Resume;
    }
    return null;
  };

  const handleSave = async (content: Resume): Promise<boolean> => {
    try {
      const result = await updateResumeContent(resumeId, content);
      if (!result.success) throw new ExternalServiceError('Resume API', result.error);
      toast.success('Resume saved');
      setIsEditing(false);
      return true;
    } catch (error) {
      toast.error('Failed to save resume');
      return false;
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await handleDelete();
    } catch {
      setDeleteDialogOpen(false);
    }
  };

  const handleSaveTitle = async (newTitle: string) => {
    return await updateMetadata({ jobTitle: newTitle });
  };

  const getMetadata = (): ResumeMetadata => {
    if (!resume || !resume.metadata) return {};
    return resume.metadata as unknown as ResumeMetadata;
  };

  if (isLoading) {
    return (
      <Page
        title="Loading..."
        description="Fetching resume details"
        breadcrumbs={[
          { label: 'Resumes', href: '/resumes' },
          { label: '...' },
        ]}
      >
        <LoadingState message="Loading resume..." />
      </Page>
    );
  }

  if (error || !resume) {
    return (
      <Page
        title="Error"
        description="Failed to load resume"
        breadcrumbs={[
          { label: 'Resumes', href: '/resumes' },
          { label: 'Error' },
        ]}
      >
        <ErrorState
          title="Resume Not Found"
          message={error || 'Resume not found'}
          variant="full"
          onRetry={() => router.push('/resumes')}
          retryText="Back to Resumes"
        />
      </Page>
    );
  }

  return (
    <FeatureErrorBoundary featureName="Resume Editor">
      <EditorProvider onLoad={handleLoad} onSave={handleSave}>
        <Page
          title={
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold uppercase tracking-tight truncate max-w-[300px]">
                {resume.jobTitle || 'Untitled Resume'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsRenameModalOpen(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setIsInfoModalOpen(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          }
          description={resume.companyName || "Tailor your resume for the specific job description"}
          maxWidth="full"
          breadcrumbs={[
            { label: 'Resumes', href: '/resumes' },
            { label: resume.jobTitle || 'Resume' },
          ]}
          scrollable={false}
          actions={
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-background border-primary/10 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-background border-primary/10 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                  >
                    <Copy className="h-3.5 w-3.5 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-background border-primary/10 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                    onClick={() => editorRef.current?.setShowShareDialog(true)}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl font-bold uppercase tracking-widest text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-background border-primary/10 hover:bg-primary/5 transition-all shadow-sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all"
                    onClick={() => editorRef.current?.save()}
                  >
                    <Save className="h-3.5 w-3.5 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          }
        >
          <div className="flex-1 flex flex-col h-full -mx-4 sm:-mx-8">
            <ResumeEditor
              ref={editorRef}
              id={resumeId}
              displayName={resume.jobTitle}
              onDisplayNameChange={async (name) => {
                await updateMetadata({ jobTitle: name });
              }}
            />
          </div>

          <ResumeMetadataModals
            isRenameModalOpen={isRenameModalOpen}
            setIsRenameModalOpen={setIsRenameModalOpen}
            isInfoModalOpen={isInfoModalOpen}
            setIsInfoModalOpen={setIsInfoModalOpen}
            title={resume.jobTitle || ''}
            onSaveTitle={handleSaveTitle}
            companyName={resume.companyName}
            jobDescription={resume.jobDescription}
            metadata={getMetadata()}
            createdAt={resume.createdAt}
          />

          <ConfirmDialog
            isOpen={deleteDialogOpen}
            title="Delete Resume"
            message="Are you sure you want to delete this resume? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteDialogOpen(false)}
          />
        </Page>
      </EditorProvider>
    </FeatureErrorBoundary>
  );
}
