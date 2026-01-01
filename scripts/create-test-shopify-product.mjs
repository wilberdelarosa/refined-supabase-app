import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2] ?? '';
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    return true;
  } catch {
    return false;
  }
}

function getSupabaseFunctionsBaseUrl(supabaseUrl) {
  const match = supabaseUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  if (!match) {
    throw new Error(`Invalid VITE_SUPABASE_URL: ${supabaseUrl}`);
  }
  const projectRef = match[1];
  return `https://${projectRef}.functions.supabase.co`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  // Load env from common local files (no dependency)
  const cwd = process.cwd();
  loadDotEnvFile(path.join(cwd, '.env.local'));
  loadDotEnvFile(path.join(cwd, '.env'));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL in .env/.env.local');
  if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY in .env/.env.local');

  const functionsBaseUrl = getSupabaseFunctionsBaseUrl(supabaseUrl);
  const endpoint = `${functionsBaseUrl}/shopify-admin`;

  const now = new Date();
  const title = `Test Product ${now.toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;

  const body = {
    action: 'create_product',
    product: {
      title,
      body_html: '<p>Producto de prueba creado desde el proyecto (Edge Function).</p>',
      vendor: 'Barbaro Nutrition',
      product_type: 'Test',
      tags: 'test,lovable,edge-function',
      status: 'active',
      variants: [
        {
          price: '99.00',
          sku: `TEST-${now.getTime()}`,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
        },
      ],
    },
  };

  if (dryRun) {
    console.log('[dry-run] Would POST:', endpoint);
    console.log('[dry-run] Body:', JSON.stringify(body, null, 2));
    console.log('[dry-run] Headers: apikey + Authorization: Bearer <anon-key>');
    return;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(`Supabase function error ${res.status}: ${text}`);
  }

  if (json?.error) {
    throw new Error(`Shopify Admin function returned error: ${json.error}`);
  }

  const productId = json?.product?.id;
  const productTitle = json?.product?.title;
  console.log('Created Shopify product OK');
  console.log('ID:', productId ?? '(unknown)');
  console.log('Title:', productTitle ?? title);
}

main().catch((err) => {
  console.error('Failed to create test product');
  console.error(err?.message ?? err);
  process.exit(1);
});
