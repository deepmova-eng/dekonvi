import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBadgeProps {
  sellerId?: string;
  count?: number;
}

export default function NotificationBadge({ sellerId, count }: NotificationBadgeProps) {
  const { unreadCount: notificationCount } = useNotifications();

  // Use provided count if available, otherwise use notification count
  const displayCount = count !== undefined ? count : notificationCount;

  if (displayCount === 0) return null;

  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 animate-pulse">
      {displayCount > 99 ? '99+' : displayCount}
    </div>
  );
}