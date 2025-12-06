'use client';

import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { RouteErrorCard } from '@/components/shared/RouteErrorCard';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Cover Letters Route Error Boundary
 * 
 * Handles errors specific to the cover letters section.
 */
export default function CoverLettersError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Cover letters error:', error);
  }, [error]);

  // Detect generation errors
  const isGenerationError = error.message?.toLowerCase().includes('generat');
  const isRateLimitError = error.message?.toLowerCase().includes('rate limit');

  const getErrorTitle = () => {
    if (isRateLimitError) return 'Rate Limit Exceeded';
    if (isGenerationError) return 'Generation Error';
    return 'Cover Letter Error';
  };

  const getErrorDescription = () => {
    if (isRateLimitError) return "You've made too many requests. Please wait a moment and try again.";
    if (isGenerationError) return 'Failed to generate your cover letter.';
    return 'Something went wrong while loading your cover letters.';
  };

  return (
    <RouteErrorCard
      error={error}
      reset={reset}
      title={getErrorTitle()}
      description={getErrorDescription()}
      sectionIcon={FileText}
      sectionLabel="View All Cover Letters"
      sectionHref="/cover-letters"
    />
  );
}
