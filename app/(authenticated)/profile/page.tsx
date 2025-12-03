/**
 * Profiles Gallery Page
 * Browse and manage all your professional profiles
 */

import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { profileService } from "@/lib/services/profile.service";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import type { Resume } from "@/lib/validations/jsonresume";

export default async function ProfilesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const result = await profileService.getProfiles(session.user.id);
  
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
    <>
      <PageHeader
        title="Professional Profiles"
        description="Manage your professional profiles for targeted resume generation"
        breadcrumbs={[
          { label: "Profiles" },
        ]}
      />
      <PageContainer>
        <ProfileGallery initialProfiles={profiles} />
      </PageContainer>
    </>
  );
}

