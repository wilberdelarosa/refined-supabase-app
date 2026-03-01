/**
 * Usa Image Finder para buscar imágenes de productos faltantes y las importa a Barbaro.
 * Requiere: image_finder corriendo en http://localhost:5177 (npm run dev)
 */
import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import path, { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const IMAGE_FINDER_URL = process.env.IMAGE_FINDER_URL || 'http://localhost:5177';
const IMAGE_FINDER_ROOT = resolve(__dirname, '..', '..', '..', 'image_finder');
const IMAGE_FINDER_DB = join(IMAGE_FINDER_ROOT, 'data', 'image_finder.db');

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';
const supabase = createClient(supabaseUrl, supabaseKey);

function hasBadOrNoImage(p) {
  if (!p.image_url || !p.image_url.trim()) return true;
  const u = p.image_url.toLowerCase();
  return u.includes('amazon') || u.includes('walmart') || u.includes('drive.google');
}

/** Genera query de búsqueda óptima para Bing/Google */
function buildSearchQuery(name, category) {
  const n = String(name || '');
  // Quitar cantidades exactas que restringen demasiado
  let q = n.replace(/\s+\d+\.?\d*\s*(LB|OZ|G|MG|MCG|SERVICIOS|CAPSULAS|CÁPSULAS)\b/gi, ' ');
  q = q.replace(/\s+/g, ' ').trim();
  if (q.length < 10) return n;
  // Añadir "supplement" o término de categoría si ayuda
  if (category === 'Creatinas') q += ' creatine supplement';
  else if (category === 'Pre-Entrenos') q += ' pre workout supplement';
  else if (category === 'Mass Gainers') q += ' mass gainer';
  else if (category === 'Proteínas') q += ' protein supplement';
  else if (category === 'Vitaminas') q += ' supplement';
  return q.substring(0, 80);
}

async function api(path, opts = {}) {
  const url = IMAGE_FINDER_URL + path;
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
  const text = await r.text();
  try {
    return { ok: r.ok, data: JSON.parse(text), status: r.status };
  } catch {
    return { ok: r.ok, data: null, status: r.status, raw: text };
  }
}

async function main() {
  console.log('🔍 Usando Image Finder para buscar imágenes faltantes\n');

  // 1. Verificar image_finder
  let useApi = false;
  try {
    const h = await api('/api/health');
    if (h.ok) {
      useApi = true;
      console.log('✅ Image Finder API disponible:', IMAGE_FINDER_URL);
    }
  } catch (e) {
    console.log('⚠️ Image Finder API no responde. Usando solo base de datos local.\n');
  }

  if (!existsSync(IMAGE_FINDER_DB)) {
    console.error('❌ No se encontró', IMAGE_FINDER_DB);
    console.log('   Inicia image_finder: cd image_finder && npm run dev');
    process.exit(1);
  }

  const db = new Database(IMAGE_FINDER_DB);

  // 2. Productos Barbaro sin buena imagen
  const { data: barbaroProducts } = await supabase.from('products').select('id, name, category, image_url');
  const missing = barbaroProducts.filter(hasBadOrNoImage);

  if (missing.length === 0) {
    console.log('✅ Todos los productos ya tienen buena imagen.');
    db.close();
    return;
  }

  console.log(`⚠️ ${missing.length} productos necesitan imagen:\n`);

  const existingTitles = new Set(
    db.prepare('SELECT title FROM products').all().map(r => r.title.toLowerCase().trim())
  );

  let added = 0;
  let queued = 0;

  for (const p of missing) {
    const title = p.name.trim();
    const titleLower = title.toLowerCase();
    const query = buildSearchQuery(p.name, p.category);

    if (useApi) {
      // Crear vía API si no existe
      const list = await api('/api/products');
      const exists = list.data?.items?.some(i => i.title?.toLowerCase() === titleLower);
      if (!exists) {
        const cre = await api('/api/products', {
          method: 'POST',
          body: JSON.stringify({ title, query, brand: p.category })
        });
        if (cre.ok) {
          added++;
          console.log(`   + ${title}`);
        }
      }
    } else {
      // Crear directo en DB
      if (!existingTitles.has(titleLower)) {
        db.prepare(
          'INSERT INTO products(title, sku, brand, query, status) VALUES (?, ?, ?, ?, ?)'
        ).run(title, null, p.category, query, 'new');
        existingTitles.add(titleLower);
        added++;
        console.log(`   + ${title}`);
      }
    }
  }

  if (added > 0) {
    console.log(`\n📤 ${added} productos añadidos a Image Finder con status 'new'`);
  }

  // 3. Marcar como retry los que ya existían pero no tienen aprobadas
  const productsInDb = db.prepare('SELECT id, title FROM products').all();
  for (const p of productsInDb) {
    const hasApproved = db.prepare(
      'SELECT 1 FROM candidates WHERE product_id=? AND state=?'
    ).get(p.id, 'approved');
    const missingProd = missing.find(m => m.name.toLowerCase().trim() === p.title.toLowerCase().trim());
    if (!hasApproved && missingProd) {
      db.prepare("UPDATE products SET status='retry' WHERE id=?").run(p.id);
      queued++;
    }
  }
  if (queued > 0) {
    console.log(`   ${queued} productos en cola para búsqueda (retry)\n`);
  }

  db.close();

  // 4. Iniciar worker de búsqueda (requiere API)
  if (useApi) {
    console.log('🚀 Iniciando búsqueda en Image Finder...');
    const run = await api('/api/run-search', { method: 'POST' });
    if (run.ok) {
      console.log('   Worker activado. Las búsquedas se ejecutan en segundo plano.');
      console.log('\n⏳ Esperando 90 segundos para que busque y descargue imágenes...');
      await new Promise(r => setTimeout(r, 90000));

      // 5. Auto-aprobar (si OPENROUTER_API_KEY está configurado)
      try {
        console.log('\n🤖 Ejecutando aprobación automática por IA...');
        const approve = await api('/api/auto-approve-global', {
          method: 'POST',
          body: JSON.stringify({ maxApproved: 3, minScoreForSelection: 0.75 })
        });
        if (approve.ok && approve.data?.total_approved > 0) {
          console.log(`   ✓ ${approve.data.total_approved} imágenes aprobadas automáticamente`);
        } else if (approve.data?.error) {
          console.log('   ⚠️', approve.data.error);
        }
      } catch (e) {
        console.log('   ⚠️ Auto-aprobación falló (puedes aprobar manualmente en http://localhost:5177)');
      }
    }
  } else {
    console.log('\n💡 Para que Image Finder busque automáticamente:');
    console.log('   1. cd C:\\Users\\wilbe\\Downloads\\image_finder');
    console.log('   2. npm run dev');
    console.log('   3. Abre http://localhost:5177 y haz clic en "Iniciar búsqueda"');
    console.log('   4. Espera a que termine, usa "Aprobación automática (IA)" si quieres');
    console.log('   5. Ejecuta: npm run import:images');
  }

  // 6. Importar lo que haya
  console.log('\n📥 Importando imágenes aprobadas a Barbaro...');
  const { execSync } = await import('child_process');
  try {
    execSync('node scripts/import-image-finder.mjs', {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit'
    });
  } catch {
    console.log('   (Ejecuta manualmente: npm run import:images)');
  }
  console.log('\n✨ Listo.');
}

main().catch(e => {
  console.error('❌', e);
  process.exit(1);
});
