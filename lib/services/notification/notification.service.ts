import {
  notificationRepository,
  NotificationRepository,
} from '@/lib/repositories/notification.repository';
import type { CreateNotificationInput, NotificationData } from '@/lib/repositories/interfaces';
import { emitNotification } from '@/lib/notifications/emitter';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError, GenericUserOwnedCrudService } from '@/lib/services/utils';
import type {
  INotificationService,
  NotificationServiceData,
} from '@/lib/services/interfaces/notification.service.interface';
import { toNotificationData, toNotificationPayload, type DbNotification } from './transform';

/**
 * Notification service for handling business logic.
 *
 * Split into a dedicated module so the root `notification.service.ts` can be a
 * stable facade and avoid mixing transform + emit + CRUD details.
 */
export class NotificationService 
  extends GenericUserOwnedCrudService<NotificationData, CreateNotificationInput, any, NotificationRepository>
  implements INotificationService 
{
  constructor(repository: NotificationRepository = notificationRepository) {
    super(repository, 'Notification');
  }


  async createNotification(
    input: CreateNotificationInput
  ): Promise<ServiceResult<NotificationServiceData>> {
    const result = await this.create(input as any);
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
    actionLabel?: string
  ): Promise<ServiceResult<NotificationServiceData>> {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      actionUrl,
      actionLabel,
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
