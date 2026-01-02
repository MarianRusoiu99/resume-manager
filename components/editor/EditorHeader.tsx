import { Button } from "@/components/ui/button";
import { Save, Share2, Sparkles, Edit2, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { AIEnhanceResumeModal } from "@/components/ai-enhance";
import type { Resume } from "@/lib/validations/jsonresume";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditorHeaderProps {
    displayName: string;
    isDirty: boolean;
    isSaving: boolean;
    lastSavedAt: Date | null;
    resume?: Resume;
    profileId?: string;
    templateId?: string | null;
    onSave: () => Promise<void>;
    onDisplayNameChange?: (name: string) => Promise<void>;
    onTogglePublic?: () => Promise<void>;
    onShareClick?: () => void;
    onResumeChange?: (resume: Resume) => void;
    isPublic?: boolean;
}

export function EditorHeader({
    displayName,
    isDirty,
    isSaving,
    lastSavedAt,
    resume,
    profileId,
    templateId,
    onSave,
    onDisplayNameChange,
    onTogglePublic,
    onShareClick,
    onResumeChange,
    isPublic,
}: Readonly<EditorHeaderProps>) {
    const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [newName, setNewName] = useState(displayName);
    const [showSavedFeedback, setShowSavedFeedback] = useState(false);

    // Provide visual feedback after successful save
    useEffect(() => {
        if (!isSaving && lastSavedAt) {
            setShowSavedFeedback(true);
            const timer = setTimeout(() => setShowSavedFeedback(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSaving, lastSavedAt]);

    const handleEnhancedResume = (enhancedResume: Resume) => {
        if (onResumeChange) {
            onResumeChange(enhancedResume);
        }
    };

    const handleRename = async () => {
        if (!newName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }
        if (onDisplayNameChange) {
            await onDisplayNameChange(newName);
            setIsRenameModalOpen(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between bg-muted/20 px-4 sm:px-8 py-2 shrink-0 border-b">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {displayName || "Untitled"}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                                setNewName(displayName);
                                setIsRenameModalOpen(true);
                            }}
                        >
                            <Edit2 className="h-3 w-3" />
                        </Button>
                    </div>

                    {isDirty && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Unsaved Changes
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {lastSavedAt && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-70 mr-4">
                            Last saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}

                    {resume && onResumeChange && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 hover:bg-primary/10 hover:text-primary transition-all font-bold uppercase tracking-widest text-xs"
                            onClick={() => setEnhanceModalOpen(true)}
                        >
                            <Sparkles className="h-3 w-3 mr-2 text-primary" />
                            AI Enhance
                        </Button>
                    )}

                    {onTogglePublic && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 font-bold uppercase tracking-widest text-xs"
                            onClick={onShareClick}
                        >
                            <Share2 className="h-3 w-3 mr-2" />
                            {isPublic ? "Public" : "Share"}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        className={cn(
                            "h-8 font-bold uppercase tracking-widest text-xs ml-2 min-w-[100px] transition-all duration-300",
                            showSavedFeedback && !isDirty && "bg-green-600 hover:bg-green-600 text-white border-green-600 shadow-green-200"
                        )}
                        onClick={onSave}
                        disabled={isSaving || (!isDirty && !showSavedFeedback)}
                    >
                        {isSaving ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : showSavedFeedback && !isDirty ? (
                            <Check className="h-3 w-3 mr-2" />
                        ) : (
                            <Save className="h-3 w-3 mr-2" />
                        )}
                        {isSaving ? "Saving..." : showSavedFeedback && !isDirty ? "Saved" : "Save"}
                    </Button>
                </div>
            </div>

            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Resume</DialogTitle>
                        <DialogDescription>
                            Give your resume a name that helps you identify it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Resume Name</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Senior Frontend Engineer - Google"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {resume && onResumeChange && (
                <AIEnhanceResumeModal
                    open={enhanceModalOpen}
                    onOpenChange={setEnhanceModalOpen}
                    resume={resume}
                    onAccept={handleEnhancedResume}
                    profileId={profileId}
                    templateId={templateId}
                />
            )}
        </>
    );
}

