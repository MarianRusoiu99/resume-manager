'use client';

import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { RouteErrorCard } from '@/components/shared/RouteErrorCard';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Resumes Route Error Boundary
 * 
 * Handles errors specific to the resumes section with relevant recovery options.
 */
export default function ResumesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Resumes error:', error);
  }, [error]);

  return (
    <RouteErrorCard
      error={error}
      reset={reset}
      title="Resume Error"
      description="Something went wrong while loading your resumes."
      sectionIcon={FileText}
      sectionLabel="View All Resumes"
      sectionHref="/resumes"
    />
  );
}
