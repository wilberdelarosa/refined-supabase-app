import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "";
const SITE_URL = "https://barbaro-nutrition.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  type:
    | "order_created"
    | "status_changed"
    | "payment_proof_uploaded"
    | "payment_verified"
    | "payment_rejected"
    | "invoice_created"
    | "admin_new_order";
  customerEmail?: string;
  customerName?: string;
  adminEmail?: string;
  orderId: string;
  orderTotal: number;
  orderItems?: Array<{ name: string; quantity: number; price: number }>;
  newStatus?: string;
  oldStatus?: string;
  shippingAddress?: string;
  orderUrl?: string;
  invoiceNumber?: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  payment_pending: "Verificando Pago",
  paid: "Pagado",
  processing: "Procesando",
  packed: "Empacado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

// ── Shared HTML helpers ──────────────────────────────────────────────

const header = `
<div style="background-color:#000;color:#fff;padding:30px;text-align:center;">
  <h1 style="margin:0;font-size:24px;font-weight:bold;">Barbaro Nutrition</h1>
</div>`;

const footer = `
<div style="background-color:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0;color:#666;font-size:14px;">¿Tienes preguntas? Contáctanos</p>
  <p style="margin:10px 0 0;color:#999;font-size:12px;">© ${new Date().getFullYear()} Barbaro Nutrition. Todos los derechos reservados.</p>
</div>`;

const wrap = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
<div style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
${header}
<div style="padding:30px;">${body}</div>
${footer}
</div></div></body></html>`;

const btn = (url: string, label: string) =>
  `<div style="text-align:center;margin-top:25px;">
    <a href="${url}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">${label}</a>
  </div>`;

const fmtDOP = (n: number) => `DOP ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

// ── Email generators ─────────────────────────────────────────────────

function itemsTable(items: OrderEmailRequest["orderItems"], total: number) {
  if (!items?.length) return "";
  const rows = items.map(i => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">${i.name}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${fmtDOP(i.price * i.quantity)}</td>
    </tr>`).join("");
  return `
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <thead><tr style="background:#f0f0f0;">
      <th style="padding:12px;text-align:left;font-weight:600;">Producto</th>
      <th style="padding:12px;text-align:center;font-weight:600;">Cant.</th>
      <th style="padding:12px;text-align:right;font-weight:600;">Precio</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="2" style="padding:15px 12px;font-weight:bold;font-size:16px;">Total</td>
      <td style="padding:15px 12px;text-align:right;font-weight:bold;font-size:16px;">${fmtDOP(total)}</td>
    </tr></tfoot>
  </table>`;
}

function orderCreatedEmail(d: OrderEmailRequest) {
  const orderUrl = `${SITE_URL}/order/${d.orderId}`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">¡Gracias por tu pedido, ${d.customerName}!</h2>
    <p style="color:#666;margin:0 0 20px;">Hemos recibido tu pedido correctamente.</p>
    <div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#333;"><strong>Pedido:</strong> #${d.orderId.slice(0, 8).toUpperCase()}</p>
    </div>
    ${itemsTable(d.orderItems, d.orderTotal)}
    ${d.shippingAddress ? `<div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:20px;">
      <h3 style="margin:0 0 10px;font-size:14px;color:#333;">Dirección de Envío</h3>
      <p style="margin:0;color:#666;white-space:pre-line;font-size:14px;">${d.shippingAddress}</p>
    </div>` : ""}
    <div style="background:#fef3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;">
      <p style="margin:0;color:#856404;font-size:14px;">
        <strong>Importante:</strong> Si realizaste el pago por transferencia, tu pedido será procesado una vez verifiquemos el pago.
      </p>
    </div>
    ${btn(orderUrl, "Ver pedido y subir comprobante")}
  `);
}

