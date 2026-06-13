'use client';

import { useMemo } from 'react';
import type { ConversationContext } from '@/modules/ai-enhance/hooks/useConversation';
import type { Resume } from '@/lib/validations/jsonresume';
import type { GenerationType } from './useSessionManager';
import type { ArtifactReference } from './useArtifactCatalog';

interface UseArtifactContextOverrideOptions {
  generationType: GenerationType;
  selectedArtifacts: ArtifactReference[];
  selectedTemplateArtifact: ArtifactReference | null;
  hydratedProfileRefs: Record<string, Resume>;
  hydratedResumeRefs: Record<string, Resume>;
}

export function useArtifactContextOverride({
  generationType,
  selectedArtifacts,
  selectedTemplateArtifact,
  hydratedProfileRefs,
  hydratedResumeRefs,
}: UseArtifactContextOverrideOptions): Partial<ConversationContext> | undefined {
  return useMemo(() => {
    if (selectedArtifacts.length === 0) return undefined;

    const referencedProfiles = selectedArtifacts
      .filter((artifact) => artifact.type === 'profile')
      .map((artifact) => ({
        id: artifact.id,
        name: artifact.label.replace(/^Profile:\s*/, '').replace(/^Resume Source:\s*/, ''),
        resume: hydratedProfileRefs[artifact.id],
      }))
      .filter((profile) => Boolean(profile.resume));

    const referencedResumes = selectedArtifacts
      .filter((artifact) => artifact.type === 'resume')
      .map((artifact) => ({
        id: artifact.id,
        label: artifact.label.replace(/^Resume:\s*/, '').replace(/^Generated Resume:\s*/, ''),
        resume: hydratedResumeRefs[artifact.id],
      }))
      .filter((resume) => Boolean(resume.resume));

    const referencedCoverLetters = selectedArtifacts
      .filter((artifact) => artifact.type === 'cover-letter')
      .map((artifact) => artifact.label);

    const override: Record<string, unknown> = {};

    if (!(generationType === 'template' && referencedProfiles.length > 0) && referencedProfiles.length > 0) {
      override.userProfile = referencedProfiles[0];
      override.referencedProfiles = referencedProfiles;
    }

    if (referencedResumes.length > 0) {
      override.currentResume = referencedResumes[0].resume;
      override.referencedResumes = referencedResumes;
    }

    if (referencedCoverLetters.length > 0) {
      override.currentCoverLetter = referencedCoverLetters[0];
      override.referencedCoverLetters = referencedCoverLetters;
    }

    if (selectedTemplateArtifact) {
      override.template = { name: selectedTemplateArtifact.label };
    }

    return Object.keys(override).length > 0 ? (override as Partial<ConversationContext>) : undefined;
  }, [selectedArtifacts, selectedTemplateArtifact, generationType, hydratedProfileRefs, hydratedResumeRefs]);
}
