/**
 * Determina qué productos de Barbaro faltan buenas imágenes y les asigna
 * las mejores disponibles de image_finder (aprobadas + pendientes con buen score).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import path, { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGE_FINDER_ROOT = resolve(__dirname, '..', '..', '..', 'image_finder');
const IMAGE_FINDER_DB = join(IMAGE_FINDER_ROOT, 'data', 'image_finder.db');
const IMAGE_FINDER_STORE = join(IMAGE_FINDER_ROOT, 'data', 'store');

function normalizeName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategory(title) {
  const t = normalizeName(title || '');
  if (/creatin|creatine/.test(t)) return 'Creatinas';
  if (/whey|protein|isolate|hydrolyz|proteina|proteín/.test(t)) return 'Proteínas';
  if (/mass|gainer|masa/.test(t)) return 'Mass Gainers';
  if (/pre.?workout|preworkout|pre.entreno|beta.?alanin|pump|burn/.test(t)) return 'Pre-Entrenos';
  if (/vitamin|vitamina|omega|biotin|calcium|zinc|iron|ashwagandha|turmeric|coq|melatonin|colageno|magnesio|multivitamin/.test(t)) return 'Vitaminas';
  return null;
}

function categoriesCompatible(barbaroCat, imgTitle) {
  const imgCat = inferCategory(imgTitle);
  if (!imgCat || !barbaroCat) return true; // si no sabemos, permitir
  return barbaroCat === imgCat;
}

function matchScore(prodName, imgProductTitle) {
  const p = new Set(normalizeName(prodName).split(/\s+/).filter(Boolean));
  const i = new Set(normalizeName(imgProductTitle).split(/\s+/).filter(Boolean));
  if (p.size === 0) return 0;
  let hits = 0;
  for (const t of p) {
    if (i.has(t)) hits++;
    else {
      for (const it of i) {
        if (it.includes(t) || t.includes(it)) { hits++; break; }
      }
    }
  }
  return hits / p.size;
}

function hasBadOrNoImage(product) {
  if (!product.image_url || product.image_url.trim() === '') return true;
  const url = product.image_url.toLowerCase();
  return url.includes('amazon') || url.includes('walmart') || url.includes('drive.google');
}

async function main() {
  console.log('🔍 Identificando productos sin buenas imágenes y buscando candidatos...\n');

  if (!existsSync(IMAGE_FINDER_DB)) {
    console.error('❌ No se encontró la BD de image_finder:', IMAGE_FINDER_DB);
    process.exit(1);
  }

  const db = new Database(IMAGE_FINDER_DB);

  // Candidatos: aprobados + pendientes con score >= 0.5 y file_path
  const candidates = db.prepare(`
    SELECT p.id as product_id, p.title, p.sku, p.brand,
           c.id as candidate_id, c.file_path, c.score, c.sha256, c.state
    FROM products p
    INNER JOIN candidates c ON c.product_id = p.id
    WHERE c.file_path IS NOT NULL
      AND (c.state = 'approved' OR (c.state = 'pending' AND c.score >= 0.5))
    ORDER BY c.state DESC, c.score DESC NULLS LAST, c.id DESC
  `).all();
  db.close();

  // Por producto image_finder: mejor candidato (aprobado > pendiente, luego por score)
  const byImgProduct = new Map();
  for (const row of candidates) {
    const key = row.product_id;
    if (!byImgProduct.has(key)) {
      byImgProduct.set(key, row);
    }
  }
  const bestCandidates = Array.from(byImgProduct.values());

  console.log(`🖼️ ${bestCandidates.length} productos en image_finder con imágenes utilizables\n`);

  const { data: barbaroProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, category, image_url');

  if (fetchErr) {
    console.error('❌ Error:', fetchErr.message);
    process.exit(1);
  }

  const missing = barbaroProducts.filter(hasBadOrNoImage);
  console.log(`⚠️ ${missing.length} productos de Barbaro necesitan mejor imagen:\n`);
  missing.forEach(p => console.log(`   - ${p.name}`));
  console.log('');

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'wilber.alitoeirl@gmail.com',
    password: '123456'
  });
  if (authError) {
    console.error('❌ Auth:', authError.message);
    process.exit(1);
  }

  let filled = 0;
  const stillMissing = [];
  const MIN_MATCH = 0.5; // Umbral mínimo y misma categoría

  for (const prod of missing) {
    let bestCand = null;
    let bestScore = 0;

    for (const cand of bestCandidates) {
      if (!categoriesCompatible(prod.category, cand.title)) continue;
      const score = matchScore(prod.name, cand.title);
      if (score > bestScore && score >= MIN_MATCH) {
        bestScore = score;
        bestCand = cand;
      }
    }

    if (!bestCand) {
      stillMissing.push({ name: prod.name, category: prod.category });
      continue;
    }

    let absPath = bestCand.file_path;
    if (!path.isAbsolute(bestCand.file_path)) {
      const base = bestCand.file_path.startsWith('store/') ? IMAGE_FINDER_STORE : join(IMAGE_FINDER_ROOT, 'data');
      absPath = join(base, bestCand.file_path.replace(/^store\//, ''));
    }
    if (!existsSync(absPath)) {
      const hashFile = join(IMAGE_FINDER_STORE, (bestCand.sha256 || '') + '.jpg');
      if (existsSync(hashFile)) absPath = hashFile;
      else {
        stillMissing.push({ name: prod.name, reason: 'archivo no encontrado' });
        continue;
      }
    }

    try {
      const ext = absPath.endsWith('.jpg') || absPath.endsWith('.jpeg') ? 'jpg' : 'png';
      const storageName = `${prod.id}/main.${ext}`;
      const fileBuffer = readFileSync(absPath);

      const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(storageName, fileBuffer, {
          contentType: ext === 'jpg' ? 'image/jpeg' : 'image/png',
          upsert: true
        });

      if (uploadErr) {
        stillMissing.push({ name: prod.name, reason: uploadErr.message });
        continue;
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(storageName);
      const publicUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', prod.id);

      if (updateErr) {
        stillMissing.push({ name: prod.name, reason: updateErr.message });
      } else {
        await supabase.from('product_images').delete().eq('product_id', prod.id);
        await supabase.from('product_images').insert({
          product_id: prod.id,
          url: publicUrl,
          alt_text: prod.name,
          is_primary: true,
          display_order: 0
        });
        filled++;
        console.log(`✅ ${prod.name} ← ${bestCand.title} (score ${bestScore.toFixed(2)})`);
      }
    } catch (err) {
      stillMissing.push({ name: prod.name, reason: String(err) });
    }
  }

  console.log(`\n✨ Resultado:`);
  console.log(`   ✓ Productos actualizados: ${filled}`);
  console.log(`   ⚠️ Sin imagen adecuada en image_finder: ${stillMissing.length}\n`);

  if (stillMissing.length > 0) {
    console.log('📋 Productos que aún necesitan imagen (buscar en image_finder o añadir manualmente):');
    stillMissing.forEach(m => console.log(`   - ${m.name}${m.reason ? ` (${m.reason})` : ''}`));
  }
}

main().catch(e => {
  console.error('❌', e);
  process.exit(1);
});
