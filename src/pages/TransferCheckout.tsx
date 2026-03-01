
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Building2, Mail, Phone, User, MapPin, Tag, Truck, ShieldCheck, CreditCard, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/lib/auth-context';
import { useDiscountCodes } from '@/hooks/useDiscountCodes';
import { useRNC } from '@/hooks/use-rnc';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DiscountCode } from '@/types/product';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-currency';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface PaymentMethod {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  rnc: string | null;
}

export default function TransferCheckout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotalPrice, getSubtotal, clearCart } = useCartStore();
  const { validateCode, applyDiscount, loading: discountLoading, error: discountError, clearError } = useDiscountCodes();
  const { fetchRNC, loading: rncLoading } = useRNC();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: DiscountCode; amount: number } | null>(null);
  const [wantsTaxReceipt, setWantsTaxReceipt] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    rnc: '',
    companyName: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Debes iniciar sesión para realizar un pedido');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchPaymentMethods() {
      const { data } = await supabase
        .from('payment_methods')
        .select('id, name, bank_name, account_type, account_number, account_holder, rnc')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data) setPaymentMethods(data);
    }
    fetchPaymentMethods();
  }, []);

  const subtotal = getSubtotal();
  const discountAmount = appliedDiscount?.amount || 0;
  const totalPrice = subtotal - discountAmount;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApplyDiscount = async () => {
    clearError();
    const result = await validateCode(discountCodeInput, subtotal);
    if (result) {
      setAppliedDiscount({ code: result.code, amount: result.discountAmount });
      toast.success(`¡Descuento aplicado!`, { description: `Ahorraste ${formatCurrency(result.discountAmount)}` });
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput('');
    clearError();
  };

  const handleRNCBlur = async () => {
      if (formData.rnc.length >= 9) {
          const data = await fetchRNC(formData.rnc);
          if (data) {
              setFormData(prev => ({
                  ...prev,
                  companyName: data.name
              }));
              toast.success('RNC Encontrado', { description: `Razón Social: ${data.name}` });
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast.error('Campos incompletos', { description: 'Por favor completa todos los campos requeridos marcados con *' });
      return;
    }

    if (wantsTaxReceipt && (!formData.rnc)) {
         toast.error('RNC Requerido', { description: 'Para crédito fiscal debes ingresar el RNC o Cédula.' });
         return;
    }

    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('Sesión requerida', { description: 'Debes iniciar sesión para finalizar el pedido' });
        navigate('/auth');
        return;
      }

      // Validate stock
      const outOfStock = items.filter(item => {
        const available = item.product.stock ?? 0;
        return item.quantity > available;
      });

      if (outOfStock.length > 0) {
        toast.error('Stock insuficiente', {
            description: 'Algunos productos en tu carrito ya no están disponibles en la cantidad solicitada.'
        });
        setIsSubmitting(false);
        return;
      }

      // Create order
      // Create order
      // Prepare payload
      const orderPayload = {
          user_id: user.id,
          total: totalPrice,
          subtotal: subtotal,
          discount_code_id: appliedDiscount?.code.id || null,
          discount_amount: discountAmount,
          status: 'pending',
          shipping_address: `${formData.fullName}\n${formData.address}\n${formData.city}\n${formData.phone}\n${formData.email}${formData.notes ? `\n\nNotas: ${formData.notes}` : ''}`,
          rnc_cedula: wantsTaxReceipt ? formData.rnc : null,
          company_name: wantsTaxReceipt ? formData.companyName : null,
          ncf_type: wantsTaxReceipt ? '01' : '02'
      };

      let orderResult;

      // Try primary insert
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) {
          console.warn("Primary insert failed. Attempting fallback without fiscal columns.", orderError);
          
          // Fallback payload (remove fiscal columns)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { rnc_cedula, company_name, ncf_type, ...fallbackPayload } = orderPayload;
          
          const { data: fallbackOrder, error: fallbackError } = await supabase
            .from('orders')
            .insert(fallbackPayload)
            .select()
            .single();
            
          if (fallbackError) throw fallbackError;
          orderResult = fallbackOrder;
          
          if (wantsTaxReceipt) {
              toast.warning("Pedido creado sin datos fiscales", {
                  description: "No se pudieron guardar el RNC. El sistema necesita una actualización de base de datos."
              });
          }
      } else {
          orderResult = order;
      }
      
      const savedOrder = orderResult; // Alias for compatibility with rest of code

      // Create order items
      const orderItems = items.map(item => ({
        order_id: savedOrder.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

       // Update usage limit if discount used
       if (appliedDiscount) {
         await applyDiscount(appliedDiscount.code.id, savedOrder.id, discountAmount);
       }

       // Update stock
       for (const item of items) {
         await supabase
           .from('products')
           .update({ stock: item.product.stock - item.quantity })
           .eq('id', item.product.id);
       }

       // Send email to customer (async)
        supabase.functions.invoke('send-order-email', {
        body: {
          type: 'order_created',
          customerEmail: formData.email,
          customerName: formData.fullName,
          orderId: savedOrder.id,
          orderTotal: totalPrice,
          orderItems: items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
          shippingAddress: `${formData.fullName}\n${formData.address}\n${formData.city}\n${formData.phone}`,
        }
      }).catch(err => console.error("Failed to send customer email", err));

      // Send email to admin about new order
      supabase.functions.invoke('send-order-email', {
        body: {
          type: 'admin_new_order',
          customerName: formData.fullName,
          orderId: savedOrder.id,
          orderTotal: totalPrice,
          orderItems: items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
        }
      }).catch(err => console.error("Failed to send admin email", err));

      // Audit + Notifications (fire-and-forget)
      const { logAction } = await import('@/hooks/useAuditLogger');
      const { notificationAdapter } = await import('@/modules/notifications/infrastructure/SupabaseNotificationAdapter');
      
      logAction('ORDER_CREATED', 'orders', savedOrder.id, { total: totalPrice, items_count: items.length });
      
      notificationAdapter.sendToUser({
        userId: user.id,
        title: 'Pedido Confirmado',
        message: `Tu pedido #${savedOrder.id.slice(0, 8).toUpperCase()} por ${formatCurrency(totalPrice)} ha sido recibido. Te notificaremos cuando sea procesado.`,
        type: 'ORDER_UPDATE',
        priority: 'HIGH',
        linkUrl: `/order/${savedOrder.id}`
      }).catch(err => console.error("Notification to user failed:", err));

      notificationAdapter.sendToAdmin({
        title: 'Nuevo Pedido Recibido',
        message: `${formData.fullName} realizó un pedido por ${formatCurrency(totalPrice)} (${items.length} productos).`,
        type: 'NEW_ORDER',
        priority: 'HIGH',
        linkUrl: '/admin/orders'
      }).catch(err => console.error("Notification to admin failed:", err));

      clearCart();
      navigate(`/order/${savedOrder.id}`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al procesar el pedido', {
        description: 'Hubo un problema al crear tu orden. Por favor intenta de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
            <div className="bg-secondary/30 p-6 rounded-full mb-6">
                <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Tu carrito está vacío</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Parece que aún no has agregado productos a tu carrito. Explora nuestra tienda para encontrar lo que necesitas.</p>
            <Button size="lg" asChild className="px-8">
                <Link to="/shop">Ir a la Tienda</Link>
            </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-muted/10 pb-20">
        {/* Header Strip */}
        <div className="bg-background border-b sticky top-0 z-10">
            <div className="container py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                        <Link to="/shop">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Seguir comprando
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="font-semibold text-lg">Finalizar Compra</h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span className="hidden sm:inline">Checkout Seguro</span>
                </div>
            </div>
        </div>

        <div className="container py-8 max-w-6xl">
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Form */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Shipping Info */}
                    <Card className="shadow-sm border-0 md:border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Truck className="h-5 w-5 text-primary" />
                                Información de Envío
                            </CardTitle>
                            <CardDescription>
                                ¿Dónde te enviaremos tu pedido?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Form fields same as before... */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nombre Completo *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            placeholder="Ej: Juan Pérez"
                                            className="pl-9 bg-background"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono / WhatsApp *</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            placeholder="Ej: 809-555-0000"
                                            className="pl-9 bg-background"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        className="pl-9 bg-background"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">Dirección *</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="address"
                                            placeholder="Calle, Número, Sector"
                                            className="pl-9 bg-background"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ciudad *</Label>
                                    <Input
                                        id="city"
                                        placeholder="Ej: Santo Domingo"
                                        className="bg-background"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        
                            {/* Billing Section Toggle */}
                             <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Comprobante Fiscal (DGII)</Label>
                                        <p className="text-sm text-muted-foreground">
                                            ¿Necesitas factura con valor fiscal (B01)?
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={wantsTaxReceipt}
                                        onCheckedChange={setWantsTaxReceipt}
                                    />
                                </div>
                                
                                {wantsTaxReceipt && (
                                    <div className="grid gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="rnc">RNC o Cédula *</Label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="rnc"
                                                    placeholder="101000000"
                                                    className="pl-9 bg-background"
                                                    value={formData.rnc}
                                                    onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
                                                    onBlur={handleRNCBlur}
                                                    required={wantsTaxReceipt}
                                                />
                                                {rncLoading && (
                                                    <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Razón Social o Nombre *</Label>
                                             <Input
                                                id="companyName"
                                                placeholder="Nombre de la empresa"
                                                className="bg-background"
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                                readOnly={rncLoading}
                                                required={wantsTaxReceipt}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                           Se emitirá una Factura de Crédito Fiscal (Type B01). Asegúrate de que el RNC esté activo.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="flex justify-between">
                                    Notas de entrega
                                    <span className="text-xs font-normal text-muted-foreground">Opcional</span>
                                </Label>
                                <Textarea
                                    id="notes"
                                    placeholder="¿Alguna instrucción especial para el mensajero?"
                                    className="bg-background resize-none min-h-[80px]"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="shadow-sm border-0 md:border group">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-xl">
                                <Building2 className="h-5 w-5 text-primary" />
                                Método de Pago
                            </CardTitle>
                            <CardDescription>
                                Realiza una transferencia a una de nuestras cuentas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {paymentMethods.map((account, idx) => (
                                    <div key={account.id} className="relative rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow hover:border-primary/50">
                                        <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40">
                                            <CreditCard className="h-12 w-12" />
                                        </div>
                                        <div className="space-y-3 relative z-10">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold leading-none text-base">{account.bank_name || account.name}</h4>
                                                <p className="text-xs text-muted-foreground">{account.account_type || 'Cuenta Corriente'}</p>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Número de Cuenta</div>
                                                <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-md w-fit">
                                                    <code className="text-sm font-mono font-bold text-foreground">{account.account_number}</code>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(account.account_number!, `acc-${idx}`)}
                                                        className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                                    >
                                                        {copied === `acc-${idx}` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {account.account_holder && (
                                                <div className="space-y-0.5">
                                                     <div className="text-[10px] text-muted-foreground uppercase">Titular</div>
                                                     <div className="text-xs font-medium">{account.account_holder}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-start gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm">
                                <ShieldCheck className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-red-900 dark:text-red-300">Importante</p>
                                    <p className="text-red-800 dark:text-red-400 leading-relaxed">
                                        Tu pedido no será procesado hasta que confirmemos la transferencia. Podrás subir tu comprobante en el siguiente paso.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Calculations */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                     <Card className="shadow-lg border-primary/20 overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle>Resumen del Pedido</CardTitle>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                            {/* Product List */}
                            <div className="max-h-[300px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-4">
                                        <div className="h-16 w-16 rounded-md bg-secondary/30 overflow-hidden shrink-0 border border-border/50">
                                            {item.product.image_url ? (
                                                <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover mix-blend-multiply" />
                                            ) : (
                                                 <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Sin foto</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">Cant: {item.quantity}</p>
                                        </div>
                                        <div className="text-right flex flex-col justify-center shrink-0">
                                             <p className="font-medium">{formatCurrency(item.product.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Discount */}
                             <div className="p-6 space-y-4">
                                <Label>Código de descuento</Label>
                                {appliedDiscount ? (
                                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Tag className="h-4 w-4 text-green-600 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-green-700 dark:text-green-400 truncate">{appliedDiscount.code.code}</p>
                                                <p className="text-xs text-green-600">Ahorro aplicado</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={handleRemoveDiscount} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                            <span className="sr-only">Remover</span>
                                            <span aria-hidden="true">×</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ingresa tu código"
                                            value={discountCodeInput}
                                            onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                                            className="uppercase font-medium"
                                        />
                                        <Button 
                                            variant="secondary" 
                                            onClick={handleApplyDiscount}
                                            disabled={discountLoading || !discountCodeInput}
                                        >
                                            Aplicar
                                        </Button>
                                    </div>
                                )}
                                {discountError && <p className="text-sm text-red-500">{discountError}</p>}
                             </div>

                             <Separator />

                             {/* Totals */}
                            <div className="p-6 space-y-3 bg-muted/10">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {appliedDiscount && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Descuento</span>
                                        <span>- {formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {wantsTaxReceipt && (
                                     <div className="flex justify-between text-muted-foreground">
                                        <span>ITBIS Incluido (18%)</span>
                                        <span>{formatCurrency(totalPrice - (totalPrice / 1.18))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end pt-3 border-t">
                                    <span className="text-lg font-bold">Total a Pagar</span>
                                    <span className="text-2xl font-bold tracking-tight">{formatCurrency(totalPrice)}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 bg-muted/5">
                            <Button 
                                className="w-full text-lg h-12 shadow-lg hover:shadow-xl transition-all" 
                                size="lg" 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
                                        Procesando...
                                    </span>
                                ) : 'Confirmar Pedido'}
                            </Button>
                        </CardFooter>
                    </Card>
                    
                    <p className="text-xs text-center text-muted-foreground">
                        Al confirmar, aceptas nuestros términos y condiciones de venta.
                    </p>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
}
