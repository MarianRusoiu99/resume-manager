"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./ProfileCard";
import { ResumeImportButton } from "./ResumeImportButton";
import { Button } from "@/components/ui";
import { Plus, User, Key } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { createProfile, deleteProfile, setDefaultProfile } from "@/app/actions/profile";
import { type ProfileDto } from "@/lib/actions/types";
import { OnboardingModal } from "./OnboardingModal";
import { useCanUseAI } from "@/lib/contexts";
import { Callout } from "@/components/shared";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface ProfileGalleryClientProps {
  initialProfiles: ProfileDto[];
  searchTerm?: string;
}

import { ResourceGallery } from "@/components/shared/ResourceGallery";

export function ProfileGalleryClient({ 
  initialProfiles,
  searchTerm = ""
}: Readonly<ProfileGalleryClientProps>) {
  const [isPending, startTransition] = useTransition();
  const [showOnboarding, setShowOnboarding] = useState(initialProfiles.length === 0);
  const canUseAI = useCanUseAI();
  const router = useRouter();

  const handleCreateProfile = () => {
    startTransition(async () => {
      const result = await createProfile(
        `Profile ${initialProfiles.length + 1}`,
        { basics: { name: "" } } as Resume,
        initialProfiles.length === 0 // First profile is default
      );

      if (result.success) {
        toast.success("Profile created successfully");
        router.push(`/profile/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    });
  };

  const handleEdit = (id: string) => {
    router.push(`/profile/${id}`);
  };

  const handleDuplicate = () => {
    router.refresh();
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      await setDefaultProfile(id);
      router.refresh();
    });
  };

  const handleImportSuccess = (resume: Resume) => {
    startTransition(async () => {
      const result = await createProfile(
        `Imported Profile ${initialProfiles.length + 1}`,
        resume,
        initialProfiles.length === 0
      );

      if (result.success) {
        toast.success("Profile created from imported resume!");
        router.push(`/profile/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    });
  };

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
      {!canUseAI && initialProfiles.length > 0 && (
        <div className="mb-6">
          <Callout variant="warning">
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

      <ResourceGallery
        initialItems={initialProfiles}
        resourceName="Profile"
        onDelete={(id: string) => deleteProfile(id)}
        searchTerm={searchTerm}
        getItemKey={(profile) => profile.id}
        emptyState={{
          icon: User,
          title: "No Profiles Yet",
          description: searchTerm 
            ? `No profiles match "${searchTerm}"`
            : "Create your first profile or import an existing resume to get started",
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
        headerActions={headerActions}
        renderItem={(profile, { onDelete }) => (
          <ProfileCard
            key={profile.id}
            id={profile.id}
            name={profile.name}
            isDefault={profile.isDefault}
            resumeData={profile.resume}
            onEdit={handleEdit}
            onDelete={onDelete}
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
