import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  ShoppingBag, 
  ArrowRight, 
  FileText, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  MapPin,
  Calendar,
  Receipt,
  ChevronRight,
  Loader2,
  PackageOpen
} from 'lucide-react';

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

const statusConfig: Record<string, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  pending: { 
    label: 'Pendiente de Pago', 
    icon: <Clock className="h-3.5 w-3.5" />, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  payment_pending: { 
    label: 'Verificando Pago', 
    icon: <Clock className="h-3.5 w-3.5" />, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  paid: { 
    label: 'Pagado', 
    icon: <CheckCircle className="h-3.5 w-3.5" />, 
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  processing: { 
    label: 'Procesando', 
    icon: <Package className="h-3.5 w-3.5" />, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  packed: { 
    label: 'Empacado', 
    icon: <Package className="h-3.5 w-3.5" />, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  shipped: { 
    label: 'Enviado', 
    icon: <Truck className="h-3.5 w-3.5" />, 
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800'
  },
  delivered: { 
    label: 'Entregado', 
    icon: <CheckCircle className="h-3.5 w-3.5" />, 
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  cancelled: { 
    label: 'Cancelado', 
    icon: <XCircle className="h-3.5 w-3.5" />, 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  refunded: { 
    label: 'Reembolsado', 
    icon: <XCircle className="h-3.5 w-3.5" />, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
};

// Skeleton loader for orders
function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Empty state component
function EmptyOrders() {
  return (
    <div className="relative">
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <PackageOpen className="h-96 w-96" strokeWidth={0.5} />
      </div>
      
      <Card className="relative overflow-hidden border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 px-6">
          {/* Icon container with subtle animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Text content */}
          <div className="text-center max-w-sm space-y-2 mb-8">
            <h3 className="text-xl font-semibold tracking-tight">
              No tienes pedidos aún
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Explora nuestra tienda y encuentra los suplementos perfectos para impulsar tu rendimiento.
            </p>
          </div>
          
          {/* CTA Button */}
          <Button size="lg" className="group gap-2 px-6" asChild>
            <Link to="/shop">
              <span>Explorar Productos</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Order card component
function OrderCard({ 
  order, 
  onViewInvoice 
}: { 
  order: OrderWithDetails; 
  onViewInvoice: (orderId: string) => void;
}) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const itemCount = order.order_items.reduce((acc, item) => acc + item.quantity, 0);
  const canViewInvoice = order.status === 'paid' || order.status === 'delivered' || order.status === 'processing' || order.status === 'shipped';
  const canViewOrder = order.status === 'pending' || order.status === 'payment_pending';

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:border-foreground/20">
      {/* Order Header */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left side - Order info */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="shrink-0 p-3 rounded-xl bg-gradient-to-br from-muted to-muted/30 border border-border/50 transition-colors group-hover:border-foreground/10">
              <Package className="h-6 w-6 text-foreground/70" strokeWidth={1.5} />
            </div>
            
            {/* Order details */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base tracking-tight">
                  Pedido #{orderNumber}
                </h3>
                <span className="text-xs text-muted-foreground font-medium">
                  · {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formattedDate}</span>
                <span className="text-border">·</span>
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Status badge */}
          <div 
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${status.color} ${status.bgColor} ${status.borderColor} transition-colors`}
          >
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>
      </div>
      
      <Separator className="bg-border/50" />
      
      {/* Order Items */}
      <div className="p-5 sm:p-6 bg-muted/20">
        <div className="space-y-3">
          {order.order_items.map((item, index) => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between gap-4 ${
                index !== order.order_items.length - 1 ? 'pb-3 border-b border-border/30' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-background border border-border/50 text-xs font-semibold text-muted-foreground">
                  {item.quantity}x
                </div>
                <span className="text-sm font-medium truncate">
                  {item.product_name}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                DOP {(item.price * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <Separator className="bg-border/50" />
      
      {/* Order Footer */}
      <div className="p-5 sm:p-6">
        {/* Total */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span>Total del pedido</span>
          </div>
          <p className="text-xl font-bold tracking-tight">
            DOP {order.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        {/* Shipping Address */}
        {order.shipping_address && (
          <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Dirección de envío
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canViewOrder && (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full sm:w-auto gap-2 group/btn"
              asChild
            >
              <Link to={`/order/${order.id}`}>
                <Package className="h-4 w-4" />
                <span>Ver Pedido</span>
                <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/70 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
          )}
          {canViewInvoice && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto gap-2 group/btn"
              onClick={() => onViewInvoice(order.id)}
            >
              <FileText className="h-4 w-4" />
              <span>Ver Factura</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      console.log('Buscando factura para pedido:', orderId);
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      console.log('Resultado búsqueda factura:', { invoice, error });

      if (error) {
        console.error('Error al buscar factura:', error);
        throw error;
      }

      if (invoice) {
        console.log('Factura encontrada, navegando a:', `/orders/invoice/${invoice.id}`);
        navigate(`/orders/invoice/${invoice.id}`);
      } else {
        console.warn('No se encontró factura para el pedido:', orderId);
        alert('La factura aún no está disponible para este pedido. Por favor, contacta con el administrador.');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Error al obtener la factura. Por favor, intenta de nuevo.');
    }
  };

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
        <div className="min-h-[80vh] bg-gradient-to-b from-muted/30 to-background">
          <div className="container py-10 sm:py-16">
            <div className="max-w-3xl mx-auto">
              {/* Header skeleton */}
              <div className="mb-10 space-y-3">
                <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                <div className="h-5 w-64 bg-muted rounded animate-pulse" />
              </div>
              <OrderSkeleton />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-[80vh] bg-gradient-to-b from-muted/30 to-background">
        <div className="container py-10 sm:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <header className="mb-10 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-foreground text-background">
                  <Package className="h-5 w-5" strokeWidth={2} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Mis Pedidos
                </h1>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base pl-[52px]">
                Historial de compras y seguimiento de envíos
              </p>
            </header>

            {/* Content */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              {orders.length === 0 ? (
                <EmptyOrders />
              ) : (
                <>
                  {/* Orders count indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{orders.length}</span>
                      {' '}{orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
                    </p>
                  </div>
                  
                  {/* Orders list */}
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className="animate-slide-up"
                        style={{ 
                          animationDelay: `${150 + index * 50}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <OrderCard 
                          order={order} 
                          onViewInvoice={handleDownloadInvoice} 
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
