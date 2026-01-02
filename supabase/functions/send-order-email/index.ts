import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  type: "order_created" | "status_changed";
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderTotal: number;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  newStatus?: string;
  oldStatus?: string;
  shippingAddress?: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  packed: "Empacado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

function generateOrderCreatedEmail(data: OrderEmailRequest): string {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">DOP ${(item.price * item.quantity).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #000; color: #fff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Barbaro Nutrition</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #333;">¡Gracias por tu pedido, ${data.customerName}!</h2>
            <p style="color: #666; margin: 0 0 20px 0;">Hemos recibido tu pedido correctamente. Aquí están los detalles:</p>
            
            <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #333;"><strong>Número de Pedido:</strong> #${data.orderId.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <!-- Order Items -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Producto</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Cantidad</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px 12px; font-weight: bold; font-size: 16px;">Total</td>
                  <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 16px;">DOP ${data.orderTotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
            
            ${
              data.shippingAddress
                ? `
            <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Dirección de Envío</h3>
              <p style="margin: 0; color: #666; white-space: pre-line; font-size: 14px;">${data.shippingAddress}</p>
            </div>
            `
                : ""
            }
            
            <div style="background-color: #fef3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Importante:</strong> Si realizaste el pago por transferencia, tu pedido será procesado una vez verifiquemos el pago.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #666; font-size: 14px;">¿Tienes preguntas? Contáctanos</p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Barbaro Nutrition. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateStatusChangeEmail(data: OrderEmailRequest): string {
  const newStatusLabel = statusLabels[data.newStatus || ""] || data.newStatus;
  const oldStatusLabel = statusLabels[data.oldStatus || ""] || data.oldStatus;

  let statusMessage = "";
  let statusColor = "#333";

  switch (data.newStatus) {
    case "paid":
      statusMessage = "Hemos confirmado tu pago. Tu pedido está siendo preparado.";
      statusColor = "#28a745";
      break;
    case "processing":
      statusMessage = "Tu pedido está siendo preparado por nuestro equipo.";
      statusColor = "#17a2b8";
      break;
    case "packed":
      statusMessage = "Tu pedido ha sido empacado y está listo para envío.";
      statusColor = "#6c757d";
      break;
    case "shipped":
      statusMessage = "¡Tu pedido está en camino! Pronto lo recibirás.";
      statusColor = "#007bff";
      break;
    case "delivered":
      statusMessage = "¡Tu pedido ha sido entregado! Esperamos que disfrutes tus productos.";
      statusColor = "#28a745";
      break;
    case "cancelled":
      statusMessage = "Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.";
      statusColor = "#dc3545";
      break;
    case "refunded":
      statusMessage = "Tu pedido ha sido reembolsado. El monto será devuelto a tu cuenta.";
      statusColor = "#dc3545";
      break;
    default:
      statusMessage = `El estado de tu pedido ha cambiado de ${oldStatusLabel} a ${newStatusLabel}.`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #000; color: #fff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Barbaro Nutrition</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #333;">Actualización de tu Pedido</h2>
            <p style="color: #666; margin: 0 0 20px 0;">Hola ${data.customerName}, hay novedades sobre tu pedido:</p>
            
            <div style="background-color: #f8f8f8; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #333;"><strong>Pedido:</strong> #${data.orderId.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <!-- Status Badge -->
            <div style="text-align: center; padding: 30px 0;">
              <div style="display: inline-block; background-color: ${statusColor}; color: #fff; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: bold;">
                ${newStatusLabel}
              </div>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 16px; margin: 0 0 20px 0;">
              ${statusMessage}
            </p>
            
            <div style="text-align: center; padding: 20px 0;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                Total del pedido: <strong>DOP ${data.orderTotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #666; font-size: 14px;">¿Tienes preguntas? Contáctanos</p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Barbaro Nutrition. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();
    
    console.log("Sending order email:", { type: data.type, orderId: data.orderId, to: data.customerEmail });

    let subject = "";
    let html = "";

    if (data.type === "order_created") {
      subject = `Pedido #${data.orderId.slice(0, 8).toUpperCase()} - Confirmación de Compra`;
      html = generateOrderCreatedEmail(data);
    } else if (data.type === "status_changed") {
      const statusLabel = statusLabels[data.newStatus || ""] || data.newStatus;
      subject = `Pedido #${data.orderId.slice(0, 8).toUpperCase()} - ${statusLabel}`;
      html = generateStatusChangeEmail(data);
    } else {
      throw new Error("Invalid email type");
    }

    const emailResponse = await resend.emails.send({
      from: "Barbaro Nutrition <onboarding@resend.dev>",
      to: [data.customerEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
