'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { type ProfileListItem } from '@/lib/actions/types';
import { getProfiles, getProfile } from '@/app/actions/profile';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import type { Resume } from '@/lib/validations/jsonresume';

export function useTemplatePreview() {
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('sample');
  const [previewResume, setPreviewResume] = useState<Resume>(sampleResume as Resume);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      const result = await getProfiles();
      if (result.success && result.data) {
        setProfiles(result.data as unknown as ProfileListItem[]);
      }
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId === 'sample') {
      setPreviewResume(sampleResume as Resume);
      return;
    }

    const loadProfileData = async () => {
      setIsLoadingProfile(true);
      try {
        const result = await getProfile(selectedProfileId);
        if (result.success && result.data?.resume) {
          setPreviewResume(result.data.resume as unknown as Resume);
        }
      } catch (err) {
        toast.error('Failed to load profile for preview');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfileData();
  }, [selectedProfileId]);

  return {
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    previewResume,
    isLoadingProfile,
  };
}
