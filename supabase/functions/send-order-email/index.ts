import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type PaymentMethod = "transfer" | "whop" | "azul" | "cardnet" | "payment_link";

interface OrderEmailRequest {
  type: "order_created" | "status_changed";
  paymentMethod?: PaymentMethod;
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderTotal: number;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  newStatus?: string;
  oldStatus?: string;
  shippingAddress?: string;
  orderUrl?: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  payment_pending: "Verificando pago",
  paid: "Pagado",
  processing: "Procesando",
  packed: "Empacado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const statusMessages: Record<string, string> = {
  payment_pending: "Recibimos el comprobante y estamos verificando el pago.",
  paid: "Confirmamos el pago y tu pedido entró en preparación.",
  processing: "Nuestro equipo está preparando tu pedido.",
  packed: "Tu pedido está empacado y listo para envío.",
  shipped: "Tu pedido está en camino.",
  delivered: "Tu pedido fue entregado. Gracias por elegirnos.",
  cancelled: "Tu pedido fue cancelado.",
  refunded: "El pedido fue reembolsado.",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}

function paymentLabel(method?: PaymentMethod) {
  if (method === "whop") return "Whop";
  if (method === "azul") return "Azul";
  if (method === "cardnet") return "CardNET";
  if (method === "payment_link") return "link de pago";
  return "transferencia bancaria";
}

function isAutomaticPayment(method?: PaymentMethod) {
  return method === "whop" || method === "azul" || method === "cardnet";
}

