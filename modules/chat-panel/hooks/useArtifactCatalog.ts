'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchProfiles, fetchResumes, fetchTemplates } from '../adapters/artifact-actions';
import type { GenerationType } from './useSessionManager';

export interface ArtifactReference {
  id: string;
  label: string;
  type: 'profile' | 'resume' | 'cover-letter' | 'template';
}

interface UseArtifactCatalogOptions {
  generationType: GenerationType;
  selectedArtifactRefs: string[];
  setSelectedArtifactRefs: Dispatch<SetStateAction<string[]>>;
}

interface UseArtifactCatalogReturn {
  artifactOptions: ArtifactReference[];
  isLoadingArtifacts: boolean;
  selectedArtifacts: ArtifactReference[];
  selectedTemplateArtifact: ArtifactReference | null;
}

export function useArtifactCatalog({
  generationType,
  selectedArtifactRefs,
  setSelectedArtifactRefs,
}: UseArtifactCatalogOptions): UseArtifactCatalogReturn {
  const [artifactOptions, setArtifactOptions] = useState<ArtifactReference[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadArtifacts = async () => {
      setIsLoadingArtifacts(true);
      try {
        if (generationType === 'resume') {
          const [profilesResult, resumesResult] = await Promise.all([fetchProfiles(), fetchResumes()]);
          if (!mounted) return;

          const options: ArtifactReference[] = [];
          if (profilesResult.success && profilesResult.data) {
            options.push(
              ...profilesResult.data.map((profile) => ({
                id: profile.id,
                label: `Resume Source: ${profile.name}`,
                type: 'profile' as const,
              }))
            );
          }
          if (resumesResult.success && resumesResult.data) {
            options.push(
              ...resumesResult.data.map((resume) => ({
                id: resume.id,
                label: `Generated Resume: ${resume.jobTitle || 'Untitled'}`,
                type: 'resume' as const,
              }))
            );
          }
          setArtifactOptions(options);
          setSelectedArtifactRefs((current) => current.filter((ref) => options.some((opt) => `${opt.type}:${opt.id}` === ref)));
          return;
        }

        if (generationType === 'cover-letter') {
          const [profilesResult, resumesResult] = await Promise.all([fetchProfiles(), fetchResumes()]);
          if (!mounted) return;

          const options: ArtifactReference[] = [];
          if (profilesResult.success && profilesResult.data) {
            options.push(
              ...profilesResult.data.map((profile) => ({
                id: profile.id,
                label: `Profile: ${profile.name}`,
                type: 'profile' as const,
              }))
            );
          }

          if (resumesResult.success && resumesResult.data) {
            options.push(
              ...resumesResult.data.map((resume) => ({
                id: resume.id,
                label: `Resume: ${resume.jobTitle || 'Untitled'}`,
                type: 'resume' as const,
              }))
            );
          }

          setArtifactOptions(options);
          setSelectedArtifactRefs((current) => current.filter((ref) => options.some((opt) => `${opt.type}:${opt.id}` === ref)));
          return;
        }

        const [templatesResult, profilesResult] = await Promise.all([fetchTemplates(), fetchProfiles()]);
        if (!mounted) return;

        const options: ArtifactReference[] = [];
        if (profilesResult.success && profilesResult.data) {
          options.push(
            ...profilesResult.data.map((profile) => ({
              id: profile.id,
              label: `Preview Profile: ${profile.name}${profile.isDefault ? ' (default)' : ''}`,
              type: 'profile' as const,
            }))
          );
        }

        if (templatesResult.success && templatesResult.data) {
          options.push(
            ...templatesResult.data.map((template) => ({
              id: template.id,
              label: `Template: ${template.name}`,
              type: 'template' as const,
            }))
          );
        }

        setArtifactOptions(options);
        setSelectedArtifactRefs((current) => {
          const valid = current.filter((ref) => options.some((opt) => `${opt.type}:${opt.id}` === ref));
          if (valid.length > 0) return valid;

          const defaultProfile = options.find((opt) => opt.type === 'profile' && opt.label.includes('(default)'));
          if (defaultProfile) return [`profile:${defaultProfile.id}`];

          const firstProfile = options.find((opt) => opt.type === 'profile');
          if (firstProfile) return [`profile:${firstProfile.id}`];

          return [];
        });
      } finally {
        if (mounted) {
          setIsLoadingArtifacts(false);
        }
      }
    };

    void loadArtifacts();

    return () => {
      mounted = false;
    };
  }, [generationType, setSelectedArtifactRefs]);

  const selectedArtifacts = useMemo(
    () => selectedArtifactRefs
      .map((ref) => artifactOptions.find((opt) => `${opt.type}:${opt.id}` === ref))
      .filter((artifact): artifact is ArtifactReference => Boolean(artifact)),
    [artifactOptions, selectedArtifactRefs]
  );

  const selectedTemplateArtifact = useMemo(
    () => selectedArtifacts.find((artifact) => artifact.type === 'template') ?? null,
    [selectedArtifacts]
  );

  return {
    artifactOptions,
    isLoadingArtifacts,
    selectedArtifacts,
    selectedTemplateArtifact,
  };
}
