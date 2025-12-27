'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { apiV1 } from '@/lib/client';
import { createComponentLogger } from '@/lib/utils/client-logger';

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


/**
 * Context state
 */
interface NotificationContextState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
}

/**
 * Context actions
 */
interface NotificationContextActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  handleNotificationAction: (notification: Notification) => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  addNotification: (notification: Notification) => void;
}

type NotificationContextType = NotificationContextState & NotificationContextActions;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

const log = createComponentLogger('NotificationProvider');

export function NotificationProvider({ children }: Readonly<NotificationProviderProps>) {
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
      const result = await apiV1.NOTIFICATIONS.ROOT.get<{ notifications?: Notification[]; unreadCount?: number }>();

      if (result.error) {
        throw new Error(result.error);
      }

      setNotifications(result.data?.notifications ?? []);
      setUnreadCount(result.data?.unreadCount ?? 0);
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
      const result = await apiV1.NOTIFICATIONS.COUNT.get<{ count?: number }>();

      if (result.error) return;

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
      const result = await apiV1.NOTIFICATIONS.ITEM(id).patch<unknown>();
      if (result.error) {
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
      const result = await apiV1.NOTIFICATIONS.ROOT.post<unknown>({ action: 'markAllRead' });
      if (result.error) {
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
      const result = await apiV1.NOTIFICATIONS.ITEM(id).delete<unknown>();
      if (result.error) {
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
      const markResult = await apiV1.NOTIFICATIONS.ROOT.post<unknown>({ action: 'markAllRead' });
      if (markResult.error) {
        throw new Error(markResult.error);
      }

      await Promise.all(idsToDelete.map((id) => apiV1.NOTIFICATIONS.ITEM(id).delete<unknown>()));

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
    const eventSource = new EventSource(apiV1.NOTIFICATIONS.STREAM.url);

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

  const value: NotificationContextType = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}
