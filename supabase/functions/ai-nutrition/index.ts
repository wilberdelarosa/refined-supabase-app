import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

// Restrict CORS to the app's own origins so anonymous websites cannot burn AI credits.
const ALLOWED_ORIGINS = new Set<string>([
  "https://barbaro-nutrition.lovable.app",
  "https://id-preview--d99ade28-307c-4ccc-aaf5-ddebe23c62ed.lovable.app",
]);

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed =
    (origin && ALLOWED_ORIGINS.has(origin)) ||
    (origin && /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)) ||
    (origin && /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin)) ||
    (origin && /^http:\/\/localhost(:\d+)?$/i.test(origin));
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin! : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const BodySchema = z.object({
  productName: z.string().trim().min(1).max(200),
  productCategory: z.string().trim().min(1).max(120).optional().nullable(),
  productDescription: z.string().trim().max(2000).optional().nullable(),
});

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // AuthN: require a valid Supabase JWT before spending AI credits.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const { productName, productCategory, productDescription } = parsed.data;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Nutrition lookup for: ${productName} (${productCategory ?? "-"})`);

    const systemPrompt = `Eres un experto en nutricion deportiva y suplementos con conocimiento profundo de marcas como Optimum Nutrition, MuscleTech, MusclePharm, BSN, Dymatize, MyProtein, Universal Nutrition, y otras marcas populares.

Tu tarea es proporcionar informacion nutricional PRECISA y ESPECIFICA para el suplemento indicado, basandote en:
1. El nombre exacto del producto
2. La marca (si se menciona)
3. La descripcion del producto
4. La categoria

BUSCA en tu conocimiento la informacion real del producto. Si conoces la marca y el producto especifico, proporciona los valores reales. Si no, proporciona valores tipicos realistas para ese tipo de producto.

Responde SIEMPRE en formato JSON valido con esta estructura exacta:
{
  "serving_size": "tamano de porcion exacto",
  "servings_per_container": numero entero basado en el tamano tipico del producto,
  "nutrition_facts": {
    "calories": "valor en kcal",
    "protein": "valor en g",
    "carbohydrates": "valor en g",
    "fat": "valor en g",
    "fiber": "valor en g si aplica",
    "sodium": "valor en mg si aplica",
    "sugar": "valor en g si aplica",
    "saturated_fat": "valor en g si aplica",
    "cholesterol": "valor en mg si aplica",
    "other": [ {"name": "nombre", "value": "valor con unidad"} ]
  },
  "ingredients": "lista completa de ingredientes principales, separados por coma",
  "allergens": ["array","de","alergenos"],
  "suggestions": "modo de uso recomendado especifico",
  "brand_info": "informacion breve sobre la marca o producto si es conocido"
}

NO incluyas texto adicional, solo el JSON.`;

    const userPrompt = `Producto: ${productName}
Categoria: ${productCategory || "Suplemento deportivo"}
${productDescription ? `Descripcion: ${productDescription}` : ""}

Responde solo con el JSON, sin explicaciones adicionales.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de solicitudes excedido, intenta mas tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Creditos de IA agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) throw new Error("No response from AI");

    let nutritionData;
    try {
      let jsonStr = String(aiResponse).trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      nutritionData = JSON.parse(jsonStr);
      if (nutritionData.nutrition_facts) {
        for (const key of Object.keys(nutritionData.nutrition_facts)) {
          if (key !== "other" && nutritionData.nutrition_facts[key] !== undefined) {
            nutritionData.nutrition_facts[key] = String(nutritionData.nutrition_facts[key]);
          }
        }
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      nutritionData = {
        serving_size: "1 porcion",
        servings_per_container: 30,
        nutrition_facts: { calories: "120", protein: "24", carbohydrates: "3", fat: "1", sodium: "50" },
        ingredients: "Proteina de suero de leche, saborizantes naturales",
        allergens: ["Lacteos"],
        suggestions: "Tomar despues del entrenamiento mezclado con agua o leche",
      };
    }

    return new Response(JSON.stringify({ success: true, data: nutritionData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-nutrition function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
