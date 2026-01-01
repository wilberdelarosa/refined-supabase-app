import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
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
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  ArrowLeft,
  Percent,
  Copy,
  Loader2,
  Pencil
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
      toast.error('Error al cargar códigos de descuento');
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
        toast.success('Código de descuento actualizado');
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(discountData);

        if (error) throw error;
        toast.success('Código de descuento creado');
      }

      setIsDialogOpen(false);
      fetchDiscounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
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
      toast.success('Código eliminado');
      fetchDiscounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    }
  }

  async function toggleActive(discount: DiscountCode) {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !discount.is_active })
        .eq('id', discount.id);

      if (error) throw error;
      toast.success(discount.is_active ? 'Código desactivado' : 'Código activado');
      fetchDiscounts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  }

  if (authLoading || rolesLoading || loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-display text-2xl font-bold">Códigos de Descuento</h1>
                <p className="text-muted-foreground text-sm">
                  {discounts.length} códigos
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Código
            </Button>
          </div>

          {/* Discounts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-center">Usos</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay códigos de descuento</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{discount.code}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => copyCode(discount.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {discount.description && (
                            <p className="text-xs text-muted-foreground">{discount.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {discount.discount_type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}%` 
                              : `RD$${discount.discount_value.toLocaleString()}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {discount.uses_count || 0} / {discount.max_uses || '∞'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={discount.is_active ?? false}
                            onCheckedChange={() => toggleActive(discount)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(discount)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(discount)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? 'Editar Código' : 'Nuevo Código de Descuento'}
            </DialogTitle>
            <DialogDescription>
              {editingDiscount ? 'Modifica los datos del código' : 'Crea un nuevo código de descuento'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VERANO2024"
                className="uppercase"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descuento de verano"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipo de descuento</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_purchase_amount">Compra mínima (RD$)</Label>
              <Input
                id="min_purchase_amount"
                type="number"
                min="0"
                value={formData.min_purchase_amount}
                onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                placeholder="Sin mínimo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Usos máximos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="0"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses_per_user">Por usuario</Label>
                <Input
                  id="max_uses_per_user"
                  type="number"
                  min="0"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Válido desde</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends_at">Válido hasta</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Código activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
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
    </Layout>
  );
}
