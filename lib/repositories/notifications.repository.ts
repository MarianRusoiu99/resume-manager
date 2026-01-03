import { PrismaClient, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import type { INotificationRepository, NotificationData, CreateNotificationInput, FindNotificationsOptions } from './interfaces/notifications.repository.interface';

/**
 * Repository for managing notifications in the database
 * 
 * Implements INotificationRepository for data access abstraction.
 */
export class NotificationRepository 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TPrismaDelegate requires dynamic Prisma types
  extends GenericUserOwnedRepository<NotificationData, CreateNotificationInput, Partial<NotificationData>, any>
  implements INotificationRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('notification', dbClient);
  }

  /**
   * Create a new notification
   */
  override async create(data: CreateNotificationInput): Promise<NotificationData> {
    return this.db.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        metadata: data.metadata as Prisma.InputJsonValue,
        expiresAt: data.expiresAt,
      },
    }) as Promise<NotificationData>;
  }

  /**
   * Find all notifications for a user
   */
  override async findAllForUser(
    userId: string,
    args?: Omit<PrismaArgs, 'data'>
  ): Promise<NotificationData[]> {
    return this.db.notification.findMany({
      ...args,
      where: {
        ...args?.where,
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: args?.orderBy || { createdAt: 'desc' },
    }) as Promise<NotificationData[]>;
  }

  /**
   * Find all notifications for a user with options
   */
  async findByUserId(
    userId: string,
    options?: FindNotificationsOptions
  ): Promise<NotificationData[]> {
    const { limit = 50, includeRead = true } = options || {};

    return this.findAllForUser(userId, {
      where: {
        ...(includeRead ? {} : { isRead: false }),
      },
      take: limit,
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.db.notification.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string, userId: string): Promise<NotificationData | null> {
    const notification = await this.findById(id, userId);

    if (!notification) {
      return null;
    }

    return this.update(id, { isRead: true }, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  override async delete(id: string, userId?: string): Promise<NotificationData> {
    return this.db.notification.delete({
      where: { id, ...(userId ? { userId } : {}) },
    }) as Promise<NotificationData>;
  }

  /**
   * Delete all read notifications older than specified days
   */
  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.db.notification.deleteMany({
      where: {
        userId,
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });

    return { count: result.count };
  }

  /**
   * Find notification by ID
   */
  override async findById(id: string, userId?: string): Promise<NotificationData | null> {
    return this.db.notification.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    }) as Promise<NotificationData | null>;
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
