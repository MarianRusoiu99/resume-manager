"use client";

import { cn } from "@/lib/utils";
import type { GalleryHeaderConfig } from "./types";

/**
 * Gallery Header Component
 */
export interface GalleryHeaderProps extends GalleryHeaderConfig {
  itemCount: number;
}

export function GalleryHeader({
  itemCount,
  showCount = false,
  countLabel,
  actions,
  filters,
  selectedFilter,
  onFilterChange,
}: GalleryHeaderProps) {
  let countText: string | null = null;

  if (showCount) {
    const singular = countLabel?.singular ?? "item";
    const plural = countLabel?.plural ?? "items";

    countText = `${itemCount} ${itemCount === 1 ? singular : plural}`;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
      <div className="flex items-center gap-4">
        {countText && (
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{countText}</p>
        )}

        {/* Filters */}
        {filters && filters.length > 0 && onFilterChange && (
          <div className="flex flex-wrap gap-px bg-border border">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                  selectedFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
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
