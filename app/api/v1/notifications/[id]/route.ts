import { notificationService } from '@/lib/services/notification.service';
import { createApiHandler } from '@/lib/api-handler';
import { success } from '@/lib/types/service-result';

/**
 * PATCH /api/notifications/[id] - Mark a notification as read
 */
export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await notificationService.markAsRead(id, session.user.id);

  if (!result.success) {
    return result;
  }

  return success({ notification: result.data });
});

/**
 * DELETE /api/notifications/[id] - Delete a notification
 */
export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await notificationService.deleteNotification(id, session.user.id);

  if (!result.success) {
    return result;
  }

  return success({ message: 'Notification deleted' });
});
