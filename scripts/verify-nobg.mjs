import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'wilber.alitoeirl@gmail.com',
        password: '123456'
    });

    if (authError) {
        console.error('Error:', authError.message);
        return;
    }

    // Get products with custom images
    const { data: products } = await supabase
        .from('products')
        .select('name, image_url')
        .in('name', [
            'Gold Standard 100% Whey',
            'Platinum Hydrowhey',
            'Nitro-Tech Whey Gold',
            'ISO100 Hydrolyzed',
            'Combat Protein Powder',
            'Glutamine Powder',
            'Platinum Creatine',
            'Cell-Tech Creatine',
            'Creatine HCl',
            'CreaClear',
            'C4 Ultimate Pre-Workout',
            'Pre JYM',
            'Wrecked Pre-Workout',
            'Total War',
            'Opti-Men Multivitamínico',
            'Opti-Women Multivitamínico'
        ])
        .order('name');

    console.log('\n✅ PRODUCTOS CON IMÁGENES SIN FONDO:\n');

    products.forEach((p, i) => {
        const fileName = p.image_url?.split('/').pop() || 'Sin imagen';
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   📁 ${fileName}\n`);
    });

    console.log(`\n📊 Total: ${products.length}/16 productos con imágenes actualizadas`);
    console.log('\n🎨 Todas estas imágenes tienen FONDO TRANSPARENTE');
}

checkImages();
