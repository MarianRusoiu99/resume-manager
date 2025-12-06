/**
 * Notification Service Interface
 * 
 * Defines the contract for notification business logic operations.
 */

import { NotificationType } from '@prisma/client';
import type { ServiceResult } from '@/lib/types/service-result';

/**
 * Notification data for API responses
 */
export interface NotificationServiceData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Input for creating a notification
 */
export interface CreateNotificationServiceInput {
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
 * Options for fetching notifications
 */
export interface GetNotificationsOptions {
  limit?: number;
  includeRead?: boolean;
}

/**
 * Notification Service Interface
 */
export interface INotificationService {
  /**
   * Create a notification
   */
  createNotification(
    input: CreateNotificationServiceInput
  ): Promise<ServiceResult<NotificationServiceData>>;

  /**
   * Create a resume generated notification
   */
  notifyResumeGenerated(
    userId: string,
    resumeId: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<ServiceResult<NotificationServiceData>>;

  /**
   * Create a cover letter generated notification
   */
  notifyCoverLetterGenerated(
    userId: string,
    coverLetterId: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<ServiceResult<NotificationServiceData>>;

  /**
   * Create a system notification
   */
  notifySystem(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Promise<ServiceResult<NotificationServiceData>>;

  /**
   * Get all notifications for a user
   */
  getNotifications(
    userId: string,
    options?: GetNotificationsOptions
  ): Promise<ServiceResult<NotificationServiceData[]>>;

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: string): Promise<ServiceResult<number>>;

  /**
   * Mark a notification as read
   */
  markAsRead(id: string, userId: string): Promise<ServiceResult<NotificationServiceData>>;

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): Promise<ServiceResult<{ count: number }>>;

  /**
   * Delete a notification
   */
  deleteNotification(id: string, userId: string): Promise<ServiceResult<void>>;

  /**
   * Delete old notifications
   */
  deleteOldNotifications(
    userId: string,
    daysOld?: number
  ): Promise<ServiceResult<{ count: number }>>;
}
