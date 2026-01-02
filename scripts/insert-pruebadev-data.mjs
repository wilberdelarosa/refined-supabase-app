import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
    console.log('📝 Insertando datos de prueba en pruebadev...\n');

    try {
        const testData = [
            { nombre: 'Prueba 1', descripcion: 'Primera entrada de prueba', valor: 100 },
            { nombre: 'Prueba 2', descripcion: 'Segunda entrada de prueba', valor: 200 },
            { nombre: 'Prueba 3', descripcion: 'Tercera entrada de prueba', valor: 300 }
        ];

        const { data, error } = await supabase
            .from('pruebadev')
            .insert(testData)
            .select();

        if (error) {
            console.error('❌ Error insertando datos:', error.message);
            console.log('\n💡 La tabla pruebadev probablemente no existe aún.');
            console.log('   Aplica la migración manualmente desde Supabase Dashboard:\n');
            console.log('   1. Ve a SQL Editor en Supabase Dashboard');
            console.log('   2. Copia el contenido de: supabase/migrations/20260102_create_pruebadev.sql');
            console.log('   3. Ejecuta el SQL\n');
            return;
        }

        console.log(`✅ Insertados ${data.length} registros exitosamente!\n`);

        // Mostrar los datos insertados
        console.log('📊 Datos en pruebadev:');
        data.forEach((row, i) => {
            console.log(`   ${i + 1}. ${row.nombre} - ${row.descripcion} (valor: ${row.valor})`);
        });

        // Verificar conteo total
        const { count } = await supabase
            .from('pruebadev')
            .select('*', { count: 'exact', head: true });

        console.log(`\n✨ Total de registros en pruebadev: ${count}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

insertTestData();
