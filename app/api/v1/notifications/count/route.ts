import { notificationService } from '@/lib/services';
import { createApiHandler } from '@/lib/api/handler';
import { success } from '@/lib/types/service-result';

/**
 * GET /api/notifications/count - Get unread notification count
 * Lightweight endpoint for polling
 */
export const GET = createApiHandler(async (request, context, session) => {
  const result = await notificationService.getUnreadCount(session.user.id);

  if (!result.success) {
    return result;
  }

  return success({
    count: result.data.count,
  });
});
