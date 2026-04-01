import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  getWhopClient,
  getWhopWebhookSecret,
  isWhopNotes,
} from "../_shared/whop.ts";

type AdminClient = ReturnType<typeof createAdminClient>;

function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function tryInsertWebhookEvent(
  admin: AdminClient,
  eventId: string,
  eventType: string,
  payload: unknown,
) {
  const { error } = await admin.from("whop_webhook_events").insert({
    id: eventId,
    event_type: eventType,
    payload,
  });

  if (!error) return { inserted: true };
  if (String(error.message ?? "").includes("duplicate key")) {
    return { inserted: false };
  }

  // Table may not exist yet on environments without migration.
  return { inserted: true };
}

async function markWebhookProcessed(
  admin: AdminClient,
  eventId: string,
  fields: Record<string, unknown>,
) {
  await admin
    .from("whop_webhook_events")
    .update({
      ...fields,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

async function applyDiscountIfNeeded(admin: AdminClient, order: any) {
  if (!order.discount_code_id || !order.discount_amount || order.discount_amount <= 0) return;

  const { data: existingUsage } = await admin
    .from("discount_usages")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existingUsage) return;

  await admin.from("discount_usages").insert({
    discount_code_id: order.discount_code_id,
    user_id: order.user_id,
    order_id: order.id,
    discount_amount: order.discount_amount,
  });

  const { data: codeData } = await admin
    .from("discount_codes")
    .select("uses_count")
    .eq("id", order.discount_code_id)
    .maybeSingle();

  if (codeData) {
    await admin
      .from("discount_codes")
      .update({ uses_count: (codeData.uses_count ?? 0) + 1 })
      .eq("id", order.discount_code_id);
  }
}

async function decrementStockIfNeeded(admin: AdminClient, order: any) {
  const { data: movement } = await admin
    .from("stock_movements")
    .select("id")
    .eq("reference_id", order.id)
    .eq("reference_type", "whop_payment")
    .maybeSingle();

  if (movement) return;

  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", order.id);

  if (itemsError || !items) {
    throw itemsError ?? new Error("No se pudieron cargar los items de la orden");
  }

  for (const item of items) {
    if (!item.product_id) continue;

    const { data: product } = await admin
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .single();

    const previousStock = Number(product?.stock ?? 0);
    const newStock = Math.max(0, previousStock - Number(item.quantity));

    await admin
      .from("products")
      .update({ stock: newStock })
      .eq("id", item.product_id);

    await admin.from("stock_movements").insert({
      product_id: item.product_id,
      quantity_change: -Number(item.quantity),
      previous_stock: previousStock,
      new_stock: newStock,
      movement_type: "sale",
      reference_id: order.id,
      reference_type: "whop_payment",
      notes: "Stock descontado automáticamente por pago Whop",
    });
  }
}

async function createInvoiceIfNeeded(admin: AdminClient, order: any) {
  const { data: existingInvoice } = await admin
    .from("invoices")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existingInvoice) return;

  const { data: invoiceNumber } = await admin.rpc("generate_invoice_number");
  const addressLines = String(order.shipping_address ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const billingName = order.company_name || addressLines[0] || "Cliente";
  const billingAddress = addressLines.slice(1, 4).join(", ");
  const subtotal = Number(order.subtotal ?? order.total);
  const taxAmount = Math.max(0, Number(order.total) - subtotal);

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber || `INV-${Date.now()}`,
      order_id: order.id,
      user_id: order.user_id,
      subtotal,
      tax_rate: subtotal > 0 ? Number((taxAmount / subtotal).toFixed(4)) : 0,
      tax_amount: taxAmount,
      total: Number(order.total),
      status: "issued",
      billing_name: billingName,
      billing_address: billingAddress,
      billing_rnc: order.rnc_cedula ?? null,
      issued_at: new Date().toISOString(),
      ncf: order.ncf_generated ?? null,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    throw invoiceError ?? new Error("No se pudo crear la factura");
  }

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, quantity, price")
    .eq("order_id", order.id);

  if (items?.length) {
    await admin.from("invoice_lines").insert(
      items.map((item) => ({
        invoice_id: invoice.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.price,
        total: Number(item.price) * Number(item.quantity),
      })),
    );
  }
}

async function sendPaidEmail(admin: AdminClient, order: any) {
  const { data: items } = await admin
    .from("order_items")
    .select("product_name, quantity, price")
    .eq("order_id", order.id);

  const addressLines = String(order.shipping_address ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const email = addressLines.find((line) => line.includes("@"));
  const customerName = order.company_name || addressLines[0] || "Cliente";

  if (!email) return;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return;

  const response = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRole}`,
      apikey: serviceRole,
    },
    body: JSON.stringify({
      type: "order_created",
      paymentMethod: "whop",
      customerEmail: email,
      customerName,
      orderId: order.id,
      orderTotal: Number(order.total),
      orderItems: (items ?? []).map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      shippingAddress: order.shipping_address,
      orderUrl: `${Deno.env.get("PUBLIC_SITE_URL") ?? ""}/order/${order.id}?provider=whop`,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send Whop paid email", await response.text());
  }
}

async function handlePaymentSucceeded(admin: AdminClient, event: any) {
  const orderId = event.data?.metadata?.order_id;
  if (!orderId) return;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw orderError ?? new Error("Order not found");
  }

  const alreadySettled = ["paid", "processing", "packed", "shipped", "delivered"].includes(
    order.status,
  );

  const paymentUpdate = {
    status: "verified",
    reference_number: event.data.id,
    verified_at: new Date().toISOString(),
    notes: "[whop] payment verified",
  };

  await admin
    .from("order_payments")
    .update(paymentUpdate)
    .eq("order_id", order.id)
    .eq("payment_method", "card");

  await admin
    .from("order_payments")
    .update({
      provider: "whop",
      provider_payment_id: event.data.id,
      provider_currency: event.data.currency ?? "dop",
      provider_fee: Number(event.data.application_fee?.amount ?? 0),
      provider_tax: Number(event.data.tax_amount ?? 0),
      provider_payload: event.data,
      paid_at: event.data.paid_at ?? new Date().toISOString(),
    })
    .eq("order_id", order.id)
    .eq("payment_method", "card");

  await admin
    .from("orders")
    .update({
      status: "paid",
      payment_provider: "whop",
      provider_reference_id: event.data.id,
      paid_at: event.data.paid_at ?? new Date().toISOString(),
      payment_metadata: {
        source: "whop",
        payment_id: event.data.id,
        currency: event.data.currency,
      },
    })
    .eq("id", order.id);

  if (!alreadySettled) {
    await applyDiscountIfNeeded(admin, order);
    await decrementStockIfNeeded(admin, order);
    await createInvoiceIfNeeded(admin, order);
    await sendPaidEmail(admin, { ...order, status: "paid" });
  }
}

async function handlePaymentFailed(admin: AdminClient, event: any) {
  const orderId = event.data?.metadata?.order_id;
  if (!orderId) return;

  await admin
    .from("order_payments")
    .update({
      status: "rejected",
      reference_number: event.data.id,
      notes: `[whop] payment failed: ${event.data.failure_message ?? "unknown"}`,
    })
    .eq("order_id", orderId)
    .eq("payment_method", "card");

  await admin
    .from("order_payments")
    .update({
      provider: "whop",
      provider_payment_id: event.data.id,
      provider_payload: event.data,
      failure_reason: event.data.failure_message ?? "Payment failed",
    })
    .eq("order_id", orderId)
    .eq("payment_method", "card");
}

async function handleRefund(admin: AdminClient, event: any) {
  const paymentId = event.data?.payment?.id;
  if (!paymentId) return;

  const { data: payment } = await admin
    .from("order_payments")
    .select("order_id, notes")
    .eq("provider_payment_id", paymentId)
    .maybeSingle();

  if (!payment?.order_id) return;

  await admin
    .from("order_payments")
    .update({
      status: "refunded",
      notes: "[whop] payment refunded",
      refunded_amount: Number(event.data.amount ?? 0),
      provider_payload: event.data,
    })
    .eq("order_id", payment.order_id);

  await admin.from("orders").update({ status: "refunded" }).eq("id", payment.order_id);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const whop = getWhopClient();
    const event = whop.webhooks.unwrap(body, {
      headers,
      key: getWhopWebhookSecret(),
    });

    const admin = createAdminClient();
    const inserted = await tryInsertWebhookEvent(admin, event.id, event.type, event);
    if (!inserted.inserted) {
      return jsonResponse({ ok: true, duplicate: true });
    }

    switch (event.type) {
      case "payment.succeeded":
        await handlePaymentSucceeded(admin, event);
        break;
      case "payment.failed":
        await handlePaymentFailed(admin, event);
        break;
      case "refund.created":
      case "refund.updated":
        await handleRefund(admin, event);
        break;
      default:
        break;
    }

    await markWebhookProcessed(admin, event.id, {
      status: "processed",
      order_id: (event.data as any)?.metadata?.order_id ?? null,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("whop-webhook error", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse({ error: message }, 400);
  }
});
