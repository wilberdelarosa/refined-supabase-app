import { supabase } from '@/integrations/supabase/client';
import { Notification } from '../domain/Notification';
import { NotificationRepository } from '../domain/NotificationRepository';
import { NotificationSender, UserNotificationPayload, AdminNotificationPayload } from '../domain/NotificationSender';
import { NotificationService } from '../application/NotificationService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapToEntity = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  priority: row.priority,
  isRead: row.is_read,
  linkUrl: row.link_url,
  createdAt: new Date(row.created_at)
});

export class SupabaseNotificationAdapter implements NotificationRepository, NotificationSender {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data.map(mapToEntity);
  }

  async getAdminNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data.map(mapToEntity);
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
  }

  listenToNotifications(
    userId: string,
    onNotificationReceived: (notification: Notification) => void,
    isAdmin: boolean = false
  ): () => void {
    // We listen to inserts on the notifications table
    let filter = `user_id=eq.${userId}`;
    if (isAdmin) {
      // Admins might need to listen to their own user_id OR global (user_id=is.null)
      // Supabase realtime filter syntax is slightly limited for OR conditions, so we might need two channels or a unified one and filter locally.
      // For simplicity, we just listen to all and filter locally if it's admin.
      filter = ''; 
    }

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          // If not admin, we use the filter. If admin, we don't use the filter
          // and filter it natively in the callback if it belongs to admin globally or specifically.
          filter: isAdmin ? undefined : filter, 
        },
        (payload) => {
          const newDoc = payload.new;
          if (isAdmin) {
            // Re-verify it concerns this admin specifically or globally
            if (newDoc.user_id !== userId && newDoc.user_id !== null) {
              return; // Not for this admin
            }
          }
          onNotificationReceived(mapToEntity(newDoc));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async sendToUser(payload: UserNotificationPayload): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority || 'NORMAL',
      link_url: payload.linkUrl
    });
    if (error) throw new Error(error.message);
  }

  async sendToAdmin(payload: AdminNotificationPayload): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      user_id: null,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority || 'NORMAL',
      link_url: payload.linkUrl
    });
    if (error) throw new Error(error.message);
  }
}

// Singleton instances for easy application-wide use without DI container framework
export const notificationAdapter = new SupabaseNotificationAdapter();
export const notificationService = new NotificationService(notificationAdapter);
