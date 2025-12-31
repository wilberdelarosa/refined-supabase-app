import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Building2, Mail, Phone, User, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Bank account details - these should be configured by the admin
const BANK_ACCOUNTS = [
  {
    bank: 'Banco Popular Dominicano',
    accountType: 'Cuenta Corriente',
    accountNumber: '123-456789-0',
    holder: 'Barbaro Nutrition SRL',
    rnc: '1-31-12345-6'
  },
  {
    bank: 'Banreservas',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '987-654321-0',
    holder: 'Barbaro Nutrition SRL',
    rnc: '1-31-12345-6'
  }
];

export default function TransferCheckout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Debes iniciar sesión para realizar un pedido');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const totalPrice = getTotalPrice();
  const currencyCode = items[0]?.price.currencyCode || 'DOP';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(null), 2000);
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

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: totalPrice,
          status: 'pending',
          shipping_address: `${formData.fullName}\n${formData.address}\n${formData.city}\n${formData.phone}\n${formData.email}${formData.notes ? `\nNotas: ${formData.notes}` : ''}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: null, // Shopify products don't have local IDs
        product_name: item.product.node.title,
        quantity: item.quantity,
        price: parseFloat(item.price.amount)
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send order confirmation email (background, don't block)
      supabase.functions.invoke('send-order-email', {
        body: {
          type: 'order_created',
          customerEmail: formData.email,
          customerName: formData.fullName,
          orderId: order.id,
          orderTotal: totalPrice,
          orderItems: items.map(item => ({
            name: item.product.node.title,
            quantity: item.quantity,
            price: parseFloat(item.price.amount)
          })),
          shippingAddress: `${formData.fullName}\n${formData.address}\n${formData.city}\n${formData.phone}`
        }
      }).then(res => {
        if (res.error) console.error('Email error:', res.error);
        else console.log('Order confirmation email sent');
      });

      // Clear cart and redirect
      clearCart();
      
      toast.success('¡Pedido creado exitosamente!', {
        description: 'Te enviaremos un correo con los detalles'
      });

      navigate('/orders');
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
                  <div key={item.variantId} className="flex gap-3">
                    <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                      {item.product.node.images?.edges?.[0]?.node && (
                        <img
                          src={item.product.node.images.edges[0].node.url}
                          alt={item.product.node.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.node.title}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      {currencyCode} {(parseFloat(item.price.amount) * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{currencyCode} {totalPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Account Details */}
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
                {BANK_ACCOUNTS.map((account, idx) => (
                  <div key={idx} className="p-4 bg-secondary/20 rounded-lg space-y-2">
                    <p className="font-semibold">{account.bank}</p>
                    <div className="grid gap-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{account.accountType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Número:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{account.accountNumber}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(account.accountNumber, `account-${idx}`)}
                          >
                            {copied === `account-${idx}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Titular:</span>
                        <span>{account.holder}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">RNC:</span>
                        <span>{account.rnc}</span>
                      </div>
                    </div>
                  </div>
                ))}

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
                <CardTitle>Datos de Envío</CardTitle>
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
