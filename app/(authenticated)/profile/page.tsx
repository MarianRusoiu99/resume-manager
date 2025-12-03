/**
 * Profiles Gallery Page
 * Browse and manage all your professional profiles
 */

import { Page } from "@/components/layout/Page";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { profileService } from "@/lib/services/profile.service";
import { verifySession } from "@/lib/auth/dal";
import type { Resume } from "@/lib/validations/jsonresume";

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
  const profiles = result.data.map(p => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    isDefault: p.isDefault,
    resume: p.resume as Resume | null,
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

