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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, ArrowLeft, Eye, ShoppingBag } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  shipping_address: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'secondary' },
  { value: 'paid', label: 'Pagado', color: 'default' },
  { value: 'processing', label: 'Procesando', color: 'secondary' },
  { value: 'packed', label: 'Empacado', color: 'secondary' },
  { value: 'shipped', label: 'Enviado', color: 'default' },
  { value: 'delivered', label: 'Entregado', color: 'default' },
  { value: 'cancelled', label: 'Cancelado', color: 'destructive' },
  { value: 'refunded', label: 'Reembolsado', color: 'destructive' },
] as const;

export default function AdminOrders() {
  const { user, loading: authLoading } = useAuth();
  const { canManageOrders, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !canManageOrders) {
        navigate('/admin');
      }
    }
  }, [user, authLoading, rolesLoading, canManageOrders, navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los pedidos', variant: 'destructive' });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function openOrderDetail(order: Order) {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    
    setOrderItems(data || []);
    setIsDetailOpen(true);
  }

  async function updateOrderStatus() {
    if (!selectedOrder || newStatus === selectedOrder.status) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
      
      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: 'UPDATE_STATUS',
        p_table_name: 'orders',
        p_record_id: selectedOrder.id,
        p_old_data: { status: selectedOrder.status },
        p_new_data: { status: newStatus, note: statusNote }
      });

      // Send status change email to customer
      // Extract email from shipping address (last line before Notes)
      const addressLines = selectedOrder.shipping_address?.split('\n') || [];
      const emailLine = addressLines.find(line => line.includes('@')) || '';
      const customerName = addressLines[0] || 'Cliente';
      
      if (emailLine) {
        supabase.functions.invoke('send-order-email', {
          body: {
            type: 'status_changed',
            customerEmail: emailLine.trim(),
            customerName: customerName,
            orderId: selectedOrder.id,
            orderTotal: selectedOrder.total,
            orderItems: orderItems.map(item => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.price
            })),
            oldStatus: selectedOrder.status,
            newStatus: newStatus
          }
        }).then(res => {
          if (res.error) console.error('Email error:', res.error);
          else console.log('Status change email sent');
        });
      }

      toast({ title: 'Éxito', description: 'Estado actualizado correctamente' });
      setIsDetailOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = ORDER_STATUSES.find(st => st.value === status);
    return (
      <Badge variant={s?.color as any || 'secondary'}>
        {s?.label || status}
      </Badge>
    );
  };

  if (authLoading || rolesLoading || loading) {
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
                <h1 className="font-display text-2xl font-bold">Pedidos</h1>
                <p className="text-muted-foreground text-sm">
                  {orders.length} pedidos en total
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ORDER_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay pedidos</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono text-sm">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('es-DO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          RD${order.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openOrderDetail(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Pedido #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString('es-DO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3">Productos</h4>
                <div className="border rounded-lg divide-y">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex justify-between p-3">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-medium">RD${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-muted/50">
                    <p className="font-semibold">Total</p>
                    <p className="font-semibold">RD${selectedOrder.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div>
                  <h4 className="font-medium mb-2">Dirección de envío</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address}</p>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Actualizar Estado</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nuevo estado</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nota interna (opcional)</Label>
                    <Textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Agregar nota sobre el cambio de estado..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
            <Button 
              onClick={updateOrderStatus} 
              disabled={updating || newStatus === selectedOrder?.status}
            >
              {updating ? 'Actualizando...' : 'Actualizar Estado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
