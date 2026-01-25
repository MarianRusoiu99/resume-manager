'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCoverLetterGeneration } from '@/modules/ai-enhance/hooks/useCoverLetterGeneration';
import { deleteCoverLetter } from '@/app/actions/cover-letter';
import { getProfile } from '@/app/actions/profile';
import { useFeatureModelPreference } from "@/hooks";

export function useCoverLetterFlow(defaultProfileId: string) {
  const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);
  const [jobDescription, setJobDescription] = useState('');
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { modelId, isLoading: isModelLoading, updatePreference } = useFeatureModelPreference('coverLetter');

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
    coverLetter: generatedCoverLetter,
    jobTitle: aiJobTitle,
    companyName: aiCompanyName,
    isLoading: isGenerating,
    error,
    reset,
    savedId,
  } = useCoverLetterGeneration();

  const handleDiscard = useCallback(async () => {
    if (!savedId) return;
    
    const result = await deleteCoverLetter(savedId);
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
      profileId: selectedProfileId,
      personalInstructions,
      overrideModelId: modelId,
      profileResume: profileResult.data.resume,
    });
  }, [generate, jobDescription, personalInstructions, modelId, selectedProfileId, savedId]);

  const handleSave = useCallback(async (contentOverride?: string, title?: string, company?: string) => {
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
    personalInstructions,
    setPersonalInstructions,
    isSaving,
    modelId,
    isModelLoading,
    handleModelChange,
    generatedCoverLetter,
    isGenerating,
    error,
    reset,
    handleGenerate,
    handleDiscard,
    handleSave,
    aiJobTitle,
    aiCompanyName,
    savedId
  };
}
