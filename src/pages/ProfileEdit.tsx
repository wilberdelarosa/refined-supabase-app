import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Loader2, User } from 'lucide-react';

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
}

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'República Dominicana',
    avatar_url: null,
  });

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
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user!.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || 'República Dominicana',
          avatar_url: data.avatar_url,
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Imagen subida correctamente');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Sync customer to Shopify
      try {
        const nameParts = (profile.full_name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: syncResult, error: syncFnError } = await supabase.functions.invoke('sync-shopify-customer', {
          body: {
            action: 'update',
            customer: {
              email: profile.email || user.email || '',
              first_name: firstName,
              last_name: lastName,
              phone: profile.phone || undefined,
              address: {
                address1: profile.address || undefined,
                city: profile.city || undefined,
                country: profile.country || undefined,
              }
            }
          }
        });

        if (syncFnError) {
          console.error('Shopify sync function error:', syncFnError);
        } else if (syncResult?.action === 'scope_not_approved') {
          console.warn('Shopify customer scopes not approved:', syncResult?.message);
        } else if (syncResult?.success) {
          console.log('Customer synced to Shopify');
        } else {
          console.warn('Unexpected Shopify sync result:', syncResult);
        }
      } catch (syncError) {
        console.error('Error syncing customer to Shopify:', syncError);
        // Don't block profile update if Shopify sync fails
      }

      toast.success('Perfil actualizado correctamente');
      navigate('/account');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/account">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Editar Perfil</h1>
              <p className="text-muted-foreground text-sm">
                Actualiza tu información personal
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>
                  Haz clic en la imagen para cambiarla
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-primary-foreground" />
                      )}
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Formatos soportados: JPG, PNG, GIF. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 809 555 0123"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={profile.address || ''}
                    onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                    placeholder="Calle, número, sector"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={profile.city || ''}
                      onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                      placeholder="Santo Domingo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={profile.country || ''}
                      onChange={(e) => setProfile(p => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/account')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
