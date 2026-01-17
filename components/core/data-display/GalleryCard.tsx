/**
 * Gallery Card Component
 * Reusable card for displaying items in galleries (profiles, resumes, templates, cover letters)
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles card display and user interactions
 * - Open/Closed: Extensible via props, closed for modification
 * - Liskov Substitution: Can be used anywhere a card display is needed
 * - Interface Segregation: Props are focused on specific use cases
 * - Dependency Inversion: Depends on abstractions (props) not concrete implementations
 */

'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { GalleryCardPreview } from '@/components/core/data-display/GalleryCardPreview';
import { GalleryCardActionsMenu } from '@/components/core/data-display/GalleryCardActionsMenu';
import { createComponentLogger } from '@/lib/utils/client-logger';

/**
 * Action item for dropdown menu
 */
export interface GalleryCardAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

/**
 * Metadata item to display
 */
export interface GalleryCardMetadata {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

/**
 * Gallery Card Props
 */
export interface GalleryCardProps {
  /** Unique identifier */
  id: string;

  /** Main title */
  title: string;

  /** Subtitle/description */
  subtitle?: string;

  /** Route to navigate when card is clicked */
  href: string;

  /** Preview HTML content for thumbnail */
  previewHtml?: string;

  /** Loading state for preview */
  isPreviewLoading?: boolean;

  /** Fallback icon when no preview available */
  previewFallbackIcon?: ReactNode;

  /** Badges to display (e.g., "Default", "Draft") */
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    icon?: ReactNode;
  }>;

  /** Metadata items to display at bottom */
  metadata?: GalleryCardMetadata[];

  /** Actions for dropdown menu */
  actions?: GalleryCardAction[];

  /** Custom class name */
  className?: string;

  /** Disable card click navigation */
  disableNavigation?: boolean;

  /** Layout orientation: horizontal (preview left) or vertical (preview top) */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Gallery Card Component
 * Displays a card with preview, title, metadata, and actions dropdown
 * Square aspect ratio: Preview on LEFT (50%), content on RIGHT (50%)
 */
const log = createComponentLogger('GalleryCard');

import { BaseGalleryCard } from '@/components/core/surfaces/cards/BaseGalleryCard';
import { memo, useCallback } from 'react';

export const GalleryCard = memo(function GalleryCard({
  id,
  title,
  subtitle,
  href,
  previewHtml,
  isPreviewLoading = false,
  previewFallbackIcon,
  badges = [],
  metadata = [],
  actions = [],
  className = '',
  disableNavigation = false,
}: Readonly<GalleryCardProps>) {
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleCardClick = useCallback(() => {
    if (!disableNavigation) {
      router.push(href);
    }
  }, [disableNavigation, href]);

  const handleActionClick = useCallback(async (action: GalleryCardAction) => {
    if (action.disabled || isActionLoading) return;

    try {
      setIsActionLoading(true);
      await action.onClick();
    } catch (error) {
      log.error('Action failed', error);
    } finally {
      setIsActionLoading(false);
    }
  }, [isActionLoading]);

  return (
    <BaseGalleryCard
      onClick={handleCardClick}
      prefetchUrls={[href]}
      className={className}
      variant="overlay"
      header={
        <GalleryCardPreview
          htmlContent={previewHtml}
          isLoading={isPreviewLoading}
          fallbackIcon={previewFallbackIcon}
          altText={`Preview of ${title}`}
        />
      }
      badge={badges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <Badge
              key={`${id}-badge-${badge.label}`}
              variant={badge.variant || "secondary"}
              className="bg-primary/90 text-primary-foreground border-none py-0.5 px-2 rounded-lg uppercase font-bold tracking-wider text-[10px]"
            >
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.label}
            </Badge>
          ))}
        </div>
      ) : null}
    >
       <div className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <GalleryCardActionsMenu
              id={id}
              actions={actions}
              isActionLoading={isActionLoading}
              onActionClick={handleActionClick}
            />
          </div>
      <h3 className="text-lg font-bold leading-snug text-white" title={title}>
        {title}
      </h3>
      
      {subtitle && (
        <p className="text-sm text-white/80 line-clamp-3 font-medium leading-relaxed" title={subtitle}>
          {subtitle}
        </p>
      )}
    </BaseGalleryCard>
  );
});
