import type { NotificationType } from '@prisma/client';

/**
 * Notification payload structure for SSE events
 */
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
