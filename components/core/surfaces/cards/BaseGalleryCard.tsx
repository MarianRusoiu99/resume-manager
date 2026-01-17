'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { prefetchUrl } from '@/lib/client/utils/prefetch';

interface BaseGalleryCardProps {
  children: ReactNode;
  onClick?: () => void;
  prefetchUrls?: string[];
  className?: string;
  footer?: ReactNode;
  header?: ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
  /** If true, content overlays the header on hover (the old app style) */
  variant?: 'default' | 'overlay';
}

export function BaseGalleryCard({
  children,
  onClick,
  prefetchUrls = [],
  className,
  footer,
  header,
  badge,
  isActive = false,
  variant = 'overlay', // Defaulting to 'overlay' to match the previous style
}: Readonly<BaseGalleryCardProps>) {
  const handleMouseEnter = () => {
    prefetchUrls.forEach(prefetchUrl);
  };

  if (variant === 'overlay') {
    return (
      <Card
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        className={cn(
          "group relative overflow-hidden aspect-[1/1.414] flex flex-col transition-all duration-300",
          "bg-card border-none shadow-sm hover:shadow-premium hover:ring-1 hover:ring-primary/20 rounded-2xl",
          onClick && "cursor-pointer",
          isActive && "ring-2 ring-primary",
          className
        )}
      >
        {/* Full Background Header (Preview) */}
        {header && (
          <div className="absolute inset-0 w-full h-full bg-muted/5">
            {header}
          </div>
        )}

        {/* Status Badge - Top Left */}
        {badge && (
          <div className="absolute top-3 left-3 z-10 transition-opacity duration-300 group-hover:opacity-0">
            {badge}
          </div>
        )}

        {/* Hover Information Overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-white z-20">
          <div className="space-y-3">
            {badge && <div className="flex">{badge}</div>}
            <div className="space-y-1">
              {children}
            </div>
            {footer && (
              <div className="pt-2 border-t border-white/10 mt-2">
                {footer}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Standard "Image top, Content bottom" variant
  return (
    <Card
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group relative flex flex-col h-full overflow-hidden transition-all duration-300",
        "bg-card hover:bg-accent/5 border-border hover:border-primary/50",
        "hover:shadow-md hover:-translate-y-0.5",
        isActive && "border-primary bg-primary/5 ring-1 ring-primary/20",
        onClick && "cursor-pointer",
        className
      )}
    >
      {badge && (
        <div className="absolute top-3 left-3 z-10">
          {badge}
        </div>
      )}

      {header && (
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/30 border-b border-border/50 transition-colors group-hover:bg-muted/50">
          {header}
        </div>
      )}

      <div className="flex-1 flex flex-col p-4">
        {children}
      </div>

      {footer && (
        <div className="mt-auto px-4 py-3 border-t border-border/30 bg-muted/5 flex items-center justify-between gap-2">
          {footer}
        </div>
      )}
    </Card>
  );
}
