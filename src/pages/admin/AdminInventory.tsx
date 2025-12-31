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
import { Label } from '@/components/ui/label';
import { useShopifyAdmin, ShopifyAdminProduct } from '@/hooks/useShopifyAdmin';
import { toast } from 'sonner';
import { 
  Search, 
  ArrowLeft,
  Package,
  Boxes,
  Loader2,
  ExternalLink,
  Plus,
  Minus
} from 'lucide-react';

interface InventoryItem {
  product: ShopifyAdminProduct;
  variant: ShopifyAdminProduct['variants'][0];
}

export default function AdminInventory() {
  const { user, loading: authLoading } = useAuth();
  const { canManageProducts, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { getProducts, adjustInventory, setInventory, getLocations, loading: apiLoading } = useShopifyAdmin();
  
  const [products, setProducts] = useState<ShopifyAdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState<number | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
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
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Get locations first
      const locationsResult = await getLocations();
      if (locationsResult.locations && locationsResult.locations.length > 0) {
        setLocationId(locationsResult.locations[0].id);
      }
      
      // Get products
      const result = await getProducts(250);
      setProducts(result.products || []);
    } catch (err) {
      toast.error('Error al cargar datos de Shopify');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const allVariants: InventoryItem[] = products.flatMap(product => 
    product.variants.map(variant => ({ product, variant }))
  );

  const filteredVariants = allVariants.filter(item => {
    const searchTerm = search.toLowerCase();
    return (
      item.product.title.toLowerCase().includes(searchTerm) ||
      (item.variant.sku?.toLowerCase().includes(searchTerm))
    );
  });

  function openAdjustDialog(item: InventoryItem) {
    setSelectedItem(item);
    setAdjustmentType('adjust');
    setAdjustmentValue('');
    setIsDialogOpen(true);
  }

  async function handleAdjustInventory() {
    if (!selectedItem || !adjustmentValue || !locationId) return;

    setSaving(true);
    try {
      const value = parseInt(adjustmentValue);
      
      if (adjustmentType === 'set') {
        await setInventory(selectedItem.variant.inventory_item_id, locationId, value);
        toast.success(`Inventario establecido a ${value}`);
      } else {
        await adjustInventory(selectedItem.variant.inventory_item_id, locationId, value);
        toast.success(`Inventario ajustado en ${value > 0 ? '+' : ''}${value}`);
      }
      
      setIsDialogOpen(false);
      fetchData();
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
                  <h1 className="font-display text-2xl font-bold">Inventario</h1>
                  <Badge variant="outline" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Shopify
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {allVariants.length} variantes de producto
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {allVariants.reduce((sum, item) => sum + (item.variant.inventory_quantity || 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Unidades totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {allVariants.filter(item => item.variant.inventory_quantity > 0).length}
                </div>
                <p className="text-sm text-muted-foreground">En stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {allVariants.filter(item => item.variant.inventory_quantity > 0 && item.variant.inventory_quantity <= 5).length}
                </div>
                <p className="text-sm text-muted-foreground">Stock bajo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {allVariants.filter(item => item.variant.inventory_quantity <= 0).length}
                </div>
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
                  placeholder="Buscar por producto o SKU..."
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
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No se encontraron productos</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVariants.map((item) => {
                      const image = item.product.images[0];
                      
                      return (
                        <TableRow key={`${item.product.id}-${item.variant.id}`}>
                          <TableCell>
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                              {image ? (
                                <img 
                                  src={image.src} 
                                  alt={item.product.title}
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
                              <p className="font-medium">{item.product.title}</p>
                              {item.variant.title !== 'Default Title' && (
                                <p className="text-xs text-muted-foreground">{item.variant.title}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {item.variant.sku || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStockBadge(item.variant.inventory_quantity || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openAdjustDialog(item)}
                            >
                              Ajustar
                            </Button>
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

      {/* Adjust Inventory Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Inventario</DialogTitle>
            <DialogDescription>
              {selectedItem?.product.title}
              {selectedItem?.variant.title !== 'Default Title' && ` - ${selectedItem?.variant.title}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Stock actual</p>
              <p className="text-3xl font-bold">{selectedItem?.variant.inventory_quantity || 0}</p>
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
                  <>
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
                  </>
                )}
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === 'adjust' ? '0' : '0'}
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
                  Nuevo stock: {(selectedItem?.variant.inventory_quantity || 0) + parseInt(adjustmentValue || '0')}
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
