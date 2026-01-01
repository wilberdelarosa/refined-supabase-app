import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Artifact images directory
const artifactsDir = 'C:\\\\Users\\\\wilbe\\\\.gemini\\\\antigravity\\\\brain\\\\f261c123-683a-4918-83b2-a2ecba6b0750';

// Product images to upload
const productImages = [
    {
        fileName: 'whey_protein_1767296391341.png',
        storageName: 'whey-protein.png',
        keywords: ['proteína', 'whey', 'protein']
    },
    {
        fileName: 'creatine_1767296403452.png',
        storageName: 'creatine.png',
        keywords: ['creatina', 'creatine']
    },
    {
        fileName: 'pre_workout_1767296416760.png',
        storageName: 'pre-workout.png',
        keywords: ['pre-workout', 'pre workout', 'preworkout']
    },
    {
        fileName: 'bcaa_1767296430239.png',
        storageName: 'bcaa.png',
        keywords: ['bcaa', 'aminoácidos', 'amino']
    },
    {
        fileName: 'multivitamin_1767296443133.png',
        storageName: 'multivitamin.png',
        keywords: ['multivitamínico', 'vitamina', 'vitamin']
    }
];

async function uploadImages() {
    console.log('🚀 Iniciando subida de imágenes a Supabase Storage...\n');

    // Authenticate as admin first
    console.log('🔐 Autenticando como administrador...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'wilber.alitoeirl@gmail.com',
        password: '123456'
    });

    if (authError) {
        console.error('❌ Error de autenticación:', authError.message);
        return [];
    }

    console.log('✅ Autenticado exitosamente como:', authData.user.email);
    console.log('');

    const uploadedImages = [];

    for (const image of productImages) {
        try {
            const filePath = join(artifactsDir, image.fileName);
            const fileBuffer = readFileSync(filePath);

            console.log(`📤 Subiendo ${image.storageName}...`);

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('products')
                .upload(image.storageName, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (error) {
                console.error(`❌ Error subiendo ${image.storageName}:`, error.message);
                continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(image.storageName);

            console.log(`✅ Subido: ${image.storageName}`);
            console.log(`   URL: ${publicUrl}\n`);

            uploadedImages.push({
                ...image,
                publicUrl
            });
        } catch (err) {
            console.error(`❌ Error procesando ${image.fileName}:`, err.message);
        }
    }

    return uploadedImages;
}

async function updateProducts(uploadedImages) {
    console.log('\n📝 Actualizando productos en la base de datos...\n');

    // Get all products
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*');

    if (fetchError) {
        console.error('❌ Error obteniendo productos:', fetchError.message);
        return;
    }

    console.log(`📦 Encontrados ${products.length} productos\n`);

    let updatedCount = 0;

    for (const product of products) {
        // Find matching image based on product name or category
        const matchingImage = uploadedImages.find(img =>
            img.keywords.some(keyword =>
                product.name?.toLowerCase().includes(keyword.toLowerCase()) ||
                product.category?.toLowerCase().includes(keyword.toLowerCase())
            )
        );

        if (matchingImage && !product.image_url) {
            console.log(`🔄 Actualizando "${product.name}"...`);

            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: matchingImage.publicUrl })
                .eq('id', product.id);

            if (updateError) {
                console.error(`❌ Error actualizando ${product.name}:`, updateError.message);
            } else {
                console.log(`✅ Actualizado: ${product.name} → ${matchingImage.storageName}\n`);
                updatedCount++;
            }
        } else if (product.image_url) {
            console.log(`⏭️  Saltando "${product.name}" (ya tiene imagen)\n`);
        } else {
            console.log(`⚠️  Sin imagen coincidente para "${product.name}"\n`);
        }
    }

    console.log(`\n✨ Proceso completado: ${updatedCount} productos actualizados`);
}

async function main() {
    try {
        const uploadedImages = await uploadImages();

        if (uploadedImages.length > 0) {
            await updateProducts(uploadedImages);
        } else {
            console.log('❌ No se subieron imágenes, cancelando actualización de productos');
        }
    } catch (error) {
        console.error('❌ Error en el proceso:', error.message);
    }
}

main();
