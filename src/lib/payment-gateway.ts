import { supabase } from '@/integrations/supabase/client';

export interface CardPaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CardPaymentResponse {
  success: boolean;
  gateway: string;
  paymentUrl?: string;
  formData?: Record<string, string>;
  paymentId?: string;
  error?: string;
  message?: string;
  fallback?: string;
}

/**
 * Initiate a card payment via AZUL gateway.
 * Returns form data that should be POSTed to the AZUL payment page.
 */
export async function initiateCardPayment(
  request: CardPaymentRequest
): Promise<CardPaymentResponse> {
  const { data, error } = await supabase.functions.invoke('process-card-payment', {
    body: request,
  });

  if (error) {
    return {
      success: false,
      gateway: 'azul',
      error: error.message || 'Error connecting to payment gateway',
    };
  }

  return data as CardPaymentResponse;
}

/**
 * Verify a payment after returning from AZUL.
 * Call this on the return URL to confirm payment status.
 */
export async function verifyPaymentStatus(orderId: string): Promise<{
  status: 'verified' | 'pending' | 'rejected' | 'not_found';
  payment?: {
    id: string;
    amount: number;
    reference_number: string | null;
    gateway: string;
  };
}> {
  const { data, error } = await supabase
    .from('order_payments')
    .select('id, amount, status, reference_number, gateway')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { status: 'not_found' };
  }

  return {
    status: data.status as 'verified' | 'pending' | 'rejected',
    payment: {
      id: data.id,
      amount: data.amount,
      reference_number: data.reference_number,
      gateway: data.gateway || 'manual',
    },
  };
}

/**
 * Submit AZUL payment form by creating a hidden form and submitting it.
 * AZUL requires a form POST (not an API call) for the payment page.
 */
export function submitAzulPaymentForm(
  paymentUrl: string,
  formData: Record<string, string>
): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentUrl;
  form.style.display = 'none';

  for (const [key, value] of Object.entries(formData)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * Get available payment methods for checkout
 */
export async function getAvailablePaymentMethods(): Promise<{
  hasCardPayment: boolean;
  hasTransfer: boolean;
  methods: Array<{ type: string; name: string; gateway?: string }>;
}> {
  const { data } = await supabase
    .from('payment_methods')
    .select('type, name, is_active')
    .eq('is_active', true)
    .order('display_order');

  const methods = data || [];
  const hasTransfer = methods.some(m => m.type === 'bank_transfer');
  const hasCardPayment = methods.some(m => m.type === 'credit_card' || m.type === 'debit_card');

  return {
    hasCardPayment,
    hasTransfer,
    methods: methods.map(m => ({ type: m.type, name: m.name })),
  };
}
