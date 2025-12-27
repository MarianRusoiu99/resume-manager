'use client';

import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GalleryCardAction } from '@/components/shared/GalleryCard';
import { cn } from '@/lib/utils';

interface GalleryCardActionsMenuProps {
  id: string;
  actions: GalleryCardAction[];
  isActionLoading: boolean;
  onActionClick: (action: GalleryCardAction) => void;
}

export function GalleryCardActionsMenu({
  id,
  actions,
  isActionLoading,
  onActionClick,
}: Readonly<GalleryCardActionsMenuProps>) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(event) => event.stopPropagation()}
          disabled={isActionLoading}
        >
          <MoreVertical className="h-3.5 w-3.5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        {actions.map((action, index) => (
          <div key={`${id}-action-${index}`}>
            {action.variant === 'destructive' && index > 0 && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onActionClick(action);
              }}
              disabled={action.disabled || isActionLoading}
              className={cn(
                action.variant === 'destructive' && 'text-destructive focus:text-destructive',
              )}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
