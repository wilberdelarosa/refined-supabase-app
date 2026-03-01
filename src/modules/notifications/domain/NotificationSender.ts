import { NotificationType, NotificationPriority } from './Notification';

export interface BaseNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  linkUrl?: string;
}

export interface UserNotificationPayload extends BaseNotificationPayload {
  userId: string;
}

export interface AdminNotificationPayload extends BaseNotificationPayload {
  // no userId means global admin alert
}

export interface NotificationSender {
  sendToUser(payload: UserNotificationPayload): Promise<void>;
  sendToAdmin(payload: AdminNotificationPayload): Promise<void>;
}
