'use client';

import { deleteCoverLetter } from '@/app/actions/cover-letter';
import { useResourceOperations } from '@/hooks/core/useResourceOperations';

/**
 * Hook for cover letter CRUD operations
 * Uses the generic useResourceOperations under the hood
 */
export function useCoverLetterOperations() {
  return useResourceOperations({
    basePath: '/cover-letters',
    resourceName: 'cover letter',
    deleteAction: deleteCoverLetter,
  });
}
