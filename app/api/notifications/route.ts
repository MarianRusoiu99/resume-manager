import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { notificationService } from '@/lib/services/notification.service';

/**
 * GET /api/notifications - Get all notifications for the current user
 * Query params:
 *   - limit: number of notifications to return (default: 50)
 *   - includeRead: whether to include read notifications (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const includeRead = searchParams.get('includeRead') !== 'false';

    const result = await notificationService.getNotifications(session.userId, {
      limit,
      includeRead,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Also get unread count
    const countResult = await notificationService.getUnreadCount(session.userId);

    return NextResponse.json({
      notifications: result.data,
      unreadCount: countResult.data?.count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const body = await request.json();

    // Action-based endpoint
    const { action } = body;

    if (action === 'markAllRead') {
      const result = await notificationService.markAllAsRead(session.userId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Marked ${result.data?.count} notifications as read`,
      });
    }

    if (action === 'cleanup') {
      const daysOld = body.daysOld || 30;
      const result = await notificationService.cleanupOldNotifications(
        session.userId,
        daysOld
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.data?.count} old notifications`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: markAllRead, cleanup' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing notification action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
