import { apiClient } from './apiClient';
import { Notification } from '../types/notification';
import { DEMO_NOTIFICATIONS } from './demoFixtures';

export const notificationsService = {
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    if (apiClient.isDemoMode()) {
      if (unreadOnly) {
        return DEMO_NOTIFICATIONS.filter((n) => !n.readAt);
      }
      return DEMO_NOTIFICATIONS;
    }
    return apiClient.get<Notification[]>('/notifications', {
      params: { unread: unreadOnly ? 'true' : 'false' },
    });
  },

  async markAsRead(id: string): Promise<Notification> {
    if (apiClient.isDemoMode()) {
      const notif = DEMO_NOTIFICATIONS.find((n) => n.id === id);
      if (notif) {
        notif.readAt = new Date().toISOString();
        return notif;
      }
      throw new Error(`Notification ${id} not found`);
    }
    return apiClient.post<Notification>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ message?: string }> {
    if (apiClient.isDemoMode()) {
      DEMO_NOTIFICATIONS.forEach((n) => {
        n.readAt = new Date().toISOString();
      });
      return { message: 'All marked as read' };
    }
    return apiClient.post<{ message?: string }>('/notifications/read-all');
  },
};
