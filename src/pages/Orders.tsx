import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingBag, ArrowRight, FileText, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

interface OrderWithDetails {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: string | null;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
  paid: { label: 'Pagado', icon: <CheckCircle className="h-3 w-3" />, variant: 'default' },
  processing: { label: 'Procesando', icon: <Package className="h-3 w-3" />, variant: 'outline' },
  shipped: { label: 'Enviado', icon: <Truck className="h-3 w-3" />, variant: 'outline' },
  delivered: { label: 'Entregado', icon: <CheckCircle className="h-3 w-3" />, variant: 'default' },
  cancelled: { label: 'Cancelado', icon: <XCircle className="h-3 w-3" />, variant: 'destructive' },
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    async function fetchOrders() {
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (id, product_name, quantity, price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Mis Pedidos</h1>
            <p className="text-muted-foreground">
              Historial de compras y seguimiento de envíos
            </p>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No tienes pedidos aún</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Explora nuestra tienda y encuentra los suplementos perfectos para ti.
                </p>
                <Button asChild>
                  <Link to="/shop">
                    Ver Productos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              Pedido #{order.id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <CardDescription>
                              {new Date(order.created_at).toLocaleDateString('es-DO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={status.variant} className="gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {/* Order items */}
                      <div className="space-y-2 mb-4">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.product_name}
                            </span>
                            <span className="font-medium">
                              DOP {(item.price * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total and actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                        <p className="font-bold text-lg">
                          Total: DOP {order.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </p>
                        
                        {(order.status === 'paid' || order.status === 'delivered') && (
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Descargar Factura
                          </Button>
                        )}
                      </div>

                      {/* Shipping address */}
                      {order.shipping_address && (
                        <div className="text-sm text-muted-foreground pt-3 mt-3 border-t">
                          <strong className="text-foreground">Dirección:</strong>
                          <p className="whitespace-pre-line mt-1">{order.shipping_address}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
