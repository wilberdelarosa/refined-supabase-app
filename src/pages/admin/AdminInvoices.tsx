import { Link } from 'react-router-dom';
import { FileText, MoreHorizontal, ArrowLeft, Download, Eye, XCircle, Search } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

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

const statusConfig: Record<string, { label: string; color: string }> = {
  issued: { label: 'Emitida', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  paid: { label: 'Pagada', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  cancelled: { label: 'Anulada', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function AdminInvoices() {
  const { user } = useAuth();
  const { canManageOrders } = useRoles();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        toast({ title: 'Error', description: 'Error al cargar facturas', variant: 'destructive' });
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

      toast({ title: 'Éxito', description: 'Factura anulada correctamente' });
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast({ title: 'Error', description: 'Error al anular factura', variant: 'destructive' });
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.billing_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user || !canManageOrders) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b8cee]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover-lift hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
                <FileText className="h-7 w-7 text-slate-700" />
                Gestión de Facturas
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {invoices.length} {invoices.length === 1 ? 'factura' : 'facturas'} en total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6 shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="pt-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-slate-200 bg-slate-50 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-slate-100">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No hay facturas registradas</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                    <TableHead className="font-bold text-slate-700">Número</TableHead>
                    <TableHead className="font-bold text-slate-700">Fecha</TableHead>
                    <TableHead className="font-bold text-slate-700">Pedido</TableHead>
                    <TableHead className="font-bold text-slate-700">Cliente</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">Estado</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const status = statusConfig[invoice.status] || statusConfig.issued;

                    return (
                      <TableRow key={invoice.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <TableCell className="font-mono font-medium text-slate-900">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(invoice.issued_at).toLocaleDateString('es-DO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/orders`} className="text-[#2b8cee] hover:underline font-mono text-sm">
                            #{invoice.order_id.slice(0, 8).toUpperCase()}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {invoice.billing_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          RD$ {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${status.color} font-medium border`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-500">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-slate-200">
                              <DropdownMenuItem asChild className="hover:bg-slate-100 cursor-pointer">
                                <Link to={`/orders/invoice/${invoice.id}`}>
                                  <Eye className="h-4 w-4 mr-2 text-slate-500" />
                                  Ver Detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/orders/invoice/${invoice.id}`, '_blank')} className="hover:bg-slate-100 cursor-pointer">
                                <Download className="h-4 w-4 mr-2 text-slate-500" />
                                Descargar PDF
                              </DropdownMenuItem>
                              {invoice.status !== 'cancelled' && (
                                <DropdownMenuItem
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
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
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
