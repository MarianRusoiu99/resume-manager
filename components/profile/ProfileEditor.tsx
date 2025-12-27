"use client";

import { EditorProvider } from "@/lib/contexts";
import { ResumeEditor } from "@/components/editor/ResumeEditor";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { apiV1, type ProfileDto } from "@/lib/client";
import { createComponentLogger } from "@/lib/utils/client-logger";

const logger = createComponentLogger('ProfileEditor');


interface ProfileEditorProps {
  profileId: string;
}

export function ProfileEditor({ profileId }: Readonly<ProfileEditorProps>) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDto | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const result = await apiV1.PROFILE.GET(profileId).get<ProfileDto>();

      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Failed to load profile');
      }

      setProfile(result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      toast.error(message);
      router.push("/profile");
    }
  }, [profileId, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLoad = async (): Promise<Resume | null> => {
    try {
      const result = await apiV1.PROFILE.GET(profileId).get<ProfileDto>({ skipSessionCheck: true });

      if (result.status === 404) {
        return null;
      }

      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load profile");
      }

      return result.data.resume ?? null;
    } catch (error) {
      logger.error('Error loading profile', error);
      return null;
    }
  };

  const handleSave = async (resume: Resume): Promise<boolean> => {
    try {
      const result = await apiV1.PROFILE.GET(profileId).patch<ProfileDto>({ resume });

      if (result.error) {
        logger.error('Profile save error', new Error(result.error));
        throw new Error(result.error);
      }

      setProfile((prev) => (prev ? { ...prev, resume } : prev));
      return true;
    } catch (error) {
      logger.error('Error saving profile', error);
      return false;
    }
  };

  const handleProfileNameChange = async (name: string) => {
    try {
      const result = await apiV1.PROFILE.GET(profileId).patch<ProfileDto>({ name });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Profile name updated");
      setProfile((prev) => prev ? { ...prev, name } : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile name";
      toast.error(message);
      throw error;
    }
  };

  const handleTogglePublic = async () => {
    try {
      const nextIsPublic = !profile?.isPublic;
      const result = await apiV1.PROFILE.PUBLIC(profileId).post<{ isPublic: boolean; publicSlug: string | null }>({
        isPublic: nextIsPublic,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const isPublic = Boolean(result.data?.isPublic ?? nextIsPublic);
      const publicSlug = result.data?.publicSlug ?? profile?.publicSlug ?? null;

      toast.success(isPublic ? "Profile is now public" : "Profile is now private");
      setProfile((prev) => (prev ? { ...prev, isPublic, publicSlug } : null));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update public status";
      toast.error(message);
      throw error;
    }
  };



  if (!profile) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Back Button */}
      <div className="border-b bg-background px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/profile")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profiles
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <EditorProvider onLoad={handleLoad} onSave={handleSave}>
          <ResumeEditor 
            id={profileId}
            displayName={profile.name}
            isPublic={profile.isPublic}
             publicSlug={profile.publicSlug ?? undefined}
            onDisplayNameChange={handleProfileNameChange}
            onTogglePublic={handleTogglePublic}
          />
        </EditorProvider>
      </div>
    </div>
  );
}
