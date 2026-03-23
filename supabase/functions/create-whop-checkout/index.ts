import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  buildWhopNotes,
  getWhopClient,
  getWhopCompanyId,
  getWhopEnvironment,
} from "../_shared/whop.ts";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

interface CheckoutRequest {
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

function createAuthClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");

  if (!url || !key) {
    throw new Error("Supabase anon key is not configured");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

function buildShippingAddress(customer: CheckoutRequest["customer"]) {
  const lines = [
    customer.fullName.trim(),
    customer.address.trim(),
    customer.city.trim(),
    customer.phone.trim(),
    customer.email.trim(),
  ];

  if (customer.notes?.trim()) {
    lines.push("", `Notas: ${customer.notes.trim()}`);
  }

  return lines.filter(Boolean).join("\n");
}

async function validateDiscount(
  admin: ReturnType<typeof createAdminClient>,
  discountCode: string | null | undefined,
  subtotal: number,
  userId: string,
) {
  if (!discountCode?.trim()) {
    return { discountCodeId: null, discountAmount: 0, normalizedCode: null };
  }

  const normalizedCode = discountCode.trim().toUpperCase();
  const { data: code, error } = await admin
    .from("discount_codes")
    .select("*")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .single();

  if (error || !code) {
    throw new Error("Código de descuento no válido");
  }

  const now = new Date();
  if (code.ends_at && new Date(code.ends_at) < now) {
    throw new Error("Este código ha expirado");
  }

  if (code.starts_at && new Date(code.starts_at) > now) {
    throw new Error("Este código aún no está activo");
  }

  if (subtotal < (code.min_purchase_amount ?? 0)) {
    throw new Error(
      `Compra mínima de DOP ${(code.min_purchase_amount ?? 0).toLocaleString()} requerida`,
    );
  }

  if (code.max_uses && (code.uses_count ?? 0) >= code.max_uses) {
    throw new Error("Este código ha alcanzado su límite de usos");
  }

  if (code.max_uses_per_user) {
    const { data: usages } = await admin
      .from("discount_usages")
      .select("id")
      .eq("discount_code_id", code.id)
      .eq("user_id", userId);

    if ((usages?.length ?? 0) >= code.max_uses_per_user) {
      throw new Error("Ya has utilizado este código");
    }
  }

  const discountAmount =
    code.discount_type === "percentage"
      ? (subtotal * code.discount_value) / 100
      : Math.min(code.discount_value, subtotal);

  return {
    discountCodeId: code.id as string,
    discountAmount,
    normalizedCode,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authClient = createAuthClient(req.headers.get("Authorization"));
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = (await req.json()) as CheckoutRequest;
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }

    const customer = body.customer;
    if (
      !customer?.fullName?.trim() ||
      !customer?.email?.trim() ||
      !customer?.phone?.trim() ||
      !customer?.address?.trim() ||
      !customer?.city?.trim()
    ) {
      return jsonResponse({ error: "Missing required checkout fields" }, 400);
    }

    if (body.wantsTaxReceipt && !customer.rnc?.trim()) {
      return jsonResponse({ error: "RNC o Cédula requerido para comprobante fiscal" }, 400);
    }

    const admin = createAdminClient();
    const productIds = [...new Set(body.items.map((item) => item.productId))];

    const { data: products, error: productError } = await admin
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds);

    if (productError || !products) {
      throw new Error("No se pudieron validar los productos");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("Uno de los productos ya no existe");
      }
      if (item.quantity <= 0) {
        throw new Error("Cantidad inválida en el carrito");
      }
      if ((product.stock ?? 0) < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }

      return {
        product,
        quantity: item.quantity,
      };
    });

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    const discount = await validateDiscount(admin, body.discountCode, subtotal, user.id);
    const total = Math.max(0, subtotal - discount.discountAmount);
    const shippingAddress = buildShippingAddress(customer);

    const orderPayload = {
      user_id: user.id,
      total,
      subtotal,
      discount_code_id: discount.discountCodeId,
      discount_amount: discount.discountAmount,
      status: "pending",
      shipping_address: shippingAddress,
      rnc_cedula: body.wantsTaxReceipt ? customer.rnc?.trim() ?? null : null,
      company_name: body.wantsTaxReceipt ? customer.companyName?.trim() ?? null : null,
      ncf_type: body.wantsTaxReceipt ? "01" : "02",
      payment_provider: "whop",
      payment_metadata: {
        source: "whop",
        discount_code: discount.normalizedCode,
      },
    };

    let orderId = "";
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError || !order) {
      const fallbackPayload = {
        user_id: user.id,
        total,
        subtotal,
        discount_code_id: discount.discountCodeId,
        discount_amount: discount.discountAmount,
        status: "pending",
        shipping_address: shippingAddress,
        rnc_cedula: body.wantsTaxReceipt ? customer.rnc?.trim() ?? null : null,
        company_name: body.wantsTaxReceipt ? customer.companyName?.trim() ?? null : null,
        ncf_type: body.wantsTaxReceipt ? "01" : "02",
      };

      const { data: fallbackOrder, error: fallbackError } = await admin
        .from("orders")
        .insert(fallbackPayload)
        .select("id")
        .single();

      if (fallbackError || !fallbackOrder) {
        throw fallbackError ?? new Error("No se pudo crear la orden");
      }
      orderId = fallbackOrder.id;
    } else {
      orderId = order.id;
    }

    const orderItems = normalizedItems.map((item) => ({
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const { error: orderItemsError } = await admin.from("order_items").insert(orderItems);
    if (orderItemsError) {
      throw orderItemsError;
    }

    const siteUrl =
      Deno.env.get("PUBLIC_SITE_URL") ??
      req.headers.get("origin") ??
      body.sourceUrl ??
      "http://localhost:8080";

    const whop = getWhopClient();
    const checkoutConfiguration = await whop.checkoutConfigurations.create({
      mode: "payment",
      source_url: body.sourceUrl ?? `${siteUrl}/checkout/transferencia`,
      redirect_url: `${siteUrl}/checkout/transferencia?order=${orderId}`,
      metadata: {
        app: "barbaro-nutrition",
        order_id: orderId,
        user_id: user.id,
        shipping_address: shippingAddress,
        wants_tax_receipt: Boolean(body.wantsTaxReceipt),
        rnc_cedula: body.wantsTaxReceipt ? customer.rnc?.trim() ?? null : null,
      },
      plan: {
        company_id: getWhopCompanyId(),
        currency: "dop",
        plan_type: "one_time",
        initial_price: Number(total.toFixed(2)),
        visibility: "hidden",
        release_method: "buy_now",
        force_create_new_plan: true,
        title: `Pedido Barbaro #${orderId.slice(0, 8).toUpperCase()}`,
        description: normalizedItems
          .map((item) => `${item.product.name} x${item.quantity}`)
          .join(", "),
        product: {
          external_identifier: `barbaro-order-${orderId}`,
          title: `Pedido Barbaro #${orderId.slice(0, 8).toUpperCase()}`,
          description: "Checkout directo de productos físicos de Barbaro Nutrition",
          collect_shipping_address: false,
          redirect_purchase_url: `${siteUrl}/order/${orderId}?provider=whop`,
        },
      },
    });

    const notes = buildWhopNotes(checkoutConfiguration.id);

    const { error: initialPaymentError } = await admin.from("order_payments").insert({
      order_id: orderId,
      payment_method: "card",
      amount: total,
      status: "pending",
      reference_number: checkoutConfiguration.id,
      notes,
    });

    if (initialPaymentError) {
      throw initialPaymentError;
    }

    await admin
      .from("orders")
      .update({
        payment_provider: "whop",
        provider_checkout_id: checkoutConfiguration.id,
        payment_metadata: {
          source: "whop",
          environment: getWhopEnvironment(),
          purchase_url: checkoutConfiguration.purchase_url,
          discount_code: discount.normalizedCode,
        },
      })
      .eq("id", orderId);

    await admin
      .from("order_payments")
      .update({
        provider: "whop",
        provider_checkout_id: checkoutConfiguration.id,
        provider_currency: "dop",
        provider_payload: {
          purchase_url: checkoutConfiguration.purchase_url,
        },
      })
      .eq("order_id", orderId)
      .eq("reference_number", checkoutConfiguration.id);

    return jsonResponse({
      orderId,
      sessionId: checkoutConfiguration.id,
      purchaseUrl: checkoutConfiguration.purchase_url,
      total,
      environment: getWhopEnvironment(),
    });
  } catch (error) {
    console.error("create-whop-checkout error", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse({ error: message }, 500);
  }
});
