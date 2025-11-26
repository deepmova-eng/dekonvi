import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationList from './NotificationList';

export default function NotificationBell() {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
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

            {isOpen && <NotificationList onClose={() => setIsOpen(false)} />}
        </div>
    );
}
