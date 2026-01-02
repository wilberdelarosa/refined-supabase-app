import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  CreditCard,
  Loader2,
  GripVertical,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  bank_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  rnc: string | null;
  instructions: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const emptyMethod: Omit<PaymentMethod, 'id' | 'created_at'> = {
  name: '',
  type: 'bank_transfer',
  bank_name: '',
  account_type: '',
  account_number: '',
  account_holder: '',
  rnc: '',
  instructions: '',
  is_active: true,
  display_order: 0
};

export default function AdminPaymentMethods() {
  const { user } = useAuth();
  const { isAdmin, isManager, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState(emptyMethod);

  useEffect(() => {
    if (!rolesLoading && !isAdmin && !isManager) {
      navigate('/');
      return;
    }
    if (user) fetchMethods();
  }, [user, rolesLoading, isAdmin, isManager]);

  async function fetchMethods() {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setMethods(data);
    }
    setLoading(false);
  }

  const openCreateDialog = () => {
    setEditingMethod(null);
    setFormData({ ...emptyMethod, display_order: methods.length });
    setDialogOpen(true);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      bank_name: method.bank_name || '',
      account_type: method.account_type || '',
      account_number: method.account_number || '',
      account_holder: method.account_holder || '',
      rnc: method.rnc || '',
      instructions: method.instructions || '',
      is_active: method.is_active,
      display_order: method.display_order
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name: formData.name,
            type: formData.type,
            bank_name: formData.bank_name || null,
            account_type: formData.account_type || null,
            account_number: formData.account_number || null,
            account_holder: formData.account_holder || null,
            rnc: formData.rnc || null,
            instructions: formData.instructions || null,
            is_active: formData.is_active,
            display_order: formData.display_order
          })
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('Método de pago actualizado');
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            name: formData.name,
            type: formData.type,
            bank_name: formData.bank_name || null,
            account_type: formData.account_type || null,
            account_number: formData.account_number || null,
            account_holder: formData.account_holder || null,
            rnc: formData.rnc || null,
            instructions: formData.instructions || null,
            is_active: formData.is_active,
            display_order: formData.display_order
          });

        if (error) throw error;
        toast.success('Método de pago creado');
      }

      setDialogOpen(false);
      await fetchMethods();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingMethod) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', editingMethod.id);

      if (error) throw error;
      toast.success('Método de pago eliminado');
      setDeleteDialogOpen(false);
      setEditingMethod(null);
      await fetchMethods();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar');
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      toast.success(method.is_active ? 'Método desactivado' : 'Método activado');
      await fetchMethods();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading || rolesLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Panel de Admin
            </Link>
          </Button>

          <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Métodos de Pago
          </h2>
          <p className="text-muted-foreground">
            Administra las cuentas bancarias y métodos de pago disponibles
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Método
        </Button>
      </div>

      {/* Methods Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No hay métodos de pago configurados
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell>{method.bank_name || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {method.account_number || '-'}
                    </TableCell>
                    <TableCell>{method.account_holder || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(method)}
                        className={method.is_active ? 'text-green-600' : 'text-muted-foreground'}
                      >
                        {method.is_active ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(method)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setEditingMethod(method);
                            setDeleteDialogOpen(true);
                          }}
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </DialogTitle>
            <DialogDescription>
              {editingMethod 
                ? 'Modifica los datos del método de pago'
                : 'Agrega una nueva cuenta bancaria o método de pago'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Banco Popular - Cuenta Principal"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Nombre del Banco</Label>
                <Input
                  id="bank_name"
                  placeholder="Banco Popular Dominicano"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData(f => ({ ...f, bank_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type">Tipo de Cuenta</Label>
                <Input
                  id="account_type"
                  placeholder="Cuenta Corriente"
                  value={formData.account_type || ''}
                  onChange={(e) => setFormData(f => ({ ...f, account_type: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Número de Cuenta</Label>
              <Input
                id="account_number"
                placeholder="123-456789-0"
                value={formData.account_number || ''}
                onChange={(e) => setFormData(f => ({ ...f, account_number: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_holder">Titular</Label>
                <Input
                  id="account_holder"
                  placeholder="Nombre del titular"
                  value={formData.account_holder || ''}
                  onChange={(e) => setFormData(f => ({ ...f, account_holder: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rnc">RNC</Label>
                <Input
                  id="rnc"
                  placeholder="1-31-12345-6"
                  value={formData.rnc || ''}
                  onChange={(e) => setFormData(f => ({ ...f, rnc: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instrucciones adicionales</Label>
              <Textarea
                id="instructions"
                placeholder="Instrucciones especiales para este método de pago..."
                value={formData.instructions || ''}
                onChange={(e) => setFormData(f => ({ ...f, instructions: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Estado</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_active ? 'Visible para clientes' : 'Oculto'}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMethod ? 'Guardar Cambios' : 'Crear Método'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El método "{editingMethod?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </div>
        </div>
      </div>
    </Layout>
  );
}