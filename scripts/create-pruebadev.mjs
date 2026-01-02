import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAndPopulateTable() {
    console.log('🚀 Creando tabla pruebadev y poblando datos...\n');

    try {
        // Primero, intentar insertar datos directamente
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
            console.log('⚠️  La tabla no existe aún. Necesitas aplicar la migración.\n');
            console.log('📋 Pasos para crear la tabla:');
            console.log('━'.repeat(70));
            console.log('1. Ve a Supabase Dashboard → SQL Editor');
            console.log('2. Copia y ejecuta este SQL:\n');
            console.log(`-- Crear tabla pruebadev
CREATE TABLE IF NOT EXISTS public.pruebadev (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    edad INTEGER NOT NULL
);

ALTER TABLE public.pruebadev ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pruebadev"
ON public.pruebadev FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pruebadev"
ON public.pruebadev FOR INSERT WITH CHECK (true);

-- Insertar datos
INSERT INTO public.pruebadev (nombre, edad) VALUES
('Juan Pérez', 25),
('María García', 30),
('Carlos López', 28),
('Ana Martínez', 22),
('Pedro Rodríguez', 35),
('Laura Sánchez', 27),
('Miguel Torres', 31),
('Isabel Ramírez', 24),
('Diego Flores', 29),
('Carmen González', 26);
`);
            console.log('━'.repeat(70));
            return;
        }

        console.log(`✅ Insertados ${data.length} registros exitosamente!\n`);

        // Mostrar tabla completa
        const { data: allData, error: fetchError } = await supabase
            .from('pruebadev')
            .select('*')
            .order('id');

        if (fetchError) {
            console.error('Error al leer datos:', fetchError.message);
            return;
        }

        console.log('📊 Tabla pruebadev (3 columnas):');
        console.log('━'.repeat(70));
        console.log('ID | Nombre                  | Edad');
        console.log('━'.repeat(70));
        allData.forEach(row => {
            console.log(`${String(row.id).padEnd(3)}| ${row.nombre.padEnd(24)}| ${row.edad}`);
        });
        console.log('━'.repeat(70));
        console.log(`\n✨ Total: ${allData.length} registros\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createAndPopulateTable();
