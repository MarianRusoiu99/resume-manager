import { PrismaClient, Notification, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

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
 * Repository for managing notifications in the database
 */
export class NotificationRepository {
  private readonly db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationInput): Promise<Notification> {
    return this.db.notification.create({
      data: {
        user: { connect: { id: data.userId } },
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
    });
  }

  /**
   * Find all notifications for a user
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      includeRead?: boolean;
    }
  ): Promise<Notification[]> {
    const { limit = 50, includeRead = true } = options || {};

    return this.db.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { isRead: false }),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
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
  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    // First verify the notification belongs to the user
    const notification = await this.db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    return this.db.notification.update({
      where: { id },
      data: { isRead: true },
    });
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
  async delete(id: string, userId: string): Promise<boolean> {
    const notification = await this.db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return false;
    }

    await this.db.notification.delete({
      where: { id },
    });

    return true;
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
  async findById(id: string): Promise<Notification | null> {
    return this.db.notification.findUnique({
      where: { id },
    });
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
