import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Resend API URL
const RESEND_API_URL = 'https://api.resend.com/emails';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record, type } = await req.json();
    
    // We expect this to be triggered by a Database Webhook on the `notifications` table
    // It will receive the newly inserted `record`.
    
    if (type !== 'INSERT' || !record) {
       return new Response(JSON.stringify({ error: 'Not an insert event' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const { user_id, title, message, type: notifType, priority, link_url } = record;

    // We only send emails for HIGH priority or specific types like NEW_ORDER / SYSTEM_ALERT
    const shouldSendEmail = priority === 'HIGH' || notifType === 'NEW_ORDER' || notifType === 'ORDER_UPDATE';

    if (!shouldSendEmail) {
       return new Response(JSON.stringify({ success: true, message: 'No email dispatch needed for this notification' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Get the user's email if user_id is provided
    let recipientEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@barbaro.com'; // Default to admin
    let recipientName = 'Admin';

    if (user_id) {
       const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
       if (userError || !userData?.user?.email) {
          console.error("Could not fetch user email", userError);
          return new Response(JSON.stringify({ error: 'User email not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
       }
       recipientEmail = userData.user.email;
       recipientName = userData.user.user_metadata?.full_name || 'Usuario';
    }

    // Send via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
       console.warn("No RESEND_API_KEY found. Skipping email dispatch.");
       return new Response(JSON.stringify({ success: true, message: 'Skipped email (no API key)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const emailResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bárbaro Store <no-reply@barbarohub.com>', // MUST BE verified in Resend
        to: [recipientEmail],
        subject: `Notificación: ${title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
             <h2>Hola ${recipientName},</h2>
             <p>${message}</p>
             ${link_url ? `<div style="margin-top: 20px;"><a href="${link_url}" style="background-color: #2b8cee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Detalles</a></div>` : ''}
             <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
             <p style="font-size: 12px; color: #888;">Este es un correo automático, por favor no respondas.</p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
        const errData = await emailResponse.text();
        throw new Error(`Resend API Error: ${errData}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Email dispatched successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
