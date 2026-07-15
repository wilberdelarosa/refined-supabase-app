import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type Provider = "azul" | "cardnet" | "payment_link";

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

function inspectProvider(provider: Provider, paymentLinkUrl: string | null) {
  if (provider === "azul") {
    const required = ["AZUL_MERCHANT_ID", "AZUL_MERCHANT_NAME", "AZUL_AUTH_KEY"];
    const missing = required.filter((name) => !Deno.env.get(name)?.trim());
    return missing.length
      ? { status: "error", message: `Faltan secretos: ${missing.join(", ")}` }
      : { status: "ready", message: "Credenciales locales completas. Pendiente validar certificacion con Azul." };
  }

  if (provider === "cardnet") {
    const required = ["CARDNET_MERCHANT_NUMBER", "CARDNET_MERCHANT_TERMINAL", "CARDNET_MERCHANT_NAME"];
    const missing = required.filter((name) => !Deno.env.get(name)?.trim());
    return missing.length
      ? { status: "error", message: `Faltan secretos: ${missing.join(", ")}` }
      : { status: "ready", message: "Credenciales locales completas. Pendiente validar certificacion con CardNET." };
  }

  if (!paymentLinkUrl) {
    return { status: "error", message: "Falta configurar la URL del link de pago." };
  }

  try {
    const parsedUrl = new URL(paymentLinkUrl);
    if (parsedUrl.protocol !== "https:") throw new Error("HTTPS required");
    return { status: "ready", message: "Link HTTPS valido. La confirmacion del pago depende del proveedor externo." };
  } catch {
    return { status: "error", message: "El link de pago debe ser una URL HTTPS valida." };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authClient = createAuthClient(req.headers.get("Authorization"));
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = createAdminClient();
    const { data: roleRows, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (roleError) throw roleError;
    const roles = new Set((roleRows ?? []).map((row) => row.role));
    if (!roles.has("admin") && !roles.has("manager")) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const requestBody = await req.json().catch(() => ({})) as { provider?: Provider };
    const requestedProvider = requestBody.provider;
    if (requestedProvider && !["azul", "cardnet", "payment_link"].includes(requestedProvider)) {
      return jsonResponse({ error: "Unsupported provider" }, 400);
    }

    let query = admin.from("payment_gateway_settings").select("provider, payment_link_url, environment, is_active");
    if (requestedProvider) query = query.eq("provider", requestedProvider);
    const { data: gateways, error: gatewayError } = await query;
    if (gatewayError) throw gatewayError;

    const results = [];
    for (const gateway of gateways ?? []) {
      const provider = gateway.provider as Provider;
      const inspection = inspectProvider(provider, gateway.payment_link_url);
      await admin.from("payment_gateway_settings").update({
        health_status: inspection.status,
        health_message: inspection.message,
        last_health_at: new Date().toISOString(),
      }).eq("provider", provider);
      results.push({
        provider,
        environment: gateway.environment,
        isActive: gateway.is_active,
        ...inspection,
      });
    }

    return jsonResponse({ ok: true, results });
  } catch (error) {
    console.error("payment-provider-health error", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
