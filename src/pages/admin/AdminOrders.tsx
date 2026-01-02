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
import {
  Search,
  ArrowLeft,
  Eye,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Download,
  User,
  Mail,
  MapPin,
  Phone,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  shipping_address: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  issued_at: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  billing_name: string | null;
  billing_address: string | null;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
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

const parseCustomerInfo = (shipping: string | null | undefined) => {
  if (!shipping) return { name: 'Cliente', address: '', city: '', phone: '', email: '', notes: '' };
  const lines = shipping.split('\n').map(l => l.trim()).filter(Boolean);
  return {
    name: lines[0] || 'Cliente',
    address: lines[1] || '',
    city: lines[2] || '',
    phone: lines[3] || '',
    email: lines.find(l => l.includes('@')) || lines[4] || '',
    notes: lines.find(l => l.toLowerCase().startsWith('notas')) || ''
  };
};

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
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
    
    // Fetch orders first
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los pedidos', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch profiles for all user_ids
    const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    // Map profiles to orders
    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    const ordersWithProfiles = (ordersData || []).map(order => ({
      ...order,
      profiles: profilesMap.get(order.user_id) || null
    }));

    setOrders(ordersWithProfiles);
    setLoading(false);
  }

  async function openOrderDetail(order: Order) {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setUserProfile(null);
    setInvoice(null);
    setInvoiceLoading(true);
    
    const [{ data: items }, { data: invoiceData }, { data: profileData }] = await Promise.all([
      supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id),
      supabase
        .from('invoices')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', order.user_id)
        .maybeSingle()
    ]);
    
    setOrderItems(items || []);
    setUserProfile(profileData || null);
    setInvoice(invoiceData || null);
    setInvoiceLoading(false);
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

      // If status changed to "paid", create invoice automatically
      if (newStatus === 'paid' && selectedOrder.status !== 'paid') {
        await createInvoiceForOrder(selectedOrder, orderItems);
      }

      // Send status change email to customer
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  }

  async function createInvoiceForOrder(order: Order, items: OrderItem[]): Promise<Invoice | null> {
    try {
      const { data: existing } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();

      if (existing) {
        setInvoice(existing);
        return existing;
      }

      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');
      
      const addressLines = order.shipping_address?.split('\n') || [];
      const billingName = addressLines[0] || 'Cliente';
      const billingAddress = addressLines.slice(1, 4).join(', ');

      const subtotal = order.total / 1.18;
      const taxRate = 0.18;
      const taxAmount = order.total - subtotal;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber || `INV-${Date.now()}`,
          order_id: order.id,
          user_id: order.user_id,
          subtotal: Math.round(subtotal * 100) / 100,
          tax_rate: taxRate,
          tax_amount: Math.round(taxAmount * 100) / 100,
          total: order.total,
          status: 'issued',
          billing_name: billingName,
          billing_address: billingAddress
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceLines = items.map(item => ({
        invoice_id: invoice.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity
      }));

      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(invoiceLines);

      if (linesError) throw linesError;

      setInvoice(invoice);
      toast({ title: 'Factura creada', description: `Factura ${invoice.invoice_number} generada automáticamente` });
      return invoice as Invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ title: 'Advertencia', description: 'No se pudo crear la factura automáticamente', variant: 'destructive' });
      return null;
    }
  }

  async function handleGenerateInvoice() {
    if (!selectedOrder) return;
    setCreatingInvoice(true);
    await createInvoiceForOrder(selectedOrder, orderItems);
    setCreatingInvoice(false);
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const customerInfo = parseCustomerInfo(selectedOrder?.shipping_address);

  const getStatusBadge = (status: string) => {
    const s = ORDER_STATUSES.find(st => st.value === status);
    const colors = {
      'pending': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      'paid': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      'processing': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      'packed': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      'shipped': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      'delivered': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      'cancelled': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      'refunded': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    };
    return (
      <Badge variant="outline" className={`${colors[status as keyof typeof colors] || 'bg-muted'} font-semibold border`}>
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
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                  <ShoppingCart className="h-7 w-7" />
                  Gestión de Pedidos
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} en total
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Card */}
          <Card className="mb-6 shadow-premium border-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent"></div>
            <CardContent className="pt-6 relative">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID de pedido..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-0 bg-background/50"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[220px] border-0 bg-background/50">
                    <SelectValue placeholder="Filtrar por estado" />
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

          {/* Enhanced Orders Table */}
          <Card className="shadow-premium border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-bold">ID Pedido</TableHead>
                      <TableHead className="font-bold">Cliente</TableHead>
                      <TableHead className="font-bold">Fecha & Hora</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                      <TableHead className="text-center font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4 animate-fade-in">
                            <div className="p-4 rounded-full bg-muted">
                              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg mb-1">No hay pedidos</p>
                              <p className="text-muted-foreground text-sm">
                                {search || filterStatus !== 'all' 
                                  ? 'No se encontraron resultados con los filtros actuales'
                                  : 'Aún no hay pedidos registrados'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <TableRow 
                          key={order.id} 
                          className="hover:bg-muted/30 transition-colors animate-fade-in group"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <TableCell>
                            <span className="font-mono text-sm font-bold bg-muted px-2.5 py-1.5 rounded-md">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {order.profiles?.full_name || parseCustomerInfo(order.shipping_address).name || 'Cliente'}
                                </span>
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {order.profiles?.email || parseCustomerInfo(order.shipping_address).email || '—'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(order.created_at).toLocaleDateString('es-DO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString('es-DO', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-lg">
                              RD${order.total.toLocaleString('es-DO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openOrderDetail(order)}
                              className="hover-lift hover:bg-foreground/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl w-[95vw]">
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
              {/* Customer + Invoice summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-2 rounded-md bg-foreground text-background">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Usuario del pedido</p>
                      <p className="font-bold text-lg leading-tight truncate">
                        {userProfile?.full_name || customerInfo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {selectedOrder.user_id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {(userProfile?.email || customerInfo.email) && (
                      <div className="flex items-center gap-2 text-foreground/80 break-all">
                        <Mail className="h-4 w-4" />
                        <span>{userProfile?.email || customerInfo.email}</span>
                      </div>
                    )}
                    {customerInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{customerInfo.phone}</span>
                      </div>
                    )}
                    {(customerInfo.address || customerInfo.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span className="whitespace-pre-line">{[customerInfo.address, customerInfo.city].filter(Boolean).join('\n')}</span>
                      </div>
                    )}
                    {customerInfo.notes && (
                      <p className="text-xs italic text-foreground/70">{customerInfo.notes}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/40 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Estado & total</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedOrder.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedOrder.created_at).toLocaleString('es-DO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        RD${selectedOrder.total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Pedido</p>
                      <p className="font-mono text-sm bg-muted px-2 py-1 rounded">#{selectedOrder.id.slice(0, 10).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-background border flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Factura</p>
                          <p className="font-semibold">
                            {invoice ? invoice.invoice_number : invoiceLoading ? 'Buscando factura...' : 'No generada'}
                          </p>
                        </div>
                      </div>
                      {invoiceLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {invoice ? (
                        <>
                          <Button variant="outline" size="sm" className="hover:bg-primary/10" asChild>
                            <Link to={`/orders/invoice/${invoice.id}`} target="_blank" rel="noreferrer">
                              <Eye className="h-4 w-4 mr-2" /> Ver / Descargar
                            </Link>
                          </Button>
                          <Button variant="secondary" size="sm" className="hover:opacity-90" onClick={() => window.open(`/orders/invoice/${invoice.id}`, '_blank')}>
                            <Download className="h-4 w-4 mr-2" /> PDF rápido
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleGenerateInvoice} size="sm" disabled={creatingInvoice || invoiceLoading || orderItems.length === 0}>
                          {creatingInvoice ? 'Generando...' : 'Generar factura' }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
