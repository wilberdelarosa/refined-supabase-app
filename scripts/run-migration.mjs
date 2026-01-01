import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials in .env file');
    process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('📖 Reading migration file...');
        const migrationPath = resolve(__dirname, '../supabase/migrations/20250101000001_complete_schema.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('✅ Migration file loaded');
        console.log(`📏 Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

        console.log('🚀 Executing migration...');
        console.log('⏳ This may take a moment...\n');

        // Execute the SQL using Supabase RPC
        // Note: This requires a custom RPC function or we need to execute via the Supabase SQL Editor
        // For now, we'll provide instructions to run manually

        console.log('⚠️  IMPORTANT INSTRUCTIONS:');
        console.log('━'.repeat(60));
        console.log('\n📋 To apply this schema to your database, follow these steps:\n');
        console.log('1. Open your Supabase Dashboard:');
        console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}`);
        console.log('\n2. Go to the SQL Editor');
        console.log('\n3. Create a new query');
        console.log('\n4. Copy the contents of this file:');
        console.log(`   ${migrationPath}`);
        console.log('\n5. Paste into the SQL Editor and click "Run"');
        console.log('\n' + '━'.repeat(60));

        console.log('\n💡 Alternative: Use Supabase CLI');
        console.log('━'.repeat(60));
        console.log('\nIf you have Supabase CLI installed:');
        console.log('1. Run: npx supabase login');
        console.log('2. Run: npx supabase link --project-ref ojybhysmjwzyhwcbvwmf');
        console.log('3. Run: npx supabase db push\n');
        console.log('━'.repeat(60));

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// Run the migration
runMigration();
