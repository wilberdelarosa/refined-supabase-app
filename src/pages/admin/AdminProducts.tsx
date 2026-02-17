import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Package,
  Beaker,
  Download,
  Upload,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductNutritionDialog from '@/components/admin/ProductNutritionDialog';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  stock: number;
  featured: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const { canManageProducts, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const PAGE_SIZE = 15;

  const [products, setProducts] = useState<Product[]>([]);
  const productsCountRef = useRef(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: '',
    stock: '',
    featured: false,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastEditedId, setLastEditedId] = useState<string | null>(null);
  const [nutritionDialogOpen, setNutritionDialogOpen] = useState(false);
  const [nutritionProduct, setNutritionProduct] = useState<Product | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function handleExportJSON() {
    const { data } = await supabase.from('products').select('*').order('name');
    if (!data) return;
    const blob = new Blob([JSON.stringify({ products: data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barbaro-products-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: `${data.length} productos exportados` });
  }

  async function handleExportCSV() {
    const { data } = await supabase.from('products').select('*').order('name');
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(p => Object.values(p).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barbaro-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: `${data.length} productos exportados como CSV` });
  }

  async function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = parsed.products || parsed;
      if (!Array.isArray(items)) throw new Error('Formato inválido');

      let count = 0;
      for (const item of items) {
        const { error } = await supabase.from('products').upsert({
          name: item.name,
          description: item.description || null,
          price: Number(item.price) || 0,
          original_price: item.original_price ? Number(item.original_price) : null,
          category: item.category || 'General',
          stock: Number(item.stock) || 0,
          featured: item.featured || false,
          image_url: item.image_url || null,
          brand: item.brand || null,
          weight_size: item.weight_size || null,
          sku: item.sku || null,
        }, { onConflict: 'sku' });
        if (!error) count++;
      }

      toast({ title: 'Importado', description: `${count} productos importados correctamente` });
      fetchProducts(1);
    } catch (err) {
      toast({ title: 'Error', description: 'Archivo inválido. Usa formato JSON con array de productos.', variant: 'destructive' });
    }
    e.target.value = '';
  }

  async function handleSeedCatalog() {
    if (!confirm('¿Poblar la tienda con el catálogo completo? Esto borrará los productos actuales.')) return;
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-catalog', {
        body: { action: 'seed' },
      });
      if (error) throw error;
      toast({ title: 'Catálogo poblado', description: `${data.products_inserted} productos, ${data.nutrition_generated} fichas nutricionales generadas` });
      fetchProducts(1);
    } catch (err) {
      toast({ title: 'Error', description: 'Error al poblar catálogo', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !canManageProducts) {
        navigate('/admin');
      }
    }
  }, [user, authLoading, rolesLoading, canManageProducts, navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    productsCountRef.current = products.length;
  }, [products.length]);

  const fetchProducts = useCallback(async (targetPage: number) => {
    if (targetPage === 1 && productsCountRef.current === 0) {
      setLoading(true);
    }
    setTableLoading(true);

    const from = (targetPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (debouncedSearch.trim()) {
      query = query.ilike('name', `%${debouncedSearch.trim()}%`);
    }

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const { data, error, count } = await query;

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los productos', variant: 'destructive' });
    } else {
      setProducts(data || []);
      setTotal(count || 0);
    }

    setLoading(false);
    setTableLoading(false);
  }, [PAGE_SIZE, debouncedSearch, filterCategory]);

  useEffect(() => {
    fetchProducts(page);
  }, [debouncedSearch, filterCategory, page, fetchProducts]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (data) setCategories(data);
  }

  function openCreateDialog() {
    setEditingProduct(null);

    // If no categories loaded yet, fetch them first
    if (categories.length === 0) {
      fetchCategories().then(() => {
        setFormData({
          name: '',
          description: '',
          price: '',
          original_price: '',
          category: '',
          stock: '0',
          featured: false,
          image_url: '',
        });
        setImageFile(null);
        setIsDialogOpen(true);
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        original_price: '',
        category: categories[0]?.name || '',
        stock: '0',
        featured: false,
        image_url: '',
      });
      setImageFile(null);
      setIsDialogOpen(true);
    }
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category: product.category,
      stock: product.stock.toString(),
      featured: product.featured,
      image_url: product.image_url || '',
    });
    setImageFile(null);
    setIsDialogOpen(true);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category: formData.category,
        stock: parseInt(formData.stock),
        featured: formData.featured,
        image_url: imageUrl || null,
      };

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        setLastEditedId(data?.id || editingProduct.id);
        toast({ title: 'Éxito', description: 'Producto actualizado correctamente' });
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .maybeSingle();

        if (error) throw error;
        setLastEditedId(data?.id || null);
        setPage(1);
        toast({ title: 'Éxito', description: 'Producto creado correctamente' });
      }

      setIsDialogOpen(false);
      await fetchProducts(editingProduct ? page : 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' });
    } else {
      toast({ title: 'Eliminado', description: 'Producto eliminado correctamente' });
      fetchProducts(page);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showInitialLoader = authLoading || rolesLoading || (loading && products.length === 0);

  useEffect(() => {
    if (!lastEditedId) return;
    const row = document.getElementById(`product-${lastEditedId}`);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('bg-[#2b8cee]/10');
    const timeout = setTimeout(() => {
      row.classList.remove('bg-[#2b8cee]/10');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [lastEditedId, products]);

  if (showInitialLoader) {
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
      {/* Enhanced Header */}
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
                <Package className="h-7 w-7 text-slate-700" />
                Gestión de Productos
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {(total || products.length)} {(total || products.length) === 1 ? 'producto' : 'productos'} en total
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedCatalog}
              disabled={seeding}
              className="text-xs"
            >
              {seeding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}
              {seeding ? 'Poblando...' : 'Poblar Catálogo'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON} className="text-xs">
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <label>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              <Button variant="outline" size="sm" asChild className="text-xs cursor-pointer">
                <span><Upload className="h-4 w-4 mr-1" />Importar</span>
              </Button>
            </label>
            <Button onClick={openCreateDialog} className="shadow-sm hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Card */}
      <Card className="mb-6 shadow-sm border overflow-hidden">
        <CardContent className="pt-6 relative">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Products Table */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                  <TableHead className="w-[80px] font-bold text-slate-700">Imagen</TableHead>
                  <TableHead className="font-bold text-slate-700">Producto</TableHead>
                  <TableHead className="font-bold text-slate-700">Categoría</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Precio</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Stock</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Destacado</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Package className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                        <p className="text-sm text-slate-500 mt-2">Cargando productos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-slate-300" />
                      <p className="text-slate-500 mt-4 font-medium">Ningún producto encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow
                      key={product.id}
                      id={`product-${product.id}`}
                      className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <TableCell className="text-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md mx-auto border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-md mx-auto flex items-center justify-center border border-slate-200">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        ${product.price.toFixed(2)}
                        {product.original_price && product.original_price > product.price && (
                          <div className="text-xs text-slate-400 line-through">
                            ${product.original_price.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            product.stock > 10
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : product.stock > 0
                                ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }
                        >
                          {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.featured && (
                          <Badge
                            variant="outline"
                            className="bg-purple-500/10 text-purple-600 border-purple-500/20"
                          >
                            ⭐ Destacado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNutritionProduct(product);
                              setNutritionDialogOpen(true);
                            }}
                            className="hover:bg-green-500/10 h-9 w-9 text-slate-400 hover:text-green-600"
                            title="Info Nutricional"
                          >
                            <Beaker className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            className="hover:bg-blue-500/10 h-9 w-9 text-slate-400 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product)}
                            className="hover:bg-red-500/10 h-9 w-9 text-slate-400 hover:text-red-600"
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

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Página {page} de {pageCount} • Mostrando {products.length} / {total || products.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || tableLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="border-slate-200 text-slate-600"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount || tableLoading}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                className="border-slate-200 text-slate-600"
              >
                Siguiente
              </Button>
              {tableLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  <span>Actualizando</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Dialog - Styling Updates */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingProduct ? 'Modifica los datos del producto' : 'Completa los datos para crear un nuevo producto'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-slate-700">Nombre del producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description" className="text-slate-700">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-700">Precio (RD$) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_price" className="text-slate-700">Precio Original (opcional)</Label>
                <Input
                  id="original_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-slate-700">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="image" className="text-slate-700">Imagen del producto</Label>
                <div className="flex gap-4">
                  {(formData.image_url || imageFile) && (
                    <div className="h-20 w-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="border-slate-200 text-slate-500 cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      O ingresa una URL de imagen:
                    </p>
                    <Input
                      className="mt-1 border-slate-200"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured" className="text-slate-700">Producto destacado</Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-200 text-slate-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#2b8cee] hover:bg-[#206bc4] text-white">
                {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nutrition Dialog - Pass props comfortably */}
      {nutritionProduct && (
        <ProductNutritionDialog
          open={nutritionDialogOpen}
          onOpenChange={setNutritionDialogOpen}
          productId={nutritionProduct.id}
          productName={nutritionProduct.name}
          productCategory={nutritionProduct.category}
          productDescription={nutritionProduct.description || undefined}
          onSaved={() => { }}
        />
      )}
    </AdminLayout>
  );
}
