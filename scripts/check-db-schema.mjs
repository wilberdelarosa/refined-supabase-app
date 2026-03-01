
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from project root manually
try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
            process.env[key] = val;
        }
    });
} catch (e) {
    console.error("Error reading .env", e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking "orders" table schema/columns...');
  
  // Try to select the new columns. If they don't exist, this will error.
  const { data, error } = await supabase
    .from('orders')
    .select('id, rnc_cedula, company_name, ncf_type')
    .limit(1);

  if (error) {
    console.error('Error selecting new columns (rnc_cedula, company_name):');
    console.error(error);
  } else {
    console.log('Success! Columns exist in "orders" table.');
  }

  console.log('\nChecking "fiscal_sequences" table...');
  const { data: seqData, error: seqError } = await supabase
    .from('fiscal_sequences')
    .select('*')
    .limit(1);

  if (seqError) {
    console.error('Error accessing "fiscal_sequences":', seqError.message);
  } else {
    console.log('Success! "fiscal_sequences" table exist.');
  }

  // Also check if products exist to ensure we can validate cart
  console.log('\nChecking sample products...');
  const { data: prods, error: prodError } = await supabase
    .from('products')
    .select('id, name')
    .limit(3);
    
  if (prodError) {
      console.error('Error fetching products:', prodError);
  } else {
      console.log(`Found ${prods.length} products.`);
  }
}

checkSchema().catch(console.error);
