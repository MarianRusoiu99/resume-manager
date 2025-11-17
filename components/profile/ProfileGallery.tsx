"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./ProfileCard";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";

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
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreateProfile = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Profile ${profiles.length + 1}`,
          resume: { basics: { name: "" } }, // Empty resume that will be filled in later
          isDefault: profiles.length === 0, // First profile is default
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create profile");
      }

      const data = await response.json();
      toast.success("Profile created successfully");
      
      // Add the new profile to the local state
      setProfiles((prev) => [...prev, data]);
      
      // Navigate to edit the new profile
      router.push(`/profile/${data.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
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

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-2xl font-semibold mb-2">No profiles yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first profile to get started
        </p>
        <Button onClick={handleCreateProfile} disabled={isCreating} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          {isCreating ? "Creating..." : "Create Profile"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {profiles.length} {profiles.length === 1 ? "profile" : "profiles"}
        </p>
        <Button onClick={handleCreateProfile} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? "Creating..." : "New Profile"}
        </Button>
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
