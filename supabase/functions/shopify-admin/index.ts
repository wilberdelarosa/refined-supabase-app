import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
const SHOPIFY_STORE_DOMAIN = 'lovable-project-fc7u9.myshopify.com';
const SHOPIFY_API_VERSION = '2025-01';

async function shopifyAdminRequest(endpoint: string, method = 'GET', body?: object) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;
  
  console.log(`Shopify Admin API: ${method} ${url}`);
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Shopify API error:', response.status, errorText);
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
  }

  // DELETE requests may not return JSON
  if (method === 'DELETE') {
    return { success: true };
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log('Action:', action, 'Params:', JSON.stringify(params));

    let result;

    switch (action) {
      // Products
      case 'get_products': {
        const limit = params.limit || 50;
        result = await shopifyAdminRequest(`/products.json?limit=${limit}`);
        break;
      }
      case 'get_product': {
        result = await shopifyAdminRequest(`/products/${params.product_id}.json`);
        break;
      }
      case 'create_product': {
        result = await shopifyAdminRequest('/products.json', 'POST', { product: params.product });
        break;
      }
      case 'update_product': {
        result = await shopifyAdminRequest(`/products/${params.product_id}.json`, 'PUT', { product: params.product });
        break;
      }
      case 'delete_product': {
        result = await shopifyAdminRequest(`/products/${params.product_id}.json`, 'DELETE');
        break;
      }

      // Inventory
      case 'get_inventory_levels': {
        const ids = params.inventory_item_ids.join(',');
        result = await shopifyAdminRequest(`/inventory_levels.json?inventory_item_ids=${ids}`);
        break;
      }
      case 'adjust_inventory': {
        result = await shopifyAdminRequest('/inventory_levels/adjust.json', 'POST', {
          location_id: params.location_id,
          inventory_item_id: params.inventory_item_id,
          available_adjustment: params.adjustment,
        });
        break;
      }
      case 'set_inventory': {
        result = await shopifyAdminRequest('/inventory_levels/set.json', 'POST', {
          location_id: params.location_id,
          inventory_item_id: params.inventory_item_id,
          available: params.quantity,
        });
        break;
      }

      // Locations
      case 'get_locations': {
        result = await shopifyAdminRequest('/locations.json');
        break;
      }

      // Price Rules
      case 'get_price_rules': {
        const limit = params.limit || 50;
        result = await shopifyAdminRequest(`/price_rules.json?limit=${limit}`);
        break;
      }
      case 'get_price_rule': {
        result = await shopifyAdminRequest(`/price_rules/${params.price_rule_id}.json`);
        break;
      }
      case 'create_price_rule': {
        result = await shopifyAdminRequest('/price_rules.json', 'POST', { price_rule: params.price_rule });
        break;
      }
      case 'update_price_rule': {
        result = await shopifyAdminRequest(`/price_rules/${params.price_rule_id}.json`, 'PUT', { price_rule: params.price_rule });
        break;
      }
      case 'delete_price_rule': {
        result = await shopifyAdminRequest(`/price_rules/${params.price_rule_id}.json`, 'DELETE');
        break;
      }

      // Discount Codes
      case 'get_discount_codes': {
        result = await shopifyAdminRequest(`/price_rules/${params.price_rule_id}/discount_codes.json`);
        break;
      }
      case 'create_discount_code': {
        result = await shopifyAdminRequest(`/price_rules/${params.price_rule_id}/discount_codes.json`, 'POST', {
          discount_code: { code: params.code }
        });
        break;
      }
      case 'delete_discount_code': {
        result = await shopifyAdminRequest(
          `/price_rules/${params.price_rule_id}/discount_codes/${params.discount_code_id}.json`, 
          'DELETE'
        );
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
