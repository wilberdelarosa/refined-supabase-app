import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type Provider = "azul" | "cardnet" | "payment_link";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

interface CheckoutRequest {
  provider: Provider;
  items: CheckoutItemInput[];
  sourceUrl?: string | null;
  discountCode?: string | null;
  wantsTaxReceipt?: boolean;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
    rnc?: string;
    companyName?: string;
  };
}

interface HostedForm {
  method: "POST" | "GET";
  url: string;
  fields: Record<string, string>;
}

function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function createAuthClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Supabase anon key is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function cents(value: number) {
  return Math.round(value * 100).toString();
}

function fixedCardnetAmount(value: number) {
  return cents(value).padStart(12, "0");
}

function compactOrderReference(orderId: string) {
  return orderId.replaceAll("-", "").slice(0, 20).toUpperCase();
}

function transactionId(orderId: string) {
  const numeric = Number.parseInt(orderId.replaceAll("-", "").slice(0, 8), 16) % 1_000_000;
  return numeric.toString().padStart(6, "0");
}

function encodeUtf16Le(value: string) {
  const bytes = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes[index * 2] = code & 0xff;
    bytes[index * 2 + 1] = code >> 8;
  }
  return bytes;
}

async function hmacSha512(message: string, key: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, encodeUtf16Le(message));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildShippingAddress(customer: CheckoutRequest["customer"]) {
  const lines = [
    customer.fullName.trim(),
    customer.address.trim(),
    customer.city.trim(),
    customer.phone.trim(),
    customer.email.trim(),
  ];
  if (customer.notes?.trim()) lines.push("", `Notas: ${customer.notes.trim()}`);
  return lines.filter(Boolean).join("\n");
}

async function validateDiscount(
  admin: ReturnType<typeof createAdminClient>,
  codeInput: string | null | undefined,
  subtotal: number,
  userId: string,
) {
  if (!codeInput?.trim()) {
    return { discountCodeId: null, discountAmount: 0, normalizedCode: null };
  }

  const normalizedCode = codeInput.trim().toUpperCase();
  const { data: code, error } = await admin
    .from("discount_codes")
    .select("*")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .single();

  if (error || !code) throw new Error("Codigo de descuento no valido");
  const now = new Date();
  if (code.ends_at && new Date(code.ends_at) < now) throw new Error("Este codigo ha expirado");
  if (code.starts_at && new Date(code.starts_at) > now) throw new Error("Este codigo aun no esta activo");
  if (subtotal < Number(code.min_purchase_amount ?? 0)) throw new Error("No se alcanza la compra minima del descuento");
  if (code.max_uses && Number(code.uses_count ?? 0) >= Number(code.max_uses)) throw new Error("Este codigo alcanzo su limite de usos");

  if (code.max_uses_per_user) {
    const { count } = await admin
      .from("discount_usages")
      .select("id", { count: "exact", head: true })
      .eq("discount_code_id", code.id)
      .eq("user_id", userId);
    if (Number(count ?? 0) >= Number(code.max_uses_per_user)) throw new Error("Ya utilizaste este codigo");
  }

  const discountAmount = code.discount_type === "percentage"
    ? (subtotal * Number(code.discount_value)) / 100
    : Math.min(Number(code.discount_value), subtotal);

  return { discountCodeId: code.id as string, discountAmount, normalizedCode };
}

function callbackUrl(provider: Provider, orderId: string, outcome: string, siteUrl: string) {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const params = new URLSearchParams({
    provider,
    order_id: orderId,
    outcome,
    return_url: `${siteUrl}/order/${orderId}?provider=${provider}`,
  });
  return `${supabaseUrl}/functions/v1/card-payment-callback?${params.toString()}`;
}

