import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Building2, Mail, Phone, User, MapPin, Tag, CreditCard, Shield } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/lib/auth-context';
import { useDiscountCodes } from '@/hooks/useDiscountCodes';
import { supabase } from '@/integrations/supabase/client';
import { getStoreSettingsSnapshot } from '@/lib/store-settings';
import { formatRnc } from '@/lib/invoicing';
import { toast } from 'sonner';
import { DiscountCode } from '@/types/product';

interface PaymentMethodDB {
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
}

export default function TransferCheckout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { validateCode, applyDiscount, loading: discountLoading, error: discountError, clearError } = useDiscountCodes();

  const [bankAccounts, setBankAccounts] = useState<PaymentMethodDB[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: DiscountCode; amount: number } | null>(null);
  const [storeRnc, setStoreRnc] = useState<string>('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    billingRnc: ''
  });

  // Load bank accounts from DB and store settings
  useEffect(() => {
    async function loadData() {
      const [accountsResult, settings] = await Promise.all([
        supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .eq('type', 'bank_transfer')
          .order('display_order', { ascending: true }),
        getStoreSettingsSnapshot()
      ]);

      if (accountsResult.data) {
        setBankAccounts(accountsResult.data);
      }
      if (settings.invoicing.rnc) {
        setStoreRnc(formatRnc(settings.invoicing.rnc));
      }
      setLoadingAccounts(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Debes iniciar sesión para realizar un pedido');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
      toast.success(`Descuento aplicado! Ahorraste DOP ${result.discountAmount.toLocaleString()}`);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput('');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('Debes iniciar sesión para realizar un pedido');
        navigate('/auth');
        return;
      }

      const shippingAddress = `${formData.fullName}\n${formData.address}\n${formData.city}\n${formData.phone}\n${formData.email}${formData.notes ? `\nNotas: ${formData.notes}` : ''}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: totalPrice,
          subtotal: subtotal,
          discount_code_id: appliedDiscount?.code.id || null,
          discount_amount: discountAmount,
          status: 'pending',
          shipping_address: shippingAddress,
          billing_name: formData.fullName,
          billing_rnc: formData.billingRnc || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (appliedDiscount) {
        await applyDiscount(appliedDiscount.code.id, order.id, discountAmount);
      }

      // Update stock
      for (const item of items) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id);
      }

      // Send order confirmation email
      supabase.functions.invoke('send-order-email', {
        body: {
          type: 'order_created',
          customerEmail: formData.email,
          customerName: formData.fullName,
          orderId: order.id,
          orderTotal: totalPrice,
          orderItems: items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
          shippingAddress: `${formData.fullName}\n${formData.address}\n${formData.city}\n${formData.phone}`
        }
      }).then(res => {
        if (res.error) console.error('Email error:', res.error);
      });

      clearCart();

      toast.success('Pedido creado exitosamente!', {
        description: 'Ahora puedes adjuntar tu comprobante de pago'
      });

      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al crear el pedido', {
        description: 'Por favor intenta de nuevo'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Carrito vacío</h1>
          <p className="text-muted-foreground mb-6">No hay productos para procesar</p>
          <Button asChild><Link to="/shop">Ver Tienda</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la tienda
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                      {item.product.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      DOP {(item.product.price * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}

                <Separator />

                {/* Discount Code */}
                <div className="space-y-2">
                  <Label>Código de descuento</Label>
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          {appliedDiscount.code.code}
                        </span>
                        <span className="text-sm text-green-600">
                          (-DOP {appliedDiscount.amount.toLocaleString()})
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveDiscount}>
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="CODIGO2024"
                        value={discountCodeInput}
                        onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={discountLoading || !discountCodeInput}
                      >
                        Aplicar
                      </Button>
                    </div>
                  )}
                  {discountError && (
                    <p className="text-sm text-destructive">{discountError}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>DOP {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-DOP {discountAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>DOP {totalPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Account Details - Dynamic from DB */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Datos para Transferencia
                </CardTitle>
                <CardDescription>
                  Realiza la transferencia a cualquiera de estas cuentas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No hay cuentas bancarias configuradas.</p>
                    <p className="text-sm">Contacta al administrador.</p>
                  </div>
                ) : (
                  bankAccounts.map((account) => (
                    <div key={account.id} className="p-4 bg-secondary/20 rounded-lg space-y-2">
                      <p className="font-semibold">{account.bank_name || account.name}</p>
                      <div className="grid gap-1 text-sm">
                        {account.account_type && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span>{account.account_type}</span>
                          </div>
                        )}
                        {account.account_number && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Número:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{account.account_number}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(account.account_number!, `account-${account.id}`)}
                              >
                                {copied === `account-${account.id}` ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        {account.account_holder && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Titular:</span>
                            <span>{account.account_holder}</span>
                          </div>
                        )}
                        {(account.rnc || storeRnc) && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">RNC:</span>
                            <span>{account.rnc ? formatRnc(account.rnc) : storeRnc}</span>
                          </div>
                        )}
                      </div>
                      {account.instructions && (
                        <p className="text-xs text-muted-foreground italic mt-2">{account.instructions}</p>
                      )}
                    </div>
                  ))
                )}

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Importante:</strong> Incluye tu correo electrónico en el concepto de la transferencia para facilitar la verificación.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Datos de Envío y Facturación</CardTitle>
                <CardDescription>
                  Completa tus datos para procesar el pedido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Juan Pérez"
                        className="pl-10"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="809-555-1234"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Calle, número, sector"
                        className="pl-10"
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
                      placeholder="Santo Domingo"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <Separator />

                  {/* RNC Field for fiscal invoicing */}
                  <div className="space-y-2">
                    <Label htmlFor="billingRnc" className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      RNC (opcional - para factura fiscal)
                    </Label>
                    <Input
                      id="billingRnc"
                      placeholder="000000000"
                      value={formData.billingRnc}
                      onChange={(e) => setFormData({ ...formData, billingRnc: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                      maxLength={9}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si deseas factura con comprobante fiscal, ingresa tu RNC de 9 dígitos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales</Label>
                    <Textarea
                      id="notes"
                      placeholder="Instrucciones especiales de entrega..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al confirmar, recibirás un correo con los detalles del pedido.
                    Tu pedido será procesado una vez verifiquemos la transferencia.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
