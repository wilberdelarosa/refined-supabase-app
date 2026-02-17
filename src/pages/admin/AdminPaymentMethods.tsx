import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
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
        toast({ title: 'Éxito', description: 'Método de pago actualizado' });
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
        toast({ title: 'Éxito', description: 'Método de pago creado' });
      }

      setDialogOpen(false);
      await fetchMethods();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Error al guardar', variant: 'destructive' });
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
      toast({ title: 'Eliminado', description: 'Método de pago eliminado' });
      setDeleteDialogOpen(false);
      setEditingMethod(null);
      await fetchMethods();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      toast({
        title: method.is_active ? 'Desactivado' : 'Activado',
        description: method.is_active ? 'El método ha sido desactivado' : 'El método ha sido activado'
      });
      await fetchMethods();
    } catch (error) {
      toast({ title: 'Error', description: 'Error al actualizar', variant: 'destructive' });
    }
  };

  if (loading || rolesLoading) {
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
                <CreditCard className="h-7 w-7 text-slate-700" />
                Métodos de Pago
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Administra las cuentas bancarias y métodos de pago disponibles
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="shadow-sm hover:shadow-md bg-[#2b8cee] hover:bg-[#206bc4] text-white w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Método
          </Button>
        </div>
      </div>

      {/* Methods Table */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                <TableHead className="w-12 text-slate-700"></TableHead>
                <TableHead className="font-bold text-slate-700">Nombre</TableHead>
                <TableHead className="font-bold text-slate-700">Banco</TableHead>
                <TableHead className="font-bold text-slate-700">Número de Cuenta</TableHead>
                <TableHead className="font-bold text-slate-700">Titular</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Estado</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-slate-100">
                        <CreditCard className="h-12 w-12 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No hay métodos de pago configurados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((method) => (
                  <TableRow key={method.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#2b8cee]/10 rounded text-[#2b8cee]">
                          <Building2 className="h-4 w-4" />
                        </div>
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{method.bank_name || '-'}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {method.account_number || '-'}
                    </TableCell>
                    <TableCell className="text-slate-600">{method.account_holder || '-'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={() => toggleActive(method)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(method)}
                          className="hover:bg-blue-500/10 text-slate-400 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-500/10 text-slate-400 hover:text-red-600"
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
        <DialogContent className="sm:max-w-lg bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingMethod
                ? 'Modifica los datos del método de pago'
                : 'Agrega una nueva cuenta bancaria o método de pago'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Banco Popular - Cuenta Principal"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="text-slate-700">Nombre del Banco</Label>
                <Input
                  id="bank_name"
                  placeholder="Banco Popular Dominicano"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData(f => ({ ...f, bank_name: e.target.value }))}
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type" className="text-slate-700">Tipo de Cuenta</Label>
                <Input
                  id="account_type"
                  placeholder="Cuenta Corriente"
                  value={formData.account_type || ''}
                  onChange={(e) => setFormData(f => ({ ...f, account_type: e.target.value }))}
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number" className="text-slate-700">Número de Cuenta</Label>
              <Input
                id="account_number"
                placeholder="123-456789-0"
                value={formData.account_number || ''}
                onChange={(e) => setFormData(f => ({ ...f, account_number: e.target.value }))}
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_holder" className="text-slate-700">Titular</Label>
                <Input
                  id="account_holder"
                  placeholder="Nombre del titular"
                  value={formData.account_holder || ''}
                  onChange={(e) => setFormData(f => ({ ...f, account_holder: e.target.value }))}
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rnc" className="text-slate-700">RNC</Label>
                <Input
                  id="rnc"
                  placeholder="1-31-12345-6"
                  value={formData.rnc || ''}
                  onChange={(e) => setFormData(f => ({ ...f, rnc: e.target.value }))}
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-slate-700">Instrucciones adicionales</Label>
              <Textarea
                id="instructions"
                placeholder="Instrucciones especiales para este método de pago..."
                value={formData.instructions || ''}
                onChange={(e) => setFormData(f => ({ ...f, instructions: e.target.value }))}
                rows={3}
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
                className="data-[state=checked]:bg-[#2b8cee]"
              />
              <div className="space-y-0.5">
                <Label className="text-slate-700 font-medium">Estado</Label>
                <p className="text-xs text-slate-500">
                  {formData.is_active ? 'Visible para clientes' : 'Oculto'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-200 text-slate-700">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#2b8cee] hover:bg-[#206bc4] text-white">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingMethod ? 'Guardar Cambios' : 'Crear Método'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">¿Eliminar método de pago?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Esta acción no se puede deshacer. El método "{editingMethod?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 text-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}