async function buildAzulForm(
  orderId: string,
  total: number,
  tax: number,
  siteUrl: string,
  environment: string,
) : Promise<{ form: HostedForm; session: Record<string, unknown> }> {
  const merchantId = getRequiredEnv("AZUL_MERCHANT_ID");
  const merchantName = getRequiredEnv("AZUL_MERCHANT_NAME");
  const merchantType = Deno.env.get("AZUL_MERCHANT_TYPE")?.trim() || "ECommerce";
  const currencyCode = Deno.env.get("AZUL_CURRENCY_CODE")?.trim() || "$";
  const authKey = getRequiredEnv("AZUL_AUTH_KEY");
  const orderNumber = compactOrderReference(orderId);
  const amount = cents(total);
  const itbis = cents(tax);
  const approvedUrl = callbackUrl("azul", orderId, "approved", siteUrl);
  const declinedUrl = callbackUrl("azul", orderId, "declined", siteUrl);
  const cancelUrl = callbackUrl("azul", orderId, "cancelled", siteUrl);

  const fields: Record<string, string> = {
    MerchantId: merchantId,
    MerchantName: merchantName,
    MerchantType: merchantType,
    CurrencyCode: currencyCode,
    OrderNumber: orderNumber,
    Amount: amount,
    ITBIS: itbis,
    ApprovedUrl: approvedUrl,
    DeclinedUrl: declinedUrl,
    CancelUrl: cancelUrl,
    UseCustomField1: "1",
    CustomField1Label: "Pedido",
    CustomField1Value: orderNumber,
    UseCustomField2: "0",
    CustomField2Label: "",
    CustomField2Value: "",
    ShowTransactionResult: "1",
    Locale: "ES",
    SaveToDataVault: "0",
    AltMerchantName: `BARBARO ${orderNumber.slice(-8)}`.slice(0, 25),
  };

  const stringToSign = [
    fields.MerchantId,
    fields.MerchantName,
    fields.MerchantType,
    fields.CurrencyCode,
    fields.OrderNumber,
    fields.Amount,
    fields.ITBIS,
    fields.ApprovedUrl,
    fields.DeclinedUrl,
    fields.CancelUrl,
    fields.UseCustomField1,
    fields.CustomField1Label,
    fields.CustomField1Value,
    fields.UseCustomField2,
    fields.CustomField2Label,
    fields.CustomField2Value,
    authKey,
  ].join("");
  fields.AuthHash = await hmacSha512(stringToSign, authKey);

  const url = Deno.env.get("AZUL_PAYMENT_URL")?.trim() || (
    environment === "production"
      ? "https://pagos.azul.com.do/PaymentPage/Default.aspx"
      : "https://pruebas.azul.com.do/PaymentPage/"
  );

  return {
    form: { method: "POST", url, fields },
    session: { order_number: orderNumber, amount, itbis },
  };
}

