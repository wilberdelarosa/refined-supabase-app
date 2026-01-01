import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

const artifactsDir = 'C:\\\\Users\\\\wilbe\\\\.gemini\\\\antigravity\\\\brain\\\\f261c123-683a-4918-83b2-a2ecba6b0750';

// Generated product images with their corresponding product names
const productImages = [
    // Proteins
    { file: 'gold_standard_whey_1767298682112.png', storage: 'gold-standard-whey.png', product: 'Gold Standard 100% Whey' },
    { file: 'platinum_hydrowhey_1767298694686.png', storage: 'platinum-hydrowhey.png', product: 'Platinum Hydrowhey' },
    { file: 'nitro_tech_whey_1767298707973.png', storage: 'nitro-tech-whey.png', product: 'Nitro-Tech Whey Gold' },
    { file: 'iso100_hydrolyzed_1767298727104.png', storage: 'iso100-hydrolyzed.png', product: 'ISO100 Hydrolyzed' },
    { file: 'combat_protein_1767298741664.png', storage: 'combat-protein.png', product: 'Combat Protein Powder' },
    { file: 'glutamine_powder_1767298755830.png', storage: 'glutamine-powder.png', product: 'Glutamine Powder' },

    // Creatines
    { file: 'platinum_creatine_1767298779548.png', storage: 'platinum-creatine.png', product: 'Platinum Creatine' },
    { file: 'celltech_creatine_1767298793941.png', storage: 'celltech-creatine.png', product: 'Cell-Tech Creatine' },
    { file: 'creatine_hcl_1767298808238.png', storage: 'creatine-hcl.png', product: 'Creatine HCl' },
    { file: 'creaclear_1767298824073.png', storage: 'creaclear.png', product: 'CreaClear' },

    // Pre-Workouts
    { file: 'c4_ultimate_1767298837357.png', storage: 'c4-ultimate.png', product: 'C4 Ultimate Pre-Workout' },
    { file: 'pre_jym_1767298851700.png', storage: 'pre-jym.png', product: 'Pre JYM' },
    { file: 'wrecked_preworkout_1767298866293.png', storage: 'wrecked-preworkout.png', product: 'Wrecked Pre-Workout' },
    { file: 'total_war_1767298879247.png', storage: 'total-war.png', product: 'Total War' },

    // Vitamins
    { file: 'opti_men_1767298907893.png', storage: 'opti-men.png', product: 'Opti-Men Multivitamínico' },
    { file: 'opti_women_1767298920960.png', storage: 'opti-women.png', product: 'Opti-Women Multivitamínico' },
];

async function main() {
    console.log('🔐 Autenticando...');
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'wilber.alitoeirl@gmail.com',
        password: '123456'
    });

    if (authError) {
        console.error('❌ Error autenticación:', authError.message);
        return;
    }

    console.log('✅ Autenticado\n');
    console.log('📤 Subiendo 16 imágenes generadas...\n');

    let uploaded = 0;
    let updated = 0;

    for (const img of productImages) {
        try {
            const filePath = join(artifactsDir, img.file);
            const fileBuffer = readFileSync(filePath);

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(img.storage, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ Error subiendo ${img.storage}:`, uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(img.storage);

            console.log(`✅ ${img.storage}`);
            uploaded++;

            // Update product in database
            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: publicUrl })
                .eq('name', img.product);

            if (updateError) {
                console.error(`   ⚠️  Error actualizando producto:`, updateError.message);
            } else {
                console.log(`   ✓ Producto actualizado: ${img.product}`);
                updated++;
            }
            console.log('');
        } catch (err) {
            console.error(`❌ Error procesando ${img.file}:`, err.message);
        }
    }

    console.log(`\n✨ Proceso completado:`);
    console.log(`   📤 ${uploaded}/16 imágenes subidas`);
    console.log(`   ✓ ${updated}/16 productos actualizados`);
    console.log(`\n⚠️  Nota: Faltan 6 imágenes por generar debido a límite de cuota`);
    console.log(`   - Fish Oil Omega-3`);
    console.log(`   - Vitamin D3 5000IU`);
    console.log(`   - Xtend BCAA`);
    console.log(`   - Essential Amino Energy`);
    console.log(`   - EAA Energy`);
    console.log(`   - ZMA Recovery`);
}

main();
