import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ArrowLeft, FolderOpen, Tag, CheckCircle2, XCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const { canManageProducts, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !canManageProducts) {
        navigate('/admin');
      }
    }
  }, [user, authLoading, rolesLoading, canManageProducts, navigate]);

  useEffect(() => {
    fetchCategories();
    fetchProductCounts();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las categorías', variant: 'destructive' });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  async function fetchProductCounts() {
    const { data } = await supabase
      .from('products')
      .select('category');

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
      });
      setProductCounts(counts);
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function openCreateDialog() {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        is_active: formData.is_active,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: 'Éxito', description: 'Categoría actualizada correctamente' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        toast({ title: 'Éxito', description: 'Categoría creada correctamente' });
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    const count = productCounts[category.name] || 0;
    if (count > 0) {
      toast({
        title: 'No se puede eliminar',
        description: `Esta categoría tiene ${count} productos asociados`,
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`¿Eliminar "${category.name}"?`)) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la categoría', variant: 'destructive' });
    } else {
      toast({ title: 'Eliminado', description: 'Categoría eliminada correctamente' });
      fetchCategories();
    }
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
                <Tag className="h-7 w-7 text-slate-700" />
                Categorías
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="shadow-sm hover:shadow-md bg-[#2b8cee] hover:bg-[#206bc4] text-white w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Categories Table */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-bold text-slate-700">Nombre</TableHead>
                  <TableHead className="font-bold text-slate-700">Slug</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Productos</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Estado</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100">
                          <FolderOpen className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No hay categorías</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-slate-500 truncate max-w-[250px] italic">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs bg-slate-100 text-slate-600 border-slate-200">
                          {category.slug}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                          {productCounts[category.name] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {category.is_active ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 pl-1.5">
                            <CheckCircle2 className="h-3 w-3" /> Activa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 gap-1 pl-1.5">
                            <XCircle className="h-3 w-3" /> Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category)}
                            className="hover:bg-blue-500/10 text-slate-400 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
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

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingCategory ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de productos'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  });
                }}
                required
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-slate-700">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="se-genera-automaticamente"
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee] bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="data-[state=checked]:bg-[#2b8cee]"
              />
              <Label htmlFor="is_active" className="cursor-pointer text-slate-700 font-medium">Categoría activa</Label>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-200 text-slate-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#2b8cee] hover:bg-[#206bc4] text-white">
                {saving ? 'Guardando...' : editingCategory ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
