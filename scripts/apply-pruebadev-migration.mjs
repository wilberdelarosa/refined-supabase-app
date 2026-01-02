import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan credenciales de Supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Aplicando migración pruebadev...\n');

    try {
        // Leer el archivo SQL
        const sql = readFileSync('supabase/migrations/20260102_create_pruebadev.sql', 'utf8');

        // Dividir en statements individuales
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Ejecutando ${statements.length} statements SQL...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length === 0) continue;

            console.log(`   [${i + 1}/${statements.length}] Ejecutando...`);

            const { error } = await supabase.rpc('exec_sql', {
                sql_query: statement + ';'
            });

            if (error) {
                console.log(`   ⚠️  Statement falló (esto es normal si no existe exec_sql RPC)`);
                console.log(`   💡 Usa el SQL Editor de Supabase Dashboard para aplicar la migración\n`);
                console.log('📋 Contenido de la migración:');
                console.log('━'.repeat(60));
                console.log(sql);
                console.log('━'.repeat(60));
                return;
            }
        }

        console.log('\n✅ Migración aplicada exitosamente!');

        // Verificar que la tabla existe
        const { count, error: verifyError } = await supabase
            .from('pruebadev')
            .select('*', { count: 'exact', head: true });

        if (verifyError) {
            console.log('\n⚠️  No se pudo verificar la tabla:', verifyError.message);
        } else {
            console.log(`\n📊 Tabla pruebadev creada con ${count || 0} registros\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

applyMigration();
