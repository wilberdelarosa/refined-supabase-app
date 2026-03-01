import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileCode, Plus, Edit, Trash2, Eye, Save, X } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAction } from '@/hooks/useAuditLogger';

interface InvoiceTemplate {
  id: string;
  name: string;
  subject: string | null;
  html_content: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SAMPLE_VARS: Record<string, string> = {
  '{{customer_name}}': 'Juan Pérez',
  '{{customer_email}}': 'juan@ejemplo.com',
  '{{order_id}}': 'ORD-2026-001234',
  '{{total}}': 'RD$ 3,500.00',
  '{{subtotal}}': 'RD$ 3,000.00',
  '{{tax}}': 'RD$ 500.00',
  '{{invoice_number}}': 'INV-2026-000042',
  '{{date}}': '01/03/2026',
  '{{items}}': '<li>Whey Protein x2 - RD$ 1,500.00</li><li>Creatina x1 - RD$ 1,500.00</li>',
  '{{order_url}}': '#',
  '{{store_name}}': 'Bárbaro Nutrition',
};

function replaceVariables(html: string): string {
  let result = html;
  for (const [key, value] of Object.entries(SAMPLE_VARS)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InvoiceTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', subject: '', html_content: '', is_active: true });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Error al cargar plantillas');
    }
    setTemplates((data as unknown as InvoiceTemplate[]) || []);
    setLoading(false);
  }

  function openEditor(tpl?: InvoiceTemplate) {
    if (tpl) {
      setEditing(tpl);
      setForm({
        name: tpl.name,
        subject: tpl.subject || '',
        html_content: tpl.html_content || '',
        is_active: tpl.is_active,
      });
    } else {
      setEditing({} as InvoiceTemplate);
      setForm({ name: '', subject: '', html_content: '', is_active: true });
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editing?.id) {
        const { error } = await supabase
          .from('invoice_templates')
          .update({
            name: form.name,
            subject: form.subject,
            html_content: form.html_content,
            is_active: form.is_active,
          })
          .eq('id', editing.id);
        if (error) throw error;
        logAction('TEMPLATE_UPDATED', 'invoice_templates', editing.id, { name: form.name });
        toast.success('Plantilla actualizada');
      } else {
        const { data, error } = await supabase
          .from('invoice_templates')
          .insert({
            name: form.name,
            subject: form.subject,
            html_content: form.html_content,
            is_active: form.is_active,
          })
          .select()
          .single();
        if (error) throw error;
        logAction('TEMPLATE_CREATED', 'invoice_templates', (data as unknown as InvoiceTemplate)?.id, { name: form.name });
        toast.success('Plantilla creada');
      }
      setEditing(null);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    const { error } = await supabase.from('invoice_templates').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
      return;
    }
    logAction('TEMPLATE_DELETED', 'invoice_templates', id);
    toast.success('Plantilla eliminada');
    fetchTemplates();
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
                <FileCode className="h-7 w-7 text-slate-700" />
                Plantillas de Email / Factura
              </h1>
              <p className="text-slate-500 text-sm mt-1">Diseña y personaliza tus correos de notificación</p>
            </div>
          </div>
          <Button onClick={() => openEditor()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-12 text-center">
            <FileCode className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No hay plantillas. Crea la primera.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <Badge variant="outline" className={tpl.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 text-slate-500'}>
                    {tpl.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {tpl.subject && <p className="text-xs text-slate-500 mt-1">{tpl.subject}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditor(tpl)} className="gap-1">
                    <Edit className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPreviewHtml(tpl.html_content || '')} className="gap-1">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tpl.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Confirmación de Pedido" />
              </div>
              <div className="space-y-2">
                <Label>Asunto del Email</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ej: Tu pedido ha sido confirmado" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenido HTML</Label>
              <Textarea
                value={form.html_content}
                onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                rows={12}
                className="font-mono text-xs"
                placeholder="<div>Hola {{customer_name}}, tu pedido {{order_id}} por {{total}} ha sido procesado.</div>"
              />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">Variables disponibles:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(SAMPLE_VARS).map((v) => (
                  <Badge key={v} variant="outline" className="text-xs font-mono cursor-pointer hover:bg-slate-200" onClick={() => setForm({ ...form, html_content: form.html_content + v })}>
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Plantilla activa</Label>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setPreviewHtml(form.html_content)} className="gap-2">
                <Eye className="h-4 w-4" /> Vista Previa
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Preview Dialog */}
      <Dialog open={previewHtml !== null} onOpenChange={(open) => !open && setPreviewHtml(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div
              className="p-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: replaceVariables(previewHtml || '') }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
