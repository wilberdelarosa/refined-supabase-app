import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ASSETS_DIR = path.resolve(process.cwd(), 'src/assets');
const OUTPUT_JSON = path.resolve(process.cwd(), 'scripts/uploads.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'products';
const SHOULD_SEED_DB = process.env.RUN_DB === 'true' || process.argv.includes('--seed');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY (or SUPABASE_KEY) environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function uploadFile(filePath, destPath) {
  const body = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage.from(BUCKET).upload(destPath, body, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(destPath);
  const publicUrl = urlData.publicUrl || urlData.public_url || urlData.publicURL;
  return publicUrl;
}

function listAssetFiles() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs.readdirSync(ASSETS_DIR).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f));
}

async function main() {
  const files = listAssetFiles();
  if (files.length === 0) {
    console.log('No image assets found in', ASSETS_DIR);
    return;
  }

  const result = {};
  for (const filename of files) {
    const fullPath = path.join(ASSETS_DIR, filename);
    // destination path inside bucket
    const dest = `images/${filename}`;
    try {
      process.stdout.write(`Uploading ${filename} ... `);
      const url = await uploadFile(fullPath, dest);
      console.log('done');
      result[filename] = url;
    } catch (err) {
      console.error('failed:', err.message || err);
    }
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(result, null, 2));
  console.log('Wrote mapping to', OUTPUT_JSON);

  if (SHOULD_SEED_DB) {
    console.log('Seeding DB with uploaded URLs (running in-service mode)');
    // Example: create or update products table entries by filename match on name
    for (const [filename, url] of Object.entries(result)) {
      // Build a generic product name from filename (without extension)
      const name = path.basename(filename, path.extname(filename)).replace(/[-_]/g, ' ');
      const product = {
        name: `Imported: ${name}`,
        description: `Imported asset ${filename}`,
        price: 0.0,
        category: 'Imported',
        stock: 0,
        image_url: url,
      };

      // Insert a product (service key required)
      const { error } = await supabase.from('products').insert(product);
      if (error) {
        console.error('DB insert failed for', filename, error.message || error);
      } else {
        console.log('Inserted product for', filename);
      }
    }
    console.log('DB seeding finished.');
  } else {
    console.log('DB seeding skipped. To enable, set RUN_DB=true or pass --seed (requires service role key).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
