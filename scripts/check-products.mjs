import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    // Authenticate
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'wilber.alitoeirl@gmail.com',
        password: '123456'
    });

    if (authError) {
        console.error('❌ Error:', authError.message);
        return;
    }

    // Get all products
    const { data: products } = await supabase
        .from('products')
        .select('id, name, category, image_url')
        .order('name');

    console.log('\n📦 PRODUCTOS EN LA BASE DE DATOS:\n');
    console.log('Total:', products.length, 'productos\n');

    products.forEach((p, i) => {
        const hasImage = p.image_url ? '✅' : '❌';
        console.log(`${i + 1}. ${hasImage} ${p.name}`);
        console.log(`   Categoría: ${p.category}`);
        if (p.image_url) {
            const fileName = p.image_url.split('/').pop();
            console.log(`   Imagen: ${fileName}`);
        } else {
            console.log(`   Imagen: SIN IMAGEN`);
        }
        console.log('');
    });

    // Check storage
    const { data: files } = await supabase.storage
        .from('products')
        .list();

    console.log('\n📁 IMÁGENES EN STORAGE:\n');
    files?.forEach(file => {
        const url = `https://xuhvlomytegdbifziilf.supabase.co/storage/v1/object/public/products/${file.name}`;
        console.log(`- ${file.name}`);
        console.log(`  ${url}\n`);
    });
}

checkProducts();