async function buildCardnetForm(
  orderId: string,
  total: number,
  tax: number,
  customer: CheckoutRequest["customer"],
  clientIp: string,
  siteUrl: string,
  environment: string,
) : Promise<{ form: HostedForm; session: Record<string, unknown> }> {
  const merchantNumber = getRequiredEnv("CARDNET_MERCHANT_NUMBER");
  const merchantTerminal = getRequiredEnv("CARDNET_MERCHANT_TERMINAL");
  const merchantName = getRequiredEnv("CARDNET_MERCHANT_NAME").toUpperCase().slice(0, 40);
  const merchantType = Deno.env.get("CARDNET_MERCHANT_TYPE")?.trim() || "5440";
  const acquiringCode = Deno.env.get("CARDNET_ACQUIRING_CODE")?.trim() || "349";
  const orderReference = compactOrderReference(orderId);
  const returnUrl = callbackUrl("cardnet", orderId, "return", siteUrl);
  const cancelUrl = callbackUrl("cardnet", orderId, "cancelled", siteUrl);
  const sessionsUrl = Deno.env.get("CARDNET_SESSIONS_URL")?.trim() || (
    environment === "production"
      ? "https://ecommerce.cardnet.com.do/sessions"
      : "https://labservicios.cardnet.com.do/sessions"
  );
  const authorizeUrl = Deno.env.get("CARDNET_AUTHORIZE_URL")?.trim() || (
    environment === "production"
      ? "https://ecommerce.cardnet.com.do/authorize"
      : "https://labservicios.cardnet.com.do/authorize"
  );

  const phone = customer.phone.replace(/\D/g, "").slice(0, 15);
  const clientIpv4 = clientIp.includes(":") ? "127.0.0.1" : clientIp.slice(0, 15);
  const defaultState = Deno.env.get("CARDNET_DEFAULT_STATE")?.trim().slice(0, 3) || "DN";
  const defaultPostCode = Deno.env.get("CARDNET_DEFAULT_POSTCODE")?.trim().slice(0, 16) || "10101";
  const countryCode = Deno.env.get("CARDNET_COUNTRY_CODE")?.trim().slice(0, 3) || "DOP";

  const payload = {
    TransactionType: "0200",
    CurrencyCode: "214",
    AcquiringInstitutionCode: acquiringCode,
    MerchantType: merchantType,
    MerchantNumber: merchantNumber,
    MerchantTerminal: merchantTerminal,
    ReturnUrl: returnUrl,
    CancelUrl: cancelUrl,
    PageLanguaje: "ESP",
    OrdenId: orderReference,
    TransactionId: transactionId(orderId),
    Tax: fixedCardnetAmount(tax),
    MerchantName: merchantName,
    Amount: fixedCardnetAmount(total),
    Ipclient: clientIpv4,
    "3DS_email": customer.email.slice(0, 254),
    "3DS_mobilePhone": phone,
    "3DS_workPhone": phone,
    "3DS_homePhone": phone,
    "3DS_billAddr_line1": customer.address.slice(0, 50),
    "3DS_billAddr_line2": "N/A",
    "3DS_billAddr_line3": "N/A",
    "3DS_billAddr_city": customer.city.slice(0, 50),
    "3DS_billAddr_state": defaultState,
    "3DS_billAddr_country": countryCode,
    "3DS_billAddr_postCode": defaultPostCode,
    "3DS_shipAddr_line1": customer.address.slice(0, 50),
    "3DS_shipAddr_line2": "N/A",
    "3DS_shipAddr_line3": "N/A",
    "3DS_shipAddr_city": customer.city.slice(0, 50),
    "3DS_shipAddr_state": defaultState,
    "3DS_shipAddr_country": countryCode,
    "3DS_shipAddr_postCode": defaultPostCode,
    "3DS_transType": "01",
  };

  const response = await fetch(sessionsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`CardNET session error (${response.status}): ${responseText.slice(0, 180)}`);

  let sessionData: Record<string, string>;
  try {
    sessionData = JSON.parse(responseText);
  } catch {
    throw new Error("CardNET devolvio una respuesta de sesion invalida");
  }

  const sessionId = sessionData.SESSION;
  const sessionKey = sessionData["session-key"];
  if (!sessionId || !sessionKey) throw new Error("CardNET no devolvio SESSION y session-key");

  return {
    form: { method: "POST", url: authorizeUrl, fields: { SESSION: sessionId } },
    session: {
      session_id: sessionId,
      session_key: sessionKey,
      order_reference: orderReference,
      sessions_url: sessionsUrl,
      transaction_id: payload.TransactionId,
    },
  };
}

