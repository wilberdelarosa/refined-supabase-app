import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 5, offset = 0 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get products without images
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, brand, category, weight_size')
      .is('image_url', null)
      .order('name')
      .range(offset, offset + batch_size - 1);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No more products without images',
        processed: 0,
        remaining: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Count remaining
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .is('image_url', null);

    const results: { name: string; images: number; error?: string }[] = [];

    for (const product of products) {
      try {
        const prompt = `Find 3 REAL, working image URLs for this supplement product: "${product.name}" by ${product.brand}, size: ${product.weight_size}, category: ${product.category}.

IMPORTANT: Return ONLY real, publicly accessible image URLs from major retailers like:
- Amazon (images-na.ssl-images-amazon.com or m.media-amazon.com)
- iHerb (cloudinary.images-iherb.com)
- Bodybuilding.com (www.bodybuilding.com)
- Walmart (i5.walmartimages.com)
- Official brand websites

Return ONLY valid JSON, no markdown:
{"images": [{"url": "...", "alt": "Front view", "order": 0}, {"url": "...", "alt": "Nutrition facts", "order": 1}, {"url": "...", "alt": "Side view", "order": 2}]}

The URLs MUST be real working URLs to actual product photos. If you cannot find real URLs, use these placeholder patterns:
- https://images-na.ssl-images-amazon.com/images/I/ followed by the product ASIN
- https://m.media-amazon.com/images/I/ for Amazon product images`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a product image finder. Return ONLY valid JSON with real, working image URLs. No markdown, no explanation." },
              { role: "user", content: prompt }
            ],
          }),
        });

        if (!aiResp.ok) {
          results.push({ name: product.name, images: 0, error: `AI error: ${aiResp.status}` });
          continue;
        }

        const aiData = await aiResp.json();
        let content = aiData.choices?.[0]?.message?.content || '';
        content = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

        const parsed = JSON.parse(content);
        const images = parsed.images || [];

        if (images.length > 0) {
          // Update main product image
          await supabase.from('products').update({ 
            image_url: images[0].url 
          }).eq('id', product.id);

          // Insert into product_images
          const imageRecords = images.map((img: any, idx: number) => ({
            product_id: product.id,
            url: img.url,
            alt_text: img.alt || `${product.name} - Vista ${idx + 1}`,
            display_order: img.order ?? idx,
            is_primary: idx === 0,
          }));

          await supabase.from('product_images').insert(imageRecords);
          results.push({ name: product.name, images: images.length });
        } else {
          results.push({ name: product.name, images: 0, error: 'No images found' });
        }
      } catch (e) {
        console.error(`Error for ${product.name}:`, e);
        results.push({ name: product.name, images: 0, error: String(e) });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      remaining: (count || 0) - results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('populate-product-images error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
