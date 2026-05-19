import { Suspense } from 'react';
import { getProfiles } from '@/app/actions/profile';
import { getApiProviders } from '@/app/actions/api-provider';
import { GenerateContent } from './components/GenerateContent';
import { PageSkeleton } from '@/components/core/data-display/skeletons/PageSkeleton';
import type { ProfileListItem } from '@/lib/actions/types';

async function GenerateDataWrapper() {
  const [profilesResult, providersResult] = await Promise.all([
    getProfiles(),
    getApiProviders(),
  ]);

  const profiles = (profilesResult.success ? profilesResult.data : []) as ProfileListItem[];
  const providers = (providersResult.success ? providersResult.data : []) as { isActive?: boolean }[];
  const hasAIProviders = providers.some((p) => p.isActive);
  
  const defaultProfile = profiles.find((p) => p.isDefault) || profiles[0];
  const defaultProfileId = defaultProfile?.id || '';

  return (
    <GenerateContent 
      initialProfiles={profiles}
      hasAIProviders={hasAIProviders}
      defaultProfileId={defaultProfileId}
    />
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GenerateDataWrapper />
    </Suspense>
  );
}
