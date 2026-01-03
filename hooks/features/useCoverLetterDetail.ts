'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { getCoverLetter, updateCoverLetter } from '@/app/actions/cover-letter';
import type { CoverLetterWithResume } from '@/lib/types/cover-letter';

export function useCoverLetterDetail(coverLetterId: string) {
  const [coverLetter, setCoverLetter] = useState<CoverLetterWithResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoverLetter = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getCoverLetter(coverLetterId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch cover letter');
      }

      setCoverLetter(result.data as CoverLetterWithResume);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cover letter';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [coverLetterId]);

  const saveCoverLetter = useCallback(async (content: string, contentJson: string) => {
    try {
      setIsSaving(true);
      const result = await updateCoverLetter(coverLetterId, {
        content,
        metadata: {
          contentJson,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save cover letter');
      }

      setCoverLetter(result.data as CoverLetterWithResume);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save cover letter';
      toast.error(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [coverLetterId]);

  useEffect(() => {
    if (coverLetterId) {
      fetchCoverLetter();
    }
  }, [coverLetterId, fetchCoverLetter]);

  return {
    coverLetter,
    isLoading,
    error,
    isSaving,
    fetchCoverLetter,
    saveCoverLetter,
  };
}
