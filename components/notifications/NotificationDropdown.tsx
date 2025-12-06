'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Mail, User, Download, Bell, X, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, type Notification } from '@/lib/contexts';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'RESUME_GENERATED':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'COVER_LETTER_GENERATED':
      return <Mail className="h-4 w-4 text-green-500" />;
    case 'PROFILE_UPDATED':
      return <User className="h-4 w-4 text-purple-500" />;
    case 'EXPORT_COMPLETE':
      return <Download className="h-4 w-4 text-orange-500" />;
    case 'SYSTEM':
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

interface NotificationItemProps {
  readonly notification: Notification;
  readonly onAction: (notification: Notification) => void;
  readonly onDelete: (id: string) => void;
  readonly onMarkRead: (id: string) => void;
}

/**
 * Individual notification item
 */
function NotificationItem({
  notification,
  onAction,
  onDelete,
  onMarkRead,
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors rounded-md mx-2 my-1',
        !notification.isRead && 'bg-muted/30'
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" />
      )}

      {/* Icon with background */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="p-2 rounded-lg bg-muted/50">
          {getNotificationIcon(notification.type)}
        </div>
      </div>

      {/* Content - clickable area */}
      <button
        type="button"
        className="flex-1 min-w-0 text-left cursor-pointer"
        onClick={() => onAction(notification)}
      >
        <p className="text-sm font-medium leading-snug truncate max-w-full pr-2" title={notification.title}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 pr-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {notification.actionUrl && notification.actionLabel && (
            <span className="text-xs text-primary flex items-center gap-1 font-medium">
              {notification.actionLabel}
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>

      {/* Action buttons (show on hover) - siblings, not nested */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-start">
        {!notification.isRead && (
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
          onClick={() => onDelete(notification.id)}
          title="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface NotificationDropdownProps {
  readonly className?: string;
}

/**
 * Notification dropdown with bell icon and list of notifications
 */
export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    openNotifications,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationAction,
  } = useNotifications();

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => open ? openNotifications() : closeNotifications()}>
      <DropdownMenuTrigger asChild>
        <div className={className}>
          <NotificationBell />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[500px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1.5 px-3 text-xs hover:bg-accent"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="h-[500px] min-w-[500px]">
          {isLoading && (
            <div className="flex items-center justify-center h-32 w-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 w-full text-muted-foreground px-4">
              <div className="p-3 rounded-full bg-muted/50 mb-3">
                <Bell className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs mt-1 text-center">You&apos;ll see updates here when something happens</p>
            </div>
          )}

          {!isLoading && notifications.length > 0 && (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onAction={handleNotificationAction}
                  onDelete={deleteNotification}
                  onMarkRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  markAllAsRead();
                  // Delete all notifications after marking as read
                  for (const n of notifications) {
                    deleteNotification(n.id);
                  }
                }}
              >
                Clear all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
