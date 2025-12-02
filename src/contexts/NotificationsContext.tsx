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
                // Fetch all notifications for the user
                const { data: allNotifications, error } = await supabase
                    .from('notifications' as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                // 🔥 FIX: Filter out message notifications from soft-deleted conversations
                // BUT allow "resurrected" conversations (new messages after deletion)
                let filteredNotifications = allNotifications || [];

                if (filteredNotifications.length > 0) {
                    // Get conversation deletions WITH deletion dates
                    const { data: deletedConvs } = await (supabase as any)
                        .from('conversation_deletions')
                        .select('conversation_id, deleted_at')
                        .eq('user_id', user.id);

                    // Create map of conversation_id -> deleted_at
                    const deletionDates = new Map(
                        deletedConvs?.map((d: any) => [d.conversation_id, d.deleted_at]) || []
                    );

                    // Filter out notifications for deleted conversations
                    // UNLESS the notification is newer than the deletion (resurrected conversation)
                    filteredNotifications = filteredNotifications.filter(notification => {
                        // Keep non-message notifications
                        if (notification.type !== 'message') return true;

                        // For message notifications, check if conversation is deleted
                        // Extract conversation ID from link (format: /messages?conversation=XYZ)
                        if (notification.link) {
                            const match = notification.link.match(/[?&]conversation(?:Id)?=([^&]*)/);
                            if (match && match[1]) {
                                const convId = match[1];
                                const deletedAt = deletionDates.get(convId);

                                // If not deleted, keep it
                                if (!deletedAt) return true;

                                // 🔥 RESURRECTION CHECK: If notification is AFTER deletion, keep it
                                // This handles cases where user deletes a conversation but then receives new messages
                                const notifDate = new Date(notification.created_at);
                                const deleteDate = new Date(deletedAt);

                                if (notifDate > deleteDate) {
                                    // console.log('📨 [Notifications] Resurrected conversation:', convId);
                                    return true; // Keep - conversation was resurrected
                                }

                                // Otherwise, hide it (deleted and no new activity)
                                return false;
                            }
                        }

                        return true; // Keep if we can't extract conversation ID
                    });
                }

                setNotifications(filteredNotifications);
                setUnreadCount(filteredNotifications.filter(n => !n.read).length);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to real-time changes with wildcard approach
        const channel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes' as any,  // Bypass strict typing
                {
                    event: '*',  // Listen to all events
                    schema: 'public',
                    table: 'notifications',
                    // NO FILTER - Manual client-side filtering to avoid binding mismatch
                } as any,
                async (payload: any) => {  // Made async to allow await
                    // Client-side filtering: only process notifications for this user
                    const notification = payload.new || payload.old
                    if (!notification || notification.user_id !== user.id) {
                        return  // Ignore notifications for other users
                    }

                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification;

                        // 🔥 FIX: Check if this notification is for a deleted conversation
                        if (newNotification.type === 'message' && newNotification.link) {
                            const match = newNotification.link.match(/[?&]conversation(?:Id)?=([^&]*)/);
                            if (match && match[1]) {
                                const convId = match[1];

                                // Check if conversation is deleted
                                const { data: deletion } = await (supabase as any)
                                    .from('conversation_deletions')
                                    .select('id')
                                    .eq('conversation_id', convId)
                                    .eq('user_id', user.id)
                                    .maybeSingle();

                                // Skip this notification if conversation is deleted
                                if (deletion) {
                                    console.log('🔕 [Notifications] Skipping notification from deleted conversation:', convId);
                                    return;
                                }
                            }
                        }

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

        // 🔥 POLLING BACKUP: Refetch notifications every 10 seconds as backup to Realtime
        // This ensures badge updates even if Realtime has issues
        const pollingInterval = setInterval(() => {
            fetchNotifications();
        }, 10000); // 10 seconds

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollingInterval);
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
