/**
 * Importa las mejores imágenes aprobadas desde image_finder hacia Barbaro (Supabase).
 * Hace match por nombre de producto (normalizado) y sube solo las que coincidan bien.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import path, { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase (mismo que professional-image-manager)
const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta a image_finder
const IMAGE_FINDER_ROOT = resolve(__dirname, '..', '..', '..', 'image_finder');
const IMAGE_FINDER_DB = join(IMAGE_FINDER_ROOT, 'data', 'image_finder.db');
const IMAGE_FINDER_STORE = join(IMAGE_FINDER_ROOT, 'data', 'store');

/** Normaliza nombre para matching (quita acentos, minúsculas, quita caracteres especiales) */
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

/** Calcula similitud: cuántos tokens del título del producto están en el título de la imagen */
function matchScore(prodName, imgProductTitle) {
  const p = new Set(normalizeName(prodName).split(/\s+/).filter(Boolean));
  const i = new Set(normalizeName(imgProductTitle).split(/\s+/).filter(Boolean));
  if (p.size === 0) return 0;
  let hits = 0;
  for (const t of p) {
    if (i.has(t)) hits++;
    else {
      // match parcial: "whey" en "whey protein"
      for (const it of i) {
        if (it.includes(t) || t.includes(it)) { hits++; break; }
      }
    }
  }
  return hits / p.size;
}

async function main() {
  console.log('📥 Importando imágenes desde image_finder a Barbaro\n');

  // 1. Leer aprobadas de image_finder
  if (!existsSync(IMAGE_FINDER_DB)) {
    console.error('❌ No se encontró la BD de image_finder:', IMAGE_FINDER_DB);
    process.exit(1);
  }

  const db = new Database(IMAGE_FINDER_DB);
  const approved = db.prepare(`
    SELECT p.id as product_id, p.title, p.sku, p.brand,
           c.id as candidate_id, c.file_path, c.score, c.sha256
    FROM products p
    INNER JOIN candidates c ON c.product_id = p.id AND c.state = 'approved'
    WHERE c.file_path IS NOT NULL
    ORDER BY p.title, c.score DESC NULLS LAST, c.id DESC
  `).all();
  db.close();

  console.log(`🖼️ ${approved.length} candidatos aprobados en image_finder`);

  // 2. Por cada producto, quedarse con la mejor imagen (mayor score)
  const byProduct = new Map();
  for (const row of approved) {
    const key = row.product_id;
    if (!byProduct.has(key)) {
      byProduct.set(key, row);
    }
  }

  const bestCandidates = Array.from(byProduct.values());
  console.log(`📦 ${bestCandidates.length} productos únicos con imagen aprobada\n`);

  // 3. Obtener productos de Barbaro
  const { data: barbaroProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, category, image_url');

  if (fetchErr) {
    console.error('❌ Error obteniendo productos Barbaro:', fetchErr.message);
    process.exit(1);
  }

  console.log(`🏪 ${barbaroProducts.length} productos en Barbaro\n`);

  // 4. Autenticar
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'wilber.alitoeirl@gmail.com',
    password: '123456'
  });
  if (authError) {
    console.error('❌ Error de autenticación:', authError.message);
    process.exit(1);
  }

  let uploaded = 0;
  let updated = 0;
  const results = [];

  for (const cand of bestCandidates) {
    const imgTitle = cand.title;
    const filePath = cand.file_path;

    // Resolver ruta del archivo (puede ser absoluta o relativa a store)
    let absPath = filePath;
    if (!path.isAbsolute(filePath)) {
      const base = filePath.startsWith('store/') ? IMAGE_FINDER_STORE : join(IMAGE_FINDER_ROOT, 'data');
      absPath = join(base, filePath.replace(/^store\//, ''));
    }
    if (!existsSync(absPath)) {
      // Probar solo el hash en store
      const hashFile = join(IMAGE_FINDER_STORE, (cand.sha256 || '') + '.jpg');
      if (existsSync(hashFile)) absPath = hashFile;
      else {
        results.push({ product: imgTitle, status: 'skip', reason: 'archivo no encontrado' });
        continue;
      }
    }

    // Buscar mejor match en Barbaro
    let bestMatch = null;
    let bestScore = 0;
    for (const p of barbaroProducts) {
      const score = matchScore(p.name, imgTitle);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = p;
      }
    }

    if (!bestMatch) {
      results.push({ product: imgTitle, status: 'no_match' });
      continue;
    }

    // Preferir productos sin imagen o con imagen de terceros (amazon, walmart, drive)
    const hasBadImage = bestMatch.image_url && (
      bestMatch.image_url.includes('amazon') ||
      bestMatch.image_url.includes('walmart') ||
      bestMatch.image_url.includes('drive.google')
    );
    if (bestMatch.image_url && !hasBadImage) {
      results.push({ product: imgTitle, match: bestMatch.name, status: 'skip', reason: 'ya tiene imagen buena' });
      continue;
    }

    try {
      const ext = absPath.endsWith('.jpg') || absPath.endsWith('.jpeg') ? 'jpg' : 'png';
      const storageName = `${bestMatch.id}/main.${ext}`;

      const fileBuffer = readFileSync(absPath);

      const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(storageName, fileBuffer, {
          contentType: ext === 'jpg' ? 'image/jpeg' : 'image/png',
          upsert: true
        });

      if (uploadErr) {
        results.push({ product: imgTitle, match: bestMatch.name, status: 'error', error: uploadErr.message });
        continue;
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(storageName);
      const publicUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', bestMatch.id);

      if (updateErr) {
        results.push({ product: imgTitle, match: bestMatch.name, status: 'update_error', error: updateErr.message });
      } else {
        // También agregar a product_images para la galería
        await supabase.from('product_images').delete().eq('product_id', bestMatch.id);
        await supabase.from('product_images').insert({
          product_id: bestMatch.id,
          url: publicUrl,
          alt_text: bestMatch.name,
          is_primary: true,
          display_order: 0
        });
        uploaded++;
        updated++;
        results.push({ product: imgTitle, match: bestMatch.name, status: 'ok', url: publicUrl });
        console.log(`✅ ${bestMatch.name} ← ${imgTitle}`);
      }
    } catch (err) {
      results.push({ product: imgTitle, match: bestMatch?.name, status: 'error', error: String(err) });
    }
  }

  console.log(`\n✨ Completado:`);
  console.log(`   📤 Imágenes subidas: ${uploaded}`);
  console.log(`   ✓ Productos actualizados: ${updated}`);
  console.log(`   ⏭️ Sin match: ${results.filter(r => r.status === 'no_match').length}`);
  console.log(`   ⏭️ Omitidos: ${results.filter(r => r.status === 'skip').length}`);
}

main().catch(e => {
  console.error('❌', e);
  process.exit(1);
});
