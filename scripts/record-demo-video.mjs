/**
 * Graba un video PROFESIONAL de uso de la página: recorrido completo público + panel admin,
 * con pausas largas (~10–12 s por pantalla) para narración de ~10 min.
 *
 * Uso:
 *   1. Iniciar la app: npm run dev
 *   2. Ejecutar: npm run demo-video
 *      o: node scripts/record-demo-video.mjs
 *
 * Requerido para panel admin (recomendado para video completo):
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=...
 *
 * Opcional para sección cliente (cuenta, favoritos, pedidos, checkout):
 *   E2E_USER_EMAIL=... E2E_USER_PASSWORD=...
 *
 * El video se guarda en docs/videos/barbaro-demo.webm
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const OUT_DIR = path.join(ROOT, 'docs', 'videos');
const VIDEO_PATH = path.join(OUT_DIR, 'barbaro-demo.webm');

const VIEWPORT = { width: 1280, height: 720 };

// Pausas para video profesional (~10 min narración): pantallas principales 10–12 s, transiciones 6–7 s
const PAUSE_MAIN = 12000;   // 12 s en pantallas clave (inicio, tienda, producto, dashboard, pedidos, productos)
const PAUSE_MED  = 9000;   // 9 s en pantallas secundarias (about, auth, inventario, categorías, etc.)
const PAUSE_SHORT = 6000;   // 6 s en transiciones o listados rápidos

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function gotoAndWait(page, url, label, pauseMs = PAUSE_MAIN) {
  console.log('  →', label || url);
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(pauseMs);
}

async function scrollPage(page, direction = 'down', amount = 400) {
  await page.evaluate(({ amount, direction }) => {
    const y = direction === 'down' ? amount : -amount;
    window.scrollBy({ top: y, behavior: 'smooth' });
  }, { amount, direction });
  await sleep(1500);
}

async function loginAsUser(page, email, password) {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(800);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname !== '/auth', { timeout: 12000 }).catch(() => {});
  await sleep(2000);
}

async function getFirstProductId(page) {
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1500);
  const href = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/producto/"]');
    return link ? link.getAttribute('href') : null;
  });
  if (href) {
    const id = href.replace('/producto/', '').trim();
    if (id) return id;
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();

  const hasAdmin = process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD;
  const hasUser = process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD;

  console.log('Base URL:', BASE_URL);
  console.log('Video profesional: público +', hasUser ? 'cliente + ' : '', hasAdmin ? 'admin' : '(solo público)');
  console.log('Pausas: 12 s (principales), 9 s (secundarias), 6 s (transiciones)\n');

  try {
    // ——— PARTE PÚBLICA ———
    await gotoAndWait(page, '/', 'Inicio', PAUSE_MAIN);
    await gotoAndWait(page, '/shop', 'Tienda', PAUSE_MAIN);
    await scrollPage(page, 'down', 350);
    await sleep(2000);
    await scrollPage(page, 'up', 350);
    await sleep(1000);

    // Añadir un producto al carrito para que el drawer no esté vacío
    const addCartBtn = page.locator('button:has-text("Agregar al Carrito"), button:has-text("Agregar al carrito")').first();
    if (await addCartBtn.isVisible().catch(() => false)) {
      await addCartBtn.click();
      await sleep(1500);
    }

    const productId = await getFirstProductId(page);
    if (productId) {
      await gotoAndWait(page, `/producto/${productId}`, 'Detalle de producto', PAUSE_MAIN);
      await scrollPage(page, 'down', 300);
      await sleep(2000);
      await scrollPage(page, 'down', 300);
      await sleep(1500);
      await scrollPage(page, 'up', 600);
      await sleep(800);
    }

    // Abrir carrito (drawer) vía evento personalizado
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('openCartDrawer')));
    await sleep(PAUSE_MED);
    await page.keyboard.press('Escape');
    await sleep(800);

    await gotoAndWait(page, '/about', 'Sobre nosotros', PAUSE_MED);
    await gotoAndWait(page, '/auth', 'Iniciar sesión / Registro', PAUSE_MED);

    // ——— OPCIONAL: SECCIÓN CLIENTE (con usuario) ———
    if (hasUser) {
      await loginAsUser(page, process.env.E2E_USER_EMAIL, process.env.E2E_USER_PASSWORD);
      await gotoAndWait(page, '/account', 'Mi cuenta', PAUSE_MED);
      await gotoAndWait(page, '/profile/edit', 'Editar perfil', PAUSE_SHORT);
      await gotoAndWait(page, '/wishlist', 'Favoritos', PAUSE_MED);
      await gotoAndWait(page, '/orders', 'Mis pedidos', PAUSE_MED);
      await gotoAndWait(page, '/checkout/transferencia', 'Checkout (transferencia)', PAUSE_MED);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 15000 });
      await sleep(1000);
    }

    // ——— PANEL ADMIN ———
    if (hasAdmin) {
      await loginAsUser(page, process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD);
      await gotoAndWait(page, '/admin', 'Dashboard admin', PAUSE_MAIN);
      await gotoAndWait(page, '/admin/orders', 'Pedidos', PAUSE_MAIN);
      // Intentar abrir el detalle del primer pedido si hay fila clicable
      const firstOrderRow = page.locator('table tbody tr, [role="row"]').first();
      if (await firstOrderRow.isVisible().catch(() => false)) {
        await firstOrderRow.click();
        await sleep(PAUSE_MED);
        await page.keyboard.press('Escape');
        await sleep(600);
      }
      await gotoAndWait(page, '/admin/products', 'Productos', PAUSE_MAIN);
      await gotoAndWait(page, '/admin/inventory', 'Inventario', PAUSE_MED);
      await gotoAndWait(page, '/admin/categories', 'Categorías', PAUSE_MED);
      await gotoAndWait(page, '/admin/payment-methods', 'Métodos de pago', PAUSE_MED);
      await gotoAndWait(page, '/admin/discounts', 'Descuentos', PAUSE_MED);
      await gotoAndWait(page, '/admin/invoices', 'Facturas', PAUSE_MED);
      await gotoAndWait(page, '/admin/users', 'Usuarios', PAUSE_MED);
    }
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      await video.saveAs(VIDEO_PATH);
      console.log('\nVideo guardado:', VIDEO_PATH);
    } else {
      console.warn('\nNo se generó archivo de video.');
    }
  }

  await browser.close();
}

main().catch((err) => {
  if (err.message && (err.message.includes('Executable doesn\'t exist') || err.message.includes('browserType.launch'))) {
    console.error('\n[Playwright] Instala Chromium: npx playwright install chromium\n');
  } else {
    console.error(err);
  }
  process.exit(1);
});
