import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 2, offset = 0 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get products to process (skip those already with storage images)
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, brand, category, weight_size, image_url')
      .order('name')
      .range(offset, offset + batch_size - 1);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, message: 'No more products', processed: 0 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: { name: string; success: boolean; error?: string }[] = [];

    for (const product of products) {
      // Skip if already has storage image
      if (product.image_url?.includes('supabase.co/storage')) {
        results.push({ name: product.name, success: true, error: 'Already done' });
        continue;
      }

      try {
        // Generate product image using AI
        const prompt = `Generate a professional product photo of a supplement container/bottle for: "${product.name}" by ${product.brand}. 
Size: ${product.weight_size}. Category: ${product.category}.
The image should show a realistic supplement product container with the brand name "${product.brand}" and product name visible on the label.
Professional studio lighting, white background, product photography style. Ultra high resolution.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [
              { role: "user", content: prompt }
            ],
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error for ${product.name}: ${aiResp.status} ${errText}`);
          results.push({ name: product.name, success: false, error: `AI ${aiResp.status}` });
          continue;
        }

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content;
        
        // Check if response has inline image data
        let imageData: Uint8Array | null = null;
        let contentType = 'image/png';

        // Check for parts with inline_data (Gemini image generation format)
        const parts = aiData.choices?.[0]?.message?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inline_data) {
              imageData = decode(part.inline_data.data);
              contentType = part.inline_data.mime_type || 'image/png';
              break;
            }
          }
        }

        if (!imageData) {
          console.log(`No image generated for ${product.name}. Response:`, JSON.stringify(aiData).substring(0, 500));
          results.push({ name: product.name, success: false, error: 'No image in response' });
          continue;
        }

        // Upload to storage
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        const filePath = `${product.id}/main.${ext}`;

        // Delete existing files
        const { data: existingFiles } = await supabase.storage
          .from('products')
          .list(product.id);
        if (existingFiles?.length) {
          await supabase.storage
            .from('products')
            .remove(existingFiles.map((f: any) => `${product.id}/${f.name}`));
        }

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageData, { contentType, upsert: true });

        if (uploadError) {
          results.push({ name: product.name, success: false, error: uploadError.message });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // Update product and product_images
        await supabase.from('products').update({ image_url: publicUrl }).eq('id', product.id);
        
        // Clear old images and add new one
        await supabase.from('product_images').delete().eq('product_id', product.id);
        await supabase.from('product_images').insert({
          product_id: product.id,
          url: publicUrl,
          alt_text: `${product.name} - ${product.brand}`,
          display_order: 0,
          is_primary: true,
        });

        results.push({ name: product.name, success: true });
        console.log(`✅ Generated image for ${product.name}`);

      } catch (e) {
        console.error(`Error for ${product.name}:`, e);
        results.push({ name: product.name, success: false, error: String(e) });
      }
    }

    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true });

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      total_products: count || 0,
      next_offset: offset + batch_size,
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
