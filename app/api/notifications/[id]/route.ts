import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { notificationService } from '@/lib/services/notification.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id] - Mark a notification as read
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession();
    const { id } = await params;

    const result = await notificationService.markAsRead(id, session.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: result.data,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id] - Delete a notification
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession();
    const { id } = await params;

    const result = await notificationService.deleteNotification(id, session.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
