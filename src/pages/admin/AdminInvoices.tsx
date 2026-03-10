import { Link } from 'react-router-dom';
import {
  FileText, MoreHorizontal, ArrowLeft, Download, Eye, XCircle, Search,
  ReceiptText, CalendarDays, TrendingUp, AlertCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { createCreditNote, type CreditNoteInput } from '@/lib/credit-notes';

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
  discount_amount?: number | null;
  discount_code?: string | null;
  billing_rnc?: string | null;
}

interface InvoiceLine {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  issued: { label: 'Emitida', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  paid: { label: 'Pagada', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  cancelled: { label: 'Anulada', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const refundMethodLabels: Record<string, string> = {
  original_payment: 'Reembolso al método original',
  store_credit: 'Crédito en tienda',
  bank_transfer: 'Transferencia bancaria',
  cash: 'Efectivo',
};

export default function AdminInvoices() {
  const { user } = useAuth();
  const { canManageOrders } = useRoles();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  // Credit note dialog
  const [creditNoteDialog, setCreditNoteDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditNoteMethod, setCreditNoteMethod] = useState<'original_payment' | 'store_credit' | 'bank_transfer' | 'cash'>('store_credit');
  const [creatingCreditNote, setCreatingCreditNote] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
      if (!user || !canManageOrders) return;

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
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

      toast({ title: 'Factura anulada correctamente' });
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast({ title: 'Error', description: 'Error al anular factura', variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(invoices.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
      ));

      toast({ title: 'Factura marcada como pagada' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al actualizar factura', variant: 'destructive' });
    }
  };

  const openCreditNoteDialog = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCreditNoteReason('');
    setCreditNoteMethod('store_credit');

    const { data } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoice.id);

    setInvoiceLines(data || []);
    setCreditNoteDialog(true);
  };

  const handleCreateCreditNote = async () => {
    if (!selectedInvoice || !creditNoteReason || creditNoteReason.length < 5) {
      toast({ title: 'Error', description: 'La razón debe tener al menos 5 caracteres', variant: 'destructive' });
      return;
    }

    setCreatingCreditNote(true);

    const input: CreditNoteInput = {
      invoiceId: selectedInvoice.id,
      orderId: selectedInvoice.order_id,
      userId: selectedInvoice.user_id,
      reason: creditNoteReason,
      refundMethod: creditNoteMethod,
      lines: invoiceLines.map(line => ({
        invoiceLineId: line.id,
        productName: line.product_name,
        quantity: line.quantity,
        unitPrice: line.unit_price,
      })),
    };

    const result = await createCreditNote(input);

    if (result.success) {
      toast({
        title: 'Nota de crédito creada',
        description: `${result.creditNote?.credit_note_number} generada correctamente`,
      });

      // Update invoice status to cancelled
      await supabase
        .from('invoices')
        .update({ status: 'cancelled', credit_note_id: result.creditNote?.id })
        .eq('id', selectedInvoice.id);

      setInvoices(invoices.map(inv =>
        inv.id === selectedInvoice.id ? { ...inv, status: 'cancelled' } : inv
      ));

      setCreditNoteDialog(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }

    setCreatingCreditNote(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Número', 'Fecha', 'Cliente', 'RNC', 'Subtotal', 'ITBIS', 'Total', 'Estado'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      new Date(inv.issued_at).toLocaleDateString('es-DO'),
      inv.billing_name || 'Sin nombre',
      inv.billing_rnc || '',
      inv.subtotal.toFixed(2),
      inv.tax_amount.toFixed(2),
      inv.total.toFixed(2),
      statusConfig[inv.status]?.label || inv.status,
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'CSV exportado', description: `${filteredInvoices.length} facturas exportadas` });
  };

  // Filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.billing_name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.billing_rnc?.includes(search);
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      const matchesMonth = filterMonth === 'all' ||
        new Date(inv.issued_at).toISOString().slice(0, 7) === filterMonth;
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [invoices, search, filterStatus, filterMonth]);

