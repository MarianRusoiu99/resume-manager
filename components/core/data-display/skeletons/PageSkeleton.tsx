'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  type?: 'default' | 'gallery' | 'form' | 'dashboard';
  className?: string;
}

export function PageSkeleton({ type = 'default', className }: Readonly<PageSkeletonProps>) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-500", className)}>
      {/* Dynamic Content based on type */}
      {type === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[1/1.414] rounded-2xl" />
          ))}
        </div>
      )}

      {type === 'form' && (
        <div className="space-y-6 max-w-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {type === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
        </div>
      )}

      {type === 'default' && (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
