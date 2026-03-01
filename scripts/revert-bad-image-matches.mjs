/**
 * Revierte productos que recibieron imágenes incorrectas (categoría incompatible).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Productos que recibieron imágenes incorrectas en esta sesión
const REVERT_NAMES = [
  'MUSCLE TECH 100% CREATINA 80 SERVICIOS',      // ← recibió NATURAVIT vitamina C
  'PATRIOT NUTRITION ZMA 90 CÁPSULAS',           // ← recibió Omega 3
  'NATURAVIT COLÁGENO HIDROLIZADO + BIOTINA',    // ← recibió Swanson Vitamin A
  // Lista anterior (mantener por si acaso):
  'MUSCLE TECH 100% CREATINA 80 SERVICIOS',      // ← vitamina C
  'ON GOLD STANDARD PRE-WORKOUT 30 SERVICIOS',   // ← whey
  'ON MICRONIZED CREATINE POWDER 120 SERVICIOS', // ← vitamina C kids
  'CELLUCOR C4 SPORT RIPPED 20 SERVICIOS',       // ← vitamina C kids
  'PATRIOT NUTRITION MUSCLE PUMP 50 MG 120 CÁPSULAS', // ← zinc
  'SIMPLY CREATINA 100% PURE MONOHYDRATE',       // ← whey
  'PATRIOT CREATINE PUMP 3.4 LB',                // ← iso whey
  'NATURAVIT MAGNESIO + ZINC + B6',              // ← mass gainer
  'EARTHS CREATION MULTIVITAMIN FOR MEN',        // ← mass gainer
  'EARTHS CREATION MULTIVITAMIN FOR WOMEN',      // ← mass gainer
  'SWANSON ASHWAGANDHA 450MG',                   // ← whey
  'NOW FOODS IRON 18MG',                         // ← whey
  'PATRIOT NUTRITION ZMA 90 CÁPSULAS',           // ← whey
  'PATRIOT NUTRITION MULTIVITAMIN SPORT',        // ← mass gainer
  'PATRIOT NUTRITION ATLAS GAINER 15 LB',        // ← whey
  'NUTREX CREATINA MONOHIDRATADA 60 SERVICIOS',  // ← mass gainer
  'NATURAVIT COLÁGENO HIDROLIZADO + BIOTINA',    // ← mass gainer
  'ALLMAX CREATINA 80 SERVICIOS',                // ← vitamina C kids
  'CELL TECH CREATINA 6 LB',                     // ← vitamina C kids
  'BPI SPORT MICRONIZED CREATINA 120 SERVICIOS', // ← vitamina C kids
  'NUTREX CREATINA MONOHIDRATADA 200 SERVICIOS', // ← mass gainer
  'EARTHS CREATION BIOTIN 10,000 MCG',           // ← swanson vitamina C
];

async function main() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'wilber.alitoeirl@gmail.com',
    password: '123456'
  });
  if (authError) {
    console.error('❌ Auth:', authError.message);
    process.exit(1);
  }

  for (const name of REVERT_NAMES) {
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: null })
      .eq('name', name)
      .select('id, name');

    if (error) {
      console.error(`❌ ${name}:`, error.message);
    } else if (data && data.length > 0) {
      await supabase.from('product_images').delete().eq('product_id', data[0].id);
      console.log(`✓ Revertido: ${name}`);
    }
  }
  console.log('\n✨ Listo. Esos productos quedan sin imagen para asignar una correcta.');
}

main().catch(e => { console.error(e); process.exit(1); });
