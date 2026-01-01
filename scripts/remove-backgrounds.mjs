import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import https from 'https';

const REMOVE_BG_API_KEY = 'zqGBYxYvJzvbWKooZtAyHxHz';
const artifactsDir = 'C:\\\\Users\\\\wilbe\\\\.gemini\\\\antigravity\\\\brain\\\\f261c123-683a-4918-83b2-a2ecba6b0750';

// Lista de imágenes generadas
const images = [
    // Proteins
    { file: 'gold_standard_whey_1767298682112.png', output: 'gold_standard_whey_nobg.png' },
    { file: 'platinum_hydrowhey_1767298694686.png', output: 'platinum_hydrowhey_nobg.png' },
    { file: 'nitro_tech_whey_1767298707973.png', output: 'nitro_tech_whey_nobg.png' },
    { file: 'iso100_hydrolyzed_1767298727104.png', output: 'iso100_hydrolyzed_nobg.png' },
    { file: 'combat_protein_1767298741664.png', output: 'combat_protein_nobg.png' },
    { file: 'glutamine_powder_1767298755830.png', output: 'glutamine_powder_nobg.png' },

    // Creatines
    { file: 'platinum_creatine_1767298779548.png', output: 'platinum_creatine_nobg.png' },
    { file: 'celltech_creatine_1767298793941.png', output: 'celltech_creatine_nobg.png' },
    { file: 'creatine_hcl_1767298808238.png', output: 'creatine_hcl_nobg.png' },
    { file: 'creaclear_1767298824073.png', output: 'creaclear_nobg.png' },

    // Pre-Workouts
    { file: 'c4_ultimate_1767298837357.png', output: 'c4_ultimate_nobg.png' },
    { file: 'pre_jym_1767298851700.png', output: 'pre_jym_nobg.png' },
    { file: 'wrecked_preworkout_1767298866293.png', output: 'wrecked_preworkout_nobg.png' },
    { file: 'total_war_1767298879247.png', output: 'total_war_nobg.png' },

    // Vitamins
    { file: 'opti_men_1767298907893.png', output: 'opti_men_nobg.png' },
    { file: 'opti_women_1767298920960.png', output: 'opti_women_nobg.png' },
];

function removeBackground(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        try {
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

            const req = https.request(options, (res) => {
                const chunks = [];

                res.on('data', (chunk) => chunks.push(chunk));

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        const buffer = Buffer.concat(chunks);
                        writeFileSync(outputPath, buffer);
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

async function processAllImages() {
    console.log('🎨 Iniciando eliminación de fondos...\\n');
    console.log(`📁 Directorio: ${artifactsDir}\\n`);

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const inputPath = join(artifactsDir, img.file);
        const outputPath = join(artifactsDir, img.output);

        console.log(`[${i + 1}/${images.length}] Procesando: ${img.file}`);

        try {
            await removeBackground(inputPath, outputPath);
            console.log(`✅ Guardado: ${img.output}\\n`);
            processed++;
        } catch (error) {
            console.log(`❌ Error: ${error.message}\\n`);
            failed++;
        }

        // Pausa para no saturar la API
        if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    console.log('\\n📊 Resultado:');
    console.log(`   ✅ Procesadas: ${processed}/${images.length}`);
    console.log(`   ❌ Fallidas: ${failed}/${images.length}`);

    if (processed > 0) {
        console.log('\\n✨ Imágenes sin fondo guardadas en:');
        console.log(`   ${artifactsDir}`);
        console.log('\\nPrefijo: *_nobg.png');
    }
}

processAllImages().catch(console.error);
