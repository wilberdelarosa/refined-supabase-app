import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Eres un asesor experto de nutrición deportiva en República Dominicana. Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto extra. Formato exacto:

{
  "momento": "1-2 oraciones sobre el mejor momento del día para tomar el producto",
  "combinar": "1-2 oraciones sobre con qué otros suplementos o alimentos combinarlo",
  "perfil": "1-2 oraciones sobre el perfil ideal del usuario (objetivos, entrenamiento, nivel)"
}

Cada campo debe ser un string en español, claro, profesional y sin emojis.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const productName = typeof body?.productName === "string" ? body.productName.trim() : "";
    const productCategory = typeof body?.productCategory === "string" ? body.productCategory.trim() : "";

    if (!productName || productName.length > 200 || !productCategory || productCategory.length > 100) {
      return json({ error: "Parámetros inválidos" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI no configurada" }, 500);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Producto: "${productName}". Categoría: "${productCategory}". Responde solo con el JSON.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return json({ error: "Estamos recibiendo muchas solicitudes. Intenta en unos segundos." }, 429);
      }
      if (response.status === 402) {
        return json({ error: "Sin créditos de IA disponibles. Contacta al administrador." }, 402);
      }
      const errText = await response.text();
      console.error("Gateway error:", response.status, errText);
      return json({ error: "Error del servicio de IA" }, 502);
    }

    const data = await response.json();
    const rawContent = (data.choices?.[0]?.message?.content || "").trim();

    let sections: { momento?: string; combinar?: string; perfil?: string } | null = null;
    try {
      const cleaned = rawContent.replace(/```json?\s*|\s*```/g, "");
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object") {
        sections = {
          momento: typeof parsed.momento === "string" ? parsed.momento : undefined,
          combinar: typeof parsed.combinar === "string" ? parsed.combinar : undefined,
          perfil: typeof parsed.perfil === "string" ? parsed.perfil : undefined,
        };
      }
    } catch {
      // fall through to plain text
    }

    if (sections && (sections.momento || sections.combinar || sections.perfil)) {
      return json({ recommendation: rawContent, sections });
    }
    return json({ recommendation: rawContent || "No se pudo generar una recomendación." });
  } catch (error) {
    console.error("ai-recommendation error:", error);
    return json({ error: error instanceof Error ? error.message : "Error interno" }, 500);
  }
});
