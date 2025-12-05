/**
 * Notification Repository Interface
 * 
 * Defines the contract for notification data access operations.
 */

import { NotificationType } from '@prisma/client';

/**
 * Notification data structure
 */
export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Input for creating a notification
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

/**
 * Options for finding notifications
 */
export interface FindNotificationsOptions {
  limit?: number;
  includeRead?: boolean;
}

/**
 * Notification Repository Interface
 */
export interface INotificationRepository {
  /**
   * Create a new notification
   */
  create(data: CreateNotificationInput): Promise<NotificationData>;

  /**
   * Find all notifications for a user
   */
  findByUserId(userId: string, options?: FindNotificationsOptions): Promise<NotificationData[]>;

  /**
   * Get unread count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Mark a single notification as read
   */
  markAsRead(id: string, userId: string): Promise<NotificationData | null>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<{ count: number }>;

  /**
   * Delete a notification
   */
  delete(id: string, userId: string): Promise<boolean>;

  /**
   * Delete old read notifications
   */
  deleteOldNotifications(userId: string, daysOld?: number): Promise<{ count: number }>;
}
