'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useResumeGeneration } from '@/modules/ai-enhance/hooks/useResumeGeneration';
import { deleteResume } from '@/app/actions/resume';
import { getProfile } from '@/app/actions/profile';
import { useTemplateSelection } from '@/components/preview/useTemplateSelection';
import { useFeatureModelPreference } from "@/hooks";

export function useResumeFlow(defaultProfileId: string) {
  const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);
  const [jobDescription, setJobDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { modelId, providerId, isLoading: isModelLoading, updatePreference } = useFeatureModelPreference('resume');

  // Sync selectedProfileId if defaultProfileId changes externally
  const [prevDefaultProfileId, setPrevDefaultProfileId] = useState(defaultProfileId);
  if (defaultProfileId !== prevDefaultProfileId) {
    setPrevDefaultProfileId(defaultProfileId);
    setSelectedProfileId(defaultProfileId);
  }

  const handleModelChange = useCallback((newModelId: string, newProviderId: string) => {
    updatePreference(newModelId, newProviderId);
  }, [updatePreference]);

  const {
    generate,
    resume: generatedResume,
    jobTitle: aiJobTitle,
    companyName: aiCompanyName,
    matchScore,
    suggestions,
    isLoading: isGenerating,
    error,
    savedId,
    reset,
  } = useResumeGeneration();

  const handleDiscard = useCallback(async () => {
    if (!savedId) return;
    
    const result = await deleteResume(savedId);
    if (result.success) {
      toast.success('Draft discarded');
      reset();
    } else {
      toast.error('Failed to discard draft');
    }
  }, [savedId, reset]);

  const handleGenerate = useCallback(async (isConfirmed = false) => {
    if (savedId && !isConfirmed) {
      return 'confirm_overwrite';
    }

    if (jobDescription.length < 50) {
      toast.error('Job description must be at least 50 characters');
      return;
    }

    if (!selectedProfileId) {
      toast.error('Please select a profile first');
      return;
    }

    if (!modelId) {
      toast.error('Please select an AI model first');
      return;
    }

    const profileResult = await getProfile(selectedProfileId);
    if (!profileResult.success || !profileResult.data) {
      toast.error('Failed to load selected profile data');
      return;
    }

    await generate({
      jobDescription,
      personalInstructions: '',
      overrideModelId: modelId,
      profileResume: profileResult.data.resume,
    });
  }, [generate, jobDescription, modelId, selectedProfileId, savedId]);

  const { selectedTemplateId } = useTemplateSelection({
    profileId: selectedProfileId,
  });

  const handleSave = useCallback(async (resume: unknown, title?: string, company?: string, score?: number | null, sug?: string[]) => {
    // Auto-save is now handled on the server (api/v1/ai/chat)
    // This client-side save is only for manual overrides or fallback
    return;
  }, []);

  // Handle auto-save when generation completes
  useEffect(() => {
    // Server handles auto-save for both streaming and non-streaming
    // No need for client-side effect to trigger save
  }, []);

  return {
    selectedProfileId,
    setSelectedProfileId,
    jobDescription,
    setJobDescription,
    isSaving,
    modelId,
    providerId,
    isModelLoading,
    handleModelChange,
    generatedResume,
    isGenerating,
    error,
    matchScore,
    suggestions,
    handleGenerate,
    handleDiscard,
    handleSave,
    savedId,
  };
}