function emailShell(content: string) {
  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        @media (max-width:620px){.wrap{padding:12px!important}.content{padding:22px!important}.items th,.items td{padding:9px 6px!important;font-size:12px!important}.button{display:block!important;text-align:center!important}}
      </style>
    </head>
    <body style="margin:0;background:#f3f6f8;color:#172033;font-family:Arial,Helvetica,sans-serif">
      <div class="wrap" style="padding:28px 16px">
        <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #dce4ea;border-radius:18px;background:#fff;box-shadow:0 12px 32px rgba(15,23,42,.08)">
          <div style="padding:26px 30px;background:linear-gradient(135deg,#071521,#123b55);color:#fff">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7dd3fc">Bárbaro Nutrition</div>
            <div style="margin-top:7px;font-size:24px;font-weight:800">Tu nutrición, bien gestionada</div>
          </div>
          <div class="content" style="padding:30px">${content}</div>
          <div style="padding:18px 30px;border-top:1px solid #e7edf1;background:#f8fafc;text-align:center;color:#64748b;font-size:12px">
            © ${new Date().getFullYear()} Bárbaro Nutrition · Este correo fue generado automáticamente.
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function orderCreatedEmail(data: OrderEmailRequest) {
  const automatic = isAutomaticPayment(data.paymentMethod);
  const provider = paymentLabel(data.paymentMethod);
  const items = data.orderItems.map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e7edf1">${escapeHtml(item.name)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e7edf1;text-align:center">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e7edf1;text-align:right;white-space:nowrap">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`).join("");
  const address = data.shippingAddress
    ? `<div style="margin-top:20px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc"><strong>Entrega</strong><div style="margin-top:8px;color:#475569;line-height:1.6">${escapeHtml(data.shippingAddress).replaceAll("\n", "<br>")}</div></div>`
    : "";
  const action = data.orderUrl
    ? `<div style="margin-top:24px;text-align:center"><a class="button" href="${escapeHtml(data.orderUrl)}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#0284c7;color:#fff;text-decoration:none;font-weight:700">Ver pedido y factura</a></div>`
    : "";

  return emailShell(`
    <h1 style="margin:0;font-size:24px">${automatic ? "Pago confirmado" : "Pedido recibido"}</h1>
    <p style="margin:10px 0 0;color:#475569;line-height:1.6">Hola ${escapeHtml(data.customerName)}, registramos tu pedido <strong>#${escapeHtml(data.orderId.slice(0, 8).toUpperCase())}</strong>.</p>
    <div style="margin:22px 0;padding:16px;border-radius:12px;background:${automatic ? "#ecfdf5" : "#fff7ed"};border:1px solid ${automatic ? "#a7f3d0" : "#fed7aa"};color:${automatic ? "#065f46" : "#9a3412"}">
      <strong>${automatic ? "Cobro verificado" : "Pago pendiente"}:</strong>
      ${automatic ? ` ${escapeHtml(provider)} confirmó la transacción.` : ` completa o confirma el pago mediante ${escapeHtml(provider)}.`}
    </div>
    <table class="items" style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f1f5f9"><th style="padding:10px 8px;text-align:left">Producto</th><th style="padding:10px 8px;text-align:center">Cant.</th><th style="padding:10px 8px;text-align:right">Importe</th></tr></thead>
      <tbody>${items}</tbody>
      <tfoot><tr><td colspan="2" style="padding:16px 8px;font-weight:800">Total</td><td style="padding:16px 8px;text-align:right;font-size:18px;font-weight:800">${formatCurrency(data.orderTotal)}</td></tr></tfoot>
    </table>
    ${address}${action}`);
}

function statusChangedEmail(data: OrderEmailRequest) {
  const label = statusLabels[data.newStatus || ""] || data.newStatus || "Actualizado";
  const message = statusMessages[data.newStatus || ""]
    || `El estado cambió de ${statusLabels[data.oldStatus || ""] || data.oldStatus || "anterior"} a ${label}.`;
  const action = data.orderUrl
    ? `<div style="margin-top:24px;text-align:center"><a class="button" href="${escapeHtml(data.orderUrl)}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#0284c7;color:#fff;text-decoration:none;font-weight:700">Ver estado del pedido</a></div>`
    : "";
  return emailShell(`
    <h1 style="margin:0;font-size:24px">Actualización de pedido</h1>
    <p style="margin:10px 0 0;color:#475569;line-height:1.6">Hola ${escapeHtml(data.customerName)}, hay novedades en el pedido <strong>#${escapeHtml(data.orderId.slice(0, 8).toUpperCase())}</strong>.</p>
    <div style="margin:24px 0;text-align:center"><span style="display:inline-block;padding:12px 22px;border-radius:999px;background:#0f172a;color:#fff;font-weight:800">${escapeHtml(label)}</span></div>
    <p style="text-align:center;color:#475569;line-height:1.6">${escapeHtml(message)}</p>
    <p style="text-align:center;color:#64748b">Total: <strong>${formatCurrency(data.orderTotal)}</strong></p>
    ${action}`);
}

async function authorizeRequest(req: Request, orderId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !serviceRole) throw new Error("Supabase email authorization is not configured");

  if (authorization === `Bearer ${serviceRole}`) return;

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: order } = await admin.from("orders").select("user_id").eq("id", orderId).maybeSingle();
  if (order?.user_id === user.id) return;

  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  if ((roles ?? []).some((row) => ["admin", "manager", "support"].includes(row.role))) return;
  throw new Error("Forbidden");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const data = await req.json() as OrderEmailRequest;
    if (!data.orderId || !data.customerEmail || !data.customerEmail.includes("@")) {
      return jsonResponse({ error: "Invalid email request" }, 400);
    }
    if (data.type !== "order_created" && data.type !== "status_changed") {
      return jsonResponse({ error: "Invalid email type" }, 400);
    }

    await authorizeRequest(req, data.orderId);
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(apiKey);
    const statusLabel = statusLabels[data.newStatus || ""] || data.newStatus;
    const subject = data.type === "order_created"
      ? `Pedido #${data.orderId.slice(0, 8).toUpperCase()} - ${isAutomaticPayment(data.paymentMethod) ? "Pago confirmado" : "Confirmación"}`
      : `Pedido #${data.orderId.slice(0, 8).toUpperCase()} - ${statusLabel}`;
    const html = data.type === "order_created" ? orderCreatedEmail(data) : statusChangedEmail(data);
    const from = Deno.env.get("ORDER_EMAIL_FROM")?.trim() || "Bárbaro Nutrition <onboarding@resend.dev>";

    const emailResponse = await resend.emails.send({
      from,
      to: [data.customerEmail],
      subject,
      html,
    });

    console.log("Order email sent", { type: data.type, orderId: data.orderId });
    return jsonResponse({ success: true, data: emailResponse });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("send-order-email error", message);
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ success: false, error: message }, status);
  }
});
