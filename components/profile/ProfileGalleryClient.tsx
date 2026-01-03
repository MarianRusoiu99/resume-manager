"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./ProfileCard";
import { ResumeImportButton } from "./ResumeImportButton";
import { Button } from "@/components/ui";
import { Gallery } from "@/components/shared/Gallery";
import { Plus, User, Key } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { createProfile, deleteProfile, setDefaultProfile } from "@/app/actions/profile";
import { type ProfileDto } from "@/lib/actions/types";
import { OnboardingModal } from "./OnboardingModal";
import { useCanUseAI } from "@/lib/contexts";
import { Callout, SearchInput } from "@/components/shared";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface ProfileGalleryClientProps {
  initialProfiles: ProfileDto[];
  searchTerm?: string;
}

export function ProfileGalleryClient({ 
  initialProfiles,
  searchTerm = ""
}: Readonly<ProfileGalleryClientProps>) {
  const [isPending, startTransition] = useTransition();
  const [showOnboarding, setShowOnboarding] = useState(initialProfiles.length === 0);
  const canUseAI = useCanUseAI();
  const router = useRouter();

  const [optimisticProfiles, updateOptimisticProfiles] = useOptimistic(
    initialProfiles,
    (state, action: { type: 'delete' | 'default', id: string }) => {
      if (action.type === 'delete') {
        return state.filter(p => p.id !== action.id);
      }
      if (action.type === 'default') {
        return state.map(p => ({
          ...p,
          isDefault: p.id === action.id
        }));
      }
      return state;
    }
  );

  const handleCreateProfile = () => {
    startTransition(async () => {
      const result = await createProfile(
        `Profile ${optimisticProfiles.length + 1}`,
        { basics: { name: "" } } as Resume,
        optimisticProfiles.length === 0 // First profile is default
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

  const handleDelete = (id: string) => {
    startTransition(async () => {
      updateOptimisticProfiles({ type: 'delete', id });
      await deleteProfile(id);
    });
  };

  const handleDuplicate = () => {
    router.refresh();
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      updateOptimisticProfiles({ type: 'default', id });
      await setDefaultProfile(id);
    });
  };

  const handleImportSuccess = (resume: Resume) => {
    startTransition(async () => {
      const result = await createProfile(
        `Imported Profile ${optimisticProfiles.length + 1}`,
        resume,
        optimisticProfiles.length === 0
      );

      if (result.success) {
        toast.success("Profile created from imported resume!");
        router.push(`/profile/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    });
  };

  const filteredProfiles = optimisticProfiles.filter(p => {
    if (!searchTerm) return true;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      <div className="mb-6">
        <SearchInput 
          placeholder="Search profiles..." 
          defaultValue={searchTerm}
        />
      </div>

      {!canUseAI && optimisticProfiles.length > 0 && (
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

      <Gallery
        items={filteredProfiles}
        getItemKey={(profile) => profile.id}
        searchTerm={searchTerm}
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
