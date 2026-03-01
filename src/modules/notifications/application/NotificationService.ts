import { NotificationRepository } from '../domain/NotificationRepository';
import { Notification } from '../domain/Notification';

export class NotificationService {
  constructor(private repository: NotificationRepository) {}

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.repository.getNotifications(userId);
  }

  async getAdminNotifications(): Promise<Notification[]> {
    return this.repository.getAdminNotifications();
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.repository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.markAllAsRead(userId);
  }

  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void,
    isAdmin: boolean = false
  ): () => void {
    return this.repository.listenToNotifications(userId, onNotification, isAdmin);
  }
}
