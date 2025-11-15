/**
 * Custom hook for managing template selection
 * Single Responsibility: Handle template selection logic for both profiles and resumes
 */

import { useState, useEffect, useCallback } from 'react';

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
    
    const endpoint = isProfile ? `/api/profiles/${entityId}` : `/api/resumes/${entityId}`;
    const response = await fetch(endpoint);
    
    if (response.ok) {
      const data = await response.json();
      return isProfile ? data.selectedTemplateId : data.templateId;
    }
    
    return null;
  }, [entityId, isProfile]);

  // Helper: Load default template
  const loadDefaultTemplate = useCallback(async (): Promise<string | null> => {
    const response = await fetch('/api/templates?limit=1');
    if (response.ok) {
      const { templates } = await response.json();
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
        console.error('Error loading template preference:', error);
        
        // Fallback: Try loading default template
        try {
          const defaultTemplate = await loadDefaultTemplate();
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate);
          }
        } catch (fallbackError) {
          console.error('Error loading default template:', fallbackError);
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
        const endpoint = isProfile ? `/api/profiles/${entityId}` : `/api/resumes/${entityId}`;
        const body = isProfile 
          ? { selectedTemplateId: templateId }
          : { templateId };
        
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to save template selection:', error);
        }
      } catch (error) {
        console.error('Error saving template:', error);
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
