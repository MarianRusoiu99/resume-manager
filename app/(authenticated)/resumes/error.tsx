'use client';

import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { RouteErrorCard } from '@/components/shared/RouteErrorCard';
import { createComponentLogger } from '@/lib/utils/client-logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Resumes Route Error Boundary
 * 
 * Handles errors specific to the resumes section with relevant recovery options.
 */
const log = createComponentLogger('ResumesError');

export default function ResumesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    log.error('Resumes error', error);
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
