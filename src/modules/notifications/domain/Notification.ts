export type NotificationType = 'ORDER_UPDATE' | 'PROMO' | 'SYSTEM_ALERT' | 'NEW_ORDER' | 'NEW_USER';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface Notification {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: Date;
}
