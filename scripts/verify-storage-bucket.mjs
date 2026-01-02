import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBucket() {
    console.log('🔧 Configurando bucket de Storage para comprobantes...\n');

    try {
        // 1. Verificar si el bucket existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Error listando buckets:', listError.message);
            return;
        }

        const bucketExists = buckets?.some(b => b.name === 'order-proofs');

        if (bucketExists) {
            console.log('✅ El bucket "order-proofs" ya existe\n');
        } else {
            console.log('⚠️  El bucket "order-proofs" NO existe');
            console.log('📋 Necesitas crearlo manualmente desde Dashboard:\n');
            console.log('1. Ve a: https://supabase.com/dashboard/project/xuhvlomytegdbifziilf/storage');
            console.log('2. Click "New Bucket"');
            console.log('3. Name: order-proofs');
            console.log('4. Public: YES ✅');
            console.log('5. Max file size: 10MB');
            console.log('6. Allowed MIME: image/*\n');
            return;
        }

        // 2. Verificar configuración del bucket
        const { data: bucket } = await supabase.storage.getBucket('order-proofs');

        if (bucket) {
            console.log('📦 Configuración del bucket:');
            console.log(`   • Name: ${bucket.name}`);
            console.log(`   • Public: ${bucket.public ? '✅ YES' : '❌ NO'}`);
            console.log(`   • File size limit: ${bucket.file_size_limit ? `${bucket.file_size_limit / 1024 / 1024}MB` : 'No limit'}`);
            console.log(`   • Allowed MIME: ${bucket.allowed_mime_types || 'All types'}\n`);

            if (!bucket.public) {
                console.log('⚠️  WARNING: El bucket NO es público!');
                console.log('   Las imágenes no se verán. Cambia a público en Dashboard.\n');
            }
        }

        // 3. Listar archivos existentes
        const { data: files, error: filesError } = await supabase.storage
            .from('order-proofs')
            .list();

        if (filesError) {
            console.log('⚠️  Error listando archivos:', filesError.message);
        } else {
            console.log(`📁 Archivos en bucket: ${files?.length || 0}`);
            if (files && files.length > 0) {
                files.slice(0, 5).forEach(file => {
                    console.log(`   • ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
                });
                if (files.length > 5) {
                    console.log(`   ... y ${files.length - 5} más`);
                }
            }
            console.log('');
        }

        // 4. Probar subida de archivo de prueba
        console.log('🧪 Probando subida de archivo...');
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

        const { error: uploadError } = await supabase.storage
            .from('order-proofs')
            .upload(`test-${Date.now()}.txt`, testFile);

        if (uploadError) {
            console.log('❌ Error en subida de prueba:', uploadError.message);
            console.log('   Verifica permisos del bucket\n');
        } else {
            console.log('✅ Subida de prueba exitosa!\n');
        }

        console.log('✨ Verificación completa!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

setupStorageBucket();
