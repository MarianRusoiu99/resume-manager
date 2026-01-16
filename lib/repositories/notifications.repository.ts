import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import { TransactionClient } from '@/lib/db/transaction';
import type { INotificationRepository, NotificationData, CreateNotificationInput, FindNotificationsOptions } from './interfaces/notifications.repository.interface';

/**
 * Repository for managing notifications in the database
 * 
 * Implements INotificationRepository for data access abstraction.
 */
export class NotificationRepository 
  extends GenericUserOwnedRepository<NotificationData, CreateNotificationInput, Partial<NotificationData>>
  implements INotificationRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('notification', dbClient);
  }

  /**
   * Create a new notification
   */
  override async create(data: CreateNotificationInput, tx?: TransactionClient): Promise<NotificationData> {
    return this.getDelegate(tx).create({
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
    args?: Omit<PrismaArgs, 'data'>,
    tx?: TransactionClient
  ): Promise<NotificationData[]> {
    return this.getDelegate(tx).findMany({
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
    options?: FindNotificationsOptions,
    tx?: TransactionClient
  ): Promise<NotificationData[]> {
    const { limit = 50, includeRead = true } = options || {};

    return this.findAllForUser(userId, {
      where: {
        ...(includeRead ? {} : { isRead: false }),
      },
      take: limit,
    }, tx);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string, tx?: TransactionClient): Promise<number> {
    return this.getDelegate(tx).count({
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
  async markAsRead(id: string, userId: string, tx?: TransactionClient): Promise<NotificationData | null> {
    const notification = await this.findById(id, userId, tx);

    if (!notification) {
      return null;
    }

    return this.update(id, { isRead: true }, userId, tx);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, tx?: TransactionClient): Promise<{ count: number }> {
    const result = await (this.getDelegate(tx) as any).updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  override async delete(id: string, userId?: string, tx?: TransactionClient): Promise<NotificationData> {
    return this.getDelegate(tx).delete({
      where: { id, ...(userId ? { userId } : {}) },
    }) as Promise<NotificationData>;
  }

  /**
   * Delete all read notifications older than specified days
   */
  async deleteOldNotifications(userId: string, daysOld: number = 30, tx?: TransactionClient): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await (this.getDelegate(tx) as any).deleteMany({
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
  override async findById(id: string, userId?: string, tx?: TransactionClient): Promise<NotificationData | null> {
    return this.getDelegate(tx).findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    }) as Promise<NotificationData | null>;
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
