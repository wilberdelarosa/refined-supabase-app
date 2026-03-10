import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * AZUL Payment Gateway Integration for Dominican Republic
 *
 * AZUL (azul.com.do) is the primary card processor in the DR.
 * This function creates a payment page URL or processes a direct payment.
 *
 * Environment variables required:
 * - AZUL_MERCHANT_ID: Your AZUL merchant ID
 * - AZUL_AUTH_KEY: Your AZUL authentication key
 * - AZUL_MERCHANT_NAME: Display name for the merchant
 * - AZUL_MERCHANT_TYPE: Merchant type code
 * - AZUL_ENVIRONMENT: 'sandbox' | 'production'
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}

// AZUL API endpoints
const AZUL_ENDPOINTS = {
  sandbox: 'https://pruebas.azul.com.do/WebPayments/ProcessPayment',
  production: 'https://pagos.azul.com.do/WebPayments/ProcessPayment',
};

const AZUL_VERIFY_ENDPOINTS = {
  sandbox: 'https://pruebas.azul.com.do/WebPayments/VerifyPayment',
  production: 'https://pagos.azul.com.do/WebPayments/VerifyPayment',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaymentRequest = await req.json();
    const { orderId, amount, customerName, customerEmail, description, returnUrl, cancelUrl } = body;

    if (!orderId || !amount || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, amount, returnUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify order belongs to user and is pending
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Order is not in pending status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AZUL configuration
    const merchantId = Deno.env.get('AZUL_MERCHANT_ID');
    const authKey = Deno.env.get('AZUL_AUTH_KEY');
    const merchantName = Deno.env.get('AZUL_MERCHANT_NAME') || 'Barbaro Nutrition';
    const merchantType = Deno.env.get('AZUL_MERCHANT_TYPE') || 'E-Commerce';
    const environment = (Deno.env.get('AZUL_ENVIRONMENT') || 'sandbox') as 'sandbox' | 'production';

    if (!merchantId || !authKey) {
      // If AZUL is not configured, return error with instructions
      return new Response(
        JSON.stringify({
          error: 'Payment gateway not configured',
          message: 'AZUL payment gateway credentials are not set up. Please configure AZUL_MERCHANT_ID and AZUL_AUTH_KEY in your environment.',
          fallback: 'transfer'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Amount in cents (AZUL requires amount * 100)
    const amountInCents = Math.round(amount * 100);
    const itbisAmount = Math.round((amount / 1.18) * 0.18 * 100); // ITBIS separated

    // Create AZUL payment request
    const azulPayload = {
      MerchantId: merchantId,
      MerchantName: merchantName,
      MerchantType: merchantType,
      CurrencyPosCode: '$',
      Payments: '1',
      Plan: '0',
      Amount: amountInCents.toString(),
      ITBIS: itbisAmount.toString(),
      ApprovedUrl: `${returnUrl}?status=approved&orderId=${orderId}`,
      DeclineUrl: `${cancelUrl}?status=declined&orderId=${orderId}`,
      CancelUrl: `${cancelUrl}?status=cancelled&orderId=${orderId}`,
      UseCustomField1: '1',
      CustomField1Label: 'Pedido',
      CustomField1Value: orderId.slice(0, 8).toUpperCase(),
      UseCustomField2: '1',
      CustomField2Label: 'Email',
      CustomField2Value: customerEmail,
      AltMerchantName: merchantName,
      OrderNumber: orderId,
      ShowTransactionResult: '1',
    };

    // Generate AZUL auth hash
    const encoder = new TextEncoder();
    const data = encoder.encode(
      merchantId + merchantName + merchantType + '$' + amountInCents + itbisAmount + orderId + authKey
    );
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const authHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const azulEndpoint = AZUL_ENDPOINTS[environment];

    // Create a pending payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('order_payments')
      .insert({
        order_id: orderId,
        payment_method: 'card',
        amount: amount,
        status: 'pending',
        gateway: 'azul',
        currency: 'DOP',
        metadata: {
          merchant_id: merchantId,
          environment: environment,
          customer_email: customerEmail,
          customer_name: customerName
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        gateway: 'azul',
        paymentUrl: azulEndpoint,
        formData: {
          ...azulPayload,
          AuthHash: authHash,
        },
        paymentId: paymentRecord?.id,
        message: 'Redirect user to AZUL payment page with form POST'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
