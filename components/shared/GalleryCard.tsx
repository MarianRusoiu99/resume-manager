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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { GalleryCardPreview } from '@/components/shared/GalleryCardPreview';

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
      console.error('Action failed:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Square card with horizontal layout (preview left, content right)
  return (
    <Card
      className={`group hover:shadow-lg transition-shadow ${disableNavigation ? '' : 'cursor-pointer'
        } relative overflow-hidden aspect-[3/2] flex ${className}`}
      onClick={handleCardClick}
    >
      {/* Preview Area - Left Half (50%) */}
      <div className="w-1/2  shrink-0">
        <GalleryCardPreview
          htmlContent={previewHtml}
          isLoading={isPreviewLoading}
          fallbackIcon={previewFallbackIcon}
          altText={`Preview of ${title}`}
        />
      </div>

      {/* Content Area - Right Half (50%) */}
      <div className="w-1/2 flex flex-col p-4 overflow-hidden">
        {/* Header with Badges and Actions */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate" title={title}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={subtitle}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Badges - show only first one */}
            {badges.slice(0, 1).map((badge, index) => (
              <Badge
                key={`${id}-badge-${index}`}
                variant={badge.variant || 'secondary'}
                className="gap-1 text-xs"
              >
                {badge.icon}
                {badge.label}
              </Badge>
            ))}

            {/* Actions Dropdown */}
            {actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isActionLoading}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {actions.map((action, index) => (
                    <div key={`${id}-action-${index}`}>
                      {action.variant === 'destructive' && index > 0 && (
                        <DropdownMenuSeparator />
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(action);
                        }}
                        disabled={action.disabled || isActionLoading}
                        className={
                          action.variant === 'destructive'
                            ? 'text-destructive focus:text-destructive'
                            : ''
                        }
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Metadata Section */}
        {metadata.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 mt-auto border-t text-xs">
            {metadata.slice(0, 3).map((item, index) => (
              <div key={`${id}-metadata-${index}`} className="flex items-center gap-1">
                {item.icon}
                <span className="font-medium text-foreground">{item.value}</span>
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
