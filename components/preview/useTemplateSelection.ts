/**
 * Custom hook for managing template selection
 * Single Responsibility: Handle template selection logic for both profiles and resumes
 */

import { useState, useEffect, useCallback } from 'react';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { API_V1 } from '@/lib/constants';
import { parseApiJson, readApiErrorMessage } from '@/lib/utils/api-response';

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
    
    const endpoint = isProfile ? API_V1.PROFILE.GET(entityId) : API_V1.RESUME.GET(entityId);
    const response = await fetch(endpoint);
    
    if (response.ok) {
      const data = await parseApiJson<{ selectedTemplateId?: string | null; templateId?: string | null }>(response);

      if (isProfile) {
        return data.selectedTemplateId ?? null;
      }

      return data.templateId ?? null;
    }
    
    return null;
  }, [entityId, isProfile]);

  // Helper: Load default template
  const loadDefaultTemplate = useCallback(async (): Promise<string | null> => {
    const response = await fetch(`${API_V1.TEMPLATE.LIST}?limit=1`);
    if (response.ok) {
      const data = await parseApiJson<{ templates?: Array<{ id: string }> }>(response);
      const templates = data.templates;

      if (templates && templates.length > 0) {
        return templates[0].id;
      }
    }
    return null;
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
        const endpoint = isProfile ? API_V1.PROFILE.GET(entityId) : API_V1.RESUME.GET(entityId);
        const body = isProfile 
          ? { selectedTemplateId: templateId }
          : { templateId };
        
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        
        if (!response.ok) {
          const message = await readApiErrorMessage(response, 'Unknown error');
          logger.error('Failed to save template selection', new Error(message));
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
