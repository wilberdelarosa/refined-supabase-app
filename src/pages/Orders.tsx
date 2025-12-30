import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingBag, ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: string | null;
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
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
        .select('*')
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente', variant: 'secondary' },
      paid: { label: 'Pagado', variant: 'default' },
      processing: { label: 'Procesando', variant: 'secondary' },
      shipped: { label: 'Enviado', variant: 'default' },
      delivered: { label: 'Entregado', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };
    const s = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

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
              {orders.map((order) => (
                <Card key={order.id} className="hover:border-foreground/20 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
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
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="font-semibold mt-1">
                          RD${order.total.toLocaleString('es-DO')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
