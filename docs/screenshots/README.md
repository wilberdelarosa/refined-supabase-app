# Capturas de pantalla — Barbaro Nutrition

Este directorio contiene (o debe contener) capturas de **todas** las pantallas de la aplicación en versión **web** y **móvil**, para documentación y presentación al cliente.

## Estructura

- **`web/`** — Capturas en viewport escritorio (1280×720).
- **`mobile/`** — Capturas en viewport móvil (375×667).

## Cómo generar las capturas

### Requisito previo (solo la primera vez)

Instala el navegador Chromium que usa Playwright. En la raíz del proyecto ejecuta:

```bash
npx playwright install chromium
```

(Si prefieres instalar todos los navegadores: `npx playwright install`.)

### Pasos

1. **Iniciar la aplicación** en tu máquina (puerto 8080):
   ```bash
   npm run dev
   ```
2. En **otra terminal**, desde la raíz del proyecto, ejecutar el script de captura:
   ```bash
   npm run screenshots
   ```
   o:
   ```bash
   node scripts/capture-screenshots.mjs
   ```
3. Las imágenes se guardan en `docs/screenshots/web/` y `docs/screenshots/mobile/`.

### Capturas que requieren login (opcional)

Para incluir pantallas de usuario logueado y de admin, define estas variables de entorno antes de ejecutar el script (usa un usuario de prueba y un admin de prueba):

- **Usuario cliente:** `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`
- **Usuario admin:** `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- **IDs opcionales:** `PRODUCT_ID`, `ORDER_ID`, `INVOICE_ID` (si no se pasan, producto se obtiene del listado de la tienda; orden y factura se omiten si no hay ID).

Ejemplo (Windows PowerShell):

```powershell
$env:E2E_USER_EMAIL="cliente@ejemplo.com"
$env:E2E_USER_PASSWORD="password123"
$env:E2E_ADMIN_EMAIL="admin@ejemplo.com"
$env:E2E_ADMIN_PASSWORD="admin123"
node scripts/capture-screenshots.mjs
```

## Listado completo de capturas (checklist)

Marcar cuando la captura exista en **web** y **mobile**. Nombres de archivo = sin extensión (se guardan como `.png`).

### Públicas (siempre)

| # | Pantalla              | Ruta              | Archivo (web/mobile)     | Web | Mobile |
|---|------------------------|-------------------|--------------------------|-----|--------|
| 1 | Inicio                 | `/`               | `01-inicio`              | ☑   | ☑      |
| 2 | Iniciar sesión / Registro | `/auth`       | `02-auth`                | ☑   | ☑      |
| 3 | Tienda                 | `/shop`           | `03-tienda`              | ☑   | ☑      |
| 4 | Sobre nosotros         | `/about`          | `04-sobre-nosotros`      | ☑   | ☑      |
| 5 | Detalle de producto    | `/producto/:id`   | `05-producto-detalle`   | ☑   | ☑      |

### Con usuario logueado (cliente)

| # | Pantalla              | Ruta                      | Archivo                         | Web | Mobile |
|---|------------------------|---------------------------|---------------------------------|-----|--------|
| 6 | Confirmación de pedido | `/order/:id`              | `06-order-confirmation`         | ☐   | ☐      |
| 7 | Factura                | `/orders/invoice/:id`     | `07-factura`                    | ☐   | ☐      |
| 8 | Mi cuenta              | `/account`                | `08-mi-cuenta`                  | ☑   | ☑      |
| 9 | Editar perfil          | `/profile/edit`           | `09-editar-perfil`              | ☑   | ☑      |
|10 | Favoritos              | `/wishlist`               | `10-favoritos`                  | ☑   | ☑      |
|11 | Mis pedidos            | `/orders`                 | `11-mis-pedidos`                | ☑   | ☑      |
|12 | Checkout transferencia | `/checkout/transferencia` | `12-checkout-transferencia`     | ☑   | ☑      |

### Admin (con usuario admin)

| # | Pantalla         | Ruta                       | Archivo                  | Web | Mobile |
|---|------------------|----------------------------|--------------------------|-----|--------|
| 1 | Dashboard        | `/admin`                   | `admin-01-dashboard`     | ☑   | ☑      |
| 2 | Pedidos          | `/admin/orders`            | `admin-02-pedidos`       | ☑   | ☑      |
| 3 | Productos        | `/admin/products`         | `admin-03-productos`     | ☑   | ☑      |
| 4 | Inventario       | `/admin/inventory`         | `admin-04-inventario`    | ☑   | ☑      |
| 5 | Categorías       | `/admin/categories`        | `admin-05-categorias`    | ☑   | ☑      |
| 6 | Métodos de pago  | `/admin/payment-methods`   | `admin-06-metodos-pago`  | ☑   | ☑      |
| 7 | Descuentos       | `/admin/discounts`        | `admin-07-descuentos`    | ☑   | ☑      |
| 8 | Facturas         | `/admin/invoices`          | `admin-08-facturas`      | ☑   | ☑      |
| 9 | Usuarios         | `/admin/users`             | `admin-09-usuarios`      | ☑   | ☑      |

### Extras recomendados (manual o ampliando el script)

- **Tienda:** con filtros aplicados, vista lista, “sin resultados”.
- **Producto:** con recomendación IA generada, galería con varias imágenes.
- **Carrito:** drawer abierto (web y móvil).
- **Pedido:** con comprobante subido; estados “Verificando pago” y “Pagado”.
- **Admin pedidos:** detalle de un pedido abierto (modal/panel); comprobante visible; aprobar/rechazar pago.
- **Admin productos:** modal crear/editar producto; diálogo información nutricional (con IA generada).
- **Admin inventario:** diálogo ajustar stock.
- **Admin categorías:** modal crear/editar categoría.
- **Admin descuentos:** modal crear/editar cupón.
- **Admin métodos de pago:** modal crear/editar método.
- **Admin usuarios:** diálogo gestionar roles.
- **404:** página no encontrada (`/*`).

Si alguna pantalla tiene subvistas (tabs, modales, estados vacíos), se pueden añadir filas a esta tabla y capturarlas a mano o extendiendo `scripts/capture-screenshots.mjs`.
