/**
 * Profiles Gallery Page
 * Browse and manage all your professional profiles
 */

import { Page } from "@/components/layout/Page";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { profileService } from "@/lib/services";
import { verifySession } from "@/lib/auth/dal";
import type { Resume } from "@/lib/validations/jsonresume";
import type { ProfileDto } from "@/lib/client";

export default async function ProfilesPage() {
  // Use DAL for auth - will redirect if not authenticated
  const session = await verifySession();

  const result = await profileService.getProfiles(session.userId);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data || !Array.isArray(result.data)) {
    throw new Error("Failed to load profiles");
  }

  // Map to expected format with proper typing
  const profiles: ProfileDto[] = result.data.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    resume: p.resume as Resume | null,
    templateId: p.templateId ?? null,
    selectedTemplateId: p.selectedTemplateId ?? p.templateId ?? null,
    isDefault: p.isDefault,
    isPublic: p.isPublic,
    publicSlug: p.publicSlug,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <Page
      title="Professional Profiles"
      description="Manage your professional profiles for targeted resume generation"
      breadcrumbs={[{ label: "Profiles" }]}
    >
      <ProfileGallery initialProfiles={profiles} />
    </Page>
  );
}

