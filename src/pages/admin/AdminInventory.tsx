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
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  ArrowLeft,
  Package,
  Boxes,
  Loader2,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle
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
      toast({ title: 'Error', description: 'Error al cargar productos', variant: 'destructive' });
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
        toast({ title: 'Éxito', description: `Stock establecido a ${newStock}` });
      } else {
        toast({ title: 'Éxito', description: `Stock ajustado en ${value > 0 ? '+' : ''}${value}` });
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">Agotado</Badge>;
    } else if (quantity <= 5) {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">Bajo: {quantity}</Badge>;
    } else if (quantity <= 20) {
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">{quantity}</Badge>;
    }
    return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">{quantity}</Badge>;
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b8cee]"></div>
        </div>
      </AdminLayout>
    );
  }

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const inStock = products.filter(p => p.stock > 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock <= 0).length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="hover-lift hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
              <Boxes className="h-7 w-7 text-slate-700" />
              Inventario
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Control de stock y existencias
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm border border-slate-200 bg-white">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 text-uppercase tracking-wider">Unidades Totales</p>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalUnits}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 bg-white">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 text-uppercase tracking-wider">En Stock</p>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{inStock}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 bg-white">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 text-uppercase tracking-wider">Stock Bajo</p>
              <div className="text-2xl font-bold text-yellow-600 mt-1">{lowStock}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 bg-white">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 text-uppercase tracking-wider">Agotados</p>
              <div className="text-2xl font-bold text-red-600 mt-1">{outOfStock}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6 shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="pt-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por producto o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-slate-200 bg-slate-50 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
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
                  <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100">
                          <Boxes className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No se encontraron productos</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell>
                        <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900">{product.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-normal">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium text-slate-900">
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
                          className="hover:bg-slate-100 border-slate-200 text-slate-700"
                        >
                          Ajustar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Adjust Inventory Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Ajustar Inventario</DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-lg text-center border border-slate-200">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Stock actual</p>
              <p className="text-4xl font-bold text-slate-900">{selectedProduct?.stock || 0}</p>
            </div>

            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <Button
                  variant="ghost"
                  onClick={() => setAdjustmentType('adjust')}
                  className={`flex-1 rounded-md transition-all ${adjustmentType === 'adjust'
                      ? 'bg-white shadow-sm text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Ajustar (+/-)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setAdjustmentType('set')}
                  className={`flex-1 rounded-md transition-all ${adjustmentType === 'set'
                      ? 'bg-white shadow-sm text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Establecer
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment" className="text-slate-700 font-medium">
                  {adjustmentType === 'adjust' ? 'Cantidad a agregar (positivo) o quitar (negativo)' : 'Nueva cantidad de stock'}
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
                      className="border-slate-200 hover:bg-slate-100 text-slate-700"
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
                    className="text-center font-mono text-lg border-slate-200 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
                  />
                  {adjustmentType === 'adjust' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const current = parseInt(adjustmentValue) || 0;
                        setAdjustmentValue((current + 1).toString());
                      }}
                      className="border-slate-200 hover:bg-slate-100 text-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {adjustmentType === 'adjust' && adjustmentValue && (
                  <p className="text-sm text-center font-medium">
                    <span className="text-slate-500">Resultado: </span>
                    <span className={
                      ((selectedProduct?.stock || 0) + parseInt(adjustmentValue || '0')) < 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }>
                      {Math.max(0, (selectedProduct?.stock || 0) + parseInt(adjustmentValue || '0'))} unidades
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-200 text-slate-700">
              Cancelar
            </Button>
            <Button onClick={handleAdjustInventory} disabled={saving || !adjustmentValue} className="bg-[#2b8cee] hover:bg-[#206bc4] text-white">
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
    </AdminLayout>
  );
}
