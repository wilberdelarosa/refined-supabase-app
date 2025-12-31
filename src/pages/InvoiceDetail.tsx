import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Building2, FileText } from 'lucide-react';

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

interface InvoiceLine {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
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

      // Verify user owns this invoice
      if (invoiceData.user_id !== user.id) {
        navigate('/orders');
        return;
      }

      const { data: linesData } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId);

      setInvoice(invoiceData);
      setLines(linesData || []);
      setLoading(false);
    }

    if (user) {
      fetchInvoice();
    }
  }, [invoiceId, user, authLoading, navigate]);

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

  return (
    <Layout>
      <div className="container py-8 print:py-0">
        {/* Back button - hidden on print */}
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

        <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 print:bg-gray-100">
                  <FileText className="h-6 w-6 text-primary print:text-gray-800" />
                </div>
                <div>
                  <CardTitle className="text-xl">Factura {invoice.invoice_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Emitida el {new Date(invoice.issued_at).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">Barbaro Nutrition</p>
                <p className="text-sm text-muted-foreground">RNC: 1-31-12345-6</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Billing Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">FACTURADO A</h3>
                <p className="font-medium">{invoice.billing_name || 'Cliente'}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.billing_address || 'Sin dirección'}
                </p>
              </div>
              <div className="text-right md:text-left">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">DETALLES</h3>
                <p className="text-sm">
                  <span className="text-muted-foreground">Pedido:</span>{' '}
                  <span className="font-mono">#{invoice.order_id.slice(0, 8).toUpperCase()}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Estado:</span>{' '}
                  <span className="font-medium capitalize">{invoice.status}</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Invoice Lines */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-4">DETALLE DE PRODUCTOS</h3>
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

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
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

            {/* Footer */}
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
