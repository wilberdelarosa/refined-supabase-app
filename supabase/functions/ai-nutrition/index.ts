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
    const { productName, productCategory, productDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Nutrition lookup for: ${productName} (${productCategory})`);
    console.log(`Description: ${productDescription || 'None provided'}`);

    const systemPrompt = `Eres un experto en nutrición deportiva y suplementos con conocimiento profundo de marcas como Optimum Nutrition, MuscleTech, MusclePharm, BSN, Dymatize, MyProtein, Universal Nutrition, y otras marcas populares.

Tu tarea es proporcionar información nutricional PRECISA y ESPECÍFICA para el suplemento indicado, basándote en:
1. El nombre exacto del producto
2. La marca (si se menciona)
3. La descripción del producto
4. La categoría

BUSCA en tu conocimiento la información real del producto. Si conoces la marca y el producto específico, proporciona los valores reales. Si no, proporciona valores típicos realistas para ese tipo de producto.

Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "serving_size": "tamaño de porción exacto (ej: '30g (1 scoop)', '2 cápsulas', '5g')",
  "servings_per_container": número entero basado en el tamaño típico del producto,
  "nutrition_facts": {
    "calories": "valor en kcal (solo número)",
    "protein": "valor en g (solo número)",
    "carbohydrates": "valor en g (solo número)",
    "fat": "valor en g (solo número)",
    "fiber": "valor en g si aplica (solo número)",
    "sodium": "valor en mg si aplica (solo número)",
    "sugar": "valor en g si aplica (solo número)",
    "saturated_fat": "valor en g si aplica (solo número)",
    "cholesterol": "valor en mg si aplica (solo número)",
    "other": [
      {"name": "nombre del nutriente adicional", "value": "valor con unidad"}
    ]
  },
  "ingredients": "lista completa de ingredientes principales del producto real, separados por coma",
  "allergens": ["array", "de", "alérgenos", "específicos", "del", "producto"],
  "suggestions": "modo de uso recomendado específico para este producto",
  "brand_info": "información breve sobre la marca o producto si es conocido"
}

IMPORTANTE:
- Para PROTEÍNAS: típicamente 20-30g proteína por porción, bajo en carbohidratos
- Para CREATINA: 3-5g por porción, sin calorías significativas
- Para PRE-WORKOUT: cafeína, beta-alanina, citrulina son comunes
- Para BCAA/EAA: aminoácidos esenciales, bajo en calorías
- Para VITAMINAS: lista las vitaminas y minerales específicos
- Para GAINERS: alto en calorías y carbohidratos

NO incluyas texto adicional, solo el JSON.`;

    const userPrompt = `Busca y proporciona la información nutricional ESPECÍFICA para este suplemento deportivo:

Producto: ${productName}
Categoría: ${productCategory || 'Suplemento deportivo'}
${productDescription ? `Descripción: ${productDescription}` : ''}

Si conoces este producto específico, proporciona sus valores reales. Si no, proporciona valores típicos precisos para este tipo de suplemento.

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
      
      // Ensure nutrition_facts values are strings
      if (nutritionData.nutrition_facts) {
        for (const key of Object.keys(nutritionData.nutrition_facts)) {
          if (key !== 'other' && nutritionData.nutrition_facts[key] !== undefined) {
            nutritionData.nutrition_facts[key] = String(nutritionData.nutrition_facts[key]);
          }
        }
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw:", aiResponse);
      // Return a default structure if parsing fails
      nutritionData = {
        serving_size: "1 porción",
        servings_per_container: 30,
        nutrition_facts: {
          calories: "120",
          protein: "24",
          carbohydrates: "3",
          fat: "1",
          sodium: "50"
        },
        ingredients: "Proteína de suero de leche, saborizantes naturales",
        allergens: ["Lácteos"],
        suggestions: "Tomar después del entrenamiento mezclado con agua o leche"
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
