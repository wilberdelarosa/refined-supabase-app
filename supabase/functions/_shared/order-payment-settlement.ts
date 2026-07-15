import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

type AdminClient = SupabaseClient;

interface SettlementInput {
  orderId: string;
  provider: string;
  providerReferenceId: string;
  authorizationCode?: string | null;
  responseCode?: string | null;
  payload?: Record<string, unknown>;
}

async function sendPaidEmail(admin: AdminClient, order: Record<string, unknown>, provider: string) {
  const orderId = order.id as string;
  const { data: items } = await admin
    .from("order_items")
    .select("product_name, quantity, price")
    .eq("order_id", orderId);

  const addressLines = String(order.shipping_address ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const customerEmail = addressLines.find((line) => line.includes("@"));
  if (!customerEmail) return;

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
      paymentMethod: provider,
      customerEmail,
      customerName: order.company_name || addressLines[0] || "Cliente",
      orderId,
      orderTotal: Number(order.total),
      orderItems: (items ?? []).map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      shippingAddress: order.shipping_address,
      orderUrl: `${Deno.env.get("PUBLIC_SITE_URL") ?? ""}/order/${orderId}?provider=${provider}`,
    }),
  });

  if (!response.ok) {
    console.error("No se pudo enviar el email de pago", await response.text());
  }
}

export async function settleOrderPayment(admin: AdminClient, input: SettlementInput) {
  const { data: result, error: settlementError } = await admin.rpc(
    "settle_hosted_order_payment",
    {
      p_order_id: input.orderId,
      p_provider: input.provider,
      p_provider_reference_id: input.providerReferenceId,
      p_authorization_code: input.authorizationCode ?? null,
      p_response_code: input.responseCode ?? null,
      p_payload: input.payload ?? {},
    },
  );

  if (settlementError) throw settlementError;

  const settlement = (result ?? {}) as { already_settled?: boolean };
  if (!settlement.already_settled) {
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("*")
      .eq("id", input.orderId)
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Orden no encontrada despues de liquidar el pago");
    }

    await sendPaidEmail(admin, order, input.provider);
  }

  return { alreadySettled: Boolean(settlement.already_settled) };
}

export async function failOrderPayment(
  admin: AdminClient,
  orderId: string,
  provider: string,
  reason: string,
  payload: Record<string, unknown> = {},
) {
  await admin
    .from("order_payments")
    .update({
      status: "rejected",
      failure_reason: reason,
      provider_payload: payload,
      notes: `[${provider}] payment failed`,
    })
    .eq("order_id", orderId)
    .eq("provider", provider);
}
