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

async function executeSQLDirectly() {
    try {
        console.log('📖 Reading migration file...');
        const migrationPath = resolve(__dirname, '../supabase/migrations/20250101000001_complete_schema.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('✅ Migration file loaded');
        console.log(`📏 Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

        console.log('🚀 Executing SQL migration...');
        console.log('⏳ This may take a moment...\n');

        // Split SQL into individual statements and execute
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';

            // Skip comments
            if (statement.trim().startsWith('--')) continue;

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });

                if (error) {
                    errorCount++;
                    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
                    errors.push({
                        statement: i + 1,
                        preview: preview + (statement.length > 60 ? '...' : ''),
                        error: error.message
                    });
                    console.log(`❌ Statement ${i + 1} failed: ${preview}...`);
                } else {
                    successCount++;
                    process.stdout.write(`✅ Progress: ${successCount}/${statements.length}\r`);
                }
            } catch (err) {
                errorCount++;
                const preview = statement.substring(0, 60).replace(/\n/g, ' ');
                errors.push({
                    statement: i + 1,
                    preview: preview + (statement.length > 60 ? '...' : ''),
                    error: err.message
                });
            }
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log('='.repeat(60));

        if (errors.length > 0) {
            console.log('\n⚠️  ERRORS ENCOUNTERED:\n');
            errors.forEach(err => {
                console.log(`Statement #${err.statement}: ${err.preview}`);
                console.log(`   Error: ${err.error}\n`);
            });

            console.log('\n💡 NOTE: Some errors are expected (e.g., "already exists")');
            console.log('    and can be safely ignored if tables were created previously.\n');
        }

    } catch (err) {
        console.error('❌ Fatal Error:', err.message);
        process.exit(1);
    }
}

// Check if exec_sql RPC exists, if not provide alternative
async function checkAndExecute() {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    if (error && error.message.includes('function')) {
        console.log('⚠️  exec_sql RPC function not available');
        console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:');
        console.log('━'.repeat(70));
        console.log('\nTo apply this schema to your database:\n');
        console.log('1. Open your Supabase Dashboard SQL Editor:');
        console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql/new')}`);
        console.log('\n2. Copy the entire contents of:');
        console.log('   supabase/migrations/20250101000001_complete_schema.sql');
        console.log('\n3. Paste into the SQL Editor');
        console.log('\n4. Click "Run" (or press Ctrl/Cmd + Enter)');
        console.log('\n5. Wait for execution to complete');
        console.log('\n━'.repeat(70));
        console.log('\n💡 The migration file is ready at:');
        console.log('   ' + resolve(dirname(fileURLToPath(import.meta.url)), '../supabase/migrations/20250101000001_complete_schema.sql'));
        console.log('\n✨ After running, use "npm run db:verify" to verify the schema\n');
    } else {
        await executeSQLDirectly();
    }
}

checkAndExecute();
