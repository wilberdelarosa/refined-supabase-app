import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function listDatabaseTables() {
    try {
        console.log('\n📊 Fetching database tables...\n');

        // Query to get all tables from the public schema
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');

        if (error) {
            // If the above query doesn't work (some Supabase versions), 
            // try using RPC or direct query
            console.log('⚠️ Standard query failed, trying alternative method...\n');

            // Alternative: Try to query each common table to see what exists
            const commonTables = [
                'profiles', 'users', 'products', 'orders', 'customers',
                'categories', 'inventory', 'settings', 'shopify_customers',
                'shopify_sync_log', 'posts', 'comments', 'reviews'
            ];

            console.log('🔍 Checking for common tables:\n');
            const existingTables = [];

            for (const tableName of commonTables) {
                const { error: tableError, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!tableError) {
                    existingTables.push(tableName);
                    console.log(`✅ ${tableName} (exists)`);
                }
            }

            if (existingTables.length === 0) {
                console.log('\n⚠️ No common tables found. You may need to create tables first.');
                console.log('\n💡 Tip: Check your Supabase dashboard to see existing tables.');
            } else {
                console.log(`\n📋 Found ${existingTables.length} table(s):`);
                existingTables.forEach((table, index) => {
                    console.log(`${index + 1}. ${table}`);
                });
            }

            // Try to get row counts
            console.log('\n📊 Getting row counts...\n');
            for (const tableName of existingTables) {
                const { count, error: countError } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!countError) {
                    console.log(`📦 ${tableName}: ${count} row(s)`);
                }
            }

            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Database Tables Found:\n');
            data.forEach((table, index) => {
                console.log(`${index + 1}. ${table.table_name}`);
            });

            console.log(`\n📋 Total tables: ${data.length}`);

            // Get row counts for each table
            console.log('\n📊 Getting row counts...\n');
            for (const table of data) {
                const { count, error: countError } = await supabase
                    .from(table.table_name)
                    .select('*', { count: 'exact', head: true });

                if (!countError) {
                    console.log(`📦 ${table.table_name}: ${count} row(s)`);
                } else {
                    console.log(`⚠️ ${table.table_name}: Cannot access`);
                }
            }
        } else {
            console.log('⚠️ No tables found in the public schema.');
            console.log('\n💡 This could mean:');
            console.log('   - Your database is empty');
            console.log('   - Tables are in a different schema');
            console.log('   - You need to run migrations');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

// Test connection
async function testConnection() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error && error.message !== 'Auth session missing!') {
            console.error('❌ Connection error:', error);
            return false;
        }
        console.log('✅ Successfully connected to Supabase!\n');
        return true;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        return false;
    }
}

// Run the script
(async () => {
    const connected = await testConnection();
    if (connected) {
        await listDatabaseTables();
    }
    console.log('\n✨ Done!\n');
})();
