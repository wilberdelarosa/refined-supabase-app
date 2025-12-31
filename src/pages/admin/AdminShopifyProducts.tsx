import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
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
import { Textarea } from '@/components/ui/textarea';
import { useShopifyAdmin, ShopifyAdminProduct } from '@/hooks/useShopifyAdmin';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ArrowLeft,
  Package,
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function AdminShopifyProducts() {
  const { user, loading: authLoading } = useAuth();
  const { canManageProducts, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { getProducts, createProduct, updateProduct, deleteProduct, loading: apiLoading } = useShopifyAdmin();
  
  const [products, setProducts] = useState<ShopifyAdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopifyAdminProduct | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body_html: '',
    product_type: '',
    vendor: 'Barbaro Nutrition',
    tags: '',
    status: 'active' as 'active' | 'draft' | 'archived',
    price: '',
    sku: '',
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
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const result = await getProducts(250);
      setProducts(result.products || []);
    } catch (err) {
      toast.error('Error al cargar productos de Shopify');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function openCreateDialog() {
    setEditingProduct(null);
    setFormData({
      title: '',
      body_html: '',
      product_type: '',
      vendor: 'Barbaro Nutrition',
      tags: '',
      status: 'active',
      price: '',
      sku: '',
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(product: ShopifyAdminProduct) {
    setEditingProduct(product);
    const variant = product.variants[0];
    setFormData({
      title: product.title,
      body_html: product.body_html || '',
      product_type: product.product_type || '',
      vendor: product.vendor || 'Barbaro Nutrition',
      tags: product.tags || '',
      status: product.status,
      price: variant?.price || '',
      sku: variant?.sku || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const productData: Record<string, unknown> = {
        title: formData.title,
        body_html: formData.body_html || null,
        product_type: formData.product_type || null,
        vendor: formData.vendor || 'Barbaro Nutrition',
        tags: formData.tags || '',
        status: formData.status,
      };

      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, productData as Partial<ShopifyAdminProduct>);
        
        // Update variant price/sku if changed
        if (editingProduct.variants[0] && (formData.price || formData.sku)) {
          // Note: Variant updates would need separate API call
        }
        
        toast.success('Producto actualizado en Shopify');
      } else {
        // Create new product with variant
        productData.variants = [{
          price: formData.price || '0',
          sku: formData.sku || '',
          inventory_management: 'shopify',
          inventory_policy: 'deny',
        }];
        
        await createProduct(productData as Partial<ShopifyAdminProduct>);
        toast.success('Producto creado en Shopify');
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: ShopifyAdminProduct) {
    if (!confirm(`¿Eliminar "${product.title}" de Shopify? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteProduct(product.id);
      toast.success('Producto eliminado de Shopify');
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Activo</Badge>;
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">Productos Shopify</h1>
                  <Badge variant="outline" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Sincronizado
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {products.length} productos en Shopify
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog} disabled={apiLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="draft">Borradores</SelectItem>
                    <SelectItem value="archived">Archivados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No se encontraron productos</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const variant = product.variants[0];
                      const image = product.images[0];
                      const totalStock = product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                              {image ? (
                                <img 
                                  src={image.src} 
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {variant?.sku || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{product.product_type || 'Sin tipo'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-medium">
                              DOP ${parseFloat(variant?.price || '0').toLocaleString()}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={totalStock > 10 ? 'default' : totalStock > 0 ? 'secondary' : 'destructive'}>
                              {totalStock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(product.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEditDialog(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(product)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto en Shopify' : 'Nuevo Producto en Shopify'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Los cambios se reflejarán en tu tienda Shopify' : 'Este producto se creará directamente en Shopify'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Nombre del producto *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="body_html">Descripción</Label>
                <Textarea
                  id="body_html"
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  rows={3}
                  placeholder="Descripción del producto (puede incluir HTML)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (DOP) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required={!editingProduct}
                  disabled={!!editingProduct}
                  placeholder={editingProduct ? 'Editar en variantes' : ''}
                />
                {editingProduct && (
                  <p className="text-xs text-muted-foreground">
                    El precio se edita desde las variantes en Shopify Admin
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  disabled={!!editingProduct}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_type">Tipo de producto</Label>
                <Input
                  id="product_type"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  placeholder="ej: Proteína, Creatina, Pre-entreno"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Proveedor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="proteina, whey, fitness (separadas por coma)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'draft' | 'archived') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                ) : editingProduct ? 'Actualizar en Shopify' : 'Crear en Shopify'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
