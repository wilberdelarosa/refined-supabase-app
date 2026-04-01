import { Link } from 'react-router-dom';
import { User, Menu, Settings, LogOut, ShoppingBag, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { supabase } from '@/integrations/supabase/client';
import barbaroLogo from '@/assets/barbaro-logo.png';

function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    fetchCount();

    const channel = supabase
      .channel(`notif-badge-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchCount())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link to="/account">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function Navbar() {
  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/shop' },
    { name: 'Nosotros', path: '/about' },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, canManageOrders } = useRoles();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();

    // Listen for profile changes
    const channel = supabase
      .channel(`avatar-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newAvatar = (payload.new as any)?.avatar_url;
        setAvatarUrl(newAvatar || null);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img src={barbaroLogo} alt="Barbaro Nutrition" className="h-10 w-auto group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-[13px] font-bold text-foreground/60 hover:text-foreground transition-colors uppercase tracking-[0.1em] relative group py-1"
            >
              {link.name}
              <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <NotificationBell />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-xl border-border/50">
                <div className="px-3 py-3 mb-1">
                  <p className="font-semibold text-sm truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Mi cuenta</p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
                  <Link to="/account" className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Mi Cuenta</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
                  <Link to="/orders" className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Mis Pedidos</span>
                  </Link>
                </DropdownMenuItem>

                {canManageOrders && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
                      <Link to="/admin" className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold">Panel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span className="font-medium">Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <CartDrawer />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-bold uppercase tracking-wide hover:text-muted-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-border pt-6 mt-4">
                  {user ? (
                    <>
                      <Link to="/account" onClick={() => setIsOpen(false)} className="block text-lg font-bold uppercase tracking-wide mb-4">
                        Mi Cuenta
                      </Link>
                      {canManageOrders && (
                        <Link to="/admin" onClick={() => setIsOpen(false)} className="block text-lg font-bold uppercase tracking-wide mb-4">
                          Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setIsOpen(false); }}
                        className="text-lg font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase tracking-wide">
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
