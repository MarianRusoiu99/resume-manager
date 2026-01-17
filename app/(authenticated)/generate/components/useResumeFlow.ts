'use client';

import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useResumeGeneration } from '@/modules/ai-enhance/hooks/useResumeGeneration';
import { saveGeneratedResume } from '@/app/actions/resume';
import { getProfile } from '@/app/actions/profile';
import { useTemplateSelection } from '@/components/preview/useTemplateSelection';
import { useFeatureModelPreference } from '@/hooks';

export function useResumeFlow(defaultProfileId: string) {
  const [selectedProfileId, setSelectedProfileId] = useState(() => defaultProfileId);
  const [jobDescription, setJobDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { modelId, providerId, isLoading: isModelLoading, updatePreference } = useFeatureModelPreference('resume');

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
    resume: generatedResume,
    jobTitle: aiJobTitle,
    companyName: aiCompanyName,
    matchScore,
    suggestions,
    isLoading: isGenerating,
    error,
  } = useResumeGeneration();

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
      personalInstructions: '',
      overrideModelId: modelId,
      profileResume: profileResult.data.resume,
    });
  }, [generate, jobDescription, modelId, selectedProfileId]);

  const { selectedTemplateId } = useTemplateSelection({
    profileId: selectedProfileId,
  });

  const handleSave = async () => {
    if (!generatedResume) return;

    setIsSaving(true);
    try {
      const result = await saveGeneratedResume({
        resume: generatedResume,
        jobDescription,
        jobTitle: aiJobTitle || (generatedResume as any).basics?.label || 'Optimized Resume',
        companyName: aiCompanyName || '',
        templateId: selectedTemplateId || undefined,
        metadata: {
          matchScore,
          suggestions,
        }
      });

      if (result.success) {
        toast.success('Resume saved to library');
      } else {
        toast.error(result.error || 'Failed to save resume');
      }
    } catch {
      toast.error('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

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
    handleSave,
  };
}
