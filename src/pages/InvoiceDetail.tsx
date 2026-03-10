import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { getStoreSettingsSnapshot, type InvoicingSettings, type BrandingSettings } from '@/lib/store-settings';
import { formatRnc } from '@/lib/invoicing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Building2, FileText, MapPin, Mail, Phone, User, Printer, CreditCard } from 'lucide-react';
import { downloadInvoicePDF } from '@/lib/invoice-pdf';
import logo from '@/assets/barbaro-logo.png';

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
  billing_rnc: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  discount_amount: number | null;
  discount_code: string | null;
  notes: string | null;
}

interface InvoiceLine {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface OrderInfo {
  shipping_address: string | null;
  user_id: string;
  status: string;
}

interface PaymentInfo {
  id: string;
  payment_method: string;
  status: string;
  reference_number: string | null;
  amount: number;
  gateway: string | null;
}

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

const statusConfig: Record<string, { label: string; color: string }> = {
  issued: { label: 'Emitida', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  paid: { label: 'Pagada', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  cancelled: { label: 'Anulada', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const paymentMethodLabels: Record<string, string> = {
  transfer: 'Transferencia Bancaria',
  cash: 'Efectivo',
  card: 'Tarjeta',
  azul: 'AZUL (Tarjeta)',
  other: 'Otro',
};

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { canManageOrders, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeInvoicing, setStoreInvoicing] = useState<InvoicingSettings | null>(null);
  const [storeBranding, setStoreBranding] = useState<BrandingSettings | null>(null);

  useEffect(() => {
    if (!authLoading && !rolesLoading && !user) {
      navigate('/auth');
      return;
    }

    async function fetchInvoice() {
      if (!invoiceId || !user) return;

      const [invoiceResult, settingsSnapshot] = await Promise.all([
        supabase.from('invoices').select('*').eq('id', invoiceId).single(),
        getStoreSettingsSnapshot()
      ]);

      if (invoiceResult.error || !invoiceResult.data) {
        navigate('/orders');
        return;
      }

      const invoiceData = invoiceResult.data;

      if (invoiceData.user_id !== user.id && !canManageOrders) {
        navigate('/orders');
        return;
      }

      setStoreInvoicing(settingsSnapshot.invoicing);
      setStoreBranding(settingsSnapshot.branding);

      const [linesResult, orderResult, paymentResult] = await Promise.all([
        supabase.from('invoice_lines').select('*').eq('invoice_id', invoiceId),
        supabase.from('orders').select('shipping_address, user_id, status').eq('id', invoiceData.order_id).maybeSingle(),
        supabase.from('order_payments').select('id, payment_method, status, reference_number, amount, gateway').eq('order_id', invoiceData.order_id).eq('status', 'verified').maybeSingle()
      ]);

      setInvoice(invoiceData as Invoice);
      setLines(linesResult.data || []);
      setOrderInfo(orderResult.data || null);
      setPayment(paymentResult.data || null);
      setLoading(false);
    }

    if (user && !rolesLoading) {
      fetchInvoice();
    }
  }, [invoiceId, user, authLoading, navigate, canManageOrders, rolesLoading]);

  const handlePrint = () => {
    document.title = `Factura-${invoice?.invoice_number || 'INV'}`;
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    downloadInvoicePDF({
      invoiceNumber: invoice.invoice_number,
      issuedAt: invoice.issued_at,
      status: invoice.status,
      orderId: invoice.order_id,
      fiscalName,
      fiscalRnc,
      fiscalAddress,
      supportEmail,
      billingName: invoice.billing_name || customer.name,
      billingAddress: invoice.billing_address || [customer.address, customer.city].filter(Boolean).join(', '),
      billingRnc: invoice.billing_rnc || undefined,
      billingEmail: invoice.billing_email || customer.email || undefined,
      billingPhone: invoice.billing_phone || customer.phone || undefined,
      lines: lines.map(l => ({
        productName: l.product_name,
        quantity: l.quantity,
        unitPrice: l.unit_price,
        total: l.total,
      })),
      subtotal: invoice.subtotal,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      discountAmount: invoice.discount_amount ?? undefined,
      discountCode: invoice.discount_code ?? undefined,
      paymentMethod: payment ? (paymentMethodLabels[payment.payment_method] || payment.payment_method) : undefined,
      paymentReference: payment?.reference_number ?? undefined,
    });
  };

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

  if (!invoice) return null;

  const customer = parseCustomerInfo(orderInfo?.shipping_address || invoice.billing_address);
  const issuedDate = invoice.issued_at ? new Date(invoice.issued_at) : new Date();
  const status = statusConfig[invoice.status] || statusConfig.issued;

  const fiscalName = storeInvoicing?.fiscal_name || 'Barbaro Nutrition SRL';
  const fiscalRnc = storeInvoicing?.rnc ? formatRnc(storeInvoicing.rnc) : '';
  const fiscalAddress = storeInvoicing?.fiscal_address || 'Santo Domingo, República Dominicana';
  const supportEmail = storeBranding?.support_email || 'info@barbaronutrition.com';
  const storeName = storeBranding?.store_name || 'Barbaro Nutrition';

  const hasDiscount = (invoice.discount_amount ?? 0) > 0;

  return (
    <Layout>
      <div className="container py-8 print:py-2 print:px-0">
        {/* Navigation - hidden on print */}
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Pedidos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadPDF} variant="default" className="gap-2 font-semibold">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto print:shadow-none print:border print:border-gray-300 print:max-w-full">
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-foreground/5 via-background to-background relative overflow-hidden print:bg-white print:py-4">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.05),transparent_25%)]" />
            <div className="flex items-center justify-between gap-4 relative">
              <div className="flex items-center gap-4">
                <img src={logo} alt={storeName} className="h-12 w-auto rounded-md bg-background p-2 border print:border-gray-300" />
                <div>
                  <CardTitle className="text-2xl">Factura {invoice.invoice_number}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Emitida el {issuedDate.toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <Badge variant="outline" className={`${status.color} capitalize`}>
                  {status.label}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <p>Pedido #{invoice.order_id.slice(0, 8).toUpperCase()}</p>
                  {fiscalRnc && <p>RNC: {fiscalRnc}</p>}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 print:pt-4 space-y-6 print:space-y-4">
            {/* Billing Info Grid */}
            <div className="grid md:grid-cols-2 gap-4 print:gap-3">
              {/* Customer Info */}
              <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-foreground text-background">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Facturado a</p>
                    <p className="font-semibold text-lg">{invoice.billing_name || customer.name}</p>
                    {invoice.billing_rnc && (
                      <p className="text-xs text-muted-foreground">RNC: {formatRnc(invoice.billing_rnc)}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {(invoice.billing_email || customer.email) && (
                    <div className="flex items-center gap-2 text-foreground/80">
                      <Mail className="h-4 w-4" />
                      <span>{invoice.billing_email || customer.email}</span>
                    </div>
                  )}
                  {(invoice.billing_phone || customer.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{invoice.billing_phone || customer.phone}</span>
                    </div>
                  )}
                  {(invoice.billing_address || customer.address || customer.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="whitespace-pre-line">
                        {invoice.billing_address || [customer.address, customer.city].filter(Boolean).join('\n')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Issuer Info - Dynamic from store_settings */}
              <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Emisor</p>
                    <p className="font-semibold">{fiscalName}</p>
                    <p className="text-sm text-muted-foreground">{supportEmail}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {fiscalRnc && <p>RNC: {fiscalRnc}</p>}
                  <p>Dirección: {fiscalAddress}</p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {payment && (
              <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                    Pago verificado - {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                  </p>
                  {payment.reference_number && (
                    <p className="text-xs text-emerald-600">Ref: {payment.reference_number}</p>
                  )}
                </div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                  DOP {payment.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <Separator />

            {/* Product Details */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-4">Detalle de productos</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full print:text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 print:p-2 text-sm font-medium">Producto</th>
                      <th className="text-center p-3 print:p-2 text-sm font-medium">Cant.</th>
                      <th className="text-right p-3 print:p-2 text-sm font-medium">Precio Unit.</th>
                      <th className="text-right p-3 print:p-2 text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lines.map((line) => (
                      <tr key={line.id}>
                        <td className="p-3 print:p-2">{line.product_name}</td>
                        <td className="p-3 print:p-2 text-center">{line.quantity}</td>
                        <td className="p-3 print:p-2 text-right">
                          DOP {line.unit_price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 print:p-2 text-right font-medium">
                          DOP {line.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 p-4 rounded-lg bg-muted/30 border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>DOP {invoice.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento {invoice.discount_code ? `(${invoice.discount_code})` : ''}</span>
                    <span>-DOP {(invoice.discount_amount ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ITBIS ({(invoice.tax_rate * 100).toFixed(0)}%)</span>
                  <span>DOP {invoice.tax_amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>DOP {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="p-3 rounded-lg bg-muted/20 border text-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notas</p>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t text-center text-sm text-muted-foreground space-y-1">
              <p>Gracias por tu compra en {storeName}</p>
              <p>Para cualquier consulta, contáctanos a {supportEmail}</p>
              {fiscalRnc && (
                <p className="text-xs mt-2">Documento fiscal - NCF conforme a la DGII - RNC: {fiscalRnc}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
