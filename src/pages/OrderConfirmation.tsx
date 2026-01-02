import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Upload, 
  ArrowLeft, 
  Clock, 
  CreditCard, 
  Package,
  Copy,
  Check,
  Building2,
  Loader2,
  FileImage,
  Trash2,
  Eye,
  ShoppingBag,
  Truck
} from 'lucide-react';

// Bank account details
const BANK_ACCOUNTS = [
  {
    bank: 'Banco Popular Dominicano',
    accountType: 'Cuenta Corriente',
    accountNumber: '123-456789-0',
    holder: 'Barbaro Nutrition SRL',
    rnc: '1-31-12345-6'
  },
  {
    bank: 'Banreservas',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '987-654321-0',
    holder: 'Barbaro Nutrition SRL',
    rnc: '1-31-12345-6'
  }
];

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface OrderPayment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  proof_url: string | null;
  reference_number: string | null;
  created_at: string;
}

interface Order {
  id: string;
  total: number;
  subtotal: number | null;
  discount_amount: number | null;
  status: string;
  shipping_address: string | null;
  created_at: string;
  order_items?: OrderItem[];
  order_payments?: OrderPayment[];
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [existingPayment, setExistingPayment] = useState<OrderPayment | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (orderId && user) {
      fetchOrder();
    }
  }, [orderId, user, authLoading, navigate]);

  async function fetchOrder() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_payments(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user?.id)
      .single();

    if (error || !data) {
      toast.error('Pedido no encontrado');
      navigate('/orders');
      return;
    }

    setOrder(data);
    if (data.order_payments && data.order_payments.length > 0) {
      setExistingPayment(data.order_payments[0]);
    }
    setLoading(false);
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande (máximo 10MB)');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !order) {
      toast.error('Por favor adjunta el comprobante de transferencia');
      return;
    }

    setUploading(true);

    try {
      // Upload proof image
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${order.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('order-proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-proofs')
        .getPublicUrl(fileName);

      // Create payment record
      const { error: paymentError } = await supabase
        .from('order_payments')
        .insert({
          order_id: order.id,
          amount: order.total,
          payment_method: 'transfer',
          status: 'pending_verification',
          proof_url: publicUrl,
          reference_number: referenceNumber || null,
          notes: notes || null
        });

      if (paymentError) throw paymentError;

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'payment_pending' })
        .eq('id', order.id);

      toast.success('¡Comprobante enviado!', {
        description: 'Tu pago será verificado pronto'
      });

      await fetchOrder();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Error al enviar comprobante');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      'pending': { label: 'Pendiente de Pago', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      'payment_pending': { label: 'Verificando Pago', variant: 'outline', icon: <CreditCard className="h-3 w-3" /> },
      'processing': { label: 'Procesando', variant: 'default', icon: <Package className="h-3 w-3" /> },
      'shipped': { label: 'Enviado', variant: 'default', icon: <Truck className="h-3 w-3" /> },
      'completed': { label: 'Completado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      'cancelled': { label: 'Cancelado', variant: 'destructive', icon: <Trash2 className="h-3 w-3" /> }
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const, icon: null };
    return (
      <Badge variant={config.variant} className="gap-1.5 px-3 py-1.5">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Pedido no encontrado</h1>
          <Button asChild><Link to="/orders">Ver mis pedidos</Link></Button>
        </div>
      </Layout>
    );
  }

  const showUploadSection = order.status === 'pending' && !existingPayment;
  const showPaymentStatus = existingPayment;

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Mis Pedidos
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  ¡Pedido Creado!
                </h1>
              </div>
              <p className="text-muted-foreground">
                Pedido #{order.id.slice(0, 8).toUpperCase()} • Creado el {new Date(order.created_at).toLocaleDateString('es-DO', { 
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Order Details */}
          <div className="space-y-6">
            {/* Order Items */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      DOP {(item.price * item.quantity).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  {order.subtotal && (
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>DOP {order.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>-DOP {order.discount_amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2">
                    <span>Total</span>
                    <span>DOP {order.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Accounts */}
            {showUploadSection && (
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Datos para Transferencia
                  </CardTitle>
                  <CardDescription>
                    Realiza la transferencia a cualquiera de estas cuentas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {BANK_ACCOUNTS.map((account, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-xl space-y-2">
                      <p className="font-semibold">{account.bank}</p>
                      <div className="grid gap-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span>{account.accountType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Número:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{account.accountNumber}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(account.accountNumber, `acc-${idx}`)}
                            >
                              {copied === `acc-${idx}` ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Titular:</span>
                          <span>{account.holder}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Upload Proof */}
          <div className="space-y-6">
            {showUploadSection && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Adjuntar Comprobante
                  </CardTitle>
                  <CardDescription>
                    Sube el comprobante de tu transferencia para agilizar la verificación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload Area */}
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer hover:border-primary hover:bg-primary/5 ${
                      proofPreview ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    {proofPreview ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <img 
                            src={proofPreview} 
                            alt="Comprobante" 
                            className="max-h-48 mx-auto rounded-lg shadow-md"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{proofFile?.name}</p>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium mb-1">Arrastra o haz clic para subir</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG hasta 10MB</p>
                      </>
                    )}
                  </div>

                  {/* Reference Number */}
                  <div className="space-y-2">
                    <Label htmlFor="reference">Número de Referencia (opcional)</Label>
                    <Input
                      id="reference"
                      placeholder="Ej: 123456789"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Información adicional sobre la transferencia..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleSubmitProof}
                    disabled={!proofFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Comprobante
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Status */}
            {showPaymentStatus && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Estado del Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={existingPayment?.status === 'verified' ? 'default' : 'secondary'}>
                      {existingPayment?.status === 'verified' ? 'Verificado' : 'Pendiente de verificación'}
                    </Badge>
                  </div>
                  
                  {existingPayment?.reference_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Referencia:</span>
                      <span className="font-mono">{existingPayment.reference_number}</span>
                    </div>
                  )}

                  {existingPayment?.proof_url && (
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Comprobante enviado:</p>
                      <div className="relative">
                        <img 
                          src={existingPayment.proof_url} 
                          alt="Comprobante" 
                          className="w-full max-h-64 object-contain rounded-lg border"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => window.open(existingPayment.proof_url!, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver completo
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <strong>Próximos pasos:</strong> Verificaremos tu pago y te notificaremos por correo cuando tu pedido esté siendo preparado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <p className="text-sm">
                  <strong className="text-amber-700 dark:text-amber-400">¿Necesitas ayuda?</strong>
                  <br />
                  Si tienes alguna pregunta sobre tu pedido, contáctanos por WhatsApp o correo electrónico.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
