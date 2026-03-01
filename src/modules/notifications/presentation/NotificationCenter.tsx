import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Ticket, AlertTriangle, ShoppingBag, UserCheck, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { notificationService } from '../infrastructure/SupabaseNotificationAdapter';
import { Notification, NotificationType } from '../domain/Notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  isAdmin?: boolean;
}

export function NotificationCenter({ isAdmin = false }: NotificationCenterProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    let unsubscribe: () => void = () => {};

    const loadNotifications = async () => {
      try {
        let fetched: Notification[] = [];
        if (isAdmin) {
          fetched = await notificationService.getAdminNotifications();
        } else {
          fetched = await notificationService.getUserNotifications(user.id);
        }
        setNotifications(fetched);

        // Subscribing to realtime updates
        unsubscribe = notificationService.subscribeToNotifications(
          user.id,
          (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
          },
          isAdmin
        );
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isAdmin]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.linkUrl) {
      setIsOpen(false);
      navigate(notif.linkUrl);
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_UPDATE':
      case 'NEW_ORDER':
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case 'PROMO':
        return <Ticket className="w-5 h-5 text-green-500" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'NEW_USER':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell className="h-[22px] w-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 overflow-hidden rounded-xl border-slate-200">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-slate-800">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs text-slate-500 hover:text-primary transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Marcar todas leídas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
              <div className="w-12 h-12 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium">No tienes notificaciones</p>
              <p className="text-xs text-slate-400 mt-1">
                Aquí aparecerán tus alertas y actualizaciones.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !notif.isRead ? 'bg-[#2b8cee]/5' : ''
                  }`}
                >
                  <div className="shrink-0 mt-1">
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm tracking-tight ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                        {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 line-clamp-2 ${!notif.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="shrink-0 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#2b8cee]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
