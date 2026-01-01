import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import https from 'https';

const REMOVE_BG_API_KEY = 'zqGBYxYvJzvbWKooZtAyHxHz';
const logoPath = 'C:\\\\Users\\\\wilbe\\\\Downloads\\\\Barbaro2.0\\\\refined-supabase-app\\\\src\\\\assets\\\\barbaro-logo.png';
const outputPath = 'C:\\\\Users\\\\wilbe\\\\Downloads\\\\Barbaro2.0\\\\refined-supabase-app\\\\src\\\\assets\\\\barbaro-logo-nobg.png';
const backupPath = 'C:\\\\Users\\\\wilbe\\\\Downloads\\\\Barbaro2.0\\\\refined-supabase-app\\\\src\\\\assets\\\\barbaro-logo-original.png';

function removeBackground(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            console.log('📁 Leyendo logo...');
            const imageBuffer = readFileSync(inputPath);
            const base64Image = imageBuffer.toString('base64');

            const postData = JSON.stringify({
                image_file_b64: base64Image,
                size: 'auto'
            });

            const options = {
                hostname: 'api.remove.bg',
                port: 443,
                path: '/v1.0/removebg',
                method: 'POST',
                headers: {
                    'X-Api-Key': REMOVE_BG_API_KEY,
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                }
            };

            console.log('🎨 Procesando con remove.bg API...');

            const req = https.request(options, (res) => {
                const chunks = [];

                res.on('data', (chunk) => chunks.push(chunk));

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        const buffer = Buffer.concat(chunks);
                        writeFileSync(outputPath, buffer);
                        console.log(`✅ Logo sin fondo guardado: ${outputPath}`);
                        resolve(true);
                    } else {
                        const error = Buffer.concat(chunks).toString();
                        reject(new Error(`API Error ${res.statusCode}: ${error}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();

        } catch (error) {
            reject(error);
        }
    });
}

async function processLogo() {
    console.log('🔰 Procesando Logo de Barbaro Nutrition\\n');

    try {
        // Backup del logo original
        console.log('💾 Creando backup del logo original...');
        copyFileSync(logoPath, backupPath);
        console.log(`✅ Backup creado: barbaro-logo-original.png\\n`);

        // Quitar fondo
        await removeBackground(logoPath, outputPath);

        // Reemplazar el logo original con el que no tiene fondo
        console.log('\\n📝 Reemplazando logo original...');
        copyFileSync(outputPath, logoPath);
        console.log('✅ Logo actualizado: barbaro-logo.png ahora sin fondo');

        console.log('\\n✨ Proceso completado:');
        console.log('   📁 Logo sin fondo: src/assets/barbaro-logo.png');
        console.log('   💾 Backup original: src/assets/barbaro-logo-original.png');
        console.log('   🎨 Versión temporal: src/assets/barbaro-logo-nobg.png');

    } catch (error) {
        console.error('\\n❌ Error:', error.message);
    }
}

processLogo();
