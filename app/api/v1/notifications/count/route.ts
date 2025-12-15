import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notification.service';
import { createApiHandler } from '@/lib/api-handler';

/**
 * GET /api/notifications/count - Get unread notification count
 * Lightweight endpoint for polling
 */
export const GET = createApiHandler(async (request, context, session) => {
  const result = await notificationService.getUnreadCount(session.user.id);

  if (!result.success) {
    return result;
  }

  return NextResponse.json({
    count: result.data.count,
  });
});
