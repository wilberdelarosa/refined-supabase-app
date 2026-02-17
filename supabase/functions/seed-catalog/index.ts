import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATALOG = [
  // PROTEINAS
  { name: "ALLMAX ISOFLEX 5 LB", category: "Proteínas", brand: "Allmax", weight_size: "5 LB", price: 4500 },
  { name: "ANS PERFORMANCE N-WHEY 5 LB", category: "Proteínas", brand: "ANS Performance", weight_size: "5 LB", price: 3800 },
  { name: "BODY FORTRESS 100% PREMIUM PROTEIN 1.78 LB", category: "Proteínas", brand: "Body Fortress", weight_size: "1.78 LB", price: 1800 },
  { name: "DYMATIZE ISO 100 HYDROLYZED 1.6 LB", category: "Proteínas", brand: "Dymatize", weight_size: "1.6 LB", price: 3200 },
  { name: "DYMATIZE ISO 100 HYDROLYZED 6 LB", category: "Proteínas", brand: "Dymatize", weight_size: "6 LB", price: 7500 },
  { name: "GOLIATH 100% WHEY PROTEIN 5 LB", category: "Proteínas", brand: "Goliath", weight_size: "5 LB", price: 3500 },
  { name: "ISOPURE INFUSIONS 14.1 OZ", category: "Proteínas", brand: "Isopure", weight_size: "14.1 OZ", price: 2800 },
  { name: "ISOPURE ZERO CARB PROTEIN 3 LB", category: "Proteínas", brand: "Isopure", weight_size: "3 LB", price: 4200 },
  { name: "ISOPURE ZERO CARB PROTEIN 4.5 LB", category: "Proteínas", brand: "Isopure", weight_size: "4.5 LB", price: 5500 },
  { name: "MUSCLE TECH 100% GRASS FED WHEY PROTEIN 1.80 LB", category: "Proteínas", brand: "MuscleTech", weight_size: "1.80 LB", price: 2500 },
  { name: "MUSCLE TECH NITRO TECH 100% WHEY GOLD 2 LB", category: "Proteínas", brand: "MuscleTech", weight_size: "2 LB", price: 3000 },
  { name: "MUSCLE TECH NITRO TECH 100% WHEY GOLD 5 LB", category: "Proteínas", brand: "MuscleTech", weight_size: "5 LB", price: 5800 },
  { name: "MUSCLE TECH NITRO TECH CLASSIC WHEY PROTEIN 4 LB", category: "Proteínas", brand: "MuscleTech", weight_size: "4 LB", price: 4200 },
  { name: "MUSCLE TECH PLATINUM WHEY + MUSCLE BUILDER 1.80 LB", category: "Proteínas", brand: "MuscleTech", weight_size: "1.80 LB", price: 2800 },
  { name: "NUTREX 100% WHEY 5 LB", category: "Proteínas", brand: "Nutrex", weight_size: "5 LB", price: 3800 },
  { name: "ON GOLD STANDARD 100% WHEY 1.47 LB", category: "Proteínas", brand: "Optimum Nutrition", weight_size: "1.47 LB", price: 2200 },
  { name: "ON GOLD STANDARD 100% WHEY 5 LB", category: "Proteínas", brand: "Optimum Nutrition", weight_size: "5 LB", price: 5500 },
  { name: "ON GOLD STANDARD 100% WHEY 5.47 LB", category: "Proteínas", brand: "Optimum Nutrition", weight_size: "5.47 LB", price: 5800 },
  { name: "PATRIOT NUTRITION ISO WHEY 1.38 LB", category: "Proteínas", brand: "Patriot Nutrition", weight_size: "1.38 LB", price: 1500 },
  { name: "PATRIOT NUTRITION SKIRLA WHEY CONCENTRATE 2 LB", category: "Proteínas", brand: "Patriot Nutrition", weight_size: "2 LB", price: 1800 },
  { name: "RONNIE COLEMAN KING MASS 3 LB", category: "Proteínas", brand: "Ronnie Coleman", weight_size: "3 LB", price: 2500 },

  // MASS GAINERS
  { name: "ANS PERFORMANCE N-MASS 15 LB", category: "Mass Gainers", brand: "ANS Performance", weight_size: "15 LB", price: 5500 },
  { name: "ANS PERFORMANCE N-MASS 6 LB", category: "Mass Gainers", brand: "ANS Performance", weight_size: "6 LB", price: 3200 },
  { name: "DYMATIZE SUPER MASS GAINER 12 LB", category: "Mass Gainers", brand: "Dymatize", weight_size: "12 LB", price: 5800 },
  { name: "DYMATIZE SUPER MASS GAINER 6 LB", category: "Mass Gainers", brand: "Dymatize", weight_size: "6 LB", price: 3500 },
  { name: "GASPARI REAL MASS 12 LB", category: "Mass Gainers", brand: "Gaspari", weight_size: "12 LB", price: 5200 },
  { name: "MUSCLE TECH MASS TECH EXTREME 2000 12 LB", category: "Mass Gainers", brand: "MuscleTech", weight_size: "12 LB", price: 5800 },
  { name: "MUSCLE TECH MASS TECH EXTREME 6 LB", category: "Mass Gainers", brand: "MuscleTech", weight_size: "6 LB", price: 3500 },
  { name: "MUSCLEMEDS CARNIVOR MASS 6 LB", category: "Mass Gainers", brand: "MuscleMeds", weight_size: "6 LB", price: 3800 },
  { name: "MUTANT MASS EXTREME 2500 12 LB", category: "Mass Gainers", brand: "Mutant", weight_size: "12 LB", price: 5500 },
  { name: "ON SERIOUS MASS 12 LB", category: "Mass Gainers", brand: "Optimum Nutrition", weight_size: "12 LB", price: 5800 },
  { name: "ON SERIOUS MASS 6 LB", category: "Mass Gainers", brand: "Optimum Nutrition", weight_size: "6 LB", price: 3500 },
  { name: "PATRIOT NUTRITION ATLAS GAINER 15 LB", category: "Mass Gainers", brand: "Patriot Nutrition", weight_size: "15 LB", price: 4200 },
  { name: "SIMPLY MASS GAINER 13 LB", category: "Mass Gainers", brand: "Simply", weight_size: "13 LB", price: 3800 },

  // CREATINAS
  { name: "ALLMAX CREATINA 80 SERVICIOS", category: "Creatinas", brand: "Allmax", weight_size: "80 servicios", price: 1500 },
  { name: "BPI SPORT MICRONIZED CREATINA 120 SERVICIOS", category: "Creatinas", brand: "BPI Sports", weight_size: "120 servicios", price: 1800 },
  { name: "CELL TECH CREATINA 6 LB", category: "Creatinas", brand: "MuscleTech", weight_size: "6 LB", price: 4500 },
  { name: "MUSCLE TECH 100% CREATINA 80 SERVICIOS", category: "Creatinas", brand: "MuscleTech", weight_size: "80 servicios", price: 1500 },
  { name: "NUTREX CREATINA MONOHIDRATADA 200 SERVICIOS", category: "Creatinas", brand: "Nutrex", weight_size: "200 servicios", price: 2800 },
  { name: "NUTREX CREATINA MONOHIDRATADA 60 SERVICIOS", category: "Creatinas", brand: "Nutrex", weight_size: "60 servicios", price: 1200 },
  { name: "ON MICRONIZED CREATINE POWDER 120 SERVICIOS", category: "Creatinas", brand: "Optimum Nutrition", weight_size: "120 servicios", price: 2200 },
  { name: "PATRIOT CREATINE PUMP 3.4 LB", category: "Creatinas", brand: "Patriot Nutrition", weight_size: "3.4 LB", price: 2500 },
  { name: "SIMPLY CREATINA 100% PURE MONOHYDRATE", category: "Creatinas", brand: "Simply", weight_size: "300g", price: 1200 },

  // PRE-ENTRENOS
  { name: "ALPHA SUPPS BETA-ALANINE 100 SERVICIOS", category: "Pre-Entrenos", brand: "Alpha Supps", weight_size: "100 servicios", price: 1500 },
  { name: "CELLUCOR C4 SPORT RIPPED 20 SERVICIOS", category: "Pre-Entrenos", brand: "Cellucor", weight_size: "20 servicios", price: 1800 },
  { name: "PATRIOT NUTRITION SUICIDE TEST PRE WORKOUT 50 SERVICIOS", category: "Pre-Entrenos", brand: "Patriot Nutrition", weight_size: "50 servicios", price: 2200 },
  { name: "ON GOLD STANDARD PRE-WORKOUT 30 SERVICIOS", category: "Pre-Entrenos", brand: "Optimum Nutrition", weight_size: "30 servicios", price: 2500 },
  { name: "PATRIOT NUTRITION MUSCLE PUMP 50 MG 120 CÁPSULAS", category: "Pre-Entrenos", brand: "Patriot Nutrition", weight_size: "120 cápsulas", price: 1200 },
  { name: "PATRIOT NUTRITION TESTO PUMP 90 CÁPSULAS", category: "Pre-Entrenos", brand: "Patriot Nutrition", weight_size: "90 cápsulas", price: 1500 },
  { name: "MHP ANADROX PUMP & BURN 112 CÁPSULAS", category: "Pre-Entrenos", brand: "MHP", weight_size: "112 cápsulas", price: 2200 },

  // VITAMINAS Y MINERALES
  { name: "BALKAN PHARMACEUTICALS OMEGA-3", category: "Vitaminas", brand: "Balkan Pharmaceuticals", weight_size: "90 cápsulas", price: 800 },
  { name: "COUNTRY LIFE ZINC PICOLINATE 25MG", category: "Vitaminas", brand: "Country Life", weight_size: "100 tabletas", price: 1200 },
  { name: "EARTHS CREATION VITAMIN D3 5000 IU", category: "Vitaminas", brand: "Earth's Creation", weight_size: "100 softgels", price: 800 },
  { name: "EARTHS CREATION CALCIUM MAGNESIUM ZINC + D3", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 tabletas", price: 900 },
  { name: "EARTHS CREATION BIOTIN 10,000 MCG", category: "Vitaminas", brand: "Earth's Creation", weight_size: "100 cápsulas", price: 700 },
  { name: "EARTHS CREATION MULTIVITAMIN FOR MEN", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 tabletas", price: 1000 },
  { name: "EARTHS CREATION MULTIVITAMIN FOR WOMEN", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 tabletas", price: 1000 },
  { name: "EARTHS CREATION VITAMIN C 1000MG", category: "Vitaminas", brand: "Earth's Creation", weight_size: "100 tabletas", price: 700 },
  { name: "NATURAVIT MAGNESIO + ZINC + B6", category: "Vitaminas", brand: "Naturavit", weight_size: "60 cápsulas", price: 800 },
  { name: "NOW FOODS VITAMIN B-12 1000MCG", category: "Vitaminas", brand: "NOW Foods", weight_size: "100 tabletas", price: 1000 },
  { name: "NOW FOODS IRON 18MG", category: "Vitaminas", brand: "NOW Foods", weight_size: "120 cápsulas", price: 900 },
  { name: "PATRIOT NUTRITION MULTIVITAMIN SPORT", category: "Vitaminas", brand: "Patriot Nutrition", weight_size: "90 tabletas", price: 1200 },
  { name: "PATRIOT NUTRITION ZMA 90 CÁPSULAS", category: "Vitaminas", brand: "Patriot Nutrition", weight_size: "90 cápsulas", price: 1000 },
  { name: "SWANSON MELATONIN 3MG", category: "Vitaminas", brand: "Swanson", weight_size: "120 cápsulas", price: 600 },
  { name: "SWANSON ASHWAGANDHA 450MG", category: "Vitaminas", brand: "Swanson", weight_size: "100 cápsulas", price: 900 },
  { name: "SWANSON COQ-10 100MG", category: "Vitaminas", brand: "Swanson", weight_size: "100 softgels", price: 1500 },
  { name: "EARTHS CREATION KIDS MULTIVITAMIN GUMMIES", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 gummies", price: 800 },
  { name: "EARTHS CREATION KIDS VITAMIN C GUMMIES", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 gummies", price: 700 },
  { name: "EARTHS CREATION KIDS OMEGA-3 GUMMIES", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 gummies", price: 800 },
  { name: "EARTHS CREATION KIDS CALCIUM + D3 GUMMIES", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 gummies", price: 750 },
  { name: "NOW FOODS OMEGA-3 1000MG", category: "Vitaminas", brand: "NOW Foods", weight_size: "200 softgels", price: 1800 },
  { name: "NATURAVIT COLÁGENO HIDROLIZADO + BIOTINA", category: "Vitaminas", brand: "Naturavit", weight_size: "60 cápsulas", price: 1000 },
  { name: "EARTHS CREATION APPLE CIDER VINEGAR GUMMIES", category: "Vitaminas", brand: "Earth's Creation", weight_size: "60 gummies", price: 700 },
  { name: "SWANSON TURMERIC & BLACK PEPPER", category: "Vitaminas", brand: "Swanson", weight_size: "60 cápsulas", price: 800 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'clear') {
      // Clear related tables first due to FK constraints
      await supabase.from('product_nutrition').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      return new Response(JSON.stringify({ success: true, message: 'All products cleared' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'seed') {
      // Clear first
      await supabase.from('product_nutrition').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      console.log('Cleared existing products. Inserting catalog...');

      // Insert products in batches of 10
      const results = [];
      for (let i = 0; i < CATALOG.length; i += 10) {
        const batch = CATALOG.slice(i, i + 10).map((p, idx) => ({
          name: p.name,
          category: p.category,
          brand: p.brand,
          weight_size: p.weight_size,
          price: p.price,
          stock: 0,
          featured: idx === 0 && i === 0, // first product featured
          description: `${p.brand} - ${p.name}. Suplemento deportivo premium.`,
          sku: `BN-${p.category.substring(0, 3).toUpperCase()}-${(i + idx + 1).toString().padStart(3, '0')}`,
        }));

        const { data, error } = await supabase.from('products').insert(batch).select('id, name, category');
        if (error) {
          console.error('Insert batch error:', error);
          continue;
        }
        if (data) results.push(...data);
      }

      console.log(`Inserted ${results.length} products`);

      // Now generate nutrition data for each product using AI
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      let nutritionCount = 0;

      if (LOVABLE_API_KEY) {
        // Process in batches of 5 to avoid rate limits
        for (let i = 0; i < results.length; i += 5) {
          const batch = results.slice(i, i + 5);
          const promises = batch.map(async (product) => {
            try {
              const catalogItem = CATALOG.find(c => c.name === product.name);
              const prompt = `Proporciona información nutricional PRECISA para: ${product.name} (${catalogItem?.brand || ''}, ${catalogItem?.weight_size || ''}, categoría: ${product.category}). 
Responde SOLO JSON válido: {"serving_size":"...","servings_per_container":N,"nutrition_facts":{"calories":"N","protein":"N","carbohydrates":"N","fat":"N","fiber":"N","sodium":"N","sugar":"N","other":[{"name":"...","value":"..."}]},"ingredients":"...","allergens":["..."],"suggestions":"modo de uso"}`;

              const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: "Eres experto en nutrición deportiva. Responde SOLO JSON válido sin markdown." },
                    { role: "user", content: prompt }
                  ],
                }),
              });

              if (!aiResp.ok) {
                console.error(`AI error for ${product.name}: ${aiResp.status}`);
                return null;
              }

              const aiData = await aiResp.json();
              let content = aiData.choices?.[0]?.message?.content || '';
              content = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
              
              const nutrition = JSON.parse(content);

              const { error: nutritionError } = await supabase.from('product_nutrition').insert({
                product_id: product.id,
                serving_size: nutrition.serving_size || '1 porción',
                servings_per_container: nutrition.servings_per_container || 30,
                nutrition_facts: nutrition.nutrition_facts || {},
                ingredients: nutrition.ingredients || '',
                allergens: nutrition.allergens || [],
              });

              if (!nutritionError) {
                nutritionCount++;
                // Also update usage_instructions on the product
                if (nutrition.suggestions) {
                  await supabase.from('products').update({
                    usage_instructions: nutrition.suggestions
                  }).eq('id', product.id);
                }
              }
            } catch (e) {
              console.error(`Nutrition error for ${product.name}:`, e);
            }
          });

          await Promise.all(promises);
          // Small delay between batches to avoid rate limits
          if (i + 5 < results.length) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        products_inserted: results.length,
        nutrition_generated: nutritionCount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "seed" or "clear".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('seed-catalog error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
