import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConnection() {
    console.log('🔍 Verificando conexión en VIVO a Supabase...\n');

    try {
        // Obtener datos reales de products
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, price, stock')
            .limit(5);

        if (error) throw error;

        console.log('✅ CONECTADO EXITOSAMENTE!\n');
        console.log('📦 Primeros 5 productos en la base de datos:\n');

        products.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   Precio: RD$${p.price}`);
            console.log(`   Stock: ${p.stock} unidades\n`);
        });

        // Obtener conteo total
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { count: totalProfiles } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        console.log('📊 Resumen de base de datos:');
        console.log(`   • Total productos: ${totalProducts}`);
        console.log(`   • Total pedidos: ${totalOrders}`);
        console.log(`   • Total usuarios: ${totalProfiles}\n`);

        console.log('🎯 Base de datos:');
        console.log(`   ${supabaseUrl}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyConnection();
