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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Search, 
  ArrowLeft,
  Package,
  Boxes,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';
import type { Product } from '@/types/product';

export default function AdminInventory() {
  const { user, loading: authLoading } = useAuth();
  const { canManageProducts, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'adjust'>('adjust');
  const [adjustmentValue, setAdjustmentValue] = useState('');
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      toast.error('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  function openAdjustDialog(product: Product) {
    setSelectedProduct(product);
    setAdjustmentType('adjust');
    setAdjustmentValue('');
    setIsDialogOpen(true);
  }

  async function handleAdjustInventory() {
    if (!selectedProduct || !adjustmentValue) return;

    setSaving(true);
    try {
      const value = parseInt(adjustmentValue);
      let newStock: number;
      
      if (adjustmentType === 'set') {
        newStock = value;
      } else {
        newStock = selectedProduct.stock + value;
      }

      // Ensure stock doesn't go negative
      if (newStock < 0) newStock = 0;

      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      if (adjustmentType === 'set') {
        toast.success(`Stock establecido a ${newStock}`);
      } else {
        toast.success(`Stock ajustado en ${value > 0 ? '+' : ''}${value}`);
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

  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Agotado</Badge>;
    } else if (quantity <= 5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Bajo: {quantity}</Badge>;
    } else if (quantity <= 20) {
      return <Badge variant="secondary">{quantity}</Badge>;
    }
    return <Badge>{quantity}</Badge>;
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

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const inStock = products.filter(p => p.stock > 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock <= 0).length;

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
                <h1 className="font-display text-2xl font-bold">Inventario</h1>
                <p className="text-muted-foreground text-sm">
                  {products.length} productos
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalUnits}</div>
                <p className="text-sm text-muted-foreground">Unidades totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{inStock}</div>
                <p className="text-sm text-muted-foreground">En stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{lowStock}</div>
                <p className="text-sm text-muted-foreground">Stock bajo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
                <p className="text-sm text-muted-foreground">Agotados</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No se encontraron productos</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
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
                          <p className="font-medium">{product.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-medium">
                            RD${product.price.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStockBadge(product.stock)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openAdjustDialog(product)}
                          >
                            Ajustar
                          </Button>
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

      {/* Adjust Inventory Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Inventario</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Stock actual</p>
              <p className="text-3xl font-bold">{selectedProduct?.stock || 0}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={adjustmentType === 'adjust' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('adjust')}
                className="flex-1"
              >
                Ajustar (+/-)
              </Button>
              <Button
                variant={adjustmentType === 'set' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('set')}
                className="flex-1"
              >
                Establecer
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment">
                {adjustmentType === 'adjust' ? 'Cantidad a agregar/quitar' : 'Nuevo stock'}
              </Label>
              <div className="flex gap-2">
                {adjustmentType === 'adjust' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = parseInt(adjustmentValue) || 0;
                      setAdjustmentValue((current - 1).toString());
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="0"
                  className="text-center"
                />
                {adjustmentType === 'adjust' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = parseInt(adjustmentValue) || 0;
                      setAdjustmentValue((current + 1).toString());
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {adjustmentType === 'adjust' && adjustmentValue && (
                <p className="text-sm text-muted-foreground text-center">
                  Nuevo stock: {Math.max(0, (selectedProduct?.stock || 0) + parseInt(adjustmentValue || '0'))}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjustInventory} disabled={saving || !adjustmentValue}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
