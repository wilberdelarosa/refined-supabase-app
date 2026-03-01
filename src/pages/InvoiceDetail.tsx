
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Building2, FileText, MapPin, Mail, Phone, User, QrCode } from 'lucide-react';
import logo from '@/assets/barbaro-logo.png';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/format-currency';

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
  ncf: string | null;
  ncf_expiration_date: string | null;
  security_code: string | null;
  electronic_sign: string | null;
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
  rnc_cedula: string | null;
  company_name: string | null;
}

const parseCustomerInfo = (shipping: string | null | undefined, rnc: string | null, companyName: string | null, billingName: string | null) => {
  if (!shipping) return { name: companyName || billingName || 'Cliente', address: '', city: '', phone: '', email: '', notes: '', rnc: rnc || '' };
  const lines = shipping.split('\n').map(l => l.trim()).filter(Boolean);
  return {
    name: companyName || billingName || lines[0] || 'Cliente', // Prioritize Company Name if exists
    address: lines[1] || '',
    city: lines[2] || '',
    phone: lines[3] || '',
    email: lines.find(l => l.includes('@')) || lines[4] || '',
    notes: lines.find(l => l.toLowerCase().startsWith('notas')) || '',
    rnc: rnc || ''
  };
};

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { canManageOrders, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !rolesLoading && !user) {
      navigate('/auth');
      return;
    }

    async function fetchInvoice() {
      if (!invoiceId || !user) return;

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoiceData) {
        navigate('/orders');
        return;
      }

      if (invoiceData.user_id !== user.id && !canManageOrders) {
        navigate('/orders');
        return;
      }

      const { data: linesData } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId);

      // Try to fetch order with fiscal columns
      let { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('shipping_address, user_id, rnc_cedula, company_name')
        .eq('id', invoiceData.order_id)
        .maybeSingle();

      // Fallback: If fetch fails (likely due to missing columns in DB), fetch without fiscal columns
      if (orderError) {
        console.warn('Failed to fetch fiscal data, retrying without new columns...', orderError);
        const { data: fallbackData } = await supabase
            .from('orders')
            .select('shipping_address, user_id')
            .eq('id', invoiceData.order_id)
            .maybeSingle();
        
        if (fallbackData) {
            // Manually add missing properties to satisfy type
            orderData = {
                ...fallbackData,
                rnc_cedula: null,
                company_name: null,
                ncf_type: null,
                ncf_generated: null
            } as any; 
        }
      }

      setInvoice(invoiceData);
      setLines(linesData || []);
      setOrderInfo(orderData || null);
      setLoading(false);
    }

    if (user && !rolesLoading) {
      fetchInvoice();
    }
  }, [invoiceId, user, authLoading, navigate, canManageOrders, rolesLoading]);

  const handlePrint = () => {
    // Preparar el documento para imprimir
    document.title = `Factura-${invoice?.invoice_number || 'INV'}`;
    
    // Trigger print dialog
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner className="h-8 w-8 text-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!invoice) return null;

  const customer = parseCustomerInfo(
    orderInfo?.shipping_address || invoice.billing_address,
    orderInfo?.rnc_cedula || null,
    orderInfo?.company_name || null,
    invoice.billing_name
  );
  
  const issuedDate = invoice.issued_at ? new Date(invoice.issued_at) : new Date();
  
  // NCF Validation Label
  const getNcfLabel = (ncf: string) => {
      if (ncf.startsWith('B01') || ncf.startsWith('E31')) return 'Crédito Fiscal';
      if (ncf.startsWith('B02') || ncf.startsWith('E32')) return 'Consumidor Final';
      return 'Comprobante';
  };

  return (
    <Layout>
      <div className="container py-8 print:py-4">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Pedidos
            </Link>
          </Button>
          <Button onClick={handlePrint} variant="default" className="gap-2 font-semibold">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto print:shadow-none print:border print:border-gray-300 print:max-w-full bg-white">
          {/* Header Profesional */}
          <CardHeader className="border-b-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden print:bg-white print:py-4">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.03),transparent_30%)]" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative">
              {/* Logo y Info Principal */}
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white border-2 border-primary/20 shadow-sm print:border-gray-300">
                  <img src={logo} alt="Barbaro Nutrition" className="h-14 w-auto" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
                    FACTURA
                  </CardTitle>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-lg font-semibold text-primary">
                      {invoice.invoice_number}
                    </p>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 capitalize font-semibold">
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <FileText className="h-3.5 w-3.5" />
                    Emitida el {issuedDate.toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {/* Info Secundaria: NCF Section */}
              <div className="text-left md:text-right space-y-2">
                {invoice.ncf && (
                    <div className="p-3 rounded-lg bg-white/80 border border-primary/10 print:bg-white print:border-gray-300">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            {getNcfLabel(invoice.ncf)}
                        </p>
                        <p className="text-lg font-mono font-bold text-foreground tracking-tight">{invoice.ncf}</p>
                        {invoice.ncf_expiration_date && (
                             <p className="text-[10px] text-muted-foreground">Vence: {new Date(invoice.ncf_expiration_date).toLocaleDateString('es-DO')}</p>
                        )}
                    </div>
                )}
                
                {!invoice.ncf && (
                    <div className="p-3 rounded-lg bg-white/80 border border-primary/10 print:bg-white print:border-gray-300">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pedido</p>
                        <p className="text-sm font-mono font-semibold text-foreground">#{invoice.order_id.slice(0, 8).toUpperCase()}</p>
                    </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 print:pt-4 space-y-6 print:space-y-4">
            {/* Información de Cliente y Emisor - Diseño Profesional */}
            <div className="grid md:grid-cols-2 gap-4 print:gap-3">
              {/* Cliente */}
              <div className="p-5 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white print:bg-white print:border-gray-300 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Facturado a</p>
                    <p className="font-bold text-lg text-foreground mt-0.5">{customer.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {customer.rnc && (
                     <div className="flex items-center gap-2 text-foreground font-semibold">
                       <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                       <span>RNC/Cédula: {customer.rnc}</span>
                     </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="break-all">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {(customer.address || customer.city) && (
                    <div className="flex items-start gap-2 text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="whitespace-pre-line leading-relaxed">{[customer.address, customer.city].filter(Boolean).join('\n')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Emisor */}
              <div className="p-5 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white print:bg-white print:border-gray-300 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-primary/20">
                  <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Emisor</p>
                    <p className="font-bold text-lg text-foreground mt-0.5">Barbaro Nutrition</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>info@barbaronutrition.com</span>
                  </div>
                   <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>809-555-0000</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <span>Santo Domingo, República Dominicana</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20">
                    <p className="text-xs font-semibold text-muted-foreground">RNC: 1-31-12345-6</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="border-slate-200" />

            {/* Tabla de Productos - Diseño Profesional */}
            <div>
              <h3 className="font-bold text-base text-foreground mb-4 uppercase tracking-wide">Detalle de Productos</h3>
              <div className="border-2 border-slate-200 rounded-lg overflow-hidden print:border-gray-300">
                <table className="w-full print:text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 print:bg-gray-100">
                    <tr>
                      <th className="text-left p-4 print:p-2 text-xs font-bold text-slate-700 uppercase tracking-wider">Producto</th>
                      <th className="text-center p-4 print:p-2 text-xs font-bold text-slate-700 uppercase tracking-wider w-20">Cant.</th>
                      <th className="text-right p-4 print:p-2 text-xs font-bold text-slate-700 uppercase tracking-wider w-32">Precio Unit.</th>
                      <th className="text-right p-4 print:p-2 text-xs font-bold text-slate-700 uppercase tracking-wider w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {lines.map((line, index) => (
                      <tr key={line.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-white'}>
                        <td className="p-4 print:p-2 font-medium text-foreground">{line.product_name}</td>
                        <td className="p-4 print:p-2 text-center text-foreground">{line.quantity}</td>
                        <td className="p-4 print:p-2 text-right text-foreground tabular-nums">
                          {formatCurrency(line.unit_price)}
                        </td>
                        <td className="p-4 print:p-2 text-right font-semibold text-foreground tabular-nums">
                          {formatCurrency(line.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales - Diseño Profesional */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3 p-5 rounded-lg bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 print:bg-white print:border-gray-300">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    ITBIS ({(invoice.tax_rate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(invoice.tax_amount)}
                  </span>
                </div>
                <Separator className="border-slate-300" />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-lg font-bold text-foreground uppercase tracking-wide">Total</span>
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    DOP {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* e-CF Security Code Section if available */}
             {invoice.ncf && invoice.security_code && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between print:bg-white print:border-gray-300">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase">Código de Seguridad e-CF</p>
                        <p className="font-mono text-lg tracking-wider">{invoice.security_code}</p>
                    </div>
                    {invoice.electronic_sign && (
                        <div className="h-16 w-16 bg-white border border-slate-200 p-1 rounded flex items-center justify-center">
                            <QrCode className="h-12 w-12 text-slate-800" />
                        </div>
                    )}
                </div>
            )}

            {/* Footer Profesional */}
            <div className="pt-6 border-t-2 border-slate-200 text-center space-y-2 print:border-gray-300">
              <div className="print:hidden">
                 <p className="text-sm font-semibold text-foreground">Gracias por tu compra en Barbaro Nutrition</p>
              </div>
              
              <div className="pt-4 border-t border-slate-200 print:border-gray-300">
                <p className="text-[10px] text-muted-foreground italic uppercase">
                  {invoice.ncf ? 'Comprobante válido para crédito fiscal' : 'Factura de Consumo Interno'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
