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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GalleryCardPreview } from '@/components/shared/GalleryCardPreview';
import { GalleryCardActionsMenu } from '@/components/shared/GalleryCardActionsMenu';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { cn } from '@/lib/utils';

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

export function GalleryCard({
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

  const handleCardClick = () => {
    if (!disableNavigation) {
      router.push(href);
    }
  };

  const handleActionClick = async (action: GalleryCardAction) => {
    if (action.disabled || isActionLoading) return;

    try {
      setIsActionLoading(true);
      await action.onClick();
    } catch (error) {
      log.error('Action failed', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Square card with vertical layout (A4 aspect ratio)
  // Preview fills 100%, content overlays on hover
  return (
    <Card
      className={cn(
        "group transition-all duration-300 relative overflow-hidden aspect-[1/1.414] flex bg-card border-none shadow-sm hover:shadow-xl hover:ring-1 hover:ring-primary/20 rounded-2xl",
        disableNavigation ? "" : "cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Preview Area - Full Background */}
      <div className="absolute inset-0 w-full h-full bg-muted/5">
        <GalleryCardPreview
          htmlContent={previewHtml}
          isLoading={isPreviewLoading}
          fallbackIcon={previewFallbackIcon}
          altText={`Preview of ${title}`}
        />
      </div>

      {/* Hover Information Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {/* Badges - show inline before title */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {badges.map((badge, index) => (
                  <Badge
                    key={`${id}-badge-${index}`}
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-[10px] text-white border-none py-0.5 px-2 rounded-lg uppercase font-bold tracking-wider"
                  >
                    {badge.icon && <span className="mr-1">{badge.icon}</span>}
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}

            <h3 className="text-lg font-bold leading-snug" title={title}>
              {title}
            </h3>

            {/* Subtitle - Professional Summary or Job Description */}
            {subtitle && (
              <p className="text-sm text-white/80 line-clamp-3 font-medium leading-relaxed" title={subtitle}>
                {subtitle}
              </p>
            )}

            {/* Inline Metadata - only show if no subtitle or if brief */}
            {metadata.length > 0 && !subtitle && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 opacity-70">
                {metadata.slice(0, 2).map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                    {item.icon && <span className="opacity-70">{item.icon}</span>}
                    <span>{item.value} {item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 pt-1">
            <div className="bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10">
              <GalleryCardActionsMenu
                id={id}
                actions={actions}
                isActionLoading={isActionLoading}
                onActionClick={handleActionClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Corner Status Indicator (Optional, e.g., for Default item) */}
      {!disableNavigation && isPreviewLoading && (
        <div className="absolute top-3 right-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        </div>
      )}
    </Card>
  );
}
