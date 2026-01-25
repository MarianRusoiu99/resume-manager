'use client';

import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/utils/api-client';
import { getProfiles } from '@/app/actions/profile';
import { getApiProviders } from '@/app/actions/api-provider';
import { toast } from 'sonner';
import { useComponentLogger } from "@/hooks";
import type { ProfileListItem } from '@/lib/actions/types';
import type { UserPreferences } from '@/lib/types';

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
  const [defaultProfileId, setDefaultProfileId] = useState<string>('');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const [profilesResult, providersResult, preferencesRes] = await Promise.all([
          getProfiles(),
          getApiProviders(),
          apiJson<UserPreferences>('/api/v1/user/preferences')
        ]);

        if (profilesResult.success && profilesResult.data) {
          const profileData = profilesResult.data as ProfileListItem[];
          setProfiles(profileData);
          
          const prefDefaultProfileId = (preferencesRes?.data as any)?.template?.defaultProfileId;
          const defaultProfile = profileData.find((p) => p.id === prefDefaultProfileId) || 
                                profileData.find((p) => p.isDefault) || 
                                profileData[0];
          
          if (defaultProfile) {
            setDefaultProfileId(defaultProfile.id);
          }
        }

        if (preferencesRes?.data) {
          setUserPreferences(preferencesRes.data);
        }

        if (providersResult.success && providersResult.data) {
          const providerData = providersResult.data as AIProvider[];
          setProviders(providerData);
          const activeProviders = providerData.filter((p) => p.isActive);
          setHasAIProviders(activeProviders.length > 0);
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
    defaultProfileId,
    userPreferences,
    activeProviders: providers.filter(p => p.isActive)
  };
}
