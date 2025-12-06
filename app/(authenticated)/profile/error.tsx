'use client';

import { useEffect } from 'react';
import { User } from 'lucide-react';
import { RouteErrorCard } from '@/components/shared/RouteErrorCard';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Profile Route Error Boundary
 * 
 * Handles errors specific to the profile editing section.
 */
export default function ProfileError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Profile error:', error);
  }, [error]);

  // Detect save-related errors
  const isSaveError = error.message?.toLowerCase().includes('save') || 
                      error.message?.toLowerCase().includes('update');
  const isValidationError = error.message?.toLowerCase().includes('validation');

  const getErrorTitle = () => {
    if (isValidationError) return 'Validation Error';
    if (isSaveError) return 'Save Error';
    return 'Profile Error';
  };

  const getErrorDescription = () => {
    if (isValidationError) return 'Some of your profile data is invalid. Please check your entries.';
    if (isSaveError) return 'Failed to save your profile changes.';
    return 'Something went wrong while loading your profile.';
  };

  return (
    <RouteErrorCard
      error={error}
      reset={reset}
      title={getErrorTitle()}
      description={getErrorDescription()}
      sectionIcon={User}
      sectionLabel="Reload Profile"
      sectionHref="/profile"
    />
  );
}
