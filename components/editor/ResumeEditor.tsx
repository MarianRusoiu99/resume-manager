import { useState, useImperativeHandle, forwardRef } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useEditor } from "@/lib/contexts";
import { toast } from "sonner";
import { ResumePreview } from "../resume/ResumePreview";
import { EditorSidebar } from "./EditorSidebar";
import { EditorContent } from "./EditorContent";
import { AIEnhanceResumeModal } from "@/components/ai-enhance/modals/AIEnhanceResumeModal";
import { ShareDialog } from "./modals/ShareDialog";
import { useShareState } from "@/hooks/editor/useShareState";
import type { Resume } from "@/lib/validations/jsonresume";

export interface ResumeEditorRef {
  save: () => Promise<void>;
  setShowShareDialog: (show: boolean) => void;
  updateResume: (resume: Resume) => void;
  setShowAIEnhance: (show: boolean) => void;
  resume: Resume;
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
  onDisplayNameChange: _onDisplayNameChange,
  onTogglePublic,
}, ref) => {
  const { resume, save, isDirty, isSaving, lastSavedAt, updateResume } = useEditor();
  const [activeTab, setActiveTab] = useState("basics");
  const [showAIEnhance, setShowAIEnhance] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const {
    showShareDialog,
    setShowShareDialog,
    handleTogglePublic,
    handleCopyPublicLink,
    publicLink,
  } = useShareState({
    publicSlug: initialPublicSlug || undefined,
    onTogglePublic,
  });

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
  const _publicSlug = initialPublicSlug || "";

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
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        displayName={displayName}
        isPublic={isPublic}
        publicLink={publicLink}
        onTogglePublic={handleTogglePublic}
        onCopyLink={handleCopyPublicLink}
        canTogglePublic={!!onTogglePublic}
      />

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
