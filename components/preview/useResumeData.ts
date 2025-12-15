/**
 * Custom hook for managing resume data fetching
 * Single Responsibility: Handle resume data loading
 */

import { useState, useEffect } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

const logger = createComponentLogger('useResumeData');

interface UseResumeDataProps {
  resumeData: Resume;
  resumeId?: string;
  previewKey?: number;
}

export function useResumeData({
  resumeData,
  resumeId,
  previewKey = 0,
}: UseResumeDataProps) {
  const [resume, setResume] = useState<Resume>(resumeData);
  const [localPreviewKey, setLocalPreviewKey] = useState(previewKey);

  // Fetch resume data if resumeId is provided
  useEffect(() => {
    if (resumeId) {
      const fetchResume = async () => {
        try {
          const result = await apiJson<{ content?: Resume }>(API_V1.RESUME.GET(resumeId));
          if (!result.error && result.data?.content) {
            setResume(result.data.content);
          }
        } catch (error) {
          logger.error('Error fetching resume', error);
        }
      };
      fetchResume();
    }
  }, [resumeId, localPreviewKey]);

  // Update resume when resumeData prop changes
  useEffect(() => {
    setResume(resumeData);
  }, [resumeData]);

  // Update preview key when prop changes
  useEffect(() => {
    setLocalPreviewKey(previewKey);
  }, [previewKey]);

  const handleRefresh = () => {
    setLocalPreviewKey(prev => prev + 1);
  };

  return {
    resume,
    localPreviewKey,
    handleRefresh,
  };
}
