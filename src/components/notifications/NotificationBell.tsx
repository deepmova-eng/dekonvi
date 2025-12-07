import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDrawer from './NotificationDrawer';

export default function NotificationBell() {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="notification-bell"
            >
                <Bell />
                {unreadCount > 0 && (
                    <div className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </button>

            <NotificationDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