  // Stats
  const stats = useMemo(() => {
    const active = invoices.filter(i => i.status !== 'cancelled');
    return {
      total: invoices.length,
      totalRevenue: active.reduce((sum, i) => sum + i.total, 0),
      totalTax: active.reduce((sum, i) => sum + i.tax_amount, 0),
      cancelledCount: invoices.filter(i => i.status === 'cancelled').length,
    };
  }, [invoices]);

  // Available months for filter
  const availableMonths = useMemo(() => {
    const months = new Set(invoices.map(i => new Date(i.issued_at).toISOString().slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [invoices]);

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
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Facturas</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Ingresos</p>
                <p className="text-xl font-bold text-slate-900">
                  RD${stats.totalRevenue.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <ReceiptText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">ITBIS Recolectado</p>
                <p className="text-xl font-bold text-slate-900">
                  RD${stats.totalTax.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Anuladas</p>
                <p className="text-xl font-bold text-slate-900">{stats.cancelledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por número, cliente o RNC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-slate-200 bg-slate-50"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] border-slate-200 bg-slate-50">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full md:w-[180px] border-slate-200 bg-slate-50">
                <CalendarDays className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('es-DO', { year: 'numeric', month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
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
                <p className="text-slate-500 font-medium">
                  {search || filterStatus !== 'all' || filterMonth !== 'all'
                    ? 'No se encontraron facturas con los filtros aplicados'
                    : 'No hay facturas registradas'}
                </p>
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
                    <TableHead className="font-bold text-slate-700">RNC</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Subtotal</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">ITBIS</TableHead>
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
                        <TableCell className="text-slate-600 text-sm">
                          {new Date(invoice.issued_at).toLocaleDateString('es-DO', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Link to="/admin/orders" className="text-[#2b8cee] hover:underline font-mono text-sm">
                            #{invoice.order_id.slice(0, 8).toUpperCase()}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {invoice.billing_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">
                          {invoice.billing_rnc || '-'}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 text-sm">
                          RD$ {invoice.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 text-sm">
                          RD$ {invoice.tax_amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
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
                              <DropdownMenuItem
                                onClick={() => window.open(`/orders/invoice/${invoice.id}`, '_blank')}
                                className="hover:bg-slate-100 cursor-pointer"
                              >
                                <Download className="h-4 w-4 mr-2 text-slate-500" />
                                Descargar PDF
                              </DropdownMenuItem>
                              {invoice.status === 'issued' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleMarkAsPaid(invoice.id)}
                                    className="hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                                  >
                                    <ReceiptText className="h-4 w-4 mr-2" />
                                    Marcar como pagada
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(invoice.status === 'issued' || invoice.status === 'paid') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openCreditNoteDialog(invoice)}
                                    className="hover:bg-amber-50 text-amber-700 cursor-pointer"
                                  >
                                    <ReceiptText className="h-4 w-4 mr-2" />
                                    Crear Nota de Crédito
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                    onClick={() => handleCancelInvoice(invoice.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Anular Factura
                                  </DropdownMenuItem>
                                </>
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

      {/* Credit Note Dialog */}
      <Dialog open={creditNoteDialog} onOpenChange={setCreditNoteDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              Crear Nota de Crédito
            </DialogTitle>
            <DialogDescription>
              Factura: {selectedInvoice?.invoice_number} - Total: RD$ {selectedInvoice?.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lines summary */}
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {invoiceLines.map(line => (
                <div key={line.id} className="flex justify-between p-2 text-sm">
                  <span>{line.product_name} x{line.quantity}</span>
                  <span className="font-medium">RD$ {line.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Razón de la nota de crédito *</Label>
              <Textarea
                value={creditNoteReason}
                onChange={(e) => setCreditNoteReason(e.target.value)}
                placeholder="Ej: Producto devuelto por defecto, error en facturación..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Método de reembolso</Label>
              <Select value={creditNoteMethod} onValueChange={(v) => setCreditNoteMethod(v as typeof creditNoteMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(refundMethodLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <p className="font-medium">Nota:</p>
              <p>Esta acción creará una nota de crédito por el total de la factura y la anulará. Conforme a la normativa de la DGII.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditNoteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCreditNote}
              disabled={creatingCreditNote || !creditNoteReason || creditNoteReason.length < 5}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {creatingCreditNote ? 'Generando...' : 'Crear Nota de Crédito'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
