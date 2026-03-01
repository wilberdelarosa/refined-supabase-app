
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking "orders" table schema/columns...');
  
  // Try to select the new columns
  const { data, error } = await supabase
    .from('orders')
    .select('id, rnc_cedula, company_name, ncf_type')
    .limit(1);

  if (error) {
    console.error('Error selecting new columns:', error.message);
    if (error.code === 'PGRST204') {
        console.error('Columns probably missing!');
    }
  } else {
    console.log('Success! Columns exist.');
  }

  console.log('Checking "fiscal_sequences" table...');
  const { data: seqData, error: seqError } = await supabase
    .from('fiscal_sequences')
    .select('*')
    .limit(1);

  if (seqError) {
    console.error('Error accessing fiscal_sequences:', seqError.message);
  } else {
    console.log('fiscal_sequences table exists.');
  }
}

checkSchema();
