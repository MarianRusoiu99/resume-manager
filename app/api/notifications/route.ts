import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notification.service';
import { createApiHandler } from '@/lib/api-handler';
import { z } from 'zod';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  includeRead: z.coerce.boolean().default(true),
});

/**
 * GET /api/notifications - Get all notifications for the current user
 */
export const GET = createApiHandler(async (request, context, session) => {
  const { searchParams } = new URL(request.url);
  const params = querySchema.parse({
    limit: searchParams.get('limit') || '50',
    includeRead: searchParams.get('includeRead') !== 'false',
  });

  const result = await notificationService.getNotifications(session.user.id, {
    limit: params.limit,
    includeRead: params.includeRead,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const countResult = await notificationService.getUnreadCount(session.user.id);

  return NextResponse.json({
    notifications: result.data,
    unreadCount: countResult.success ? countResult.data.count : 0,
  });
});

// Action schema for POST requests
const actionSchema = z.object({
  action: z.enum(['markAllRead', 'cleanup']),
  daysOld: z.number().min(1).max(365).optional(),
});

/**
 * POST /api/notifications - Mark all notifications as read or cleanup
 */
export const POST = createApiHandler(async (request, context, session) => {
  const body = await request.json();
  const { action, daysOld } = actionSchema.parse(body);

  if (action === 'markAllRead') {
    const result = await notificationService.markAllAsRead(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${result.data.count} notifications as read`,
    });
  }

  if (action === 'cleanup') {
    const result = await notificationService.cleanupOldNotifications(
      session.user.id,
      daysOld ?? 30
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.data.count} old notifications`,
    });
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
});
