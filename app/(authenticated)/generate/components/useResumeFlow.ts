'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useResumeGeneration } from '@/modules/ai-enhance/hooks/useResumeGeneration';
import { deleteResume } from '@/app/actions/resume';
import { getProfile } from '@/app/actions/profile';
import { useFeatureModelPreference } from "@/hooks";

export function useResumeFlow(defaultProfileId: string) {
  const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);
  const [jobDescription, setJobDescription] = useState('');

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

  return {
    selectedProfileId,
    setSelectedProfileId,
    jobDescription,
    setJobDescription,
    modelId,
    providerId,
    isModelLoading,
    handleModelChange,
    generatedResume,
    isGenerating,
    error,
    handleGenerate,
    handleDiscard,
    savedId,
  };
}
