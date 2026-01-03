'use client';

import { useState, useEffect } from 'react';
import { getProfiles } from '@/app/actions/profile';
import { getApiProviders } from '@/app/actions/api-provider';
import { toast } from 'sonner';
import { useComponentLogger } from '@/hooks';
import type { ProfileListItem } from '@/lib/actions/types';

interface AIProvider {
  name: string;
  isActive: boolean;
  models?: string[];
}

export function useGenerateMetadata() {
  const log = useComponentLogger('useGenerateMetadata');
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [hasAIProviders, setHasAIProviders] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [defaultModelId, setDefaultModelId] = useState<string>('');
  const [defaultProfileId, setDefaultProfileId] = useState<string>('');

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const [profilesResult, providersResult] = await Promise.all([
          getProfiles(),
          getApiProviders(),
        ]);

        if (profilesResult.success && profilesResult.data) {
          const profileData = profilesResult.data as ProfileListItem[];
          setProfiles(profileData);
          const defaultProfile = profileData.find((p) => p.isDefault) || profileData[0];
          if (defaultProfile) {
            setDefaultProfileId(defaultProfile.id);
          }
        }

        if (providersResult.success && providersResult.data) {
          const providerData = providersResult.data as AIProvider[];
          setProviders(providerData);
          const activeProviders = providerData.filter((p) => p.isActive);
          setHasAIProviders(activeProviders.length > 0);

          if (activeProviders.length > 0) {
            // In getUserProviders, models is a string array of modelKeys
            const firstModelId = activeProviders[0].models?.[0] || '';
            setDefaultModelId(firstModelId);
          }
        }
      } catch (err) {
        log.error('Failed to load metadata', err);
        toast.error('Failed to load configuration');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [log]);

  return {
    profiles,
    providers,
    hasAIProviders,
    isLoadingMetadata,
    defaultModelId,
    defaultProfileId,
    activeProviders: providers.filter(p => p.isActive)
  };
}
