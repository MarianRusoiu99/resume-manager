import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notification.service';
import { createApiHandler } from '@/lib/api-handler';

/**
 * PATCH /api/notifications/[id] - Mark a notification as read
 */
export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await notificationService.markAsRead(id, session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.code === 'NOT_FOUND' ? 404 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    notification: result.data,
  });
});

/**
 * DELETE /api/notifications/[id] - Delete a notification
 */
export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await notificationService.deleteNotification(id, session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.code === 'NOT_FOUND' ? 404 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Notification deleted',
  });
});
