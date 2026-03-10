import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { initiateCardPayment, submitAzulPaymentForm, verifyPaymentStatus } from '@/lib/payment-gateway';
import { toast } from 'sonner';

export default function CardCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if returning from AZUL payment
  const returnStatus = searchParams.get('status');
  const returnOrderId = searchParams.get('orderId');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // Handle return from AZUL
    if (returnStatus && returnOrderId) {
      handlePaymentReturn(returnStatus, returnOrderId);
    }
  }, [authLoading, user, returnStatus, returnOrderId]);

  async function handlePaymentReturn(status: string, orderId: string) {
    setPaymentStatus('processing');

    if (status === 'approved') {
      // Verify payment on backend
      const result = await verifyPaymentStatus(orderId);

      if (result.status === 'verified') {
        setPaymentStatus('success');
        clearCart();
        toast.success('Pago aprobado exitosamente!');
        setTimeout(() => navigate(`/order/${orderId}`), 2000);
      } else {
        // Payment might still be processing, redirect to order
        toast.info('Verificando pago...');
        navigate(`/order/${orderId}`);
      }
    } else if (status === 'declined') {
      setPaymentStatus('error');
      setErrorMessage('El pago fue rechazado por el banco. Intenta con otra tarjeta o método de pago.');
    } else {
      setPaymentStatus('error');
      setErrorMessage('El pago fue cancelado.');
    }
  }

  async function handleCardPayment() {
    if (!user) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const subtotal = getSubtotal();

      // First create the order
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const customerName = profile?.full_name || user.email || 'Cliente';
      const customerEmail = profile?.email || user.email || '';

      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: subtotal,
          subtotal: subtotal,
          status: 'pending',
          shipping_address: customerName,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      await supabase.from('order_items').insert(orderItems);

      // Initiate AZUL payment
      const baseUrl = window.location.origin;
      const result = await initiateCardPayment({
        orderId: order.id,
        amount: subtotal,
        customerName,
        customerEmail,
        description: `Pedido #${order.id.slice(0, 8).toUpperCase()} - Barbaro Nutrition`,
        returnUrl: `${baseUrl}/checkout/tarjeta`,
        cancelUrl: `${baseUrl}/checkout/tarjeta`,
      });

      if (result.success && result.paymentUrl && result.formData) {
        // Redirect to AZUL payment page
        submitAzulPaymentForm(result.paymentUrl, result.formData);
      } else if (result.fallback === 'transfer') {
        toast.error('Pasarela de pago no disponible', {
          description: 'Por favor usa transferencia bancaria.'
        });
        navigate('/checkout/transferencia');
      } else {
        throw new Error(result.error || 'Error initiating payment');
      }
    } catch (error) {
      console.error('Card payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error procesando el pago');
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  }

  // Payment return screens
  if (paymentStatus === 'processing') {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Verificando pago...</h1>
          <p className="text-muted-foreground">Espera mientras confirmamos tu pago con AZUL</p>
        </div>
      </Layout>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Pago Aprobado!</h1>
          <p className="text-muted-foreground mb-6">Tu pedido ha sido procesado exitosamente</p>
          <Button asChild>
            <Link to={`/order/${returnOrderId}`}>Ver mi pedido</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Pago no procesado</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/checkout/transferencia">Pagar por transferencia</Link>
            </Button>
            <Button onClick={() => { setPaymentStatus('idle'); setErrorMessage(''); }}>
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0 && !returnStatus) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Carrito vacío</h1>
          <p className="text-muted-foreground mb-6">No hay productos para procesar</p>
          <Button asChild><Link to="/shop">Ver Tienda</Link></Button>
        </div>
      </Layout>
    );
  }

  const subtotal = getSubtotal();

  return (
    <Layout>
      <div className="container py-8 max-w-lg mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la tienda
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pago con Tarjeta
            </CardTitle>
            <CardDescription>
              Procesado de forma segura por AZUL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span className="font-medium">
                    DOP {(item.product.price * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>DOP {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Pago seguro encriptado - Procesado por AZUL</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCardPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando con AZUL...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar DOP {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </>
              )}
            </Button>

            <div className="text-center">
              <Link to="/checkout/transferencia" className="text-sm text-muted-foreground hover:underline">
                Prefiero pagar por transferencia bancaria
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
