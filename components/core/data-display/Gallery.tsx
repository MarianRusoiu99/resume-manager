"use client";

import { type ReactNode, memo } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, SearchEmptyState } from "@/components/core/feedback/states";
import { GallerySkeleton } from "@/components/core/data-display/skeletons/GallerySkeleton";
import { GalleryHeader } from "./gallery/GalleryHeader";
import { GalleryGrid, DEFAULT_GRID_COLS } from "./gallery/GalleryGrid";
import type { 
  GridConfig, 
  GalleryHeaderConfig, 
  GalleryEmptyConfig 
} from "./gallery/types";

/**
 * Gallery Props
 */
export interface GalleryProps<T> {
  /** Array of items to display */
  items: T[];

  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;

  /** Unique key extractor for items */
  getItemKey: (item: T) => string;

  /** Loading state */
  isLoading?: boolean;

  /** Loading message */
  loadingMessage?: string;

  /** Empty state configuration */
  emptyState?: GalleryEmptyConfig;

  /** Search term (for search empty state) */
  searchTerm?: string;

  /** Clear search callback */
  onClearSearch?: () => void;

  /** Header configuration */
  header?: GalleryHeaderConfig;

  /** Grid column configuration */
  gridCols?: GridConfig;

  /** Additional className */
  className?: string;
}

/**
 * Gallery - Unified gallery/list component with loading, empty, and search states
 * 
 * Provides consistent patterns for displaying collections of items across the app.
 * Handles loading states, empty states, search empty states, and filtering.
 */
const GalleryComponent = <T,>({
  items,
  renderItem,
  getItemKey,
  isLoading = false,
  emptyState,
  searchTerm,
  onClearSearch,
  header,
  gridCols = DEFAULT_GRID_COLS,
  className,
}: GalleryProps<T>) => {
  // Handle loading state
  if (isLoading) {
    return <GallerySkeleton columns={gridCols} />;
  }

  // Handle search empty state
  if (items.length === 0 && searchTerm) {
    return (
      <SearchEmptyState
        searchTerm={searchTerm}
        onClear={onClearSearch}
      />
    );
  }

  // Handle general empty state
  if (items.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
        secondaryAction={emptyState.secondaryAction}
      />
    );
  }

  // Build grid class based on configuration
  const gridClass = cn(
    "grid gap-6",
    gridCols.sm === 1 && "grid-cols-1",
    gridCols.sm === 2 && "grid-cols-2",
    gridCols.md === 2 && "md:grid-cols-2",
    gridCols.md === 3 && "md:grid-cols-3",
    gridCols.lg === 3 && "lg:grid-cols-3",
    gridCols.lg === 4 && "lg:grid-cols-4",
    gridCols.xl === 4 && "xl:grid-cols-4",
    gridCols.xl === 5 && "xl:grid-cols-5",
  );

  const hasHeader =
    header?.showCount ||
    header?.actions ||
    (header?.filters && header.filters.length > 0);

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header Section */}
      {hasHeader && (
        <GalleryHeader itemCount={items.length} {...header} />
      )}

      {/* Grid Section */}
      <div className={gridClass}>
        {items.map((item, index) => (
          <div key={getItemKey(item)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Memoize the Gallery component for performance
export const Gallery = memo(GalleryComponent) as typeof GalleryComponent;

export { GalleryGrid, DEFAULT_GRID_COLS };
export type { GridConfig, GalleryHeaderConfig, GalleryEmptyConfig };