function adminNewOrderEmail(d: OrderEmailRequest) {
  const adminUrl = `${SITE_URL}/admin/orders`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">🛒 Nuevo Pedido Recibido</h2>
    <p style="color:#666;margin:0 0 20px;">Se ha creado un nuevo pedido en la tienda.</p>
    <div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#333;"><strong>Pedido:</strong> #${d.orderId.slice(0, 8).toUpperCase()}</p>
      <p style="margin:5px 0 0;color:#333;"><strong>Cliente:</strong> ${d.customerName || "N/A"}</p>
      <p style="margin:5px 0 0;color:#333;"><strong>Total:</strong> ${fmtDOP(d.orderTotal)}</p>
    </div>
    ${itemsTable(d.orderItems, d.orderTotal)}
    ${btn(adminUrl, "Ir al Panel de Pedidos")}
  `);
}

function paymentProofUploadedEmail(d: OrderEmailRequest) {
  const adminUrl = `${SITE_URL}/admin/orders`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">📎 Comprobante de Pago Recibido</h2>
    <p style="color:#666;margin:0 0 20px;">Un cliente ha subido un comprobante de pago para su pedido.</p>
    <div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#333;"><strong>Pedido:</strong> #${d.orderId.slice(0, 8).toUpperCase()}</p>
      <p style="margin:5px 0 0;color:#333;"><strong>Cliente:</strong> ${d.customerName || "N/A"}</p>
      <p style="margin:5px 0 0;color:#333;"><strong>Total:</strong> ${fmtDOP(d.orderTotal)}</p>
    </div>
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;">
      <p style="margin:0;color:#856404;font-size:14px;"><strong>Acción requerida:</strong> Por favor revisa y verifica el comprobante de pago.</p>
    </div>
    ${btn(adminUrl, "Verificar Comprobante")}
  `);
}

function paymentVerifiedEmail(d: OrderEmailRequest) {
  const orderUrl = `${SITE_URL}/order/${d.orderId}`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">✅ ¡Pago Verificado!</h2>
    <p style="color:#666;margin:0 0 20px;">Hola ${d.customerName}, tu pago ha sido confirmado exitosamente.</p>
    <div style="background:#d4edda;border:1px solid #28a745;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#155724;font-size:14px;">Tu pedido <strong>#${d.orderId.slice(0, 8).toUpperCase()}</strong> por <strong>${fmtDOP(d.orderTotal)}</strong> está siendo preparado.</p>
    </div>
    <p style="color:#666;font-size:14px;">Te notificaremos cuando tu pedido sea enviado.</p>
    ${btn(orderUrl, "Ver Estado del Pedido")}
  `);
}

function paymentRejectedEmail(d: OrderEmailRequest) {
  const orderUrl = `${SITE_URL}/order/${d.orderId}`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">❌ Pago No Verificado</h2>
    <p style="color:#666;margin:0 0 20px;">Hola ${d.customerName}, lamentamos informarte que no pudimos verificar tu pago.</p>
    <div style="background:#f8d7da;border:1px solid #dc3545;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#721c24;font-size:14px;">El comprobante de tu pedido <strong>#${d.orderId.slice(0, 8).toUpperCase()}</strong> no pudo ser validado. Por favor sube un nuevo comprobante.</p>
    </div>
    ${btn(orderUrl, "Subir Nuevo Comprobante")}
  `);
}

