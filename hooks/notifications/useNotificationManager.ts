'use client';

import { useState, useCallback, useEffect } from 'react';
import { ExternalServiceError } from "@/lib/errors";
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

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getNotifications({ includeRead: false });

      if (!result.success) {
        throw new ExternalServiceError('Notification API', result.error);
      }

      const fetchedNotifications = (result.data as unknown as Notification[]) ?? [];
      
      setNotifications((prev) => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = fetchedNotifications.filter(n => !existingIds.has(n.id));
        return [...newNotifications, ...prev];
      });
      
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

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();

      if (!result.success) return;

      setUnreadCount(result.data?.count ?? 0);
    } catch (error) {
      log.error('Error fetching notification count', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const result = await markAsReadAction(id);
      if (!result.success) {
        throw new ExternalServiceError('Notification API', result.error);
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      log.error('Error marking notification as read', error, { id });
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllAsReadAction();
      if (!result.success) {
        throw new ExternalServiceError('Notification API', result.error);
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      log.error('Error marking all notifications as read', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const result = await deleteNotificationAction(id);
      if (!result.success) {
        throw new ExternalServiceError('Notification API', result.error);
      }

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

  const clearAllNotifications = useCallback(async () => {
    const idsToDelete = notifications.map((n) => n.id);
    if (idsToDelete.length === 0) return;

    try {
      const markResult = await markAllAsReadAction();
      if (!markResult.success) {
        throw new ExternalServiceError('Notification API', markResult.error);
      }

      await Promise.all(idsToDelete.map((id) => deleteNotificationAction(id)));

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      log.error('Error clearing all notifications', error);
    }
  }, [notifications]);

  const handleNotificationAction = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        setIsOpen(false);
      }
    },
    [markAsRead, router]
  );

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      if (prev.some(n => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
    setUnreadCount((prev) => prev + 1);

    const truncatedTitle = notification.title.length > 60
      ? `${notification.title.substring(0, 60)}...`
      : notification.title;

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
      duration: 700,
    });
  }, [router]);

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

  useEffect(() => {
    fetchUnreadCount();

    let isClosing = false;

    const eventSource = new EventSource(API_V1.NOTIFICATIONS.STREAM);

    const sseLog = log.withContext({ action: 'notifications-sse' });

    const handleNotification = (fullNotification: Notification) => {
      addNotification(fullNotification);
    };

    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data);
        sseLog.debug('Connected to notifications stream', { data });
        
        fetchNotifications();
      } catch {
        sseLog.debug('Connected to notifications stream');
        fetchNotifications();
      }
    });

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        
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
        
        handleNotification(fullNotification);
      } catch (error) {
        sseLog.error('Error parsing notification', error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
    });

    eventSource.onerror = (error) => {
      if (isClosing || eventSource.readyState === EventSource.CLOSED) return;

      sseLog.error('Connection error', error);
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
