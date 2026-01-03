'use server'

import { notificationService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';

/**
 * Get all notifications for the current user
 */
export const getNotifications = withServerAction(
    'getNotifications',
    async (session, options?: { limit?: number; includeRead?: boolean }) => {
        return notificationService.getNotifications(session.user.id, options);
    },
    { resourceType: 'notification' }
);

/**
 * Get unread notification count
 */
export const getUnreadCount = withServerAction(
    'getUnreadCount',
    async (session) => notificationService.getUnreadCount(session.user.id),
    { resourceType: 'notification' }
);

/**
 * Mark a notification as read
 */
export const markAsRead = withServerAction(
    'markAsRead',
    async (session, notificationId: string) => {
        return notificationService.markAsRead(notificationId, session.user.id);
    },
    {
        auditAction: 'SETTINGS_UPDATE', // Reusing valid audit action for now
        resourceType: 'notification',
    }
);

/**
 * Mark all notifications as read
 */
export const markAllAsRead = withServerAction(
    'markAllAsRead',
    async (session) => notificationService.markAllAsRead(session.user.id),
    {
        auditAction: 'SETTINGS_UPDATE', // Reusing valid audit action for now
        resourceType: 'notification',
    }
);

/**
 * Delete a notification
 */
export const deleteNotification = withServerAction(
    'deleteNotification',
    async (session, notificationId: string) => {
        return notificationService.deleteNotification(notificationId, session.user.id);
    },
    {
        auditAction: 'SETTINGS_UPDATE', // Reusing valid audit action for now
        resourceType: 'notification',
    }
);
