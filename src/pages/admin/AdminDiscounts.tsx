import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useShopifyAdmin, ShopifyPriceRule, ShopifyDiscountCode } from '@/hooks/useShopifyAdmin';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  ArrowLeft,
  Percent,
  Tag,
  Copy,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function AdminDiscounts() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { 
    getPriceRules, 
    createPriceRule, 
    deletePriceRule,
    getDiscountCodes,
    createDiscountCode,
    deleteDiscountCode,
    loading: apiLoading 
  } = useShopifyAdmin();
  
  const [priceRules, setPriceRules] = useState<ShopifyPriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ShopifyPriceRule | null>(null);
  const [discountCodes, setDiscountCodes] = useState<ShopifyDiscountCode[]>([]);
  const [newCode, setNewCode] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    value_type: 'percentage' as 'percentage' | 'fixed_amount',
    value: '',
    target_type: 'line_item' as 'line_item' | 'shipping_line',
    target_selection: 'all',
    allocation_method: 'across',
    customer_selection: 'all',
    once_per_customer: false,
    usage_limit: '',
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
    fetchPriceRules();
  }, []);

  async function fetchPriceRules() {
    setLoading(true);
    try {
      const result = await getPriceRules(250);
      setPriceRules(result.price_rules || []);
    } catch (err) {
      toast.error('Error al cargar reglas de precio de Shopify');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openCodesDialog(rule: ShopifyPriceRule) {
    setSelectedRule(rule);
    setNewCode('');
    try {
      const result = await getDiscountCodes(rule.id);
      setDiscountCodes(result.discount_codes || []);
      setIsCodeDialogOpen(true);
    } catch (err) {
      toast.error('Error al cargar códigos de descuento');
    }
  }

  function openCreateDialog() {
    setFormData({
      title: '',
      value_type: 'percentage',
      value: '',
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      customer_selection: 'all',
      once_per_customer: false,
      usage_limit: '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const ruleData = {
        title: formData.title,
        value_type: formData.value_type,
        value: formData.value_type === 'percentage' ? `-${formData.value}` : `-${formData.value}`,
        target_type: formData.target_type,
        target_selection: formData.target_selection,
        allocation_method: formData.allocation_method,
        customer_selection: formData.customer_selection,
        once_per_customer: formData.once_per_customer,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        starts_at: new Date().toISOString(),
      };

      await createPriceRule(ruleData);
      toast.success('Regla de precio creada en Shopify');
      setIsDialogOpen(false);
      fetchPriceRules();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRule(rule: ShopifyPriceRule) {
    if (!confirm(`¿Eliminar la regla \"${rule.title}\"? Esto también eliminará todos sus códigos de descuento.`)) return;

    try {
      await deletePriceRule(rule.id);
      toast.success('Regla eliminada de Shopify');
      fetchPriceRules();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    }
  }

  async function handleCreateCode() {
    if (!selectedRule || !newCode.trim()) return;

    try {
      await createDiscountCode(selectedRule.id, newCode.trim().toUpperCase());
      toast.success(`Código ${newCode.toUpperCase()} creado`);
      setNewCode('');
      const result = await getDiscountCodes(selectedRule.id);
      setDiscountCodes(result.discount_codes || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    }
  }

  async function handleDeleteCode(code: ShopifyDiscountCode) {
    if (!selectedRule) return;
    if (!confirm(`¿Eliminar el código \"${code.code}\"?`)) return;

    try {
      await deleteDiscountCode(selectedRule.id, code.id);
      toast.success('Código eliminado');
      const result = await getDiscountCodes(selectedRule.id);
      setDiscountCodes(result.discount_codes || []);
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
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">Descuentos</h1>
                  <Badge variant="outline" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Shopify
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {priceRules.length} reglas de precio
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog} disabled={apiLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Regla
            </Button>
          </div>

          {/* Price Rules Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-center">Límite</TableHead>
                    <TableHead>Válido desde</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay reglas de descuento</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    priceRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <p className="font-medium">{rule.title}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {rule.value_type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {rule.value_type === 'percentage' 
                              ? `${Math.abs(parseFloat(rule.value))}%` 
                              : `DOP $${Math.abs(parseFloat(rule.value))}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {rule.usage_limit || '∞'}
                        </TableCell>
                        <TableCell>
                          {new Date(rule.starts_at).toLocaleDateString('es-DO')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openCodesDialog(rule)}
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              Códigos
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteRule(rule)}
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

      {/* Create Price Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Regla de Precio</DialogTitle>
            <DialogDescription>
              Crea una regla de descuento en Shopify
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre de la regla *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ej: Black Friday 2024"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value_type">Tipo de descuento</Label>
                <Select 
                  value={formData.value_type} 
                  onValueChange={(value: 'percentage' | 'fixed_amount') => setFormData({ ...formData, value_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed_amount">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valor *</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.value_type === 'percentage' ? '10' : '500'}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_limit">Límite de uso (opcional)</Label>
              <Input
                id="usage_limit"
                type="number"
                min="0"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                placeholder="Sin límite"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="once_per_customer"
                checked={formData.once_per_customer}
                onCheckedChange={(checked) => setFormData({ ...formData, once_per_customer: checked })}
              />
              <Label htmlFor="once_per_customer">Una vez por cliente</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : 'Crear Regla'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discount Codes Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Códigos de Descuento</DialogTitle>
            <DialogDescription>
              Regla: {selectedRule?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new code */}
            <div className="flex gap-2">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="CODIGO2024"
                className="uppercase"
              />
              <Button onClick={handleCreateCode} disabled={!newCode.trim() || apiLoading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing codes */}
            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {discountCodes.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No hay códigos creados
                </div>
              ) : (
                discountCodes.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-mono font-medium">{code.code}</p>
                      <p className="text-xs text-muted-foreground">
                        Usos: {code.usage_count}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyCode(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteCode(code)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCodeDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
