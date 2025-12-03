"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoadingState, EmptyState, SearchEmptyState } from "@/components/shared/states";
import type { LucideIcon } from "lucide-react";

/**
 * Grid column configuration for responsive layouts
 */
interface GridConfig {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

/**
 * Filter/category option for gallery filtering
 */
export interface GalleryFilterOption {
  value: string;
  label: string;
}

/**
 * Gallery Header configuration
 */
interface GalleryHeaderConfig {
  /** Show item count (e.g., "5 profiles") */
  showCount?: boolean;
  /** Label for count (e.g., "profile" -> "5 profiles") */
  countLabel?: string;
  /** Action buttons to show in header */
  actions?: ReactNode;
  /** Filter options for category filtering */
  filters?: GalleryFilterOption[];
  /** Current selected filter value */
  selectedFilter?: string;
  /** Filter change handler */
  onFilterChange?: (value: string) => void;
}

/**
 * Empty state configuration
 */
interface GalleryEmptyConfig {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  };
  /** Secondary action (e.g., import button alongside create) */
  secondaryAction?: ReactNode;
}

/**
 * Count label configuration
 */
interface CountLabelConfig {
  singular: string;
  plural: string;
}

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
  
  /** Header configuration (alternative to individual props) */
  header?: GalleryHeaderConfig;
  
  // Top-level header props (alternative to header object)
  /** Show item count in header */
  showCount?: boolean;
  /** Count label config */
  countLabel?: string | CountLabelConfig;
  /** Header action buttons */
  headerActions?: ReactNode;
  /** Filter options */
  filters?: GalleryFilterOption[];
  /** Current filter value */
  selectedFilter?: string;
  /** Filter change handler */
  onFilterChange?: (value: string) => void;
  
  /** Grid column configuration */
  gridCols?: GridConfig;
  
  /** Additional className */
  className?: string;
}

const DEFAULT_GRID_COLS: GridConfig = {
  sm: 1,
  md: 2,
  lg: 3,
};

/**
 * Gallery - Unified gallery/list component with loading, empty, and search states
 * 
 * Provides consistent patterns for displaying collections of items across the app.
 * Handles loading states, empty states, search empty states, and filtering.
 * 
 * @example
 * ```tsx
 * <Gallery
 *   items={profiles}
 *   renderItem={(profile) => (
 *     <ProfileCard key={profile.id} {...profile} />
 *   )}
 *   getItemKey={(profile) => profile.id}
 *   isLoading={isLoading}
 *   emptyState={{
 *     icon: User,
 *     title: "No profiles yet",
 *     description: "Create your first profile to get started",
 *     action: {
 *       label: "Create Profile",
 *       onClick: handleCreate,
 *       icon: <Plus />,
 *     },
 *   }}
 *   showCount
 *   countLabel={{ singular: "profile", plural: "profiles" }}
 *   headerActions={<Button onClick={handleCreate}>New Profile</Button>}
 * />
 * ```
 */
export function Gallery<T>({
  items,
  renderItem,
  getItemKey,
  isLoading = false,
  loadingMessage = "Loading...",
  emptyState,
  searchTerm,
  onClearSearch,
  header,
  // Top-level header props
  showCount,
  countLabel,
  headerActions,
  filters,
  selectedFilter,
  onFilterChange,
  gridCols = DEFAULT_GRID_COLS,
  className,
}: GalleryProps<T>) {
  // Handle loading state
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
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
  );

  // Merge header object with top-level props (top-level takes precedence)
  const normalizedCountLabel = typeof countLabel === 'string' 
    ? countLabel 
    : countLabel 
      ? `${countLabel.singular}|${countLabel.plural}` 
      : header?.countLabel;
  
  const hasHeader = header || showCount || headerActions || filters;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      {hasHeader && (
        <GalleryHeader
          itemCount={items.length}
          showCount={showCount ?? header?.showCount}
          countLabel={normalizedCountLabel}
          actions={headerActions ?? header?.actions}
          filters={filters ?? header?.filters}
          selectedFilter={selectedFilter ?? header?.selectedFilter}
          onFilterChange={onFilterChange ?? header?.onFilterChange}
        />
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
}

/**
 * Gallery Header Component
 */
interface GalleryHeaderProps extends GalleryHeaderConfig {
  itemCount: number;
}

function GalleryHeader({
  itemCount,
  showCount = false,
  countLabel = "item",
  actions,
  filters,
  selectedFilter,
  onFilterChange,
}: GalleryHeaderProps) {
  // Handle plural form: "item" -> "items" or "profile|profiles" format
  let countText: string | null = null;
  if (showCount) {
    if (countLabel?.includes('|')) {
      const [singular, plural] = countLabel.split('|');
      countText = `${itemCount} ${itemCount === 1 ? singular : plural}`;
    } else {
      countText = `${itemCount} ${itemCount === 1 ? countLabel : `${countLabel}s`}`;
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {countText && (
          <p className="text-muted-foreground text-sm">{countText}</p>
        )}
        
        {/* Filters */}
        {filters && filters.length > 0 && onFilterChange && (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-colors",
                  selectedFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * GalleryGrid - Standalone grid component for cases where Gallery is overkill
 */
interface GalleryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T) => string;
  gridCols?: GridConfig;
  className?: string;
}

export function GalleryGrid<T>({
  items,
  renderItem,
  getItemKey,
  gridCols = DEFAULT_GRID_COLS,
  className,
}: GalleryGridProps<T>) {
  const gridClass = cn(
    "grid gap-6",
    gridCols.sm === 1 && "grid-cols-1",
    gridCols.sm === 2 && "grid-cols-2",
    gridCols.md === 2 && "md:grid-cols-2",
    gridCols.md === 3 && "md:grid-cols-3",
    gridCols.lg === 3 && "lg:grid-cols-3",
    gridCols.lg === 4 && "lg:grid-cols-4",
    gridCols.xl === 4 && "xl:grid-cols-4",
    className,
  );

  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <div key={getItemKey(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
