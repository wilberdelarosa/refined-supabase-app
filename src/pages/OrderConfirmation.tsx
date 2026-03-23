
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  FileImage,
  Trash2,
  Eye,
  ShoppingBag,
  Truck,
  ImageIcon,
  Receipt,
  Download,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { normalizeImageUrl } from '@/lib/image-url';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { getWhopPurchaseUrl, isWhopPayment } from '@/lib/whop-checkout';

// Types
interface PaymentMethod {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  rnc: string | null;
  instructions: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  products?: {
    image_url: string | null;
  } | null;
}

interface OrderPayment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  proof_url: string | null;
  reference_number: string | null;
  notes?: string | null;
  provider?: string | null;
  provider_checkout_id?: string | null;
  provider_payload?: unknown;
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
  payment_provider?: string | null;
  order_items?: OrderItem[];
  order_payments?: OrderPayment[];
}

// Timeline Component
function OrderTimeline({ status }: { status: string }) {
    const steps = [
        { id: 'pending', label: 'Pedido Recibido', icon: FileImage },
        { id: 'payment_pending', label: 'Confirmando Pago', icon: CreditCard },
        { id: 'processing', label: 'Preparando', icon: Package },
        { id: 'shipped', label: 'Enviado', icon: Truck },
        { id: 'delivered', label: 'Entregado', icon: CheckCircle },
    ];

    // Map status to step index
    const statusMap: Record<string, number> = {
        'pending': 0,
        'payment_pending': 1,
        'verified': 2,
        'processing': 2,
        'packed': 2,
        'shipped': 3,
        'delivered': 4,
        'cancelled': -1,
        'refunded': -1
    };

    const currentStepIndex = statusMap[status] ?? 0;
    const isCancelled = status === 'cancelled' || status === 'refunded';

    if (isCancelled) {
        return (
            <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 text-center text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pedido Cancelado
            </div>
        );
    }

    return (
        <div className="w-full relative px-4">
            <div className="flex justify-between items-center relative z-10">
                {steps.map((step, idx) => {
                    const isActive = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                isActive ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110" : "bg-background border-muted-foreground/30 text-muted-foreground"
                            )}>
                                <Icon className={cn("h-4 w-4 md:h-5 md:w-5", isActive && "animate-pulse-subtle")} />
                            </div>
                            <span className={cn(
                                "text-[10px] md:text-xs font-medium text-center max-w-[80px]",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Progress Bar Background */}
            <div className="absolute top-4 md:top-5 left-0 w-full h-0.5 bg-muted -z-0" />
            
            {/* Active Progress Bar */}
             <div 
                className="absolute top-4 md:top-5 left-0 h-0.5 bg-primary transition-all duration-1000 -z-0 origin-left" 
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
             />
        </div>
    );
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [existingPayment, setExistingPayment] = useState<OrderPayment | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (orderId && user) {
      fetchOrder();
      fetchPaymentMethods();
    }
  }, [orderId, user, authLoading, navigate]);

  async function fetchPaymentMethods() {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data) setPaymentMethods(data);
  }

  async function fetchOrder() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(image_url)),
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
    toast.success('Copiado');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes');
            return;
        }
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

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      processFile(file);
  };

  const cleanUpload = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !order) {
      toast.error('Adjunta una imagen primero');
      return;
    }

    setUploading(true);
    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${order.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('order-proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-proofs')
        .getPublicUrl(fileName);

      const { error: paymentError } = await supabase
        .from('order_payments')
        .insert({
          order_id: order.id,
          amount: order.total,
          payment_method: 'transfer',
          status: 'pending',
          proof_url: publicUrl,
          reference_number: referenceNumber || null,
          notes: notes || null
        });

      if (paymentError) throw paymentError;

      await supabase
        .from('orders')
        .update({ status: 'payment_pending' })
        .eq('id', order.id);

      toast.success('¡Comprobante Subido!', {
        description: 'Hemos recibido tu comprobante. Te notificaremos cuando sea validado.'
      });

      await fetchOrder();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Error al subir comprobante', { description: 'Intenta nuevamente' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner className="h-8 w-8 text-primary" />
                <p className="text-muted-foreground animate-pulse">Cargando pedido...</p>
            </div>
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  const isWhopOrder = order.payment_provider === 'whop' || isWhopPayment(existingPayment);
  const whopResumeUrl = `/checkout/transferencia?order=${order.id}`;
  const whopPurchaseUrl = getWhopPurchaseUrl(existingPayment);
  const showUploadSection = !isWhopOrder && order.status === 'pending' && !existingPayment;
  // If payment exists or status implies payment started
  const showPaymentStatus = existingPayment || (order.status !== 'pending' && order.status !== 'cancelled');

  return (
    <Layout>
      <div className="min-h-screen bg-muted/5 pb-20">
        <div className="bg-background border-b shadow-sm sticky top-0 z-20">
            <div className="container py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" asChild className="mr-2">
                        <Link to="/orders"><ArrowLeft className="h-5 w-5" /></Link>
                     </Button>
                     <div className="flex flex-col">
                        <span className="font-bold text-sm">Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                     </div>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" size="sm" asChild>
                        <Link to="/shop">Ir a Tienda</Link>
                     </Button>
                </div>
            </div>
        </div>

        <div className="container max-w-5xl py-8 space-y-8">
            
            {/* Status Header */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 bg-card rounded-2xl border shadow-sm animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-24 bg-secondary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                
                <div className={cn(
                    "h-20 w-20 rounded-full flex items-center justify-center mb-2 shadow-lg",
                    order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                )}>
                    {order.status === 'pending' ? <Clock className="h-10 w-10" /> : <CheckCircle className="h-10 w-10" />}
                </div>
                
                <div className="z-10 relative">
                     <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                        {order.status === 'pending' ? 'Pedido Recibido' : '¡Gracias por tu compra!'}
                     </h1>
                     <p className="text-muted-foreground max-w-lg mx-auto">
                        {order.status === 'pending' 
                            ? 'Tu pedido ha sido creado. Por favor realiza el pago para procesar el envío.'
                            : 'Hemos recibido tu pago y estamos preparando tu orden.'}
                     </p>
                </div>

                <div className="w-full max-w-2xl mt-8 pt-8 border-t border-border/50">
                    <OrderTimeline status={order.status} />
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                 {/* Left Column: Upload & Payment Info */}
                 <div className="lg:col-span-7 space-y-6">
                     {isWhopOrder && order.status === 'pending' && (
                         <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <CreditCard className="h-5 w-5" />
                                    Pago con Whop pendiente
                                </CardTitle>
                                <CardDescription>
                                    Esta orden usa checkout automático. Retoma el pago para completar la compra.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Cuando Whop confirme el cobro, esta pantalla cambiará a pagado sin subir comprobantes manuales.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button asChild>
                                        <Link to={whopResumeUrl}>Continuar pago</Link>
                                    </Button>
                                    {whopPurchaseUrl && (
                                        <Button variant="outline" onClick={() => window.open(whopPurchaseUrl, '_blank')}>
                                            Abrir checkout
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                         </Card>
                     )}
                     
                     {showUploadSection && (
                         <Card className="border-2 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <Upload className="h-5 w-5" />
                                    Confirmar Pago
                                </CardTitle>
                                <CardDescription>
                                    Sube una captura de tu transferencia para verificar tu pago rápidamente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div 
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative overflow-hidden",
                                        isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5",
                                        proofPreview ? "border-solid border-border p-2" : ""
                                    )}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => !proofPreview && fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    
                                    {proofPreview ? (
                                        <div className="relative group">
                                            <img src={proofPreview} alt="Preview" className="w-full h-64 object-contain rounded-lg bg-black/5" />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <Button size="icon" variant="destructive" className="h-8 w-8 shadow-md" onClick={(e) => { e.stopPropagation(); cleanUpload(); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs truncate">
                                                {proofFile?.name}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 py-4">
                                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                                <ImageIcon className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">Arrastra tu comprobante aquí</p>
                                                <p className="text-sm text-muted-foreground mt-1">O haz clic para buscar en tus archivos</p>
                                            </div>
                                            <div className="text-xs text-muted-foreground bg-muted/50 inline-block px-3 py-1 rounded-full border">
                                                Soporta JPG, PNG (Max 10MB)
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Referencia (Opcional)</Label>
                                        <Input placeholder="Ej: 000123456" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notas (Opcional)</Label>
                                        <Input placeholder="Comentario adicional..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/5 border-t p-4 flex justify-end">
                                <Button size="lg" onClick={handleSubmitProof} disabled={!proofFile || uploading} className="w-full sm:w-auto min-w-[200px] shadow-lg">
                                    {uploading ? <><Spinner className="mr-2 h-4 w-4" /> Subiendo...</> : <><Upload className="mr-2 h-4 w-4" /> Enviar Comprobante</>}
                                </Button>
                            </CardFooter>
                         </Card>
                     )}

                     {existingPayment && (
                        <Card className="border-l-4 border-l-primary shadow-sm bg-gradient-to-r from-background to-secondary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Receipt className="h-5 w-5" />
                                    {isWhopOrder ? 'Estado del cobro' : 'Estado del Pago'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 mb-4">
                                    <Badge 
                                        variant={existingPayment.status === 'verified' ? 'default' : existingPayment.status === 'rejected' ? 'destructive' : 'secondary'}
                                        className="h-7 px-3 text-sm"
                                    >
                                        {existingPayment.status === 'verified' ? 'Confirmado' : existingPayment.status === 'rejected' ? 'Rechazado' : 'En Revisión'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Subido el {new Date(existingPayment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {existingPayment.proof_url && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => window.open(existingPayment.proof_url!, '_blank')}>
                                            <Eye className="h-3 w-3 mr-2" />
                                            Ver Comprobante
                                        </Button>
                                        {existingPayment.reference_number && (
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">Ref: {existingPayment.reference_number}</span>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                     )}

                     <div className={cn('space-y-4', isWhopOrder && 'hidden')}>
                         <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Cuentas para Transferencia
                         </h3>
                         <div className="grid gap-4 sm:grid-cols-2">
                             {paymentMethods.map((method, idx) => (
                                <div key={method.id} className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => copyToClipboard(method.account_number || '', `acc-${idx}`)} />
                                    </div>
                                    <p className="font-bold text-base mb-1">{method.bank_name || method.name}</p>
                                    <p className="text-xs text-muted-foreground mb-3">{method.account_type}</p>
                                    
                                    <div className="bg-muted/50 p-2 rounded border font-mono text-sm font-semibold flex justify-between items-center cursor-pointer hover:bg-muted" onClick={() => copyToClipboard(method.account_number || '', `acc-${idx}`)}>
                                        {method.account_number}
                                        {copied === `acc-${idx}` && <Check className="h-3 w-3 text-green-600" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 truncate">Titular: {method.account_holder}</p>
                                </div>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Right Column: Order Summary */}
                 <div className="lg:col-span-5 space-y-6">
                     <Card className="shadow-lg border-0 bg-card overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-base">Resumen del Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {order.order_items?.map((item) => {
                                    const img = normalizeImageUrl(item.products?.image_url);
                                    return (
                                        <div key={item.id} className="flex gap-3 items-center">
                                            <div className="h-12 w-12 bg-muted/50 rounded-md border overflow-hidden shrink-0">
                                                {img ? <img src={img} alt="" className="h-full w-full object-cover mix-blend-multiply" /> : <div className="h-full flex items-center justify-center"><ImageIcon className="h-4 w-4 opacity-30" /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.product_name}</p>
                                                <p className="text-xs text-muted-foreground">{item.quantity} x RD$ {item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="font-medium text-sm">
                                                RD$ {(item.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Separator />
                            <div className="p-4 space-y-2 bg-muted/5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>RD$ {order.subtotal?.toLocaleString()}</span>
                                </div>
                                {order.discount_amount && order.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Descuento</span>
                                        <span>- RD$ {order.discount_amount.toLocaleString()}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>RD$ {order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                     </Card>

                     {order.shipping_address && (
                         <Card>
                             <CardHeader className="pb-2">
                                 <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                     <Truck className="h-4 w-4" /> Envío
                                 </CardTitle>
                             </CardHeader>
                             <CardContent>
                                 <div className="text-sm leading-relaxed p-3 bg-muted/20 rounded-lg border">
                                     {order.shipping_address.split('\n').map((line, i) => (
                                         <p key={i} className="mb-1 last:mb-0">{line}</p>
                                     ))}
                                 </div>
                             </CardContent>
                         </Card>
                     )}

                     <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-4">
                            ¿Necesitas ayuda con tu pedido?
                        </p>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                           <Phone className="h-3 w-3" /> Contactar Soporte
                        </Button>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}
