"use client";

import { EditorProvider } from "@/lib/contexts";
import { ExternalServiceError, ValidationError } from "@/lib/errors";
import { ResumeEditor, type ResumeEditorRef } from "@/modules/editor/components/ResumeEditor";
import { Button } from "@/components/ui";
import { Page } from "@/components/layout/Page";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToastAction } from "@/hooks/useToastAction";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { createComponentLogger } from "@/lib/utils/client-logger";
import { Save, Share2, Edit2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const logger = createComponentLogger('ProfileEditor');

/** Local profile type for editor state */
interface ProfileEditorData {
  id: string;
  name: string;
  resume: Resume | null;
  isPublic: boolean;
  publicSlug: string | null;
}

interface ProfileEditorProps {
  profileId: string;
}

export function ProfileEditor({ profileId }: Readonly<ProfileEditorProps>) {
  const router = useRouter();
  const { runWithToast } = useToastAction();
  const [profile, setProfile] = useState<ProfileEditorData | null>(null);
  const editorRef = useRef<ResumeEditorRef>(null);

  // State for title rename
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const result = await getProfile(profileId);
      if (!result.success || !result.data) throw !result.success ? new ExternalServiceError('Profile API', result.error) : new ValidationError('Failed to load profile');
      setProfile({
        id: result.data.id,
        name: result.data.name,
        resume: result.data.resume as Resume | null,
        isPublic: result.data.isPublic,
        publicSlug: result.data.publicSlug,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load profile");
      router.push("/profile");
    }
  }, [profileId, router]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLoad = async (): Promise<Resume | null> => {
    try {
      const result = await getProfile(profileId);
      if (!result.success || !result.data) throw !result.success ? new ExternalServiceError('Profile API', result.error) : new ValidationError("Failed to load profile");
      return result.data.resume as unknown as Resume | null;
    } catch (error) {
      logger.error('Error loading profile', error);
      return null;
    }
  };

  const handleSave = async (resume: Resume): Promise<boolean> => {
    try {
      const result = await updateProfile(profileId, { resume });
      if (!result.success) throw new ExternalServiceError('Profile API', result.error);
      setProfile((prev) => (prev ? { ...prev, resume } : prev));
      return true;
    } catch (error) {
      logger.error('Error saving profile', error);
      return false;
    }
  };

  const handleProfileNameChange = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    const result = await runWithToast(
      () => updateProfile(profileId, { name: newName }),
      {
        successMessage: 'Profile renamed',
        errorMessage: 'Failed to update profile name',
      }
    );

    if (result) {
      setProfile((prev) => prev ? { ...prev, name: newName } : null);
      setIsRenameModalOpen(false);
    }
  };

  const onDisplayNameChange = async (name: string) => {
    setProfile((prev) => prev ? { ...prev, name } : null);
  };

  if (!profile) return null;

  return (
    <Page
      title={
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold uppercase tracking-tight">{profile.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setNewName(profile.name);
              setIsRenameModalOpen(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      }
      description="Edit your professional profile content"
      breadcrumbs={[
        { label: 'Profiles', href: '/profile' },
        { label: profile.name }
      ]}
      maxWidth="full"
      className="p-0"
      scrollable={false}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 font-bold uppercase tracking-widest text-xs"
            onClick={() => editorRef.current?.setShowAIEnhance(true)}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            AI Enhance
          </Button>
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
      <div className="flex-1 flex flex-col min-h-0 -mx-4 sm:-mx-8">
        <EditorProvider onLoad={handleLoad} onSave={handleSave}>
          <ResumeEditor 
            ref={editorRef}
            id={profileId}
            displayName={profile.name}
            isPublic={profile.isPublic}
            publicSlug={profile.publicSlug ?? undefined}
            onDisplayNameChange={onDisplayNameChange}
          />
        </EditorProvider>
      </div>

      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Profile</DialogTitle>
            <DialogDescription>Give your profile a clear identification.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest mb-2 block">Profile Name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button onClick={handleProfileNameChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
