import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

// Group notifications by date categories
function groupNotificationsByDate(notifications: Notification[]) {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const older: Notification[] = [];

    notifications.forEach(notif => {
        const date = new Date(notif.created_at);
        if (isToday(date)) {
            today.push(notif);
        } else if (isYesterday(date)) {
            yesterday.push(notif);
        } else if (isThisWeek(date)) {
            thisWeek.push(notif);
        } else {
            older.push(notif);
        }
    });

    return { today, yesterday, thisWeek, older };
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const navigate = useNavigate();

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const grouped = groupNotificationsByDate(notifications);

    if (!isOpen) return null;

    const drawerContent = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-[9998]"
                onClick={onClose}
                style={{ animation: isOpen ? 'fadeIn 0.2s ease-out' : undefined }}
            />

            {/* Drawer Panel */}
            <div
                className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-[9999] flex flex-col"
                style={{
                    animation: isOpen ? 'slideInRight 0.3s ease-out' : undefined
                }}
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-none">
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <div className="flex items-center gap-3">
                        {notifications.length > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                            <div className="text-6xl mb-4">🔔</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune notification</h3>
                            <p className="text-sm text-gray-500">Vous êtes à jour ! 🎉</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {/* Today Section */}
                            {grouped.today.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-3 bg-gray-50">
                                        Aujourd'hui
                                    </h3>
                                    {grouped.today.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onClick={() => handleNotificationClick(notif)}
                                            onDelete={(e) => handleDelete(e, notif.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Yesterday Section */}
                            {grouped.yesterday.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-3 bg-gray-50">
                                        Hier
                                    </h3>
                                    {grouped.yesterday.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onClick={() => handleNotificationClick(notif)}
                                            onDelete={(e) => handleDelete(e, notif.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* This Week Section */}
                            {grouped.thisWeek.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-3 bg-gray-50">
                                        Cette semaine
                                    </h3>
                                    {grouped.thisWeek.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onClick={() => handleNotificationClick(notif)}
                                            onDelete={(e) => handleDelete(e, notif.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Older Section */}
                            {grouped.older.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-3 bg-gray-50">
                                        Plus ancien
                                    </h3>
                                    {grouped.older.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onClick={() => handleNotificationClick(notif)}
                                            onDelete={(e) => handleDelete(e, notif.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Inline animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );

    return createPortal(drawerContent, document.body);
}

// Notification Item Component
interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
    const isUnread = !notification.read;

    return (
        <div
            className={`
                relative flex items-start gap-4 px-6 py-4 border-b border-gray-100 cursor-pointer transition-colors
                ${isUnread ? 'bg-blue-50/50 hover:bg-blue-100/50' : 'bg-white hover:bg-gray-50'}
            `}
            onClick={onClick}
        >
            {/* Icon */}
            <div className={`
                flex-none h-10 w-10 rounded-full flex items-center justify-center
                ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
            `}>
                <span className="text-lg">
                    {notification.type === 'premium' ? '🚀' :
                        notification.type === 'message' ? '💬' : '🔔'}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {notification.content}
                </p>
                <span className="text-xs text-gray-400 mt-1 block">
                    {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: fr
                    })}
                </span>
            </div>

            {/* Unread indicator */}
            {isUnread && (
                <div className="absolute top-5 right-12 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            )}

            {/* Delete button */}
            <button
                onClick={onDelete}
                className="flex-none p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Supprimer"
            >
                <X size={16} />
            </button>
        </div>
    );
}
