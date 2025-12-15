import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notification.service';
import { createApiHandler } from '@/lib/api-handler';
import { notificationActionSchema, notificationQuerySchema } from '@/lib/validations/api-schemas';

/**
 * GET /api/notifications - Get all notifications for the current user
 */
export const GET = createApiHandler(async (request, context, session) => {
  const { searchParams } = new URL(request.url);
  const params = notificationQuerySchema.parse({
    limit: searchParams.get('limit') ?? undefined,
    includeRead: searchParams.get('includeRead') ?? undefined,
  });

  const result = await notificationService.getNotifications(session.user.id, {
    limit: params.limit,
    includeRead: params.includeRead,
  });

    if (!result.success) {
      return result;
    }


  const countResult = await notificationService.getUnreadCount(session.user.id);

  return NextResponse.json({
    notifications: result.data,
    unreadCount: countResult.success ? countResult.data.count : 0,
  });
});

/**
 * POST /api/notifications - Mark all notifications as read or cleanup
 */
export const POST = createApiHandler(
  async (request, context, session, body) => {
    const { action, daysOld } = body!;

    if (action === 'markAllRead') {
      const result = await notificationService.markAllAsRead(session.user.id);

      if (!result.success) {
        return result;
      }

      return NextResponse.json({
        message: `Marked ${result.data.count} notifications as read`,
      });
    }

    const result = await notificationService.cleanupOldNotifications(session.user.id, daysOld ?? 30);

    if (!result.success) {
      return result;
    }

    return NextResponse.json({
      message: `Deleted ${result.data.count} old notifications`,
    });
  },
  { bodySchema: notificationActionSchema }
);

