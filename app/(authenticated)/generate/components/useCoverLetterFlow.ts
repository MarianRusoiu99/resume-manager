'use client';

import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCoverLetterGeneration } from '@/components/ai-enhance/hooks';
import { createCoverLetter } from '@/app/actions/cover-letter';
import { getProfile } from '@/app/actions/profile';
import { useFeatureModelPreference } from '@/hooks';

export function useCoverLetterFlow(defaultProfileId: string) {
  const [selectedProfileId, setSelectedProfileId] = useState(() => defaultProfileId);
  const [jobDescription, setJobDescription] = useState('');
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { modelId, isLoading: isModelLoading, updatePreference } = useFeatureModelPreference('coverLetter');

  useEffect(() => {
    if (defaultProfileId && !selectedProfileId) {
      setSelectedProfileId(defaultProfileId);
    }
  }, [defaultProfileId, selectedProfileId]);

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
  } = useCoverLetterGeneration();

  const handleGenerate = useCallback(async () => {
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
  }, [generate, jobDescription, personalInstructions, modelId, selectedProfileId]);

  const handleSave = async (contentOverride?: string) => {
    const content = contentOverride || generatedCoverLetter;
    if (!content) return;

    setIsSaving(true);
    try {
      const result = await createCoverLetter(
        content,
        jobDescription,
        aiJobTitle || '',
        aiCompanyName || '',
        {
          personalInstructions: personalInstructions,
          jobDescription: jobDescription,
        }
      );

      if (result.success) {
        toast.success('Cover letter saved to library');
      } else {
        toast.error(result.error || 'Failed to save cover letter');
      }
    } catch {
      toast.error('Failed to save cover letter');
    } finally {
      setIsSaving(false);
    }
  };

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
    handleSave,
    aiJobTitle,
    aiCompanyName
  };
}
