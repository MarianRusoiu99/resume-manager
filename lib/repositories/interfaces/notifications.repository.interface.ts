/**
 * Notification Repository Interface
 * 
 * Defines the contract for notification data access operations.
 */

import { NotificationType } from '@prisma/client';
import { TransactionClient } from '@/lib/db/transaction';

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
  create(data: CreateNotificationInput, tx?: TransactionClient): Promise<NotificationData>;

  /**
   * Find a notification by ID with optional user ownership check
   */
  findById(id: string, userId?: string, tx?: TransactionClient): Promise<NotificationData | null>;

  /**
   * Find all notifications for a user
   */
  findAllForUser(userId: string, args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    take?: number;
    skip?: number;
  }, tx?: TransactionClient): Promise<NotificationData[]>;

  /**
   * Update a notification
   */
  update(id: string, data: Partial<Omit<NotificationData, 'id' | 'userId' | 'createdAt'>>, userId?: string, tx?: TransactionClient): Promise<NotificationData>;

  /**
   * Delete a notification
   */
  delete(id: string, userId?: string, tx?: TransactionClient): Promise<NotificationData>;

  /**
   * Check if notification exists and belongs to user
   */
  exists(id: string, userId?: string, tx?: TransactionClient): Promise<boolean>;

  /**
   * Get unread count for a user
   */
  getUnreadCount(userId: string, tx?: TransactionClient): Promise<number>;

  /**
   * Mark a single notification as read
   */
  markAsRead(id: string, userId: string, tx?: TransactionClient): Promise<NotificationData | null>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string, tx?: TransactionClient): Promise<{ count: number }>;

  /**
   * Delete old read notifications
   */
  deleteOldNotifications(userId: string, daysOld?: number, tx?: TransactionClient): Promise<{ count: number }>;
}