function buildPaymentLinkForm(urlTemplate: string, orderId: string, total: number) {
  const url = urlTemplate
    .replaceAll("{order_id}", encodeURIComponent(orderId))
    .replaceAll("{amount}", encodeURIComponent(total.toFixed(2)))
    .replaceAll("{currency}", "DOP");
  return { method: "GET" as const, url, fields: {} };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let admin: ReturnType<typeof createAdminClient> | null = null;
  let createdOrderId: string | null = null;

  try {
    const authClient = createAuthClient(req.headers.get("Authorization"));
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json() as CheckoutRequest;
    if (!["azul", "cardnet", "payment_link"].includes(body.provider)) return jsonResponse({ error: "Unsupported provider" }, 400);
    if (!Array.isArray(body.items) || body.items.length === 0) return jsonResponse({ error: "Cart is empty" }, 400);
    if (!body.customer?.fullName?.trim() || !body.customer?.email?.trim() || !body.customer?.phone?.trim() || !body.customer?.address?.trim() || !body.customer?.city?.trim()) {
      return jsonResponse({ error: "Missing required checkout fields" }, 400);
    }
    if (body.wantsTaxReceipt && !body.customer.rnc?.trim()) return jsonResponse({ error: "RNC o Cedula requerido" }, 400);

    admin = createAdminClient();
    const { data: gateway, error: gatewayError } = await admin
      .from("payment_gateway_settings")
      .select("*")
      .eq("provider", body.provider)
      .eq("is_active", true)
      .single();
    if (gatewayError || !gateway) return jsonResponse({ error: "El proveedor no esta activo en Admin" }, 409);

    const productIds = [...new Set(body.items.map((item) => item.productId))];
    const { data: products, error: productError } = await admin
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds);
    if (productError || !products) throw new Error("No se pudieron validar los productos");

    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("Uno de los productos ya no existe");
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("Cantidad invalida");
      if (Number(product.stock ?? 0) < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
      return { product, quantity: item.quantity };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const discount = await validateDiscount(admin, body.discountCode, subtotal, user.id);
    const total = Number(Math.max(0, subtotal - discount.discountAmount).toFixed(2));
    if (total <= 0) throw new Error("El total del pago debe ser mayor que cero");
    const includedTax = Number((total - total / 1.18).toFixed(2));
    const shippingAddress = buildShippingAddress(body.customer);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        subtotal,
        discount_code_id: discount.discountCodeId,
        discount_amount: discount.discountAmount,
        status: "pending",
        shipping_address: shippingAddress,
        rnc_cedula: body.wantsTaxReceipt ? body.customer.rnc?.trim() ?? null : null,
        company_name: body.wantsTaxReceipt ? body.customer.companyName?.trim() ?? null : null,
        ncf_type: body.wantsTaxReceipt ? "01" : "02",
        payment_provider: body.provider,
        payment_metadata: { source: body.provider, environment: gateway.environment },
      })
      .select("id")
      .single();
    if (orderError || !order) throw orderError ?? new Error("No se pudo crear la orden");

    const orderId = order.id as string;
    createdOrderId = orderId;
    const { error: itemsError } = await admin.from("order_items").insert(
      normalizedItems.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
    );
    if (itemsError) throw itemsError;

    const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || req.headers.get("origin") || body.sourceUrl || "https://barbaro-nutrition.lovable.app").replace(/\/$/, "");
    const clientIp = (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "127.0.0.1").split(",")[0].trim();

    let form: HostedForm;
    let session: Record<string, unknown>;
    if (body.provider === "azul") {
      ({ form, session } = await buildAzulForm(orderId, total, includedTax, siteUrl, gateway.environment));
    } else if (body.provider === "cardnet") {
      ({ form, session } = await buildCardnetForm(orderId, total, includedTax, body.customer, clientIp, siteUrl, gateway.environment));
    } else {
      if (!gateway.payment_link_url) throw new Error("Falta configurar payment_link_url en Admin");
      form = buildPaymentLinkForm(gateway.payment_link_url, orderId, total);
      session = { order_reference: compactOrderReference(orderId), link_url: form.url };
    }

    const orderReference = String(session.order_reference ?? session.order_number ?? compactOrderReference(orderId));
    const { error: sessionInsertError } = await admin.from("payment_provider_sessions").insert({
      order_id: orderId,
      provider: body.provider,
      session_id: session.session_id ?? null,
      session_key: session.session_key ?? null,
      order_reference: orderReference,
      request_payload: session,
      expires_at: body.provider === "cardnet" ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
    });
    if (sessionInsertError) throw sessionInsertError;

    const { error: orderTraceError } = await admin.from("orders").update({
      provider_checkout_id: String(session.session_id ?? orderReference),
    }).eq("id", orderId);
    if (orderTraceError) throw orderTraceError;

    const { error: paymentInsertError } = await admin.from("order_payments").insert({
      order_id: orderId,
      payment_method: body.provider === "payment_link" ? "other" : "card",
      amount: total,
      status: "pending",
      provider: body.provider,
      provider_checkout_id: String(session.session_id ?? orderReference),
      provider_currency: "dop",
      provider_payload: { environment: gateway.environment, redirect_url: form.url },
      reference_number: String(session.session_id ?? orderReference),
      notes: `[${body.provider}] hosted payment created`,
    });
    if (paymentInsertError) throw paymentInsertError;

    return jsonResponse({
      orderId,
      provider: body.provider,
      environment: gateway.environment,
      total,
      form,
    });
  } catch (error) {
    console.error("create-hosted-payment error", error);
    if (admin && createdOrderId) {
      const { error: cleanupError } = await admin
        .from("orders")
        .delete()
        .eq("id", createdOrderId)
        .eq("status", "pending");
      if (cleanupError) console.error("create-hosted-payment cleanup error", cleanupError.message);
    }
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
