import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', '..', '..', 'image_finder', 'data', 'image_finder.db');
const db = new Database(dbPath);

const queue = db.prepare("SELECT COUNT(*) as c FROM products WHERE status IN ('new','retry','searching')").get();
const approved = db.prepare("SELECT COUNT(*) as c FROM candidates WHERE state='approved'").get();
const pending = db.prepare("SELECT COUNT(*) as c FROM candidates WHERE state='pending'").get();

console.log('Image Finder status:');
console.log('  En cola (new/retry/searching):', queue.c);
console.log('  Candidatos aprobados:', approved.c);
console.log('  Candidatos pendientes:', pending.c);

const products = db.prepare('SELECT id, title, status FROM products ORDER BY id DESC LIMIT 25').all();
console.log('\nÚltimos productos:');
products.forEach(p => {
  const cands = db.prepare('SELECT state, COUNT(*) as c FROM candidates WHERE product_id=? GROUP BY state').all(p.id);
  console.log(`  ${p.id} | ${p.status} | ${p.title.substring(0,50)} | ${JSON.stringify(cands)}`);
});

db.close();
