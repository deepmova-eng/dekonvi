import { useNotificationsContext } from '../contexts/NotificationsContext';

export type { Notification } from '../contexts/NotificationsContext';

export function useNotifications() {
    return useNotificationsContext();
}
