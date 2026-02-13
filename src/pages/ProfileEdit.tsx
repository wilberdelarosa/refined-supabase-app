import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Loader2, User, Save, Upload } from 'lucide-react';

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
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
      <ProfileLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Configuración de Perfil</h1>
          <p className="text-slate-500 text-sm">Gestiona tu información personal y preferencias</p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar / Avatar Section */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm text-center">
              <CardHeader>
                <CardTitle className="text-base">Foto de Perfil</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative mb-4 group cursor-pointer">
                  <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-100 text-slate-400">
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-md">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Recomendado: 400x400px <br /> Max 5MB, JPG/PNG
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-slate-100 border-slate-200 text-slate-500"
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
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
                <CardDescription>Utilizada para calcular envíos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={profile.address || ''}
                    onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                    placeholder="Calle, número, sector"
                    className="bg-slate-50 border-slate-200"
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
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={profile.country || ''}
                      onChange={(e) => setProfile(p => ({ ...p, country: e.target.value }))}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end p-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/account')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="min-w-[120px]">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </ProfileLayout>
  );
}
