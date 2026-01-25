'use client';

import { deleteResume, duplicateResume } from '@/app/actions/resume';
import { useResourceOperations } from "@/hooks";

/**
 * Hook for resume CRUD operations
 * Uses the generic useResourceOperations under the hood
 */
export function useResumeOperations() {
  return useResourceOperations({
    basePath: '/resumes',
    resourceName: 'resume',
    deleteAction: deleteResume,
    duplicateAction: duplicateResume,
  });
}
