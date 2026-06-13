'use client';

import { useEffect, useState } from 'react';
import { fetchProfile, fetchResume } from '../adapters/artifact-actions';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ArtifactReference } from './useArtifactCatalog';

interface UseArtifactHydrationOptions {
  selectedArtifacts: ArtifactReference[];
}

interface UseArtifactHydrationReturn {
  hydratedResumeRefs: Record<string, Resume>;
  hydratedProfileRefs: Record<string, Resume>;
}

export function useArtifactHydration({
  selectedArtifacts,
}: UseArtifactHydrationOptions): UseArtifactHydrationReturn {
  const [hydratedResumeRefs, setHydratedResumeRefs] = useState<Record<string, Resume>>({});
  const [hydratedProfileRefs, setHydratedProfileRefs] = useState<Record<string, Resume>>({});

  useEffect(() => {
    const profileIds = selectedArtifacts
      .filter((artifact) => artifact.type === 'profile')
      .map((artifact) => artifact.id)
      .filter(Boolean);

    const missingProfileIds = profileIds.filter((id) => !hydratedProfileRefs[id]);
    if (missingProfileIds.length === 0) return;

    let cancelled = false;

    const hydrateProfiles = async () => {
      for (const profileId of missingProfileIds) {
        const result = await fetchProfile(profileId);
        if (cancelled) return;
        if (!result.success || !result.data?.resume) continue;

        setHydratedProfileRefs((prev) => {
          if (prev[profileId]) return prev;
          return {
            ...prev,
            [profileId]: result.data.resume as Resume,
          };
        });
      }
    };

    void hydrateProfiles();

    return () => {
      cancelled = true;
    };
  }, [selectedArtifacts, hydratedProfileRefs]);

  useEffect(() => {
    const resumeIds = selectedArtifacts
      .filter((artifact) => artifact.type === 'resume')
      .map((artifact) => artifact.id)
      .filter(Boolean);

    const missingResumeIds = resumeIds.filter((id) => !hydratedResumeRefs[id]);
    if (missingResumeIds.length === 0) return;

    let cancelled = false;

    const hydrateResumes = async () => {
      for (const resumeId of missingResumeIds) {
        const result = await fetchResume(resumeId);
        if (cancelled) return;
        if (!result.success || !result.data?.content) continue;

        setHydratedResumeRefs((prev) => {
          if (prev[resumeId]) return prev;
          return {
            ...prev,
            [resumeId]: result.data.content as Resume,
          };
        });
      }
    };

    void hydrateResumes();

    return () => {
      cancelled = true;
    };
  }, [selectedArtifacts, hydratedResumeRefs]);

  return {
    hydratedResumeRefs,
    hydratedProfileRefs,
  };
}
