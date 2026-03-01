/**
 * Aprueba el mejor candidato pendiente (por score) para cada producto
 * que aún no tiene aprobados. Alternativa rápida sin IA.
 */
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', '..', '..', 'image_finder', 'data', 'image_finder.db');
const db = new Database(dbPath);

const productsNeedingApproval = db.prepare(`
  SELECT p.id, p.title
  FROM products p
  WHERE NOT EXISTS (SELECT 1 FROM candidates c WHERE c.product_id = p.id AND c.state = 'approved')
  AND EXISTS (SELECT 1 FROM candidates c WHERE c.product_id = p.id AND c.state = 'pending' AND c.file_path IS NOT NULL)
`).all();

let approved = 0;
for (const prod of productsNeedingApproval) {
  const best = db.prepare(`
    SELECT id, score FROM candidates 
    WHERE product_id = ? AND state = 'pending' AND file_path IS NOT NULL 
    ORDER BY score DESC NULLS LAST LIMIT 1
  `).get(prod.id);
  if (best) {
    db.prepare('UPDATE candidates SET state = ? WHERE id = ?').run('approved', best.id);
    db.prepare(
      'INSERT INTO events(kind, product_id, candidate_id, payload_json) VALUES (?, ?, ?, ?)'
    ).run('approve', prod.id, best.id, JSON.stringify({ source: 'manual_best_score', score: best.score }));
    console.log(`✓ ${prod.title.substring(0, 50)} <- score ${best.score || 'N/A'}`);
    approved++;
  }
}

console.log(`\n✨ Aprobados: ${approved} productos`);
db.close();
