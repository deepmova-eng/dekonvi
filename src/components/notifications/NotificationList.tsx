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
        <div className="
            /* Mobile: Fixed full-width */
            fixed left-4 right-4 top-20 z-50
            max-h-[80vh] overflow-y-auto
            
            /* Desktop: Absolute dropdown */
            md:absolute md:right-0 md:top-full md:left-auto md:w-96 md:mt-2
            
            /* Common styling */
            bg-white rounded-xl shadow-2xl border border-gray-100
        ">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                    <button onClick={() => markAllAsRead()} className="text-sm text-blue-600 font-semibold hover:text-blue-700">
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
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4 px-4">Nouveau</h4>
                                {notifications.filter(n => !n.read).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="flex items-start gap-4 p-4 border-b border-gray-50 bg-blue-50 hover:bg-blue-100 transition-colors relative"
                                    >
                                        {/* 1. COLUMN LEFT: Icon Circle */}
                                        <div className="flex-none h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                                            <span className="text-lg">
                                                {notification.type === 'premium' ? '🚀' :
                                                    notification.type === 'message' ? '💬' : '🔔'}
                                            </span>
                                        </div>

                                        {/* 2. COLUMN MIDDLE: Content Text */}
                                        <div
                                            className="flex-1 pr-2 cursor-pointer"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <p className="text-sm text-gray-900 font-medium leading-snug">
                                                {notification.content}
                                            </p>
                                            <span className="text-xs text-gray-400 mt-1 block">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </span>
                                        </div>

                                        {/* 3. COLUMN RIGHT: Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            className="flex-none p-1 mt-1 text-gray-400 hover:text-red-500 transition-colors"
                                            aria-label="Supprimer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        {/* Unread Indicator - Positioned relative to container */}
                                        <div className="absolute top-4 right-12 h-2 w-2 rounded-full bg-blue-500"></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Read Section */}
                        {notifications.some(n => n.read) && (
                            <div className="notification-section">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4 px-4">Plus tôt</h4>
                                {notifications.filter(n => n.read).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="flex items-start gap-4 p-4 border-b border-gray-50 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        {/* 1. COLUMN LEFT: Icon Circle */}
                                        <div className="flex-none h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
                                            <span className="text-lg">
                                                {notification.type === 'premium' ? '🚀' :
                                                    notification.type === 'message' ? '💬' : '🔔'}
                                            </span>
                                        </div>

                                        {/* 2. COLUMN MIDDLE: Content Text */}
                                        <div
                                            className="flex-1 pr-2 cursor-pointer"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <p className="text-sm text-gray-600 leading-snug">
                                                {notification.content}
                                            </p>
                                            <span className="text-xs text-gray-400 mt-1 block">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </span>
                                        </div>

                                        {/* 3. COLUMN RIGHT: Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            className="flex-none p-1 mt-1 text-gray-400 hover:text-red-500 transition-colors"
                                            aria-label="Supprimer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
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
