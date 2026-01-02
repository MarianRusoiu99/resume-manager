"use client";

import { useState, useEffect, useRef } from "react";
import { ResumeEditor, type ResumeEditorRef } from "@/components/editor/ResumeEditor";
import { EditorProvider } from "@/lib/contexts";
import type { Resume } from "@/lib/validations/jsonresume";
import { Button } from "@/components/ui/button";
import { Save, Share2, Sparkles, Edit2 } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { apiV1, type ResumeDetailsDto } from "@/lib/client";
import { useComponentLogger } from "@/hooks";
import { Page } from "@/components/layout/Page";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResumeEditPage() {
  const log = useComponentLogger("ResumeEditPage");
  const params = useParams();
  const resumeId = params.id as string;
  const [jobTitle, setJobTitle] = useState("");
  const editorRef = useRef<ResumeEditorRef>(null);
  
  // State for title rename
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Load job title from resume details
  useEffect(() => {
    const loadJobTitle = async () => {
      try {
        const result = await apiV1.RESUME.GET(resumeId).get<ResumeDetailsDto>();
        if (!result.error && result.data) {
          setJobTitle(result.data.jobTitle);
        }
      } catch (error) {
        log.error("Error loading job title", error);
      }
    };
    loadJobTitle();
  }, [resumeId, log]);

  const handleLoad = async (): Promise<Resume | null> => {
    try {
      const result = await apiV1.RESUME.GET(resumeId).get<ResumeDetailsDto>();
      if (result.error || !result.data) throw new Error(result.error || "Failed to load");
      return result.data.content as Resume;
    } catch (error) {
      log.error("Error loading resume", error);
      return null;
    }
  };

  const handleSave = async (resume: Resume): Promise<boolean> => {
    try {
      const result = await apiV1.RESUME.CONTENT(resumeId).patch<unknown>({ content: resume });
      if (result.error) throw new Error(result.error);
      return true;
    } catch (error) {
      log.error("Error saving resume", error);
      return false;
    }
  };

  const handleSaveJobTitle = async () => {
    if (!newTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      const result = await apiV1.RESUME.GET(resumeId).patch<unknown>({ jobTitle: newTitle });
      if (result.error) throw new Error(result.error);
      setJobTitle(newTitle);
      setIsRenameModalOpen(false);
      toast.success("Resume renamed");
    } catch (error) {
      log.error("Error saving title", error);
      toast.error("Failed to rename");
    }
  };

  return (
    <EditorProvider onLoad={handleLoad} onSave={handleSave}>
      <Page
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold uppercase tracking-tight">{jobTitle || "Resume Editor"}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setNewTitle(jobTitle);
                setIsRenameModalOpen(true);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        }
        description="Tailor your resume for the specific job description"
        maxWidth="full"
        breadcrumbs={[
          { label: "Resumes", href: "/resumes" },
          { label: "Edit" }
        ]}
        scrollable={false}
        actions={
          <div className="flex items-center gap-2">
             <Button
                variant="ghost"
                size="sm"
                className="h-8 font-bold uppercase tracking-widest text-xs"
                onClick={() => editorRef.current?.setShowShareDialog(true)}
              >
                <Share2 className="h-3 w-3 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                className="h-8 font-bold uppercase tracking-widest text-xs"
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
            displayName={jobTitle}
            onDisplayNameChange={async (name) => { setJobTitle(name); }}
          />
        </div>

        <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Resume</DialogTitle>
              <DialogDescription>Identify this resume in your library.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest mb-2 block">Resume Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveJobTitle}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Page>
    </EditorProvider>
  );
}
