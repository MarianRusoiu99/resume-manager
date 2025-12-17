/**
 * Custom hook for managing template selection
 * Single Responsibility: Handle template selection logic for both profiles and resumes
 */

import { useState, useEffect, useCallback } from 'react';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { apiV1, type ResumeDetailsDto, type TemplateListResponseDto } from '@/lib/client';

const logger = createComponentLogger('useTemplateSelection');

interface UseTemplateSelectionProps {
  resumeId?: string;
  profileId?: string; // Add support for profile IDs
  onTemplateChange?: (templateId: string | null) => void;
}

export function useTemplateSelection({ resumeId, profileId, onTemplateChange }: UseTemplateSelectionProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  // Determine what type of entity we're working with
  const entityId = resumeId || profileId;
  const isProfile = !!profileId && !resumeId;

  // Helper: Load template from entity (profile/resume)
  const loadFromEntity = useCallback(async (): Promise<string | null> => {
    if (!entityId) return null;

    if (isProfile) {
      // API client unwraps the `{ data: ... }` envelope automatically
      const profileResult = await apiV1.PROFILE.GET(entityId).get<{ selectedTemplateId: string | null }>();
      if (profileResult.error) return null;
      return profileResult.data?.selectedTemplateId ?? null;
    }

    const resumeResult = await apiV1.RESUME.GET(entityId).get<Pick<ResumeDetailsDto, 'templateId'>>();
    if (resumeResult.error) return null;
    return resumeResult.data?.templateId ?? null;
  }, [entityId, isProfile]);

  // Helper: Load default template
  const loadDefaultTemplate = useCallback(async (): Promise<string | null> => {
    const result = await apiV1.TEMPLATE.LIST.get<TemplateListResponseDto>();
    if (result.error || !result.data?.templates?.length) return null;

    return result.data.templates[0].id;
  }, []);


  // Load template preference on mount
  useEffect(() => {
    const loadTemplatePreference = async () => {
      setIsLoadingTemplate(true);
      
      try {
        // Priority 1: Load from entity (profile/resume)
        const entityTemplate = await loadFromEntity();
        if (entityTemplate) {
          setSelectedTemplateId(entityTemplate);
          return;
        }

        // Priority 2: Load from localStorage
        const savedTemplateId = localStorage.getItem('preferredTemplateId');
        if (savedTemplateId) {
          setSelectedTemplateId(savedTemplateId);
          return;
        }

        // Priority 3: Load default template
        const defaultTemplate = await loadDefaultTemplate();
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate);
        }
      } catch (error) {
        logger.error('Error loading template preference', error);
        
        // Fallback: Try loading default template
        try {
          const defaultTemplate = await loadDefaultTemplate();
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate);
          }
        } catch (fallbackError) {
          logger.error('Error loading default template', fallbackError);
        }
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadTemplatePreference();
  }, [entityId, isProfile, loadFromEntity, loadDefaultTemplate]);

  const handleTemplateChange = async (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    
    // Save to localStorage for future sessions
    if (templateId) {
      localStorage.setItem('preferredTemplateId', templateId);
    }
    
    // Save template selection to the appropriate entity
    if (entityId && templateId) {
      try {
        const result = isProfile
          ? await apiV1.PROFILE.GET(entityId).patch<unknown>({ selectedTemplateId: templateId })
          : await apiV1.RESUME.TEMPLATE(entityId).patch<unknown>({ templateId });

        if (result.error) {
          logger.error('Failed to save template selection', new Error(result.error));
        }
      } catch (error) {
        logger.error('Error saving template', error);
      }
    }
    
    if (onTemplateChange) {
      onTemplateChange(templateId);
    }
  };

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    handleTemplateChange,
    isLoadingTemplate,
  };
}
