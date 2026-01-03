'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { API_V1 } from '@/lib/constants';
import { createComponentLogger } from '@/lib/utils/client-logger';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
  deleteNotification as deleteNotificationAction,
} from '@/app/actions/notification';

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
};

const log = createComponentLogger('useNotificationManager');

export function useNotificationManager() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Fetch all notifications
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getNotifications({ includeRead: true });

      if (!result.success) {
        throw new Error(result.error);
      }

      setNotifications((result.data as unknown as Notification[]) ?? []);
      
      const countResult = await getUnreadCount();
      if (countResult.success) {
        setUnreadCount(countResult.data?.count ?? 0);
      }
    } catch (error) {
      log.error('Error fetching notifications', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch just the unread count (lightweight polling)
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();

      if (!result.success) return;

      setUnreadCount(result.data?.count ?? 0);
    } catch (error) {
      log.error('Error fetching notification count', error);
    }
  }, []);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const result = await markAsReadAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      log.error('Error marking notification as read', error, { id });
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllAsReadAction();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      log.error('Error marking all notifications as read', error);
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const result = await deleteNotificationAction(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update local state
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      log.error('Error deleting notification', error, { id });
    }
  }, []);

  /**
   * Clear all notifications (mark all read, then delete all)
   */
  const clearAllNotifications = useCallback(async () => {
    const idsToDelete = notifications.map((n) => n.id);
    if (idsToDelete.length === 0) return;

    try {
      // Mark all read first (preserves current API behavior)
      const markResult = await markAllAsReadAction();
      if (!markResult.success) {
        throw new Error(markResult.error);
      }

      await Promise.all(idsToDelete.map((id) => deleteNotificationAction(id)));

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      log.error('Error clearing all notifications', error);
    }
  }, [notifications]);

  /**
   * Handle notification action (navigate to URL)
   */
  const handleNotificationAction = useCallback(
    (notification: Notification) => {
      // Mark as read when clicking
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      // Navigate if there's an action URL
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        setIsOpen(false);
      }
    },
    [markAsRead, router]
  );

  /**
   * Add a notification to state (for real-time updates)
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Truncate title if too long (max 60 characters)
    const truncatedTitle = notification.title.length > 60
      ? `${notification.title.substring(0, 60)}...`
      : notification.title;

    // Show a toast with action button
    toast(truncatedTitle, {
      description: notification.message,
      action: notification.actionUrl
        ? {
          label: notification.actionLabel || 'View',
          onClick: () => {
            router.push(notification.actionUrl!);
          },
        }
        : undefined,
      duration: 5000,
    });
  }, [router]);

  /**
   * Dropdown state management
   */
  const openNotifications = useCallback(() => {
    setIsOpen(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const closeNotifications = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    if (isOpen) {
      closeNotifications();
    } else {
      openNotifications();
    }
  }, [isOpen, openNotifications, closeNotifications]);

  /**
   * Initial fetch and SSE connection for real-time notifications
   */
  useEffect(() => {
    // Initial fetch of notifications
    fetchUnreadCount();

    let isClosing = false;

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource(API_V1.NOTIFICATIONS.STREAM);

    const sseLog = log.withContext({ action: 'notifications-sse' });

    eventSource.addEventListener('connected', (event) => {
      try {
        sseLog.debug('Connected to notifications stream', { data: JSON.parse(event.data) });
      } catch {
        sseLog.debug('Connected to notifications stream');
      }
    });

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        // Transform SSE payload to match Notification interface
        const fullNotification: Notification = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: false,
          actionUrl: notification.actionUrl ?? null,
          actionLabel: notification.actionLabel ?? null,
          resourceType: notification.resourceType ?? null,
          resourceId: notification.resourceId ?? null,
          metadata: notification.metadata ?? null,
          createdAt: notification.createdAt,
        };
        addNotification(fullNotification);
      } catch (error) {
        sseLog.error('Error parsing notification', error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Connection is alive, no action needed
    });

    eventSource.onerror = (error) => {
      // In dev, navigation/HMR unmounts can interrupt the request and surface as an error.
      // Ignore disconnects caused by our own cleanup.
      if (isClosing || eventSource.readyState === EventSource.CLOSED) return;

      sseLog.error('Connection error', error);
      // EventSource will automatically try to reconnect
    };

    return () => {
      isClosing = true;
      eventSource.close();
    };
  }, [fetchUnreadCount, addNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    handleNotificationAction,
    openNotifications,
    closeNotifications,
    toggleNotifications,
    addNotification,
  };
}
