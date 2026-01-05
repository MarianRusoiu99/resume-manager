"use client";

import { type ReactNode, memo, useMemo, useCallback } from "react";
import { Gallery, type GalleryEmptyConfig, type GridConfig } from "@/components/shared/Gallery";
import { SearchInput } from "@/components/shared/SearchInput";
import { useResourceCollection } from "@/hooks/useResourceCollection";

interface Resource {
  id: string;
}

interface ResourceGalleryProps<T extends Resource> {
  /** Initial items from server */
  initialItems: T[];
  /** Render function for each item */
  renderItem: (item: T, actions: { onDelete: (id: string) => void }) => ReactNode;
  /** Unique key extractor */
  getItemKey: (item: T) => string;
  /** Delete action handler */
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Search term for filtering */
  searchTerm?: string;
  /** Resource name for notifications (e.g., "Resume") */
  resourceName?: string;
  /** Empty state configuration */
  emptyState?: GalleryEmptyConfig;
  /** Grid configuration */
  gridCols?: GridConfig;
  /** Header actions or info */
  headerActions?: ReactNode;
  /** Additional filters or controls */
  toolbar?: ReactNode;
  /** Filter function for search */
  filterFn?: (item: T, searchTerm: string) => boolean;
}

const ResourceGalleryImpl = <T extends Resource>({
  initialItems,
  renderItem,
  getItemKey,
  onDelete,
  searchTerm = "",
  resourceName = "Item",
  emptyState,
  gridCols,
  headerActions,
  toolbar,
  filterFn,
}: ResourceGalleryProps<T>) => {
  const { items: optimisticItems, handleDelete } = useResourceCollection({
    initialItems,
    onDelete,
    resourceName,
  });

  const filteredItems = useMemo(() => optimisticItems.filter((item) => {
    if (!searchTerm) return true;
    if (filterFn) return filterFn(item, searchTerm);

    // Default fallback filter (tries to match title/name if they exist)
    const searchLower = searchTerm.toLowerCase();
    const itemRecord = item as Record<string, unknown>;
    const title = typeof itemRecord.title === 'string' ? itemRecord.title : '';
    const name = typeof itemRecord.name === 'string' ? itemRecord.name : '';
    const jobTitle = typeof itemRecord.jobTitle === 'string' ? itemRecord.jobTitle : '';
    const companyName = typeof itemRecord.companyName === 'string' ? itemRecord.companyName : '';

    return (
      title.toLowerCase().includes(searchLower) ||
      name.toLowerCase().includes(searchLower) ||
      jobTitle.toLowerCase().includes(searchLower) ||
      companyName.toLowerCase().includes(searchLower)
    );
  }), [optimisticItems, searchTerm, filterFn]);

  const handleDeleteWithItemKey = useCallback((id: string) => handleDelete(id), [handleDelete]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full max-w-sm">
          <SearchInput 
            placeholder={`Search ${resourceName.toLowerCase()}s...`} 
            defaultValue={searchTerm}
          />
        </div>
        {headerActions}
      </div>

      {toolbar}

      <Gallery
        items={filteredItems}
        renderItem={(item) => renderItem(item, { onDelete: handleDeleteWithItemKey })}
        getItemKey={getItemKey}
        searchTerm={searchTerm}
        emptyState={emptyState}
        gridCols={gridCols}
        header={{
          showCount: true,
          countLabel: { 
            singular: resourceName.toLowerCase(), 
            plural: `${resourceName.toLowerCase()}s` 
          }
        }}
      />
    </div>
  );
};

/**
 * ResourceGallery - Managed gallery component for resources
 *
 * Automatically handles:
 * - Search filtering
 * - Optimistic deletions
 * - Consistency in search bar placement and empty states
 */
export const ResourceGallery = memo(ResourceGalleryImpl) as <T extends Resource>(
  props: ResourceGalleryProps<T>
) => React.ReactElement;
