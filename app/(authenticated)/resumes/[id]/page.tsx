'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Edit2, Info } from 'lucide-react';
import { getResume, updateResumeContent } from '@/app/actions/resume';
import type { Resume } from '@/lib/validations/jsonresume';
import { ResumeEditor, type ResumeEditorRef } from "@/components/editor/ResumeEditor";
import { EditorProvider } from "@/lib/contexts";
import { useResumeDetail } from '@/hooks/features/useResumeDetail';
import { ResumeDetailActions } from '@/components/resume/ResumeDetailActions';
import { ResumeMetadataModals } from '@/components/resume/ResumeMetadataModals';

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
      if (!result.success) throw new Error(result.error);
      toast.success('Resume saved');
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

  if (isLoading) {
    return <LoadingState message="Loading resume..." />;
  }

  if (error || !resume) {
    return (
      <ErrorState
        title="Error Loading Resume"
        message={error || 'Resume not found'}
        onRetry={() => router.push('/resumes')}
        retryText="Back to Resumes"
      />
    );
  }

  return (
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
              className="h-8 w-8 text-muted-foreground hover:text-primary"
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
          <ResumeDetailActions
            editorRef={editorRef}
            onDelete={handleDeleteClick}
            onDuplicate={handleDuplicate}
            isDeleting={isDeleting}
            isDuplicating={isDuplicating}
          />
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
        />

        {/* Confirmation Dialog */}
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
  );
}
