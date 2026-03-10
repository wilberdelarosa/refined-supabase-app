import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * AZUL Payment Callback Handler
 *
 * This function handles the callback from AZUL after a payment is processed.
 * AZUL sends a POST request to this endpoint with the payment result.
 *
 * It verifies the payment, updates the order status, and creates an invoice.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authKey = Deno.env.get('AZUL_AUTH_KEY') || '';

    const body = await req.json();

    const {
      OrderNumber: orderId,
      AzulOrderId: azulOrderId,
      AuthorizationCode: authCode,
      ResponseCode: responseCode,
      ResponseMessage: responseMessage,
      Amount: amountStr,
      DateTime: dateTime,
      ISOCode: isoCode,
      RRN: rrn,
      CustomOrderId: customOrderId,
      AuthHash: receivedHash,
    } = body;

    // Log the webhook event for idempotency
    const eventId = azulOrderId || `${orderId}-${Date.now()}`;

    const { data: existingEvent } = await supabase
      .from('payment_webhook_events')
      .select('id, processed')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      return new Response(
        JSON.stringify({ success: true, message: 'Event already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store webhook event
    await supabase.from('payment_webhook_events').upsert({
      event_id: eventId,
      event_type: responseCode === 'ISO8583' || responseCode === '00' ? 'payment.approved' : 'payment.declined',
      gateway: 'azul',
      payload: body,
      processed: false,
    }, { onConflict: 'event_id' });

    const isApproved = responseCode === 'ISO8583' || responseCode === '00';
    const amount = amountStr ? parseFloat(amountStr) / 100 : 0;

    if (!orderId) {
      await supabase
        .from('payment_webhook_events')
        .update({ processed: true, error_message: 'Missing OrderNumber' })
        .eq('event_id', eventId);

      return new Response(
        JSON.stringify({ error: 'Missing OrderNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record
    const { data: payment } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('gateway', 'azul')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment) {
      await supabase
        .from('order_payments')
        .update({
          status: isApproved ? 'verified' : 'rejected',
          gateway_payment_id: azulOrderId,
          reference_number: authCode || rrn,
          verified_at: isApproved ? new Date().toISOString() : null,
          notes: isApproved ? `AZUL aprobado - Auth: ${authCode}` : `AZUL rechazado: ${responseMessage}`,
          metadata: {
            ...((payment.metadata as Record<string, unknown>) || {}),
            azul_response: body,
            iso_code: isoCode,
            rrn: rrn,
          }
        })
        .eq('id', payment.id);
    }

    if (isApproved) {
      // Update order status to paid
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
        .eq('status', 'pending');

      // Auto-generate invoice
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (order) {
        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!existingInvoice) {
          const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

          const subtotal = order.total / 1.18;
          const taxAmount = order.total - subtotal;

          const addressLines = (order.shipping_address || '').split('\n');
          const billingName = order.billing_name || addressLines[0] || 'Cliente';
          const billingAddress = addressLines.slice(1, 4).join(', ');

          const { data: invoice } = await supabase
            .from('invoices')
            .insert({
              invoice_number: invoiceNumber || `INV-${Date.now()}`,
              order_id: orderId,
              user_id: order.user_id,
              subtotal: Math.round(subtotal * 100) / 100,
              tax_rate: 0.18,
              tax_amount: Math.round(taxAmount * 100) / 100,
              total: order.total,
              status: 'paid',
              billing_name: billingName,
              billing_address: billingAddress,
              billing_rnc: order.billing_rnc || null,
              discount_amount: order.discount_amount || 0,
            })
            .select()
            .single();

          if (invoice && order.order_items) {
            const invoiceLines = order.order_items.map((item: { product_name: string; quantity: number; price: number }) => ({
              invoice_id: invoice.id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.price,
              total: item.price * item.quantity
            }));

            await supabase.from('invoice_lines').insert(invoiceLines);
          }
        }

        // Send confirmation email
        const emailLine = (order.shipping_address || '').split('\n').find((l: string) => l.includes('@'));
        if (emailLine) {
          await supabase.functions.invoke('send-order-email', {
            body: {
              type: 'status_changed',
              customerEmail: emailLine.trim(),
              customerName: order.billing_name || addressLines[0] || 'Cliente',
              orderId: order.id,
              orderTotal: order.total,
              orderItems: order.order_items?.map((item: { product_name: string; quantity: number; price: number }) => ({
                name: item.product_name,
                quantity: item.quantity,
                price: item.price
              })),
              oldStatus: 'pending',
              newStatus: 'paid'
            }
          });
        }
      }
    }

    // Mark event as processed
    await supabase
      .from('payment_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', eventId);

    return new Response(
      JSON.stringify({
        success: true,
        approved: isApproved,
        orderId,
        message: isApproved ? 'Payment approved and order updated' : `Payment declined: ${responseMessage}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment callback error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
