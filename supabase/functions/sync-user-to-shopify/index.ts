import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN')!
const SHOPIFY_ADMIN_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN')!
const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') || '2025-01'

interface CustomerData {
    email: string
    first_name?: string
    last_name?: string
    accepts_marketing: boolean
    tags: string
}

serve(async (req) => {
    try {
        const { record } = await req.json()

        console.log('New user registered:', record.email)

        // Extract name from full_name if available
        const fullName = record.raw_user_meta_data?.full_name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Prepare Shopify customer data
        const customerData: CustomerData = {
            email: record.email,
            first_name: firstName,
            last_name: lastName,
            accepts_marketing: false,
            tags: 'supabase-user'
        }

        // Create customer in Shopify
        const shopifyResponse = await fetch(
            `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
                },
                body: JSON.stringify({ customer: customerData })
            }
        )

        if (!shopifyResponse.ok) {
            const error = await shopifyResponse.text()
            console.error('Shopify API Error:', error)
            throw new Error(`Shopify API failed: ${shopifyResponse.status}`)
        }

        const { customer } = await shopifyResponse.json()
        console.log('Customer created in Shopify:', customer.id)

        // Update Supabase user with Shopify customer ID
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: record.id,
                email: record.email,
                full_name: fullName,
                shopify_customer_id: customer.id.toString(),
                updated_at: new Date().toISOString()
            })

        if (updateError) {
            console.error('Error updating profile:', updateError)
        }

        return new Response(
            JSON.stringify({
                success: true,
                shopify_customer_id: customer.id,
                message: 'User synced to Shopify successfully'
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error syncing user to Shopify:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
