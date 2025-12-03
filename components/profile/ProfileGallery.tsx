"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./ProfileCard";
import { ResumeImportButton } from "./ResumeImportButton";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { createProfile } from "@/app/actions/profile";

interface Profile {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  resume: Resume | null;
  createdAt: string;
  updatedAt: string;
}

interface ProfileGalleryProps {
  initialProfiles: Profile[];
}

export function ProfileGallery({ initialProfiles }: ProfileGalleryProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Refresh profiles when the page becomes visible
  useEffect(() => {
    const refreshProfiles = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfiles(data);
        }
      } catch (error) {
        console.error("Failed to refresh profiles:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfiles();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleCreateProfile = () => {
    startTransition(async () => {
      const result = await createProfile(
        `Profile ${profiles.length + 1}`,
        { basics: { name: "" } } as Resume,
        profiles.length === 0 // First profile is default
      );

      if (result.success) {
        toast.success("Profile created successfully");
        // Add the new profile to the local state
        setProfiles((prev) => [...prev, {
          id: result.data.id,
          userId: result.data.userId,
          name: result.data.name,
          isDefault: result.data.isDefault,
          resume: result.data.resume as Resume | null,
          createdAt: result.data.createdAt.toISOString(),
          updatedAt: result.data.updatedAt.toISOString(),
        }]);
        // Navigate to edit the new profile
        router.push(`/profile/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    });
  };

  const handleEdit = (id: string) => {
    router.push(`/profile/${id}`);
  };

  const handleDelete = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicate = () => {
    // Refresh the page to show the new profile
    router.refresh();
  };

  const handleSetDefault = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === id,
      }))
    );
  };

  const handleImportSuccess = (resume: Resume) => {
    startTransition(async () => {
      const result = await createProfile(
        `Imported Profile ${profiles.length + 1}`,
        resume,
        profiles.length === 0
      );

      if (result.success) {
        toast.success("Profile created from imported resume!");
        // Add the new profile to the local state
        setProfiles((prev) => [...prev, {
          id: result.data.id,
          userId: result.data.userId,
          name: result.data.name,
          isDefault: result.data.isDefault,
          resume: result.data.resume as Resume | null,
          createdAt: result.data.createdAt.toISOString(),
          updatedAt: result.data.updatedAt.toISOString(),
        }]);
        // Navigate to edit the new profile
        router.push(`/profile/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    });
  };

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-2xl font-semibold mb-2">No profiles yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first profile or import an existing resume
        </p>
        <div className="flex gap-3">
          <Button onClick={handleCreateProfile} disabled={isPending} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            {isPending ? "Creating..." : "Create Profile"}
          </Button>
          <ResumeImportButton onImportSuccess={handleImportSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {profiles.length} {profiles.length === 1 ? "profile" : "profiles"}
        </p>
        <div className="flex gap-2">
          <ResumeImportButton onImportSuccess={handleImportSuccess} />
          <Button onClick={handleCreateProfile} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? "Creating..." : "New Profile"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            id={profile.id}
            name={profile.name}
            isDefault={profile.isDefault}
            resumeData={profile.resume}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onSetDefault={handleSetDefault}
          />
        ))}
      </div>
    </div>
  );
}
