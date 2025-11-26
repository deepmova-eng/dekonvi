import React from 'react';
import { X, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../../notifications-messages.css';

interface NotificationListProps {
    onClose: () => void;
}

export default function NotificationList({ onClose }: NotificationListProps) {
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const navigate = useNavigate();

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

    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                    <button onClick={() => markAllAsRead()} className="mark-all-read">
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-gray-900 font-medium">Aucune notification</h3>
                        <p className="text-gray-500 text-sm">Vous êtes à jour ! 🎉</p>
                    </div>
                ) : (
                    <>
                        {/* Unread Section */}
                        {notifications.some(n => !n.read) && (
                            <div className="notification-section">
                                <h4 className="section-title">Non lues</h4>
                                {notifications.filter(n => !n.read).map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="notification-item unread"
                                    >
                                        <div className="notification-icon">
                                            {notification.type === 'premium' ? '🚀' :
                                                notification.type === 'message' ? '💬' : '🔔'}
                                        </div>
                                        <div className="notification-content">
                                            <p className="notification-text">{notification.content}</p>
                                            <span className="notification-time">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Read Section */}
                        {notifications.some(n => n.read) && (
                            <div className="notification-section">
                                <h4 className="section-title">Lues</h4>
                                {notifications.filter(n => n.read).map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="notification-item"
                                    >
                                        <div className="notification-icon">
                                            {notification.type === 'premium' ? '🚀' :
                                                notification.type === 'message' ? '💬' : '🔔'}
                                        </div>
                                        <div className="notification-content">
                                            <p className="notification-text">{notification.content}</p>
                                            <span className="notification-time">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="notification-footer">
                <button onClick={() => navigate('/notifications')} className="text-primary-600 font-semibold text-sm hover:text-primary-700">
                    Voir toutes les notifications
                </button>
            </div>
        </div>
    );
}
