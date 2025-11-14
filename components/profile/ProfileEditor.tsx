"use client";

import { EditorProvider } from "@/lib/contexts/EditorContext";
import { ResumeEditor } from "@/components/editor/ResumeEditor";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";

interface Profile {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  isPublic?: boolean;
  publicSlug?: string;
  resume: Resume | null;
  createdAt: string;
  updatedAt: string;
}

interface ProfileEditorProps {
  profileId: string;
}

export function ProfileEditor({ profileId }: Readonly<ProfileEditorProps>) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      setProfile(data);
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
      const response = await fetch(`/api/profiles/${profileId}`);
      
      if (response.status === 200) {
        const data = await response.json();
        return data.resume;
      } else if (response.status === 404) {
        return null;
      }
      
      throw new Error("Failed to load profile");
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  };

  const handleSave = async (resume: Resume): Promise<boolean> => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Profile save error:", errorData);
        throw new Error(errorData.error || "Failed to save profile");
      }

      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  };

  const handleProfileNameChange = async (name: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile name");
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
      const response = await fetch(`/api/profiles/${profileId}/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !profile?.isPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update public status");
      }

      const data = await response.json();
      toast.success(data.isPublic ? "Profile is now public" : "Profile is now private");
      setProfile((prev) => prev ? { ...prev, isPublic: data.isPublic, publicSlug: data.publicSlug } : null);
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
            publicSlug={profile.publicSlug}
            onDisplayNameChange={handleProfileNameChange}
            onTogglePublic={handleTogglePublic}
            showPreview={true}
          />
        </EditorProvider>
      </div>
    </div>
  );
}
