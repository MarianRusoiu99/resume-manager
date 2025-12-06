import { Notification, NotificationType } from '@prisma/client';
import {
  NotificationRepository,
  notificationRepository,
  CreateNotificationInput,
} from '@/lib/repositories/notification.repository';
import { emitNotification, NotificationPayload } from '@/lib/notifications/emitter';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError } from '@/lib/services/utils';

/**
 * Simplified notification data for API responses
 */
export interface NotificationData {
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
 * Notification service for handling business logic
 */
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository = notificationRepository
  ) {}

  /**
   * Transform database notification to API format
   */
  private toNotificationData(notification: Notification): NotificationData {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      metadata: notification.metadata as Record<string, unknown> | null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Transform database notification to SSE payload format
   */
  private toNotificationPayload(notification: Notification): NotificationPayload {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl ?? undefined,
      actionLabel: notification.actionLabel ?? undefined,
      resourceType: notification.resourceType ?? undefined,
      resourceId: notification.resourceId ?? undefined,
      metadata: notification.metadata as Record<string, unknown> | undefined,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Create a notification and emit it via SSE to connected clients
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<ServiceResult<NotificationData>> {
    return withServiceError('create notification', async () => {
      const notification = await this.repository.create(input);
      
      // Emit to connected SSE clients for real-time updates (via PubSub)
      await emitNotification(input.userId, this.toNotificationPayload(notification));
      
      return this.toNotificationData(notification);
    });
  }

  /**
   * Create a resume generated notification
   */
  async notifyResumeGenerated(
    userId: string,
    resumeId: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<ServiceResult<NotificationData>> {
    const title = jobTitle && companyName
      ? `Resume for ${jobTitle} at ${companyName}`
      : 'Resume Generated';

    return this.createNotification({
      userId,
      type: 'RESUME_GENERATED',
      title,
      message: 'Your optimized resume is ready to view and download.',
      actionUrl: `/resumes/${resumeId}/edit`,
      actionLabel: 'View Resume',
      resourceType: 'resume',
      resourceId: resumeId,
      metadata: { jobTitle, companyName },
    });
  }

  /**
   * Create a cover letter generated notification
   */
  async notifyCoverLetterGenerated(
    userId: string,
    coverLetterId: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<ServiceResult<NotificationData>> {
    const title = jobTitle && companyName
      ? `Cover Letter for ${jobTitle} at ${companyName}`
      : 'Cover Letter Generated';

    return this.createNotification({
      userId,
      type: 'COVER_LETTER_GENERATED',
      title,
      message: 'Your cover letter is ready to view and edit.',
      actionUrl: `/cover-letters/${coverLetterId}`,
      actionLabel: 'View Cover Letter',
      resourceType: 'cover-letter',
      resourceId: coverLetterId,
      metadata: { jobTitle, companyName },
    });
  }

  /**
   * Create a system notification
   */
  async notifySystem(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Promise<ServiceResult<NotificationData>> {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      actionUrl,
      actionLabel,
    });
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    options?: { limit?: number; includeRead?: boolean }
  ): Promise<ServiceResult<NotificationData[]>> {
    return withServiceError('fetch notifications', async () => {
      const notifications = await this.repository.findByUserId(userId, options);
      return notifications.map((n) => this.toNotificationData(n));
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<ServiceResult<{ count: number }>> {
    return withServiceError('fetch unread count', async () => {
      const count = await this.repository.getUnreadCount(userId);
      return { count };
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    id: string,
    userId: string
  ): Promise<ServiceResult<NotificationData>> {
    return withServiceError('mark notification as read', async () => {
      const notification = await this.repository.markAsRead(id, userId);
      if (!notification) {
        throw new NotFoundError('Notification');
      }
      return this.toNotificationData(notification);
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<ServiceResult<{ count: number }>> {
    return withServiceError('mark all notifications as read', async () => {
      return await this.repository.markAllAsRead(userId);
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    id: string,
    userId: string
  ): Promise<ServiceResult<{ deleted: boolean }>> {
    return withServiceError('delete notification', async () => {
      const deleted = await this.repository.delete(id, userId);
      if (!deleted) {
        throw new NotFoundError('Notification');
      }
      return { deleted: true };
    });
  }

  /**
   * Clean up old read notifications
   */
  async cleanupOldNotifications(
    userId: string,
    daysOld: number = 30
  ): Promise<ServiceResult<{ count: number }>> {
    return withServiceError('cleanup notifications', async () => {
      return await this.repository.deleteOldNotifications(userId, daysOld);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
