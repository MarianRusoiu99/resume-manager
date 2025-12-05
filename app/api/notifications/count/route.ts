import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { notificationService } from '@/lib/services/notification.service';

/**
 * GET /api/notifications/count - Get unread notification count
 * Lightweight endpoint for polling
 */
export async function GET() {
  try {
    const session = await verifySession();

    const result = await notificationService.getUnreadCount(session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      count: result.data?.count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification count' },
      { status: 500 }
    );
  }
}
