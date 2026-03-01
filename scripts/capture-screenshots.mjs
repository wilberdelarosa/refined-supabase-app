/**
 * Captura capturas de pantalla de todas las rutas de la app en versión web y móvil.
 *
 * Uso:
 *   1. Iniciar la app: npm run dev
 *   2. Ejecutar: node scripts/capture-screenshots.mjs
 *
 * Opcional (para rutas que requieren login):
 *   E2E_USER_EMAIL=... E2E_USER_PASSWORD=... E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=...
 *   PRODUCT_ID=uuid ORDER_ID=uuid INVOICE_ID=uuid
 *
 * Las capturas se guardan en docs/screenshots/web/ y docs/screenshots/mobile/
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const OUT_WEB = path.join(ROOT, 'docs', 'screenshots', 'web');
const OUT_MOBILE = path.join(ROOT, 'docs', 'screenshots', 'mobile');

const VIEWPORTS = {
  web: { width: 1280, height: 720 },
  mobile: { width: 375, height: 667 },
};

/** Rutas públicas (sin login) */
const PUBLIC_ROUTES = [
  { path: '/', name: '01-inicio' },
  { path: '/auth', name: '02-auth' },
  { path: '/shop', name: '03-tienda' },
  { path: '/about', name: '04-sobre-nosotros' },
];

/** Rutas que requieren un ID (se rellenan en runtime) */
const DYNAMIC_ROUTES = [
  { path: (id) => `/producto/${id}`, name: '05-producto-detalle', needId: 'product' },
  { path: (id) => `/order/${id}`, name: '06-order-confirmation', needId: 'order' },
  { path: (id) => `/orders/invoice/${id}`, name: '07-factura', needId: 'invoice' },
];

/** Rutas que requieren usuario logueado (cliente) */
const AUTH_ROUTES = [
  { path: '/account', name: '08-mi-cuenta' },
  { path: '/profile/edit', name: '09-editar-perfil' },
  { path: '/wishlist', name: '10-favoritos' },
  { path: '/orders', name: '11-mis-pedidos' },
  { path: '/checkout/transferencia', name: '12-checkout-transferencia' },
];

/** Rutas admin (requieren login admin) */
const ADMIN_ROUTES = [
  { path: '/admin', name: 'admin-01-dashboard' },
  { path: '/admin/orders', name: 'admin-02-pedidos' },
  { path: '/admin/products', name: 'admin-03-productos' },
  { path: '/admin/inventory', name: 'admin-04-inventario' },
  { path: '/admin/categories', name: 'admin-05-categorias' },
  { path: '/admin/payment-methods', name: 'admin-06-metodos-pago' },
  { path: '/admin/discounts', name: 'admin-07-descuentos' },
  { path: '/admin/invoices', name: 'admin-08-facturas' },
  { path: '/admin/users', name: 'admin-09-usuarios' },
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function capturePage(page, url, filepath, waitMs = 800) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(waitMs);
    await page.screenshot({
      path: filepath,
      fullPage: true,
    });
    console.log('  OK', filepath);
    return true;
  } catch (err) {
    console.warn('  SKIP', url, err.message);
    return false;
  }
}

async function getFirstProductId(page) {
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
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

async function loginAsUser(page, email, password) {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname !== '/auth' || url.pathname === '/', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function runCaptures(viewportName, viewport, outDir, options = {}) {
  const { productId, orderId, invoiceId, doAuth, doAdmin } = options;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    userAgent: viewportName === 'mobile'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      : undefined,
  });
  const page = await context.newPage();

  console.log(`\n--- ${viewportName.toUpperCase()} ---\n`);

  for (const r of PUBLIC_ROUTES) {
    const filepath = path.join(outDir, `${r.name}.png`);
    await capturePage(page, `${BASE_URL}${r.path}`, filepath);
  }

  let resolvedProductId = productId;
  if (!resolvedProductId && (orderId || !productId)) {
    resolvedProductId = await getFirstProductId(page);
  }
  if (resolvedProductId) {
    const r = DYNAMIC_ROUTES.find(x => x.needId === 'product');
    const filepath = path.join(outDir, `${r.name}.png`);
    await capturePage(page, `${BASE_URL}/producto/${resolvedProductId}`, filepath);
  }

  if (orderId) {
    const r = DYNAMIC_ROUTES.find(x => x.needId === 'order');
    const filepath = path.join(outDir, `${r.name}.png`);
    await capturePage(page, `${BASE_URL}/order/${orderId}`, filepath);
  }
  if (invoiceId) {
    const r = DYNAMIC_ROUTES.find(x => x.needId === 'invoice');
    const filepath = path.join(outDir, `${r.name}.png`);
    await capturePage(page, `${BASE_URL}/orders/invoice/${invoiceId}`, filepath);
  }

  if (doAuth && process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
    await loginAsUser(page, process.env.E2E_USER_EMAIL, process.env.E2E_USER_PASSWORD);
    for (const r of AUTH_ROUTES) {
      const filepath = path.join(outDir, `${r.name}.png`);
      await capturePage(page, `${BASE_URL}${r.path}`, filepath);
    }
  }

  await browser.close();

  if (doAdmin && process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD) {
    const browserAdmin = await chromium.launch({ headless: true });
    const contextAdmin = await browserAdmin.newContext({ viewport });
    const pageAdmin = await contextAdmin.newPage();
    await loginAsUser(pageAdmin, process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD);
    for (const r of ADMIN_ROUTES) {
      const filepath = path.join(outDir, `${r.name}.png`);
      await capturePage(pageAdmin, `${BASE_URL}${r.path}`, filepath);
    }
    await browserAdmin.close();
  }
}

async function main() {
  const productId = process.env.PRODUCT_ID || null;
  const orderId = process.env.ORDER_ID || null;
  const invoiceId = process.env.INVOICE_ID || null;
  const doAuth = !!process.env.E2E_USER_EMAIL;
  const doAdmin = !!process.env.E2E_ADMIN_EMAIL;

  await ensureDir(OUT_WEB);
  await ensureDir(OUT_MOBILE);

  console.log('Base URL:', BASE_URL);
  console.log('Capturas públicas + producto (si hay en /shop)');
  if (doAuth) console.log('+ rutas con usuario (E2E_USER_*)');
  if (doAdmin) console.log('+ rutas admin (E2E_ADMIN_*)');
  if (orderId) console.log('+ order', orderId);
  if (invoiceId) console.log('+ invoice', invoiceId);

  await runCaptures('web', VIEWPORTS.web, OUT_WEB, {
    productId,
    orderId,
    invoiceId,
    doAuth,
    doAdmin,
  });

  await runCaptures('mobile', VIEWPORTS.mobile, OUT_MOBILE, {
    productId,
    orderId,
    invoiceId,
    doAuth,
    doAdmin,
  });

  console.log('\nListo. Capturas en docs/screenshots/web/ y docs/screenshots/mobile/');
}

main().catch((err) => {
  if (err.message && (err.message.includes('Executable doesn\'t exist') || err.message.includes('browserType.launch'))) {
    console.error('\n[Playwright] No se encontró el navegador Chromium. Instálalo una vez con:\n');
    console.error('  npx playwright install chromium\n');
    console.error('Luego vuelve a ejecutar: npm run screenshots\n');
  } else {
    console.error(err);
  }
  process.exit(1);
});
