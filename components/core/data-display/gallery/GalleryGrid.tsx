"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { GridConfig } from "./types";

/**
 * GalleryGrid - Standalone grid component for cases where Gallery is overkill
 */
export interface GalleryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T) => string;
  gridCols?: GridConfig;
  className?: string;
}

export const DEFAULT_GRID_COLS: GridConfig = {
  sm: 1,
  md: 2,
  lg: 4,
  xl: 4,
};

export function GalleryGrid<T>({
  items,
  renderItem,
  getItemKey,
  gridCols = DEFAULT_GRID_COLS,
  className,
}: GalleryGridProps<T>) {
  const gridClass = cn(
    "grid gap-px bg-border border",
    gridCols.sm === 1 && "grid-cols-1",
    gridCols.sm === 2 && "grid-cols-2",
    gridCols.md === 2 && "md:grid-cols-2",
    gridCols.md === 3 && "md:grid-cols-3",
    gridCols.lg === 3 && "lg:grid-cols-3",
    gridCols.lg === 4 && "lg:grid-cols-4",
    gridCols.xl === 4 && "xl:grid-cols-4",
    gridCols.xl === 5 && "xl:grid-cols-5",
    className,
  );

  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <div key={getItemKey(item)} className="bg-background">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
