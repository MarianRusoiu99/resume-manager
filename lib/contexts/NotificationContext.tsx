'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import { useNotificationManager, Notification } from '@/hooks/notifications/useNotificationManager';

export type { Notification };

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

export function NotificationProvider({ children }: Readonly<NotificationProviderProps>) {
  const manager = useNotificationManager();

  const value: NotificationContextType = useMemo(() => ({
    notifications: manager.notifications,
    unreadCount: manager.unreadCount,
    isLoading: manager.isLoading,
    isOpen: manager.isOpen,
    fetchNotifications: manager.fetchNotifications,
    markAsRead: manager.markAsRead,
    markAllAsRead: manager.markAllAsRead,
    deleteNotification: manager.deleteNotification,
    clearAllNotifications: manager.clearAllNotifications,
    handleNotificationAction: manager.handleNotificationAction,
    openNotifications: manager.openNotifications,
    closeNotifications: manager.closeNotifications,
    toggleNotifications: manager.toggleNotifications,
    addNotification: manager.addNotification,
  }), [manager]);

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
