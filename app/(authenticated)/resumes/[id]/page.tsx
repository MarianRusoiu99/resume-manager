'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Page } from '@/components/layout/Page';
import { Button } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Copy, Trash2, Save, Share2, Edit2, FileText, Info } from 'lucide-react';
import { getResume, deleteResume, duplicateResume, updateResumeContent, updateResumeMetadata } from '@/app/actions/resume';
import { createComponentLogger } from '@/lib/utils/client-logger';
import type { Resume } from '@/lib/validations/jsonresume';
import { ResumeEditor, type ResumeEditorRef } from "@/components/editor/ResumeEditor";
import { EditorProvider } from "@/lib/contexts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const logger = createComponentLogger('ResumeDetailPage');

interface ResumeData {
  id: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  content: Resume;
  coverLetter?: string;
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;
  const editorRef = useRef<ResumeEditorRef>(null);

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  // State for title rename
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // State for job description modal
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getResume(resumeId);

      if (!result.success || !result.data) {
        const errorResult = result as { error?: string };
        throw new Error(errorResult.error || 'Failed to fetch resume');
      }

      setResume(result.data as ResumeData);
      setNewTitle(result.data.jobTitle || "");
    } catch (err) {
      logger.error('Failed to fetch resume', err);
      setError(err instanceof Error ? err.message : 'Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

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

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const result = await deleteResume(resumeId);

      if (!result.success) {
        const errorResult = result as { error?: string };
        throw new Error(errorResult.error || 'Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
      router.push('/resumes');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resume');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);

      const result = await duplicateResume(resumeId);

      if (!result.success || !result.data) {
        const errorResult = result as { error?: string };
        throw new Error(errorResult.error || 'Failed to duplicate resume');
      }

      toast.success('Resume duplicated successfully');
      const duplicatedResume = result.data as { id: string };
      router.push(`/resumes/${duplicatedResume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!newTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      const result = await updateResumeMetadata(resumeId, { jobTitle: newTitle });
      if (!result.success) throw new Error(result.error);
      
      setResume(prev => prev ? { ...prev, jobTitle: newTitle } : null);
      setIsRenameModalOpen(false);
      toast.success("Resume renamed");
    } catch (error) {
      toast.error("Failed to rename");
    }
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-bold uppercase tracking-widest text-xs hidden sm:flex"
              onClick={() => editorRef.current?.setShowShareDialog(true)}
            >
              <Share2 className="h-3 w-3 mr-2" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-bold uppercase tracking-widest text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-bold uppercase tracking-widest text-xs"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              <Copy className="h-3 w-3 mr-2" />
              Duplicate
            </Button>
            <div className="w-px h-4 bg-muted-foreground/20 mx-1" />
            <Button
              size="sm"
              className="h-8 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
              onClick={() => editorRef.current?.save()}
            >
              <Save className="h-3 w-3 mr-2" />
              Save
            </Button>
          </div>
        }
      >
        <div className="flex-1 flex flex-col h-full -mx-4 sm:-mx-8">
          <ResumeEditor
            ref={editorRef}
            id={resumeId}
            displayName={resume.jobTitle}
            onDisplayNameChange={async (name) => {
              setNewTitle(name);
              setResume(prev => prev ? { ...prev, jobTitle: name } : null);
            }}
          />
        </div>

        {/* Rename Modal */}
        <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Resume</DialogTitle>
              <DialogDescription>Identify this resume in your library.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest block">Resume Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveMetadata}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info/Job Description Modal */}
        <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem]">
            <DialogHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Job Details</DialogTitle>
                  <DialogDescription>Reference information for this optimized resume.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
              {resume.companyName && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Company</h4>
                  <p className="text-sm font-medium">{resume.companyName}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Job Description</h4>
                <div className="bg-muted/30 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap border border-primary/5">
                  {resume.jobDescription || "No job description provided."}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-6 bg-muted/20 border-t border-primary/5">
              <Button onClick={() => setIsInfoModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
