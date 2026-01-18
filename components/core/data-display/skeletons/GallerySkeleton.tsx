'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GallerySkeletonProps {
  count?: number;
  className?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function GallerySkeleton({ 
  count = 8, 
  className,
  columns = { sm: 1, md: 2, lg: 4, xl: 4 }
}: GallerySkeletonProps) {
  const gridClass = cn(
    "grid gap-6",
    columns.sm === 1 && "grid-cols-1",
    columns.sm === 2 && "grid-cols-2",
    columns.md === 2 && "md:grid-cols-2",
    columns.lg === 4 && "lg:grid-cols-4",
    columns.xl === 4 && "xl:grid-cols-4",
  );

  return (
    <div className={cn("space-y-8 animate-in fade-in duration-500", className)}>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className={gridClass}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="aspect-[1/1.414] relative rounded-2xl overflow-hidden border border-border/50">
             <Skeleton className="absolute inset-0 w-full h-full" />
             <div className="absolute inset-x-0 bottom-0 p-6 space-y-3 z-10">
                <Skeleton className="h-6 w-3/4 bg-background/20" />
                <Skeleton className="h-4 w-1/2 bg-background/20" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