function invoiceCreatedEmail(d: OrderEmailRequest) {
  const orderUrl = `${SITE_URL}/order/${d.orderId}`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">🧾 Factura Generada</h2>
    <p style="color:#666;margin:0 0 20px;">Hola ${d.customerName}, tu factura ha sido generada exitosamente.</p>
    <div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#333;"><strong>Factura:</strong> ${d.invoiceNumber || "N/A"}</p>
      <p style="margin:5px 0 0;color:#333;"><strong>Total:</strong> ${fmtDOP(d.orderTotal)}</p>
    </div>
    ${btn(orderUrl, "Ver Factura")}
  `);
}

function statusChangeEmail(d: OrderEmailRequest) {
  const newLabel = statusLabels[d.newStatus || ""] || d.newStatus;
  let msg = `El estado de tu pedido ha cambiado a ${newLabel}.`;
  let color = "#333";

  switch (d.newStatus) {
    case "payment_pending": msg = "Hemos recibido tu comprobante. Lo estamos verificando."; color = "#fd7e14"; break;
    case "paid": msg = "Hemos confirmado tu pago. Tu pedido está siendo preparado."; color = "#28a745"; break;
    case "processing": msg = "Tu pedido está siendo preparado por nuestro equipo."; color = "#17a2b8"; break;
    case "packed": msg = "Tu pedido ha sido empacado y está listo para envío."; color = "#6c757d"; break;
    case "shipped": msg = "¡Tu pedido está en camino! Pronto lo recibirás."; color = "#007bff"; break;
    case "delivered": msg = "¡Tu pedido ha sido entregado! Disfruta tus productos."; color = "#28a745"; break;
    case "cancelled": msg = "Tu pedido ha sido cancelado."; color = "#dc3545"; break;
    case "refunded": msg = "Tu pedido ha sido reembolsado."; color = "#dc3545"; break;
  }

  const orderUrl = `${SITE_URL}/order/${d.orderId}`;
  return wrap(`
    <h2 style="margin:0 0 10px;font-size:20px;color:#333;">Actualización de tu Pedido</h2>
    <p style="color:#666;margin:0 0 20px;">Hola ${d.customerName}, hay novedades sobre tu pedido:</p>
    <div style="background:#f8f8f8;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#333;"><strong>Pedido:</strong> #${d.orderId.slice(0, 8).toUpperCase()}</p>
    </div>
    <div style="text-align:center;padding:30px 0;">
      <div style="display:inline-block;background:${color};color:#fff;padding:15px 30px;border-radius:50px;font-size:18px;font-weight:bold;">${newLabel}</div>
    </div>
    <p style="text-align:center;color:#666;font-size:16px;margin:0 0 20px;">${msg}</p>
    <p style="text-align:center;color:#999;font-size:14px;">Total: <strong>${fmtDOP(d.orderTotal)}</strong></p>
    ${btn(orderUrl, "Ver Pedido")}
  `);
}

// ── Main Handler ─────────────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();
    console.log("Sending order email:", { type: data.type, orderId: data.orderId });

    let subject = "";
    let html = "";
    let to = data.customerEmail || "";

    const shortId = data.orderId.slice(0, 8).toUpperCase();

    switch (data.type) {
      case "order_created":
        subject = `Pedido #${shortId} - Confirmación de Compra`;
        html = orderCreatedEmail(data);
        break;
      case "admin_new_order":
        subject = `🛒 Nuevo Pedido #${shortId} - ${data.customerName}`;
        html = adminNewOrderEmail(data);
        to = data.adminEmail || ADMIN_EMAIL;
        break;
      case "payment_proof_uploaded":
        subject = `📎 Comprobante Recibido - Pedido #${shortId}`;
        html = paymentProofUploadedEmail(data);
        to = data.adminEmail || ADMIN_EMAIL;
        break;
      case "payment_verified":
        subject = `✅ Pago Verificado - Pedido #${shortId}`;
        html = paymentVerifiedEmail(data);
        break;
      case "payment_rejected":
        subject = `❌ Pago Rechazado - Pedido #${shortId}`;
        html = paymentRejectedEmail(data);
        break;
      case "invoice_created":
        subject = `🧾 Factura ${data.invoiceNumber || ""} - Pedido #${shortId}`;
        html = invoiceCreatedEmail(data);
        break;
      case "status_changed":
        subject = `Pedido #${shortId} - ${statusLabels[data.newStatus || ""] || data.newStatus}`;
        html = statusChangeEmail(data);
        break;
      default:
        throw new Error("Invalid email type: " + data.type);
    }

    if (!to) {
      console.warn("No recipient email. Skipping.");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailResponse = await resend.emails.send({
      from: "Barbaro Nutrition <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("Error in send-order-email:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
