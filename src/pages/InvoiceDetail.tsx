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
import { ArrowLeft, Download, Building2, FileText, MapPin, Mail, Phone, User } from 'lucide-react';
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

      const { data: orderData } = await supabase
        .from('orders')
        .select('shipping_address, user_id')
        .eq('id', invoiceData.order_id)
        .maybeSingle();

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
    window.print();
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

  return (
    <Layout>
      <div className="container py-8 print:py-0">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Pedidos
            </Link>
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Imprimir / Guardar PDF
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto print:shadow-none print:border-0 print:max-w-full">
          <CardHeader className="border-b bg-gradient-to-r from-foreground/5 via-background to-background relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.05),transparent_25%)]" />
            <div className="flex items-center justify-between gap-4 relative">
              <div className="flex items-center gap-4">
                <img src={logo} alt="Barbaro Nutrition" className="h-12 w-auto rounded-md bg-background p-2 border print:border-gray-300" />
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
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 capitalize">
                  {invoice.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <p>Pedido #{invoice.order_id.slice(0, 8).toUpperCase()}</p>
                  <p>RNC: 1-31-12345-6</p>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-foreground text-background">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Facturado a</p>
                    <p className="font-semibold text-lg">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">Cliente ID: {invoice.user_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-foreground/80">
                      <Mail className="h-4 w-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {(customer.address || customer.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="whitespace-pre-line">{[customer.address, customer.city].filter(Boolean).join('\n')}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <p className="text-xs italic text-foreground/70">{customer.notes}</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Emisor</p>
                    <p className="font-semibold">Barbaro Nutrition</p>
                    <p className="text-sm text-muted-foreground">info@barbaronutrition.com</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>RNC: 1-31-12345-6</p>
                  <p>Dirección: Santo Domingo, República Dominicana</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-4">Detalle de productos</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Producto</th>
                      <th className="text-center p-3 text-sm font-medium">Cant.</th>
                      <th className="text-right p-3 text-sm font-medium">Precio</th>
                      <th className="text-right p-3 text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lines.map((line) => (
                      <tr key={line.id}>
                        <td className="p-3">{line.product_name}</td>
                        <td className="p-3 text-center">{line.quantity}</td>
                        <td className="p-3 text-right">
                          DOP {line.unit_price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-medium">
                          DOP {line.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 p-4 rounded-lg bg-muted/30 border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>DOP {invoice.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
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

            <div className="pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Gracias por tu compra en Barbaro Nutrition</p>
              <p>Para cualquier consulta, contáctanos a info@barbaronutrition.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
