import type { NotificationType } from '@prisma/client';
import type { NotificationPayload } from '@/lib/notifications/emitter';
import type { NotificationServiceData } from '@/lib/services/types';

export type DbNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  createdAt: Date;
};

export function toNotificationData(notification: DbNotification): NotificationServiceData {
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

export function toNotificationPayload(notification: DbNotification): NotificationPayload {
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
