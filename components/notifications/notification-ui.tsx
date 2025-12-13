'use client';

import React from 'react';
import { Bell, Download, FileText, Mail, User } from 'lucide-react';
import type { Notification } from '@/lib/contexts';

const notificationTypeIcon: Record<Notification['type'], React.ReactNode> = {
  RESUME_GENERATED: <FileText className="h-4 w-4 text-blue-500" />,
  COVER_LETTER_GENERATED: <Mail className="h-4 w-4 text-green-500" />,
  PROFILE_UPDATED: <User className="h-4 w-4 text-purple-500" />,
  EXPORT_COMPLETE: <Download className="h-4 w-4 text-orange-500" />,
  SYSTEM: <Bell className="h-4 w-4 text-gray-500" />,
};

export function getNotificationIcon(type: Notification['type']): React.ReactNode {
  return notificationTypeIcon[type] ?? notificationTypeIcon.SYSTEM;
}
