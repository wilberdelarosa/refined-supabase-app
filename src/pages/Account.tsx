import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Package, Heart, MapPin, Bell, Smartphone, User, TrendingUp } from 'lucide-react';

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
}

export default function Account() {
  const { user } = useAuth();
  const { roles } = useRoles();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const notificationOptions = [
    {
      key: 'orders',
      title: 'Actualizaciones de pedidos',
      description: 'Alertas de pago, comprobantes y entregas.',
      icon: Package,
      comingSoon: true,
      defaultOn: true,
    },
    {
      key: 'promos',
      title: 'Promociones y novedades',
      description: 'Ofertas personalizadas y recordatorios.',
      icon: Bell,
      comingSoon: true,
      defaultOn: false,
    },
    {
      key: 'mobile',
      title: 'Alertas en tu móvil',
      description: 'Notificaciones push y WhatsApp.',
      icon: Smartphone,
      comingSoon: true,
      defaultOn: false,
    },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    async function fetchData() {
      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Orders Count
      const { count: orders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (orders !== null) setOrdersCount(orders);

      // Wishlist Count (Local logic not easily countable if handled locally, but if in DB...)
      // The current wishlist hook uses local storage or DB?
      // Based on Wishlist.tsx, it uses `useNativeWishlist`. Let's assume we can just show a placeholder or skip it if it's complex.
      // For now, let's just count orders.

      setLoading(false);
    }

    fetchData();
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <ProfileLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      {/* Welcome Section */}
      <section>
        <h3 className="sr-only">Resumen Principal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Orders */}
          <Link to="/orders">
            <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="text-blue-500 h-6 w-6" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Mis Pedidos</p>
              <p className="text-slate-900 text-2xl font-bold tracking-tight">{ordersCount}</p>
            </div>
          </Link>

          {/* Card 2: Wishlist */}
          <Link to="/wishlist">
            <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <Heart className="text-rose-500 h-6 w-6" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Favoritos</p>
              <p className="text-slate-900 text-2xl font-bold tracking-tight">Ver lista</p>
            </div>
          </Link>

          {/* Card 3: Profile Status */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <User className="text-emerald-500 h-6 w-6" />
              </div>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-semibold rounded-md flex items-center gap-1">
                Activo
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Estado de Cuenta</p>
            <p className="text-slate-900 text-lg font-bold tracking-tight truncate">
              {profile?.city ? `${profile.city}, ` : ''}{profile?.country || 'Rep. Dom.'}
            </p>
          </div>
        </div>
      </section>

      {/* Details & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Profile Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-lg">Información Personal</CardTitle>
                <CardDescription>Tus datos de contacto y envío</CardDescription>
              </div>
              <Link to="/profile/edit">
                <Badge variant="secondary" className="cursor-pointer hover:bg-slate-200">Editar</Badge>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid gap-6 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Teléfono</dt>
                  <dd className="text-sm font-semibold text-slate-900">{profile?.phone || 'No especificado'}</dd>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Dirección</dt>
                  <dd className="text-sm font-semibold text-slate-900">{profile?.address || 'No especificada'}</dd>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Ciudad</dt>
                  <dd className="text-sm font-semibold text-slate-900">{profile?.city || 'No especificada'}</dd>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">País</dt>
                  <dd className="text-sm font-semibold text-slate-900">{profile?.country || 'República Dominicana'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              <CardDescription>
                Gestiona cómo quieres recibir nuestras actualizaciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {notificationOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.key} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{option.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {option.comingSoon && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Pronto</Badge>}
                      <Switch checked={option.defaultOn} disabled aria-readonly />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions / Sidebar Right */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base">Acceso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link to="/orders">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-primary/50 transition-all cursor-pointer">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Mis Pedidos</span>
                </div>
              </Link>
              <Link to="/account/appointments">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-primary/50 transition-all cursor-pointer">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Mis Citas</span>
                </div>
              </Link>
              <Link to="/wishlist">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-primary/50 transition-all cursor-pointer">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Favoritos</span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </ProfileLayout>
  );
}

