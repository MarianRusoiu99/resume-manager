/**
 * Resume Preview Hook
 * Manages resume data fetching and template selection
 * Single Responsibility: Resume data management
 */

'use client';

import { useState, useEffect } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';

interface UseResumeDataOptions {
  initialData: Resume;
  resumeId?: string;
  previewKey: number;
}

export function useResumeData({
  initialData,
  resumeId,
  previewKey,
}: UseResumeDataOptions) {
  const [resume, setResume] = useState<Resume>(initialData);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  // Load template preference from localStorage on mount
  useEffect(() => {
    const savedTemplateId = localStorage.getItem('preferredTemplateId');
    if (savedTemplateId && !selectedTemplateId) {
      setSelectedTemplateId(savedTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch resume data and default template if resumeId is provided
  useEffect(() => {
    if (resumeId) {
      const fetchResume = async () => {
        try {
          const response = await fetch(`/api/resumes/${resumeId}`);
          if (response.ok) {
            const data = await response.json();
            setResume(data.content as Resume);
            // Set default template if available and not already selected
            if (data.templateId && selectedTemplateId === null) {
              setSelectedTemplateId(data.templateId);
              localStorage.setItem('preferredTemplateId', data.templateId);
            }
          }
        } catch (error) {
          console.error('Error fetching resume:', error);
        }
      };
      fetchResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, previewKey]);

  // Update resume when initialData prop changes
  useEffect(() => {
    setResume(initialData);
  }, [initialData]);

  const handleTemplateChange = async (
    templateId: string | null,
    onTemplateChange?: (templateId: string | null) => void
  ) => {
    setSelectedTemplateId(templateId);

    // Save to localStorage for all scenarios
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
    resume,
    selectedTemplateId,
    handleTemplateChange,
  };
}
