import { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, ExternalLink, Save, Loader2 } from 'lucide-react';
import { SiteImage, invalidateSiteImagesCache } from '@/hooks/useSiteImages';

export default function AdminSiteImages() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_images' as never)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast.error('Error cargando imágenes: ' + error.message);
    } else {
      setImages((data ?? []) as unknown as SiteImage[]);
    }
    setLoading(false);
  }

  async function updateRow(id: string, updates: Partial<SiteImage>) {
    const { error } = await supabase
      .from('site_images' as never)
      .update(updates as never)
      .eq('id', id);
    if (error) {
      toast.error('Error al guardar: ' + error.message);
      return false;
    }
    invalidateSiteImagesCache();
    toast.success('Imagen actualizada');
    load();
    return true;
  }

  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Imágenes del sitio</h1>
        <p className="text-sm text-slate-600">
          Cambia las imágenes visibles en la portada y otras secciones. Respeta las dimensiones y peso
          recomendados para conservar la calidad visual.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {images.map((img) => (
            <SlotCard key={img.id} slot={img} onSave={updateRow} onRefresh={load} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function SlotCard({
  slot,
  onSave,
  onRefresh,
}: {
  slot: SiteImage;
  onSave: (id: string, u: Partial<SiteImage>) => Promise<boolean>;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: slot.title ?? '',
    subtitle: slot.subtitle ?? '',
    alt_text: slot.alt_text ?? '',
    link_url: slot.link_url ?? '',
    is_active: slot.is_active,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Warn about size
    if (slot.max_size_kb && file.size > slot.max_size_kb * 1024) {
      toast.warning(
        `La imagen pesa ${(file.size / 1024).toFixed(0)}KB. Se recomienda menos de ${slot.max_size_kb}KB.`
      );
    }

    // Warn about aspect ratio
    if (slot.recommended_width && slot.recommended_height) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((res) => (img.onload = () => res(null)));
      const targetRatio = slot.recommended_width / slot.recommended_height;
      const actualRatio = img.width / img.height;
      if (Math.abs(actualRatio - targetRatio) / targetRatio > 0.15) {
        toast.warning(
          `La relación de aspecto (${img.width}×${img.height}) difiere de la recomendada (${slot.recommended_width}×${slot.recommended_height}).`
        );
      }
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `site/${slot.slot}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      const url = pub.publicUrl;
      const ok = await onSave(slot.id, { image_url: url });
      if (ok) onRefresh();
    } catch (err) {
      toast.error('Error subiendo imagen: ' + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function saveMeta() {
    setSaving(true);
    await onSave(slot.id, form);
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{slot.title || slot.slot}</h3>
            <code className="text-xs text-slate-500">{slot.slot}</code>
            {slot.description && (
              <p className="text-xs text-slate-600 mt-1">{slot.description}</p>
            )}
          </div>
          <div className="text-xs text-right text-slate-600 shrink-0">
            {slot.recommended_width && slot.recommended_height && (
              <div className="font-mono">
                {slot.recommended_width}×{slot.recommended_height}px
              </div>
            )}
            {slot.recommended_format && <div>{slot.recommended_format}</div>}
            {slot.max_size_kb && <div>máx {slot.max_size_kb}KB</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border">
          {slot.image_url ? (
            <img
              src={slot.image_url}
              alt={slot.alt_text ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 flex flex-col items-center gap-2 text-sm">
              <ImageIcon className="h-8 w-8" />
              Sin imagen (usa la del sistema)
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {slot.image_url ? 'Cambiar imagen' : 'Subir imagen'}
          </Button>
          {slot.image_url && (
            <Button variant="outline" size="icon" asChild>
              <a href={slot.image_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label className="text-xs">Subtítulo</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label className="text-xs">Texto alternativo (accesibilidad)</Label>
            <Input
              value={form.alt_text}
              onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
              placeholder="Descripción de la imagen"
            />
          </div>
          <div>
            <Label className="text-xs">Enlace (opcional)</Label>
            <Input
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="/shop?category=..."
            />
          </div>
        </div>

        <Button onClick={saveMeta} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  );
}
