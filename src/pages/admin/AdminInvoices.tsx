import { Link } from 'react-router-dom';
import { FileText, Package, Clock, CheckCircle, Truck, XCircle, Download, Eye, MoreHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  user_id: string;
  issued_at: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  billing_name: string | null;
  billing_address: string | null;
  orders?: {
    id: string;
    status: string;
    created_at: string;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  issued: { label: 'Emitida', variant: 'default' },
  paid: { label: 'Pagada', variant: 'default' },
  cancelled: { label: 'Anulada', variant: 'destructive' },
  draft: { label: 'Borrador', variant: 'secondary' },
};

export default function AdminInvoices() {
  const { user } = useAuth();
  const { canManageOrders } = useRoles();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      if (!user || !canManageOrders) return;
      
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            orders:order_id (id, status, created_at)
          `)
          .order('issued_at', { ascending: false });

        if (error) throw error;
        setInvoices(data || []);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Error al cargar facturas');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [user, canManageOrders]);

  const handleCancelInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(invoices.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv
      ));
      
      toast.success('Factura anulada');
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error('Error al anular factura');
    }
  };

  if (!user || !canManageOrders) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">No tienes permisos para ver esta página</p>
          <Button asChild><Link to="/">Volver al Inicio</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Facturas</h1>
            <p className="text-muted-foreground">Gestión de facturas del sistema</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin">← Volver al Panel</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas las Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay facturas registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const status = statusConfig[invoice.status] || statusConfig.issued;
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.issued_at).toLocaleDateString('es-DO')}
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/orders`} className="text-primary hover:underline">
                            #{invoice.order_id.slice(0, 8).toUpperCase()}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {invoice.billing_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          DOP {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PDF
                              </DropdownMenuItem>
                              {invoice.status !== 'cancelled' && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleCancelInvoice(invoice.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Anular Factura
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
