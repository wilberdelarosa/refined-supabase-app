import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableAsAdmin() {
    console.log('🔐 Autenticando como admin...\n');

    try {
        // Autenticar con credenciales de admin
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'wilber.alitoeirl@gmail.com',
            password: '123456'
        });

        if (authError) {
            console.error('❌ Error de autenticación:', authError.message);
            return;
        }

        console.log(`✅ Autenticado como: ${authData.user.email}\n`);

        // Intentar crear tabla usando SQL directo
        console.log('📝 Creando tabla pruebadev...\n');

        // Como no tenemos exec_sql RPC, usaremos el método de inserción directa
        // Primero verificar si la tabla existe
        const { error: checkError } = await supabase
            .from('pruebadev')
            .select('id')
            .limit(1);

        if (checkError && checkError.code === 'PGRST116') {
            console.log('⚠️  La tabla no existe. Debes crear la tabla manualmente en SQL Editor.');
            console.log('\n📋 SQL para ejecutar en Dashboard:\n');
            console.log('━'.repeat(70));
            console.log(`CREATE TABLE IF NOT EXISTS public.pruebadev (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    edad INTEGER NOT NULL
);

ALTER TABLE public.pruebadev ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pruebadev"
ON public.pruebadev FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pruebadev"
ON public.pruebadev FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can do all"
ON public.pruebadev FOR ALL
USING (auth.role() = 'authenticated');`);
            console.log('━'.repeat(70));
            console.log('\nDespués ejecuta este script nuevamente para insertar los datos.\n');
            return;
        }

        // Si la tabla existe, insertar datos
        console.log('✅ Tabla existe! Insertando datos...\n');

        const testData = [
            { nombre: 'Juan Pérez', edad: 25 },
            { nombre: 'María García', edad: 30 },
            { nombre: 'Carlos López', edad: 28 },
            { nombre: 'Ana Martínez', edad: 22 },
            { nombre: 'Pedro Rodríguez', edad: 35 },
            { nombre: 'Laura Sánchez', edad: 27 },
            { nombre: 'Miguel Torres', edad: 31 },
            { nombre: 'Isabel Ramírez', edad: 24 },
            { nombre: 'Diego Flores', edad: 29 },
            { nombre: 'Carmen González', edad: 26 }
        ];

        const { data, error } = await supabase
            .from('pruebadev')
            .insert(testData)
            .select();

        if (error) {
            console.error('❌ Error insertando:', error.message);
            console.log('\nPosible causa: Las políticas RLS no permiten inserción.');
            console.log('Ejecuta el SQL de creación completo primero.\n');
            return;
        }

        console.log(`✅ Insertados ${data.length} registros!\n`);

        // Mostrar datos
        const { data: allData } = await supabase
            .from('pruebadev')
            .select('*')
            .order('id');

        console.log('📊 Datos en tabla pruebadev:');
        console.log('━'.repeat(70));
        console.log('ID | Nombre                  | Edad');
        console.log('━'.repeat(70));
        allData.forEach(row => {
            console.log(`${String(row.id).padEnd(3)}| ${row.nombre.padEnd(24)}| ${row.edad}`);
        });
        console.log('━'.repeat(70));
        console.log(`\n✨ Total: ${allData.length} registros\n`);

        // Cerrar sesión
        await supabase.auth.signOut();
        console.log('🔓 Sesión cerrada\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTableAsAdmin();
