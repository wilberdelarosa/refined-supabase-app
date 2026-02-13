import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Percent,
  Copy,
  Loader2,
  Pencil,
  Tag,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type DiscountCode = Tables<'discount_codes'>;

export default function AdminDiscounts() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase_amount: '',
    max_uses: '',
    max_uses_per_user: '',
    is_active: true,
    starts_at: '',
    ends_at: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !isAdmin) {
        navigate('/admin');
      }
    }
  }, [user, authLoading, rolesLoading, isAdmin, navigate]);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  async function fetchDiscounts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Error al cargar códigos de descuento', variant: 'destructive' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingDiscount(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_uses: '',
      max_uses_per_user: '',
      is_active: true,
      starts_at: '',
      ends_at: '',
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(discount: DiscountCode) {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      description: discount.description || '',
      discount_type: discount.discount_type as 'percentage' | 'fixed',
      discount_value: discount.discount_value.toString(),
      min_purchase_amount: discount.min_purchase_amount?.toString() || '',
      max_uses: discount.max_uses?.toString() || '',
      max_uses_per_user: discount.max_uses_per_user?.toString() || '',
      is_active: discount.is_active ?? true,
      starts_at: discount.starts_at ? discount.starts_at.slice(0, 16) : '',
      ends_at: discount.ends_at ? discount.ends_at.slice(0, 16) : '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const discountData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        max_uses_per_user: formData.max_uses_per_user ? parseInt(formData.max_uses_per_user) : null,
        is_active: formData.is_active,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        created_by: user?.id,
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from('discount_codes')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (error) throw error;
        toast({ title: 'Éxito', description: 'Código de descuento actualizado' });
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(discountData);

        if (error) throw error;
        toast({ title: 'Éxito', description: 'Código de descuento creado' });
      }

      setIsDialogOpen(false);
      fetchDiscounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(discount: DiscountCode) {
    if (!confirm(`¿Eliminar el código "${discount.code}"?`)) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', discount.id);

      if (error) throw error;
      toast({ title: 'Eliminado', description: 'Código eliminado correctamente' });
      fetchDiscounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  async function toggleActive(discount: DiscountCode) {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !discount.is_active })
        .eq('id', discount.id);

      if (error) throw error;
      toast({
        title: discount.is_active ? 'Desactivado' : 'Activado',
        description: discount.is_active ? 'El código ha sido desactivado' : 'El código ha sido activado'
      });
      fetchDiscounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado', description: 'Código copiado al portapapeles' });
  }

  if (authLoading || rolesLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b8cee]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover-lift hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
                <Percent className="h-7 w-7 text-slate-700" />
                Códigos de Descuento
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {discounts.length} {discounts.length === 1 ? 'código' : 'códigos'} registrados
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="shadow-sm hover:shadow-md bg-[#2b8cee] hover:bg-[#206bc4] text-white w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Código
          </Button>
        </div>
      </div>

      {/* Discounts Table */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-bold text-slate-700">Código</TableHead>
                  <TableHead className="font-bold text-slate-700">Tipo</TableHead>
                  <TableHead className="font-bold text-slate-700">Valor</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Usos</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Estado</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100">
                          <Tag className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No hay códigos de descuento</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  discounts.map((discount) => (
                    <TableRow key={discount.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2b8cee] bg-[#2b8cee]/10 px-2 py-0.5 rounded border border-[#2b8cee]/20">
                            {discount.code}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-slate-600"
                            onClick={() => copyCode(discount.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {discount.description && (
                          <p className="text-xs text-slate-500 mt-1">{discount.description}</p>
                        )}
                        {(discount.starts_at || discount.ends_at) && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {discount.ends_at
                              ? `Vence: ${new Date(discount.ends_at).toLocaleDateString()}`
                              : `Desde: ${new Date(discount.starts_at!).toLocaleDateString()}`
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                          {discount.discount_type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-600 text-lg">
                          {discount.discount_type === 'percentage'
                            ? `${discount.discount_value}%`
                            : `RD$${discount.discount_value.toLocaleString()}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-slate-700">{discount.uses_count || 0}</span>
                          <span className="text-xs text-slate-400">de {discount.max_uses || '∞'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={discount.is_active ?? false}
                            onCheckedChange={() => toggleActive(discount)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(discount)}
                            className="hover:bg-blue-500/10 text-slate-400 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(discount)}
                            className="hover:bg-red-500/10 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingDiscount ? 'Editar Código' : 'Nuevo Código de Descuento'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingDiscount ? 'Modifica los datos del código' : 'Crea un nuevo código de descuento'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-slate-700">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VERANO2024"
                className="uppercase font-mono tracking-wider border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descuento de verano"
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type" className="text-slate-700">Tipo de descuento</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value" className="text-slate-700">Valor *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                  required
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_purchase_amount" className="text-slate-700">Compra mínima (RD$)</Label>
              <Input
                id="min_purchase_amount"
                type="number"
                min="0"
                value={formData.min_purchase_amount}
                onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                placeholder="Sin mínimo"
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses" className="text-slate-700">Usos máximos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="0"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses_per_user" className="text-slate-700">Por usuario</Label>
                <Input
                  id="max_uses_per_user"
                  type="number"
                  min="0"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                  placeholder="Ilimitado"
                  className="border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at" className="text-slate-700">Válido desde</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  className="border-slate-200 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends_at" className="text-slate-700">Válido hasta</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  className="border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-[#2b8cee]"
              />
              <Label htmlFor="is_active" className="cursor-pointer text-slate-700 font-medium">Código activo</Label>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-200 text-slate-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#2b8cee] hover:bg-[#206bc4] text-white">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : editingDiscount ? 'Guardar Cambios' : 'Crear Código'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
