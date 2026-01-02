import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productCategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Nutrition lookup for: ${productName} (${productCategory})`);

    const systemPrompt = `Eres un experto en nutrición deportiva y suplementos. 
Tu tarea es proporcionar información nutricional precisa para suplementos deportivos.
Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "serving_size": "tamaño de porción (ej: '30g', '1 scoop', '2 cápsulas')",
  "servings_per_container": número entero aproximado,
  "nutrition_facts": {
    "calories": "valor kcal",
    "protein": "valor g",
    "carbohydrates": "valor g",
    "fat": "valor g",
    "fiber": "valor g (si aplica)",
    "sodium": "valor mg (si aplica)",
    "other": [{"name": "nombre", "value": "valor"}]
  },
  "ingredients": "lista de ingredientes principales separados por coma",
  "allergens": ["array", "de", "alérgenos", "comunes"],
  "suggestions": "consejos de uso breves"
}

Si no tienes información exacta, proporciona valores típicos para ese tipo de producto.
NO incluyas texto adicional, solo el JSON.`;

    const userPrompt = `Proporciona la información nutricional típica para este suplemento:
Producto: ${productName}
Categoría: ${productCategory || 'Suplemento deportivo'}

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("AI raw response:", aiResponse);

    // Parse JSON from response (handle markdown code blocks)
    let nutritionData;
    try {
      let jsonStr = aiResponse.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      nutritionData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw:", aiResponse);
      // Return a default structure if parsing fails
      nutritionData = {
        serving_size: "1 porción",
        servings_per_container: 30,
        nutrition_facts: {
          calories: "120",
          protein: "24g",
          carbohydrates: "3g",
          fat: "1g"
        },
        ingredients: "Proteína de suero de leche, saborizantes naturales",
        allergens: ["Lácteos"],
        suggestions: "Tomar después del entrenamiento"
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: nutritionData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-nutrition function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
