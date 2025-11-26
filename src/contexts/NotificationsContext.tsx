import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export interface Notification {
    id: string;
    user_id: string;
    type: 'message' | 'system' | 'alert' | 'premium';
    title: string;
    content: string;
    link: string | null;
    read: boolean;
    created_at: string;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    setCurrentConversationId: (id: string | null) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useSupabaseAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

    const notificationsRef = React.useRef(notifications);
    const currentConversationIdRef = React.useRef(currentConversationId);

    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    useEffect(() => {
        currentConversationIdRef.current = currentConversationId;
    }, [currentConversationId]);

    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications' as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                setNotifications(data || []);
                setUnreadCount(data?.filter(n => !n.read).length || 0);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification;

                        // Check if user is currently viewing this conversation
                        const currentPath = window.location.pathname;
                        const isViewingConversation = newNotification.type === 'message' &&
                            newNotification.link &&
                            currentPath.includes('/messages') &&
                            newNotification.link.includes(currentPath.split('/messages')[1] || 'nothing'); // Simple check, can be improved

                        // Better check: extract conversation ID from link and compare with URL
                        let shouldNotify = true;
                        if (newNotification.type === 'message' && newNotification.link) {
                            // Extract conversation ID from link (format: /messages?conversation=XYZ)
                            // Try both 'conversation' and 'conversationId' to be safe
                            const match = newNotification.link.match(/[?&]conversation(?:Id)?=([^&]*)/);

                            if (match && match[1]) {
                                const notifConversationId = match[1];
                                console.log('[Notifications] Checking suppression:', {
                                    current: currentConversationIdRef.current,
                                    incoming: notifConversationId,
                                    link: newNotification.link
                                });

                                if (currentConversationIdRef.current === notifConversationId) {
                                    shouldNotify = false;
                                    console.log('[Notifications] Suppressed notification for active conversation');
                                }
                            }
                        }

                        if (shouldNotify) {
                            setNotifications(prev => [newNotification, ...prev]);
                            setUnreadCount(prev => prev + 1);

                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(newNotification.title, {
                                    body: newNotification.content,
                                    icon: '/favicon.ico'
                                });
                            }

                            toast(newNotification.content, {
                                icon: '🔔',
                                duration: 4000
                            });
                        } else {
                            // Add as read without notifying
                            setNotifications(prev => [{ ...newNotification, read: true }, ...prev]);

                            // Mark as read in DB
                            supabase
                                .from('notifications' as any)
                                .update({ read: true })
                                .eq('id', newNotification.id)
                                .then();
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotification = payload.new as Notification;

                        // Use ref to get current notifications state
                        const currentNotifications = notificationsRef.current;
                        const oldNotif = currentNotifications.find(n => n.id === updatedNotification.id);

                        setNotifications(prev =>
                            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
                        );

                        // Recalculate unread count based on the change
                        if (oldNotif && !oldNotif.read && updatedNotification.read) {
                            setUnreadCount(prev => Math.max(0, prev - 1));
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;

                        // Use ref to get current notifications state
                        const currentNotifications = notificationsRef.current;
                        const deletedNotif = currentNotifications.find(n => n.id === deletedId);

                        setNotifications(prev => prev.filter(n => n.id !== deletedId));

                        if (deletedNotif && !deletedNotif.read) {
                            setUnreadCount(prev => Math.max(0, prev - 1));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const { error } = await supabase
                .from('notifications' as any)
                .update({ read: true })
                .eq('id', id);

            if (error) {
                // Revert on error
                throw error;
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update could be added here, but for now we just log
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('notifications' as any)
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        // Recalculate unread count if the deleted notification was unread
        // We need to find it in the current state (before update)
        // But setNotifications is async/batched, so we can't access "prev" easily outside.
        // However, we can use the ref or the current state variable 'notifications'
        // Since this function is a closure, 'notifications' might be stale if not careful, 
        // but we are inside the component, so 'notifications' is from the render scope.
        // To be safe, let's use the ref or just assume we need to decrement if we find it.

        const deletedNotif = notifications.find(n => n.id === id);
        if (deletedNotif && !deletedNotif.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            const { error } = await supabase
                .from('notifications' as any)
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Erreur lors de la suppression');
            // Revert optimistic update
            const deletedNotif = notificationsRef.current.find(n => n.id === id);
            if (deletedNotif) {
                setNotifications(prev => [...prev, deletedNotif].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ));
                if (!deletedNotif.read) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        }
    };

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            currentConversationId,
            setCurrentConversationId
        }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        console.warn('useNotificationsContext used outside of provider, returning defaults');
        return {
            notifications: [],
            unreadCount: 0,
            loading: false,
            markAsRead: async () => { },
            markAllAsRead: async () => { },
            deleteNotification: async () => { },
            setCurrentConversationId: () => { }
        };
    }
    return context;
}
