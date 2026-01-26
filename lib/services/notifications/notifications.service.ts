import {
  notificationRepository,
  NotificationRepository,
} from '@/lib/repositories/notifications.repository';
import type { CreateNotificationInput, NotificationData } from '@/lib/repositories/interfaces';
import { emitNotification } from '@/lib/notifications/emitter';
import { type ServiceResult } from '@/lib/types';
import { withServiceError, NotFoundError, GenericUserOwnedCrudService } from '@/lib/services/utils';
import { toNotificationData, toNotificationPayload, type DbNotification } from './transform';
import { NotificationType } from '@prisma/client';

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
  createNotification(input: CreateNotificationServiceInput): Promise<ServiceResult<NotificationServiceData>>;
  notifyResumeGenerated(userId: string, resumeId: string, jobTitle?: string, companyName?: string): Promise<ServiceResult<NotificationServiceData>>;
  notifyCoverLetterGenerated(userId: string, coverLetterId: string, jobTitle?: string, companyName?: string): Promise<ServiceResult<NotificationServiceData>>;
  notifySystem(userId: string, title: string, message: string, actionUrl?: string, actionLabel?: string): Promise<ServiceResult<NotificationServiceData>>;
  getNotifications(userId: string, options?: GetNotificationsOptions): Promise<ServiceResult<NotificationServiceData[]>>;
  getUnreadCount(userId: string): Promise<ServiceResult<{ count: number }>>;
  markAsRead(id: string, userId: string): Promise<ServiceResult<NotificationServiceData>>;
  markAllAsRead(userId: string): Promise<ServiceResult<{ count: number }>>;
  deleteNotification(id: string, userId: string): Promise<ServiceResult<{ deleted: boolean }>>;
  cleanupOldNotifications(userId: string, daysOld?: number): Promise<ServiceResult<{ count: number }>>;
}

/**
 * Notification service for handling business logic.
 */
export class NotificationService 
  extends GenericUserOwnedCrudService<NotificationData, CreateNotificationInput, Partial<NotificationData>, Record<string, unknown>, NotificationRepository>
  implements INotificationService 
{
  constructor(repository: NotificationRepository = notificationRepository) {
    super(repository, 'Notification');
  }


  async createNotification(
    input: CreateNotificationInput
  ): Promise<ServiceResult<NotificationServiceData>> {
    const dataToCreate = {
      ...input,
      actionUrl: input.actionUrl || (input.metadata as Record<string, unknown> | undefined)?.url as string | undefined || undefined,
    };
    const result = await this.create(dataToCreate as CreateNotificationInput & { userId: string });
    if (result.success) {
      const notification = result.data as unknown as DbNotification;
      await emitNotification(input.userId, toNotificationPayload(notification));
      return {
        success: true,
        data: toNotificationData(notification)
      };
    }
    return result as ServiceResult<NotificationServiceData>;
  }

  async notifyResumeGenerated(
    userId: string,
    resumeId: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<ServiceResult<NotificationServiceData>> {
    const title = jobTitle && companyName ? `Resume for ${jobTitle} at ${companyName}` : 'Resume Generated';

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

  async notifyCoverLetterGenerated(
    userId: string,
    coverLetterId: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<ServiceResult<NotificationServiceData>> {
    const title =
      jobTitle && companyName
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

  async notifySystem(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string,
    metadata?: Record<string, unknown>
  ): Promise<ServiceResult<NotificationServiceData>> {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      actionUrl,
      actionLabel,
      metadata,
    });
  }

  async getNotifications(
    userId: string,
    options?: { limit?: number; includeRead?: boolean }
  ): Promise<ServiceResult<NotificationServiceData[]>> {
    return withServiceError('fetch notifications', async () => {
      const notifications = (await this.repository.findAllForUser(userId, {
        where: {
          ...(options?.includeRead ? {} : { isRead: false }),
        },
        take: options?.limit || 50,
      })) as DbNotification[];
      return notifications.map((n) => toNotificationData(n));
    });
  }

  async getUnreadCount(userId: string): Promise<ServiceResult<{ count: number }>> {
    return withServiceError('fetch unread count', async () => {
      const count = await this.repository.getUnreadCount(userId);
      return { count };
    });
  }

  async markAsRead(id: string, userId: string): Promise<ServiceResult<NotificationServiceData>> {
    const result = await withServiceError('mark notification as read', async () => {
      const notification = (await this.repository.markAsRead(id, userId)) as DbNotification | null;
      if (!notification) {
        throw new NotFoundError('Notification');
      }
      return notification;
    });

    if (result.success) {
      return {
        success: true,
        data: toNotificationData(result.data)
      };
    }
    return result as ServiceResult<NotificationServiceData>;
  }

  async markAllAsRead(userId: string): Promise<ServiceResult<{ count: number }>> {
    return withServiceError('mark all notifications as read', async () => {
      return await this.repository.markAllAsRead(userId);
    });
  }

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

  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<ServiceResult<{ count: number }>> {
    return withServiceError('cleanup notifications', async () => {
      return await this.repository.deleteOldNotifications(userId, daysOld);
    });
  }
}

export const notificationService = new NotificationService();
