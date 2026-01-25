"use client";

import { useOptimistic, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { createComponentLogger } from "@/lib/utils/client-logger";

const logger = createComponentLogger("useResourceCollection");

interface Resource {
  id: string;
}

interface UseResourceCollectionOptions<T extends Resource> {
  initialItems: T[];
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  resourceName?: string;
}

/**
 * useResourceCollection - Unified hook for managing collections of resources
 * 
 * Handles:
 * - Optimistic deletions
 * - Server action transitions
 * - Consistent toast notifications
 * - Search filtering (optional, can be done externally or added here)
 */
export function useResourceCollection<T extends Resource>({
  initialItems,
  onDelete,
  resourceName = "Item",
}: UseResourceCollectionOptions<T>) {
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, removeOptimisticItem] = useOptimistic(
    initialItems,
    (state, id: string) => state.filter((item) => item.id !== id)
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!onDelete) return;

      startTransition(async () => {
        // Apply optimistic update
        removeOptimisticItem(id);

        try {
          const result = await onDelete(id);

          if (result.success) {
            toast.success(`${resourceName} deleted successfully`);
          } else {
            toast.error(result.error || `Failed to delete ${resourceName.toLowerCase()}`);
            // Revert is handled automatically by useOptimistic when the transition ends
            // if we don't manually update the base state (which we don't here, 
            // relying on router.refresh() or server action revalidation)
          }
        } catch (error) {
          toast.error(`An unexpected error occurred while deleting the ${resourceName.toLowerCase()}`);
          logger.error(`Delete error [${resourceName}]`, error);
        }
      });
    },
    [onDelete, removeOptimisticItem, resourceName]
  );

  return {
    items: optimisticItems,
    isPending,
    handleDelete,
  };
}
