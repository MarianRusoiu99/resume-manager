/**
 * Custom hook for managing template selection
 * Single Responsibility: Handle template selection logic
 */

import { useState, useEffect } from 'react';

interface UseTemplateSelectionProps {
  resumeId?: string;
  onTemplateChange?: (templateId: string | null) => void;
}

export function useTemplateSelection({ resumeId, onTemplateChange }: UseTemplateSelectionProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Load template preference from localStorage on mount
  useEffect(() => {
    const savedTemplateId = localStorage.getItem('preferredTemplateId');
    if (savedTemplateId && !selectedTemplateId) {
      setSelectedTemplateId(savedTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch default template if none is selected
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      if (selectedTemplateId !== null) return;

      try {
        const response = await fetch('/api/templates?limit=1');
        if (response.ok) {
          const { templates } = await response.json();
          if (templates && templates.length > 0) {
            const defaultTemplate = templates[0];
            setSelectedTemplateId(defaultTemplate.id);
          }
        }
      } catch (error) {
        console.error('Error fetching default template:', error);
      }
    };

    fetchDefaultTemplate();
  }, [selectedTemplateId]);

  const handleTemplateChange = async (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    
    // Save to localStorage
    if (templateId) {
      localStorage.setItem('preferredTemplateId', templateId);
    }
    
    // Save template selection to resume if resumeId is available
    if (resumeId && templateId) {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId }),
        });
        
        if (!response.ok) {
          console.error('Failed to save template selection');
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
  };
}
