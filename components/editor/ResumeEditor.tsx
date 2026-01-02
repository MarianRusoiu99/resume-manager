"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button, Input } from "@/components/ui";
import { Copy } from "lucide-react";
import { useEditor } from "@/lib/contexts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ResumePreview } from "../resume/ResumePreview";
import { EditorHeader } from "./EditorHeader";
import { EditorSidebar } from "./EditorSidebar";
import { EditorContent } from "./EditorContent";

interface ResumeEditorProps {
  /** ID for the resume/profile being edited */
  readonly id?: string;
  /** Display name (profile name or job title) */
  readonly displayName?: string;
  /** Whether this is a public profile/resume */
  readonly isPublic?: boolean;
  /** Public slug for sharing */
  readonly publicSlug?: string;
  /** Callback when display name changes */
  readonly onDisplayNameChange?: (name: string) => Promise<void>;
  /** Callback when public status toggles */
  readonly onTogglePublic?: () => Promise<void>;
}

export function ResumeEditor({
  id,
  displayName: initialDisplayName,
  isPublic: initialIsPublic,
  publicSlug: initialPublicSlug,
  onDisplayNameChange,
  onTogglePublic,
}: ResumeEditorProps) {
  const { resume, save, isDirty, isSaving, lastSavedAt, updateResume } = useEditor();
  const [activeTab, setActiveTab] = useState("basics");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Derive display values from props (parent is source of truth)
  const displayName = initialDisplayName || "";
  const isPublic = initialIsPublic || false;
  const publicSlug = initialPublicSlug || "";

  const handleSave = async () => {
    await save();
  };

  const handleTogglePublic = async () => {
    if (onTogglePublic) {
      await onTogglePublic();
    }
  };

  const handleCopyPublicLink = () => {
    const link = `${globalThis.location.origin}/public/${publicSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full">
      <EditorHeader
        displayName={displayName || resume.basics?.name || "Untitled"}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        resume={resume}
        profileId={id}
        templateId={selectedTemplateId}
        onSave={handleSave}
        onDisplayNameChange={onDisplayNameChange}
        onTogglePublic={onTogglePublic}
        onShareClick={() => setShowShareDialog(true)}
        onResumeChange={updateResume}
        isPublic={isPublic}
      />

      {/* Main Content - Split Layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Editor Area */}
        <div className="overflow-y-auto w-full md:w-1/2 h-1/2 md:h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <EditorSidebar />
            <EditorContent />
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="border-t md:border-t-0 md:border-l bg-muted/20 overflow-hidden w-full md:w-1/2 h-1/2 md:h-full">
          <ResumePreview
            resumeData={resume}
            profileId={id}
            showTemplateSelector
            showCard={false}
            className="h-full"
            onTemplateChange={setSelectedTemplateId}
          />
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your {displayName || "Resume"}</DialogTitle>
            <DialogDescription>
              Make your resume public and share it with a custom link
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Public Access</p>
                <p className="text-sm text-muted-foreground">
                  {isPublic ? "Your resume is publicly accessible" : "Your resume is private"}
                </p>
              </div>
              <Button
                variant={isPublic ? "destructive" : "default"}
                onClick={handleTogglePublic}
                disabled={!onTogglePublic}
              >
                {isPublic ? "Make Private" : "Make Public"}
              </Button>
            </div>

            {isPublic && publicSlug && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Public Link:</p>
                <div className="flex gap-2">
                  <Input
                    value={`${globalThis.location.origin}/public/${publicSlug}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPublicLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view your resume
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

