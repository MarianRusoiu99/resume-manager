import { useState, useImperativeHandle, forwardRef } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button, Input } from "@/components/ui";
import { Copy, Sparkles } from "lucide-react";
import { useEditor } from "@/lib/contexts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ResumePreview } from "../resume/ResumePreview";
import { EditorSidebar } from "./EditorSidebar";
import { EditorContent } from "./EditorContent";
import { AIEnhanceResumeModal } from "@/components/ai-enhance/modals/AIEnhanceResumeModal";

export interface ResumeEditorRef {
  save: () => Promise<void>;
  setShowShareDialog: (show: boolean) => void;
  updateResume: (resume: any) => void;
  setShowAIEnhance: (show: boolean) => void;
  resume: any;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

interface ResumeEditorProps {
  readonly id?: string;
  readonly displayName?: string;
  readonly isPublic?: boolean;
  readonly publicSlug?: string;
  readonly onDisplayNameChange?: (name: string) => Promise<void>;
  readonly onTogglePublic?: () => Promise<void>;
}

export const ResumeEditor = forwardRef<ResumeEditorRef, ResumeEditorProps>(({
  id,
  displayName: initialDisplayName,
  isPublic: initialIsPublic,
  publicSlug: initialPublicSlug,
  onDisplayNameChange,
  onTogglePublic,
}, ref) => {
  const { resume, save, isDirty, isSaving, lastSavedAt, updateResume } = useEditor();
  const [activeTab, setActiveTab] = useState("basics");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAIEnhance, setShowAIEnhance] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Expose methods and state to parent via ref
  useImperativeHandle(ref, () => ({
    save: async () => { await save(); },
    setShowShareDialog,
    updateResume,
    setShowAIEnhance,
    resume,
    isDirty,
    isSaving,
    lastSavedAt,
  }));

  // Derive display values from props (parent is source of truth)
  const displayName = initialDisplayName || "";
  const isPublic = initialIsPublic || false;
  const publicSlug = initialPublicSlug || "";

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
    <div className="flex-1 min-h-0 flex flex-col md:flex-row bg-transparent gap-4 p-4">
      {/* Editor Area */}
      <div className="flex flex-col min-h-0 w-full md:w-1/2 bg-card rounded-xl overflow-hidden shadow-sm border-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <EditorSidebar />
          <div className="flex-1 overflow-y-auto">
            <EditorContent />
          </div>
        </Tabs>
      </div>

      {/* Live Preview */}
      <div className="bg-card rounded-xl overflow-hidden shadow-sm w-full md:w-1/2 flex flex-col min-h-0 border-none">
        <ResumePreview
          resumeData={resume}
          profileId={id}
          showTemplateSelector
          showCard={false}
          className="h-full"
          onTemplateChange={setSelectedTemplateId}
        />
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

      {/* AI Enhance Modal */}
      <AIEnhanceResumeModal
        open={showAIEnhance}
        onOpenChange={setShowAIEnhance}
        resume={resume}
        onAccept={(enhancedResume) => {
          updateResume(enhancedResume);
          setShowAIEnhance(false);
          toast.success("Resume enhanced successfully!");
        }}
        templateId={selectedTemplateId}
      />
    </div>
  );
});

ResumeEditor.displayName = "ResumeEditor";
