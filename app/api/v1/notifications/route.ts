import { notificationService } from '@/lib/services';
import { createApiHandler } from '@/lib/api/handler';
import { notificationActionSchema, notificationQuerySchema } from '@/lib/validations/api-schemas';
import { failure, success } from '@/lib/types/service-result';

/**
 * GET /api/notifications - Get all notifications for the current user
 */
export const GET = createApiHandler<{
  notifications: unknown;
  unreadCount: number;
}>(async (request, _context, session) => {
  const { searchParams } = new URL(request.url);
  const params = notificationQuerySchema.parse({
    limit: searchParams.get('limit') ?? undefined,
    includeRead: searchParams.get('includeRead') ?? undefined,
  });

  const notificationsResult = await notificationService.getNotifications(session.user.id, {
    limit: params.limit,
    includeRead: params.includeRead,
  });

  if (!notificationsResult.success) {
    return failure(notificationsResult.error, notificationsResult.code);
  }

  const countResult = await notificationService.getUnreadCount(session.user.id);

  return success({
    notifications: notificationsResult.data,
    unreadCount: countResult.success ? countResult.data.count : 0,
  });
});

/**
 * POST /api/notifications - Mark all notifications as read or cleanup
 */
export const POST = createApiHandler(
  async (_request, _context, session, body) => {
    const { action, daysOld } = body!;

    if (action === 'markAllRead') {
      const result = await notificationService.markAllAsRead(session.user.id);

      if (!result.success) {
        return failure(result.error, result.code);
      }

      return success({
        message: `Marked ${result.data.count} notifications as read`,
      });
    }

    const result = await notificationService.cleanupOldNotifications(session.user.id, daysOld ?? 30);

    if (!result.success) {
      return failure(result.error, result.code);
    }

    return success({
      message: `Deleted ${result.data.count} old notifications`,
    });
  },
  { bodySchema: notificationActionSchema }
);
