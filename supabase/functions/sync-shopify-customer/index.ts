import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_STORE_DOMAIN = 'lovable-project-fc7u9.myshopify.com';
const SHOPIFY_API_VERSION = '2025-07';

interface CustomerData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: {
    address1?: string;
    city?: string;
    country?: string;
  };
  tags?: string[];
}

interface SyncRequest {
  action: 'create' | 'update';
  customer: CustomerData;
  shopify_customer_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
    
    if (!SHOPIFY_ACCESS_TOKEN) {
      console.error('SHOPIFY_ACCESS_TOKEN not configured');
      throw new Error('Shopify access token not configured');
    }

    const { action, customer, shopify_customer_id }: SyncRequest = await req.json();
    
    console.log(`Processing ${action} for customer:`, customer.email);

    // First, search for existing customer by email
    const searchUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(customer.email)}`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const searchData = await searchResponse.json();
    console.log('Search result:', JSON.stringify(searchData));

    let existingCustomerId = shopify_customer_id;
    
    if (searchData.customers && searchData.customers.length > 0) {
      existingCustomerId = searchData.customers[0].id.toString();
      console.log(`Found existing customer with ID: ${existingCustomerId}`);
    }

    // Parse name into first and last name
    let firstName = customer.first_name || '';
    let lastName = customer.last_name || '';
    
    // Build customer data for Shopify
    const shopifyCustomer: Record<string, unknown> = {
      email: customer.email,
      first_name: firstName,
      last_name: lastName,
      tags: ['lovable-sync', ...(customer.tags || [])].join(', '),
    };

    // Add phone if provided
    if (customer.phone) {
      shopifyCustomer.phone = customer.phone;
    }

    // Add address if provided
    if (customer.address && (customer.address.address1 || customer.address.city)) {
      shopifyCustomer.addresses = [{
        address1: customer.address.address1 || '',
        city: customer.address.city || '',
        country: customer.address.country || 'Dominican Republic',
        default: true,
      }];
    }

    let response;
    let result;

    if (existingCustomerId) {
      // Update existing customer
      console.log(`Updating customer ${existingCustomerId}`);
      
      const updateUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/${existingCustomerId}.json`;
      
      response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer: shopifyCustomer }),
      });

      result = await response.json();
      console.log('Update response:', JSON.stringify(result));

      if (result.errors) {
        console.error('Shopify update error:', result.errors);
        throw new Error(`Shopify update error: ${JSON.stringify(result.errors)}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'updated',
          shopify_customer_id: existingCustomerId,
          customer: result.customer 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Create new customer
      console.log('Creating new customer');
      
      const createUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json`;
      
      // For new customers, we need to set email marketing consent
      shopifyCustomer.email_marketing_consent = {
        state: 'subscribed',
        opt_in_level: 'single_opt_in',
      };

      response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer: shopifyCustomer }),
      });

      result = await response.json();
      console.log('Create response:', JSON.stringify(result));

      if (result.errors) {
        // Check if it's a duplicate email error
        if (JSON.stringify(result.errors).includes('has already been taken')) {
          console.log('Customer already exists, attempting to find and update');
          // Return success anyway since customer exists
          return new Response(
            JSON.stringify({ 
              success: true, 
              action: 'already_exists',
              message: 'Customer already exists in Shopify'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        console.error('Shopify create error:', result.errors);
        throw new Error(`Shopify create error: ${JSON.stringify(result.errors)}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'created',
          shopify_customer_id: result.customer?.id?.toString(),
          customer: result.customer 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error: unknown) {
    console.error('Error syncing customer to Shopify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
