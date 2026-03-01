import { Notification } from './Notification';

export interface NotificationRepository {
  getNotifications(userId: string): Promise<Notification[]>;
  getAdminNotifications(): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  listenToNotifications(
    userId: string,
    onNotificationReceived: (notification: Notification) => void,
    isAdmin?: boolean
  ): () => void; // Returns an unsubscribe function
}
