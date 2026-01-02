"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./ProfileCard";
import { ResumeImportButton } from "./ResumeImportButton";
import { Button } from "@/components/ui";
import { Gallery } from "@/components/shared/Gallery";
import { Plus, User, AlertCircle, Key } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { createProfile } from "@/app/actions/profile";
import { apiV1, type ProfileDto } from "@/lib/client";
import { useComponentLogger } from "@/hooks";
import { OnboardingModal } from "./OnboardingModal";
import { useCanUseAI } from "@/lib/contexts";
import { Callout } from "@/components/shared";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface ProfileGalleryProps {
  initialProfiles: ProfileDto[];
}

export function ProfileGallery({ initialProfiles }: Readonly<ProfileGalleryProps>) {
  const log = useComponentLogger("ProfileGallery");
  const [profiles, setProfiles] = useState<ProfileDto[]>(initialProfiles);
  const [isPending, startTransition] = useTransition();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const canUseAI = useCanUseAI();
  const router = useRouter();

  // Check for empty state on mount
  useEffect(() => {
    if (profiles.length === 0) {
      setShowOnboarding(true);
    }
  }, []);

  // Refresh profiles when the page becomes visible
  useEffect(() => {
    const refreshProfiles = async () => {
      try {
        const result = await apiV1.PROFILE.LIST.get<ProfileDto[]>();
        if (!result.error && result.data) {
          setProfiles(
            result.data.map((p) => ({
              ...p,
              resume: p.resume as Resume | null,
            }))
          );
        }
      } catch (error) {
        log.error("Failed to refresh profiles", error);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfiles();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [log]);

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
        setProfiles((prev) => [
          ...prev,
          {
            id: result.data.id,
            userId: result.data.userId,
            name: result.data.name,
            resume: result.data.resume as Resume | null,
            templateId: result.data.templateId ?? null,
            selectedTemplateId: result.data.selectedTemplateId ?? null,
            isDefault: result.data.isDefault,
            isPublic: result.data.isPublic,
            publicSlug: result.data.publicSlug,
            createdAt: result.data.createdAt.toISOString(),
            updatedAt: result.data.updatedAt.toISOString(),
          },
        ]);
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
        setProfiles((prev) => [
          ...prev,
          {
            id: result.data.id,
            userId: result.data.userId,
            name: result.data.name,
            resume: result.data.resume as Resume | null,
            templateId: result.data.templateId ?? null,
            selectedTemplateId: result.data.selectedTemplateId ?? null,
            isDefault: result.data.isDefault,
            isPublic: result.data.isPublic,
            publicSlug: result.data.publicSlug,
            createdAt: result.data.createdAt.toISOString(),
            updatedAt: result.data.updatedAt.toISOString(),
          },
        ]);
        // Navigate to edit the new profile
        router.push(`/profile/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    });
  };

  // Header actions for the gallery
  const headerActions = (
    <div className="flex gap-2">
      <ResumeImportButton onImportSuccess={handleImportSuccess} />
      <Button onClick={handleCreateProfile} disabled={isPending}>
        <Plus className="h-4 w-4 mr-2" />
        {isPending ? "Creating..." : "New Profile"}
      </Button>
    </div>
  );

  return (
    <>
      {!canUseAI && profiles.length > 0 && (
        <div className="mb-6">
          <Callout
            variant="warning"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AI Features Disabled</p>
                  <p className="text-sm">
                    Add an API key in settings to enable resume optimization and cover letter generation.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild className="shrink-0">
                <Link href={ROUTES.SETTINGS_API_KEYS}>Add API Key</Link>
              </Button>
            </div>
          </Callout>
        </div>
      )}

      <Gallery
        items={profiles}
        getItemKey={(profile) => profile.id}
        emptyState={{
          icon: User,
          title: "No Profiles Yet",
          description: "Create your first profile or import an existing resume to get started",
          action: {
            label: isPending ? "Creating..." : "Create Profile",
            onClick: handleCreateProfile,
            icon: <Plus className="w-4 h-4" />,
            disabled: isPending,
          },
          secondaryAction: (
            <ResumeImportButton onImportSuccess={handleImportSuccess} />
          ),
        }}
        header={{
          showCount: true,
          countLabel: { singular: "profile", plural: "profiles" },
          actions: headerActions,
        }}
        renderItem={(profile) => (
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
        )}
      />

      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onStartFromScratch={() => {
          setShowOnboarding(false);
          handleCreateProfile();
        }}
        onImportSuccess={(resume) => {
          setShowOnboarding(false);
          handleImportSuccess(resume);
        }}
      />
    </>
  );
}
