'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/lib/contexts';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  readonly className?: string;
}

/**
 * Bell icon with notification counter badge
 */
export function NotificationBell({ className }: Readonly<NotificationBellProps>) {
  const { unreadCount, toggleNotifications, isOpen } = useNotifications();

  const ariaLabel = unreadCount > 0 
    ? `Notifications (${unreadCount} unread)` 
    : 'Notifications';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={toggleNotifications}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
