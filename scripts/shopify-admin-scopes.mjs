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
  if (!match) throw new Error(`Invalid VITE_SUPABASE_URL: ${supabaseUrl}`);
  return `https://${match[1]}.functions.supabase.co`;
}

async function main() {
  const cwd = process.cwd();
  loadDotEnvFile(path.join(cwd, '.env.local'));
  loadDotEnvFile(path.join(cwd, '.env'));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL in .env/.env.local');
  if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY in .env/.env.local');

  const endpoint = `${getSupabaseFunctionsBaseUrl(supabaseUrl)}/shopify-admin`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ action: 'get_access_scopes' }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase function error ${res.status}: ${text}`);

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected non-JSON response: ${text}`);
  }

  if (json?.error) throw new Error(json.error);

  const scopes = json?.access_scopes?.map((s) => s.handle) ?? [];

  console.log('Shopify Admin token scopes:');
  for (const s of scopes) console.log('-', s);

  const needed = ['read_customers', 'write_customers'];
  const missing = needed.filter((n) => !scopes.includes(n));
  if (missing.length) {
    console.log('\nMissing customer scopes:', missing.join(', '));
    console.log('That would explain why customer sync does not create/update customers.');
  } else {
    console.log('\nCustomer scopes look OK.');
  }
}

main().catch((err) => {
  console.error('Failed to fetch Shopify Admin token scopes');
  console.error(err?.message ?? err);
  process.exit(1);
});
