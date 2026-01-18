/**
 * Profiles Gallery Page
 * Browse and manage all your professional profiles
 */

import { Page } from "@/components/layout/Page";
import { ProfileGalleryClient } from "@/modules/profile/components/ProfileGalleryClient";
import { profileService } from "@/lib/services";
import { verifySession } from "@/lib/auth/dal";
import type { Resume } from "@/lib/validations/jsonresume";
import type { ProfileDto } from "@/lib/actions/types";
import { Suspense } from "react";
import { ExternalServiceError, ValidationError } from "@/lib/errors";
import { GallerySkeleton } from "@/components/core/data-display/skeletons/GallerySkeleton";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ProfilesPage({ searchParams }: Props) {
  const { q: searchTerm = '' } = await searchParams;
  
  // Use DAL for auth - will redirect if not authenticated
  const session = await verifySession();

  return (
    <Page
      title="Professional Profiles"
      description="Manage your professional profiles for targeted resume generation"
    >
      <Suspense fallback={<GallerySkeleton columns={{ sm: 1, md: 2, lg: 4, xl: 4 }} />}>
        <ProfilesContent userId={session.userId} searchTerm={searchTerm} />
      </Suspense>
    </Page>
  );
}

async function ProfilesContent({ userId, searchTerm }: { userId: string; searchTerm: string }) {
  const result = await profileService.getProfiles(userId);
  
  if (!result.success) {
    throw new ExternalServiceError('Profile API', result.error);
  }

  if (!result.data || !Array.isArray(result.data)) {
    throw new ValidationError("Failed to load profiles");
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

  return <ProfileGalleryClient initialProfiles={profiles} searchTerm={searchTerm} />;
}
