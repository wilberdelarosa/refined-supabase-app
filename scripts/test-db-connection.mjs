import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan credenciales de Supabase en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔌 Probando conexión a Supabase...\n');

    try {
        // 1. Verificar conexión básica
        const { data: healthCheck, error: healthError } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });

        if (healthError) throw healthError;

        console.log('✅ Conexión exitosa a Supabase!');
        console.log(`📊 Base de datos: ${supabaseUrl}\n`);

        // 2. Listar tablas principales con conteo
        console.log('📋 Tablas principales:\n');

        const tables = [
            'products',
            'categories',
            'orders',
            'order_items',
            'invoices',
            'profiles',
            'user_roles',
            'cart_items',
            'wishlist'
        ];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`   ⚠️  ${table.padEnd(20)} - Error: ${error.message}`);
            } else {
                console.log(`   ✓  ${table.padEnd(20)} - ${count || 0} registros`);
            }
        }

        console.log('\n🎉 Conexión verificada correctamente!\n');

    } catch (error) {
        console.error('❌ Error de conexión:', error);
        process.exit(1);
    }
}

testConnection();
