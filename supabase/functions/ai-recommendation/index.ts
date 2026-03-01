import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres un asesor de nutrición deportiva. Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto adicional. El formato debe ser exactamente:

{
  "momento": "1-2 oraciones sobre el mejor momento para tomar el producto (ej: antes/después del entrenamiento, en ayunas, etc.)",
  "combinar": "1-2 oraciones sobre con qué otros suplementos o alimentos combinarlo para mejores resultados",
  "perfil": "1-2 oraciones sobre el perfil ideal del usuario (objetivos, tipo de entrenamiento, nivel)"
}

Cada campo debe ser un string en español. No incluyas llaves de más ni comillas escapadas.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productCategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Genera una recomendación para el producto "${productName}" de la categoría "${productCategory}". Responde solo con el JSON.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = (data.choices?.[0]?.message?.content || '').trim();

    // Try to parse as JSON for structured response
    let sections: { momento?: string; combinar?: string; perfil?: string } | null = null;
    try {
      const parsed = JSON.parse(rawContent.replace(/```json?\s*|\s*```/g, ''));
      if (parsed && typeof parsed === 'object') {
        sections = {
          momento: typeof parsed.momento === 'string' ? parsed.momento : undefined,
          combinar: typeof parsed.combinar === 'string' ? parsed.combinar : undefined,
          perfil: typeof parsed.perfil === 'string' ? parsed.perfil : undefined,
        };
      }
    } catch {
      // Not valid JSON - use as plain text fallback
    }

    const body = sections
      ? { recommendation: rawContent, sections }
      : { recommendation: rawContent || 'No se pudo generar una recomendación.' };

    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("ai-recommendation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
