import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { User, Package, MapPin, Settings, Shield, LogOut, Heart, Edit, Calendar } from 'lucide-react';

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
  const { user, signOut } = useAuth();
  const { roles, isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Mi Cuenta</h1>
            <p className="text-muted-foreground">
              Gestiona tu perfil, pedidos y preferencias
            </p>
          </div>

          {/* User Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">
                      {profile?.full_name || user.user_metadata?.full_name || 'Usuario'}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    {!rolesLoading && roles.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {roles.map((role) => (
                          <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                            {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/profile/edit">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Salir
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/orders">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Mis Pedidos</CardTitle>
                      <CardDescription>Ver historial de compras</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/account/appointments">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Mis Citas</CardTitle>
                      <CardDescription>Gestiona tus consultas con nutricionistas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/wishlist">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Favoritos</CardTitle>
                      <CardDescription>Productos guardados</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/profile/edit">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Direcciones</CardTitle>
                      <CardDescription>Gestionar direcciones de envío</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/profile/edit">
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Configuración</CardTitle>
                      <CardDescription>Preferencias de cuenta</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer border-primary/20 h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Panel Admin</CardTitle>
                        <CardDescription>Gestionar tienda</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>

          {/* Profile Details */}
          {profile && (
            <Card className="mt-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Información de Perfil</CardTitle>
                <Link to="/profile/edit">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
                    <dd className="mt-1">{profile.phone || 'No especificado'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Dirección</dt>
                    <dd className="mt-1">{profile.address || 'No especificada'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Ciudad</dt>
                    <dd className="mt-1">{profile.city || 'No especificada'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">País</dt>
                    <dd className="mt-1">{profile.country || 'República Dominicana'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
