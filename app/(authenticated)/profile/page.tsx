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

export default async function ProfilesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const result = await profileService.getProfiles(session.user.id);
  
  if (!result.success || !result.data || !Array.isArray(result.data)) {
    throw new Error(result.error || "Failed to load profiles");
  }

  return (
    <>
      <PageHeader
        title="Professional Profiles"
        description="Manage your professional profiles for targeted resume generation"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profiles" },
        ]}
      />
      <PageContainer>
        <ProfileGallery initialProfiles={result.data} />
      </PageContainer>
    </>
  );
}

