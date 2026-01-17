'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/actions/types';

export interface ResourceOperationsConfig<T = { id: string }> {
  /** Base path for the resource (e.g., '/resumes', '/cover-letters') */
  basePath: string;
  /** Human-readable resource name for messages (e.g., 'resume', 'cover letter') */
  resourceName: string;
  /** Delete action function */
  deleteAction: (id: string) => Promise<ActionResult<void>>;
  /** Optional duplicate action function */
  duplicateAction?: (id: string) => Promise<ActionResult<T>>;
}

export interface ResourceOperationsReturn {
  handleDelete: (id: string, title?: string) => Promise<boolean>;
  handleDuplicate?: (id: string) => Promise<void>;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
}

/**
 * Generic hook for resource CRUD operations
 * 
 * @example
 * ```tsx
 * const operations = useResourceOperations({
 *   basePath: '/resumes',
 *   resourceName: 'resume',
 *   deleteAction: deleteResume,
 *   duplicateAction: duplicateResume,
 * });
 * ```
 */
export function useResourceOperations<T extends { id: string } = { id: string }>(
  config: ResourceOperationsConfig<T>
): ResourceOperationsReturn {
  const { basePath, resourceName, deleteAction, duplicateAction } = config;
  const router = useRouter();

  const handleDelete = async (id: string, title?: string): Promise<boolean> => {
    if (title && !confirm(`Are you sure you want to delete "${title}"?`)) {
      return false;
    }

    try {
      const result = await deleteAction(id);
      if (result.success) {
        toast.success(`${capitalize(resourceName)} deleted successfully`);
        return true;
      } else {
        toast.error(`Failed to delete ${resourceName}`);
        return false;
      }
    } catch {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  const handleDuplicate = duplicateAction
    ? async (id: string): Promise<void> => {
        try {
          const result = await duplicateAction(id);
          if (result.success) {
            toast.success(`${capitalize(resourceName)} duplicated successfully`);
            if (result.data?.id) {
              router.push(`${basePath}/${result.data.id}`);
            }
          } else {
            toast.error(`Failed to duplicate ${resourceName}`);
          }
        } catch {
          toast.error('An unexpected error occurred');
        }
      }
    : undefined;

  const handleView = (id: string): void => {
    router.push(`${basePath}/${id}`);
  };

  const handleEdit = (id: string): void => {
    router.push(`${basePath}/${id}/edit`);
  };

  return {
    handleDelete,
    ...(handleDuplicate && { handleDuplicate }),
    handleView,
    handleEdit,
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
