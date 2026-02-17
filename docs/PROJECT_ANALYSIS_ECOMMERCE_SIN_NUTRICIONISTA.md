# Barbaro (refined-supabase-app) — Análisis completo (Ecommerce suplementos) **sin módulo de Nutricionista/Citas**

> Objetivo de este documento
>
> 1) Explicar **qué tiene** este proyecto y **cómo funciona** (frontend + Supabase).
> 2) Identificar y **excluir explícitamente** todo lo que sea “nutricionista/appointments/consultas” (sin confundirlo con “nutrición del producto”, que sí es ecommerce).
> 3) Entregar un **prompt maestro** para regenerar el proyecto completo (con todo lo que hace hoy), pero **sin** el módulo de nutricionista.

---

## 1) Resumen ejecutivo

Este repositorio es un **ecommerce SPA (Vite + React + TypeScript)** para venta de suplementos, con backend en **Supabase (Auth + Postgres + RLS + Storage + Edge Functions)**.

Flujo principal de negocio (lo que hoy está implementado):

1) El usuario navega la tienda (`/shop`) y detalle de producto (`/producto/:handle`).
2) Agrega productos al carrito (carrito local con Zustand).
3) Checkout por **transferencia bancaria** (`/checkout/transferencia`):
   - Crea `orders` + `order_items`.
   - Aplica cupón (`discount_codes`, `discount_usages`) si corresponde.
   - Reduce stock en `products`.
   - Dispara email transaccional con Edge Function `send-order-email`.
4) Confirmación de pedido (`/order/:orderId`):
   - Permite **subir comprobante** a Storage bucket `order-proofs`.
   - Inserta registro en `order_payments`.
   - Cambia estado del pedido a `payment_pending`.
5) Admin (`/admin/*`) gestiona:
   - Productos, inventario, categorías, descuentos.
   - Pedidos: ver detalles, verificar pagos, cambiar estados, generar facturas.
   - Facturas: ver/anular.
   - Métodos de pago.

---

## 2) Stack técnico

### 2.1 Frontend

- Vite + React 18 + TypeScript.
- Router: `react-router-dom`.
- UI: Tailwind + shadcn/ui (Radix) + `lucide-react`.
- Estado:
  - Carrito local: Zustand (`src/stores/cartStore.ts`).
  - Wishlist “nativa”: hooks propios.
- Data fetching/caching: TanStack React Query (ya instalado).
- Animaciones: `framer-motion`.
- Toasts: `sonner`.

Dependencias clave (según `package.json`):
- `@supabase/supabase-js`, `react-router-dom`, `zustand`, `@tanstack/react-query`, `zod`, `tailwindcss`, `vite-plugin-pwa`.

### 2.2 PWA

- Plugin: `vite-plugin-pwa`.
- Registro del Service Worker desde `src/pwa.ts` (via `virtual:pwa-register`).

### 2.3 Backend

- Supabase:
  - Auth: `auth.users` + `profiles` (perfil extendido) + roles (`user_roles`).
  - DB: Postgres con RLS y funciones RPC.
  - Storage:
    - `order-proofs` (comprobantes de pago)
    - `shipping-vouchers` (vouchers/guías de envío)
  - Edge Functions:
    - `send-order-email` (emails con Resend)
    - `ai-nutrition` (IA para nutrición del producto; opcional ecommerce)
    - `ai-consultation-intake` (IA para consultas; **nutricionista** → excluir)

---

## 3) Estructura del repo (alto nivel)

- `src/`:
  - `pages/`: pantallas principales ecommerce + admin.
  - `components/`: UI reusable (navbar, drawers, cards, etc.).
  - `hooks/`: integración con Supabase, carrito, descuentos, roles.
  - `integrations/supabase/`: cliente y tipos generados.
  - `stores/`: Zustand store para carrito.
  - `features/appointments/`: **nutricionista/consultas** → excluir.
- `supabase/`:
  - `functions/`: Edge Functions.
  - `migrations/`: SQL schema + policies + triggers.
- `scripts/`:
  - utilidades para cargar productos/assets y verificar conexiones.

---

## 4) Módulos de negocio (Ecommerce)

### 4.1 Autenticación y perfiles

Archivos:
- `src/lib/auth-context.tsx`: contexto de auth (login/signup/logout), expone `user`.
- `src/integrations/supabase/client.ts`: `createClient` con `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.

DB:
- `profiles`: perfil extendido (nombre, etc.) vinculado a `auth.users`.
- Trigger `handle_new_user()` para crear `profiles` al registrarse.

Roles/Permisos:
- Enum `app_role` y tabla `user_roles`.
- RPCs:
  - `public.has_role(_user_id, _role)`
  - `public.is_admin(_user_id)`

Uso:
- Admin UI valida capacidades vía `useRoles()`.

### 4.2 Catálogo (productos)

Datos principales:
- `products`: nombre, precio, stock, imagen, categoría, flags.
- `categories`: catálogo de categorías.
- `product_images`, `product_variants`, `product_nutrition`: enriquecimiento.

Frontend:
- Tienda: `src/pages/Shop.tsx` usa `useNativeProducts(selectedCategory)`.
- Detalle: `src/pages/ProductDetail.tsx` (agregar al carrito y favoritos).

Notas:
- Existe también un set de componentes en `src/components/product/` (parece una versión alternativa) y `src/components/shop/` (la que usa `/shop`).

### 4.3 Carrito

Hay dos aproximaciones en el repo:

1) **Carrito local (principal en UI actual)**
- Store Zustand: `src/stores/cartStore.ts` (persist en `localStorage` con key `barbaro-cart`).
- UI: `src/components/shop/CartDrawer.tsx` (Sheet) abre con un evento custom `openCartDrawer`.
- `src/hooks/useSavedCart.ts`: sincroniza el carrito local a Supabase en tabla `saved_carts`.

2) **Carrito en DB por item**
- Hook: `src/hooks/useCart.ts` usa tabla `cart_items`.
- Esta vía parece menos usada por la UI principal (mucho flujo opera con Zustand).

DB:
- `saved_carts`: `cart_data` como JSON.
- `cart_items`: items normalizados (product_id, quantity).

### 4.4 Wishlist

Frontend:
- `src/pages/Wishlist.tsx`: lista favoritos y permite re-agregar al carrito.
- Hooks: `useNativeWishlist` (persistencia en Supabase).

DB:
- Tabla `wishlist` (según migraciones) / o estructura equivalente en types.

### 4.5 Checkout (Transferencia)

Pantalla:
- `src/pages/TransferCheckout.tsx`.

Comportamiento:
- Requiere usuario logueado.
- Valida campos mínimos (nombre/email/teléfono/dirección).
- Crea:
  - `orders` con `status: 'pending'`, total/subtotal/descuento, y `shipping_address` serializado como string multilínea.
  - `order_items` (snapshot de nombre/precio/cantidad).
- Descuentos:
  - UI aplica cupón con `useDiscountCodes()`.
  - DB: `discount_codes`, `discount_usages`, y columnas `discount_code_id` + `discount_amount` en `orders`.
- Stock:
  - Reduce `products.stock` por cada item.
- Email:
  - Invoca `supabase.functions.invoke('send-order-email', { type: 'order_created', ... })`.

Nota importante:
- La pantalla tiene `BANK_ACCOUNTS` hardcode aunque existe `payment_methods` en DB.

### 4.6 Confirmación de pedido + comprobante

Pantalla:
- `src/pages/OrderConfirmation.tsx`.

Comportamiento:
- Carga el pedido con `orders + order_items + order_payments`.
- Lista `payment_methods` activos para mostrar cuentas/indicaciones.
- Subida de comprobante:
  - Sube imagen a bucket `order-proofs`.
  - Inserta registro en `order_payments` (status `pending`, proof_url público, referencia, notas).
  - Actualiza pedido a `status: 'payment_pending'`.

### 4.7 Mis pedidos + facturas

Pantallas:
- `src/pages/Orders.tsx`: lista pedidos del usuario y abre factura si existe.
- `src/pages/InvoiceDetail.tsx`: render de factura (imprimible, “descargar PDF” realmente dispara `window.print()`).

DB:
- `orders`, `order_items`.
- `invoices`, `invoice_lines`.
- RPC: `generate_invoice_number()` y secuencia `invoice_number_seq`.

### 4.8 Admin

Rutas admin (desde `src/App.tsx`):
- `/admin` dashboard.
- `/admin/products` productos (incluye nutrición del producto).
- `/admin/inventory` inventario.
- `/admin/discounts` cupones.
- `/admin/orders` pedidos (verificación de pagos, actualización de estado, creación de factura, auditoría).
- `/admin/users` usuarios.
- `/admin/invoices` facturas.
- `/admin/categories` categorías.
- `/admin/payment-methods` métodos de pago.
- `/admin/nutritionists` (**nutricionista** → excluir).

Pedidos en Admin:
- Ver detalle del pedido y items.
- Ver `order_payments` y:
  - aprobar/rechazar pago (marca `verified_at`, `verified_by`, actualiza estado del pedido).
- Cambio de estado:
  - Actualiza `orders.status`.
  - Log de auditoría con `public.log_audit(...)`.
  - Si cambia a `paid`, intenta crear factura automáticamente.
  - Envía email de cambio de estado con `send-order-email`.

Auditoría:
- Función RPC `public.log_audit(...)` (tabla de auditoría tipo `audit_logs`).

---

## 4.9 UX / Diseño por pantallas (módulos, botones, acciones y estados)

> Nota: esta sección describe el **comportamiento actual de la UI**. Todo lo relacionado a **Nutricionistas/Citas** (CTA en Home, link condicional en navbar, módulo admin, etc.) se considera **fuera de alcance** para la versión “sin nutricionista” y debe removerse.

### 4.9.1 Layout global + navegación

- Componente base: `Layout` envuelve páginas con `Navbar`.
- Navbar (cliente):
  - Links principales: **Inicio** (`/`), **Tienda** (`/shop`), **Sobre Nosotros** (`/about`).
  - Link condicional (a remover en “sin nutricionista”): **Nutricionistas**.
  - Acciones de la derecha:
    - Botón/ícono de carrito que abre `CartDrawer`.
    - Dropdown de usuario:
      - Si no está logueado: CTA a `/auth`.
      - Si está logueado: **Mi Cuenta** (`/account`), **Mis Pedidos** (`/orders`), **Salir** (logout).
      - Si tiene permisos: **Panel Admin** (`/admin`).

### 4.9.2 Home (`/`) — `Index`

- Secciones: Hero, Categorías, *CTA Nutricionista* (remover), destacados, testimonios, newsletter.
- CTA a tienda: navegación hacia `/shop` (a través de los componentes de home).

### 4.9.3 Tienda (`/shop`) — `Shop`

- Header: título “Tienda” y subtítulo.
- Filtro por categoría (chips/botones):
  - **Todos** (resetea filtro).
  - Botones por categoría (toggle visual `default` vs `outline`).
- Estados:
  - Loading: grilla de skeletons.
  - Error: tarjeta con “Error al cargar productos”.
  - Empty: “No hay productos disponibles”.
- Listado: grilla de `ProductCard`.

### 4.9.4 Detalle de producto (`/producto/:handle`) — `ProductDetail`

- Badges/estados:
  - Stock: “En stock” vs “Agotado” (y bloqueo de compra si 0).
  - Descuento: badge cuando hay `original_price > price`.
- Controles:
  - Selector de cantidad `- / +` (respeta stock; `+` se deshabilita al alcanzar stock).
  - Botón **Agregar al Carrito**:
    - Deshabilitado si no hay stock.
    - Toasts: éxito al agregar; error si excede stock.
  - Wishlist (ícono corazón): toggle agregar/quitar de favoritos.

### 4.9.5 Carrito (Drawer) — `CartDrawer`

- Se abre:
  - desde navbar, y
  - vía evento `window.dispatchEvent(new Event('openCartDrawer'))`.
- Por item:
  - Botones `-` y `+` (con límites), y botón eliminar (trash).
- Resumen:
  - Total.
  - Botón **Proceder al Pago** → navega a `/checkout/transferencia`.

### 4.9.6 Auth (`/auth`) — `Auth`

- Tabs/estado: alterna **Iniciar sesión** / **Crear cuenta**.
- Validación con zod; submit se deshabilita en loading.
- Feedback:
  - Loader en botón.
  - Toasts de éxito/error.

### 4.9.7 Cuenta (`/account`) — `Account`

- Tarjeta de perfil con datos básicos.
- Acciones:
  - **Editar** → `/profile/edit`.
  - **Salir** → logout.
- Accesos rápidos (cards):
  - **Mis Pedidos** → `/orders`.
  - **Favoritos** → `/wishlist`.
  - **Mis Citas** (remover en “sin nutricionista”).
  - Otros accesos informativos según UI.
- Si el usuario es admin/staff: card a **Panel Admin** → `/admin`.

### 4.9.8 Wishlist (`/wishlist`) — `Wishlist`

- Gate: requiere login (si no, muestra CTA/flujo a autenticación).
- Estados:
  - Empty: mensaje + botón **Explorar Productos**.
- Por item:
  - Botón **Agregar** (añade al carrito).
  - Botón eliminar (trash) para quitar de wishlist.

Nota (consistencia de rutas): aquí aparece un link tipo `/product/:id` en algunos puntos, mientras el detalle principal usa `/producto/:handle`. Conviene unificar.

### 4.9.9 Checkout transferencia (`/checkout/transferencia`) — `TransferCheckout`

- Secciones:
  - Resumen de carrito.
  - Cupón:
    - Input + botón **Aplicar**.
    - Si aplicado: muestra descuento y botón **Quitar**.
  - “Cuentas bancarias” (en esta pantalla hay un set hardcodeado) con botones **Copiar**.
  - Formulario de envío/facturación:
    - Campos mínimos (nombre/email/teléfono/dirección/ciudad/notas).
- Acción principal:
  - Botón **Confirmar Pedido**:
    - Crea order + items, aplica descuento, reduce stock.
    - Limpia carrito y navega a `/order/:orderId`.

### 4.9.10 Confirmación + comprobante (`/order/:orderId`) — `OrderConfirmation`

- Header:
  - Botón **Mis Pedidos** (back) → `/orders`.
  - Título “¡Pedido Creado!” + badge de estado.
- Columna izquierda:
  - Lista de productos (cantidad + subtotal por item) y totales (subtotal, descuento, total).
  - Si el pedido está `pending` sin pago previo: “Datos para Transferencia” desde `payment_methods` activos.
    - Botones copiar en número de cuenta (cambia a ícono check cuando copia).
- Columna derecha (si `pending` y sin pago):
  - Card “Adjuntar Comprobante”:
    - Área drop/click (solo imágenes, máx 10MB).
    - Preview + botón trash para quitar archivo.
    - Campos opcionales: **Número de Referencia**, **Notas adicionales**.
    - Botón **Enviar Comprobante** (disabled si no hay archivo; loading “Enviando…”).
  - Al enviar:
    - Sube a bucket `order-proofs`.
    - Inserta `order_payments` status `pending`.
    - Actualiza `orders.status` a `payment_pending`.
- Estado de pago (si existe `order_payments`):
  - Badge:
    - pending → “⏳ Pendiente de verificación”
    - verified → “✓ Verificado”
    - rejected → “✗ Rechazado”
  - Vista de comprobante:
    - Imagen embebida y botón **Ver completo** (abre en nueva pestaña).
    - Si falla carga de imagen: fallback con link “Ver en nueva pestaña”.
  - Mensajes por estado (en verificación / confirmado / rechazado).

### 4.9.11 Mis pedidos (`/orders`) — `Orders`

- Loading: skeletons.
- Empty: card con CTA **Explorar Productos** → `/shop`.
- Card por pedido:
  - Badge de estado (pending, payment_pending, paid, processing, packed, shipped, delivered, cancelled, refunded).
  - Lista de items y total.
  - Acciones:
    - **Ver Pedido** → `/order/:id` (cuando status `pending` o `payment_pending`).
    - **Ver Factura** (cuando status `paid|processing|shipped|delivered`) → busca `invoices` por `order_id` y navega a `/orders/invoice/:invoiceId`.

### 4.9.12 Factura cliente (`/orders/invoice/:invoiceId`) — `InvoiceDetail`

- Render “imprimible”.
- Botón **Descargar PDF**: usa `window.print()`.

---

## 4.10 UX / Admin (panel completo)

### 4.10.1 Dashboard (`/admin`) — `Admin`

- Header “Panel de Administración” + badge rol (Administrador/Staff).
- Módulos visibles según permisos (`useRoles`).
- Cards de stats (valores demo/hardcodeados en UI actual).
- Grid de módulos (cards clicables):
  - Pedidos, Productos, Inventario, Categorías, Métodos de Pago, Descuentos, Facturas, Clientes.
  - Módulo a remover en “sin nutricionista”: **Nutricionistas**.

### 4.10.2 Pedidos (`/admin/orders`) — `AdminOrders`

- Tabla/listado de pedidos + filtros/búsqueda (según UI actual).
- Modal/Drawer de detalle del pedido:
  - Items del pedido, total/subtotal/descuento, shipping, perfil cliente.
  - Pagos (`order_payments`) con comprobante.
- Acciones críticas:
  - **Aprobar pago / Rechazar pago**:
    - Actualiza `order_payments.status` (`verified/rejected`) + campos `verified_at/verified_by`.
    - Actualiza `orders.status` a `paid` (si aprueba) o `pending` (si rechaza).
    - Escribe auditoría con `log_audit`.
    - Si aprueba: intenta **crear factura** si no existe.
  - **Cambiar estado del pedido**:
    - Actualiza `orders.status`.
    - Auditoría `log_audit`.
    - Si cambia a `paid`: crea factura.
    - Envía email `status_changed` con Edge Function `send-order-email`.

### 4.10.3 Productos (`/admin/products`) — `AdminProducts`

- Header + botón **Nuevo Producto**.
- Filtros:
  - Input “Buscar productos por nombre…” (debounce).
  - Select “Todas las categorías” / categoría específica.
- Tabla:
  - Columnas: Imagen, Producto, Categoría, Precio, Stock, Destacado, Acciones.
  - Badges de stock con color según cantidad (alto/medio/0).
- Acciones por fila:
  - Botón “Info Nutricional” (ícono beaker) → abre `ProductNutritionDialog`.
  - Botón editar (pencil) → abre modal.
  - Botón eliminar (trash) → confirm nativo `confirm(...)`.
- Paginación:
  - Botones **Anterior** / **Siguiente** y estado “Actualizando”.
- Modal crear/editar producto:
  - Campos: nombre, descripción, precio, precio original, categoría, stock.
  - Imagen: upload file (sube a bucket `products`) + alternativa URL.
  - Switch “Producto destacado”.
  - Botones: **Cancelar**, **Crear producto** / **Guardar cambios**.

### 4.10.4 Info nutricional de producto — `ProductNutritionDialog`

- Botón **Generar Info** (IA) invoca Edge Function `ai-nutrition` y rellena campos.
- CRUD manual:
  - Tamaño de porción, porciones por envase.
  - Campos de macros (calorías, proteína, etc.) + “otros” (agregar/quitar).
  - Ingredientes.
  - Alérgenos (agregar/remover).
- Guardado:
  - Inserta/actualiza `product_nutrition` por `product_id`.
  - Toast “Información nutricional actualizada”.

### 4.10.5 Inventario (`/admin/inventory`) — `AdminInventory`

- Tabla de inventario + buscador.
- Cards de KPIs (según UI).
- Ajuste de stock:
  - Dialog con modo **set** vs **adjust**.
  - Previene stock negativo.
  - Toasts de éxito/error.

### 4.10.6 Categorías (`/admin/categories`) — `AdminCategories`

- Header + botón **Nueva Categoría**.
- Tabla: Nombre, Slug, Productos (conteo), Estado, Acciones.
- Acciones:
  - Editar (pencil) → dialog.
  - Eliminar (trash):
    - Bloquea si la categoría tiene productos asociados (muestra toast).
    - Si no tiene productos: confirm y delete.
- Dialog crear/editar:
  - Campos: nombre (autogenera slug), slug editable, descripción, switch “Categoría activa”.
  - Botones: **Cancelar**, **Crear/Guardar**.

### 4.10.7 Descuentos (`/admin/discounts`) — `AdminDiscounts`

- Header + botón **Nuevo Código**.
- Tabla: Código (con botón copiar), Tipo, Valor, Usos, Estado (switch), Acciones.
- Acciones:
  - Copiar código → clipboard + toast.
  - Switch activo/inactivo → update `discount_codes.is_active`.
  - Editar (pencil) → dialog.
  - Eliminar (trash) → confirm y delete.
- Dialog crear/editar:
  - Campos: Código (uppercase), descripción, tipo (percentage/fixed), valor, compra mínima, usos máximos, usos por usuario, válido desde/hasta, switch activo.
  - Botones: **Cancelar**, **Crear Código** / **Guardar Cambios** (loading “Guardando…”).

### 4.10.8 Métodos de pago (`/admin/payment-methods`) — `AdminPaymentMethods`

- Botón back “Panel de Admin”.
- Header + botón **Agregar Método**.
- Tabla con estado (botón icono check/X) que actúa como toggle activo/inactivo.
- Acciones por fila:
  - Editar (pencil) → dialog.
  - Eliminar (trash) → AlertDialog confirm con **Eliminar** / **Cancelar**.
- Dialog crear/editar:
  - Campos: nombre (requerido), banco, tipo cuenta, número cuenta, titular, RNC, instrucciones.
  - Switch “Estado” (visible/oculto para clientes).
  - Botones: **Cancelar**, **Crear Método** / **Guardar Cambios**.

### 4.10.9 Usuarios / Clientes (`/admin/users`) — `AdminUsers`

- Buscador: “Buscar por email o nombre…”.
- Tabla (desktop) y cards (mobile) con:
  - nombre/email, roles (badges), fecha registro.
- Acción principal: botón **Gestionar Roles**.
- Dialog “Gestionar Roles”:
  - Lista de roles disponibles con checkbox (admin/manager/editor/support/customer).
  - Botones: **Cancelar**, **Guardar Roles** (loading “Guardando…”).
  - Al guardar: borra roles anteriores e inserta nuevos; audita con `log_audit`.

### 4.10.10 Facturas (`/admin/invoices`) — `AdminInvoices`

- Tabla: número, fecha, pedido, cliente, total, estado, acciones.
- Acciones (dropdown):
  - **Ver Detalle** → `/orders/invoice/:invoiceId`.
  - **Descargar PDF** → abre invoice en nueva pestaña.
  - **Anular Factura** (si no está anulada) → update `invoices.status='cancelled'`.


## 5) Backend (Supabase) — datos, RLS, triggers y buckets

### 5.1 Tablas ecommerce principales (inventario funcional)

- Catálogo:
  - `products`, `categories`, `product_images`, `product_variants`, `product_nutrition`.
- Carrito:
  - `cart_items`, `saved_carts`.
- Wishlist:
  - `wishlist`.
- Pedidos:
  - `orders`, `order_items`, `order_payments`, `order_shipping`, `order_status_history`.
- Facturación:
  - `invoices`, `invoice_lines`.
- Descuentos:
  - `discount_codes`, `discount_usages`.
- Configuración tienda:
  - `store_settings`, `payment_methods`, (y objetos de stock/movimientos según migración).
- Usuarios:
  - `profiles`, `user_roles`.

### 5.2 Funciones (RPC)

Detectadas en migraciones:
- `public.handle_new_user()` (trigger al crear usuario auth).
- `public.update_updated_at_column()` (trigger genérico updated_at).
- `public.has_role(_user_id, _role app_role)`.
- `public.is_admin(_user_id)`.
- `public.log_audit(p_action, p_table_name, p_record_id, p_old_data, p_new_data, ...)`.
- `public.generate_invoice_number()`.

### 5.3 Triggers importantes

- `on_auth_user_created` → crea `profiles`.
- `update_*_updated_at` para: `profiles`, `products`, `categories`, `discount_codes`, `saved_carts`, `invoices`, `payment_methods`, `store_settings`, `order_shipping`, `order_payments`, `product_variants`, `product_nutrition`, etc.

### 5.4 Storage buckets

- `order-proofs`:
  - usado por `OrderConfirmation` para comprobantes.
  - requiere policies (lectura/escritura controladas).
- `shipping-vouchers`:
  - usado para vouchers/guías de envío (admin).

---

## 6) Qué significa “quitar la parte de Nutricionista” (exacto)

### 6.1 Qué SÍ es “nutricionista/appointments” (se elimina)

Frontend:
- Rutas:
  - `/appointments`
  - `/appointments/book/:nutritionistId`
  - `/account/appointments`
  - `/admin/nutritionists`
- Feature folder:
  - `src/features/appointments/**`
- Página admin:
  - `src/pages/admin/AdminNutritionists.tsx`
- Home CTA:
  - `src/components/home/NutritionistCTA.tsx` y el uso en `src/pages/Index.tsx`.

Backend:
- Edge Function:
  - `supabase/functions/ai-consultation-intake/**`.
- Migraciones/tablas:
  - `supabase/migrations/20260103_appointments_schema.sql` y/o migraciones relacionadas (tablas como `nutritionists`, `appointments`, `quotes`, `dynamic_forms`, etc.).
- Microservicio:
  - `microservices/appointments/**`.

### 6.2 Qué NO debes borrar (aunque suene a “nutrición”)

Esto es ecommerce (se queda):
- `product_nutrition` (información nutricional de productos).
- `src/components/admin/ProductNutritionDialog.tsx` (CRUD de nutrición del producto).
- Edge Function `supabase/functions/ai-nutrition/**` (IA para autogenerar nutrición del producto) — opcional, pero NO es “citas/nutricionista”.

### 6.3 Cambios mínimos para “deshabilitar” nutricionista sin romper ecommerce

1) Quitar las rutas de `src/App.tsx` relacionadas a appointments y admin nutritionists.
2) Eliminar/ocultar el CTA en Home.
3) (Opcional, si quieres limpieza total) remover migraciones/tablas del schema appointments del proyecto Supabase.
4) (Opcional) borrar el folder `microservices/appointments`.

---

## 7) Prompt maestro para regenerar el proyecto completo (sin nutricionista)

Copia/pega este prompt en tu generador (idealmente uno que cree archivos, ej. un agente de código). Está escrito para que reconstruya **todo** el ecommerce tal como está implementado hoy.

### 7.1 Prompt

**PROMPT (ES):**

Construye un proyecto completo llamado `refined-supabase-app` que sea un ecommerce de suplementos (Barbaro Nutrition) con Vite + React + TypeScript, Tailwind + shadcn/ui (Radix), Supabase (Auth + Postgres + RLS + Storage + Edge Functions). El proyecto debe replicar exactamente estos módulos y flujos, y debe excluir explícitamente TODO lo relacionado a “nutricionista/appointments/consultas”.

Restricciones:
- NO crear módulos de citas, nutricionistas, booking, intake de consulta.
- NO crear rutas `/appointments`, `/admin/nutritionists`, ni carpetas `features/appointments`.
- NO crear Edge Function `ai-consultation-intake` ni tablas `nutritionists/appointments/quotes/dynamic_forms`.
- SÍ incluir información nutricional de productos (`product_nutrition`) porque es parte del ecommerce.

Requisito UX (importante):
- Replica el comportamiento **a nivel de pantalla/botón** tal como está en este repo:
  - Drawer de carrito con `openCartDrawer`, botones `+/-`, eliminar, y CTA **Proceder al Pago** → `/checkout/transferencia`.
  - `/orders`: botones **Ver Pedido** (para `pending|payment_pending`) y **Ver Factura** (para `paid|processing|shipped|delivered`).
  - `/order/:orderId`: subida de comprobante (máx 10MB), preview, botón trash para quitar, inputs opcionales (referencia/notas), y botón **Enviar Comprobante**.
  - Admin:
    - `AdminProducts`: modal crear/editar con upload de imagen (bucket `products`) + URL alternativa, switch “Producto destacado”, y acción “Info Nutricional” (beaker) que abre `ProductNutritionDialog`.
    - `AdminDiscounts`: CRUD con switch activo, copiar a clipboard y dialog con fechas, límites de uso y compra mínima.
    - `AdminPaymentMethods`: toggle activo desde la tabla, dialog crear/editar y confirm de borrado.
    - `AdminUsers`: dialog “Gestionar Roles” con checkboxes y guardado que reemplaza roles.
    - `AdminInvoices`: menú de acciones (ver, descargar, anular).

Stack y dependencias:
- Usa Vite 5 + React 18 + TS 5.
- Router: `react-router-dom`.
- Estado: `zustand` con persist.
- UI: Tailwind + shadcn/ui con Radix (`@radix-ui/*`), `lucide-react`, `sonner`.
- Animaciones: `framer-motion`.
- Data fetching: `@tanstack/react-query`.
- PWA: `vite-plugin-pwa` y registro SW con `virtual:pwa-register`.

Estructura de carpetas (mínima necesaria):
- `src/` con:
  - `pages/`:
    - `Index` (home ecommerce), `Shop`, `ProductDetail`, `TransferCheckout`, `OrderConfirmation`, `Orders`, `InvoiceDetail`, `Account`, `Auth`, `ProfileEdit`, `About`, `NotFound`.
    - `Admin` (dashboard) y `pages/admin/`:
      - `AdminProducts`, `AdminInventory`, `AdminOrders`, `AdminDiscounts`, `AdminUsers`, `AdminInvoices`, `AdminCategories`, `AdminPaymentMethods`.
  - `components/`:
    - `layout/Layout` + `layout/Navbar` con `CartDrawer`.
    - `shop/ProductCard` y `shop/CartDrawer`.
    - `admin/ProductNutritionDialog`.
  - `stores/cartStore` (Zustand persist).
  - `hooks/`:
    - `useSavedCart` (sync con Supabase), `useDiscountCodes`, `useRoles`, `useNativeProducts`, `useNativeProduct`, `useNativeWishlist`.
  - `integrations/supabase/`:
    - `client.ts` y `types.ts` (Database types).
  - `lib/auth-context.tsx`.
  - `pwa.ts`.

Rutas (react-router-dom) exactas:
- `/` home
- `/auth`
- `/shop`
- `/cart` (redirige a shop, el carrito es drawer)
- `/producto/:handle`
- `/checkout/transferencia`
- `/order/:orderId`
- `/orders`
- `/orders/invoice/:invoiceId`
- `/wishlist`
- `/account`, `/profile/edit`, `/about`
- Admin:
  - `/admin`
  - `/admin/products`
  - `/admin/inventory`
  - `/admin/discounts`
  - `/admin/orders`
  - `/admin/users`
  - `/admin/invoices`
  - `/admin/categories`
  - `/admin/payment-methods`

Funcionalidades ecommerce a implementar:

1) Catálogo
- Tabla `products` con stock, price, original_price, image_url, category, featured, description.
- Página `/shop` lista productos y filtra por categoría.
- Página `/producto/:handle` muestra detalle, control de cantidad y agrega a carrito.

2) Carrito (local) + persistencia server
- Carrito con Zustand persist (`barbaro-cart`).
- `CartDrawer` abre desde navbar y por evento `openCartDrawer`.
- `useSavedCart`:
  - si el usuario loguea, carga `saved_carts.cart_data` y mergea con local.
  - hace debounce/guardado a Supabase en `saved_carts`.

3) Wishlist
- Página `/wishlist` que lee favoritos desde Supabase y permite borrar/agregar al carrito.

4) Checkout por Transferencia
- Página `/checkout/transferencia`:
  - requiere login.
  - muestra resumen del pedido.
  - permite aplicar cupón con `discount_codes`.
  - pide datos de envío/facturación (mínimo: nombre, email, teléfono, dirección, ciudad, notas).
  - al enviar:
    - crea `orders` con `status='pending'`, guarda `shipping_address` como string multilínea.
    - crea `order_items`.
    - aplica `discount_usages`.
    - reduce `products.stock`.
    - invoca Edge Function `send-order-email` con `type='order_created'`.
    - limpia el carrito y navega a `/order/:id`.

5) Comprobante
- Página `/order/:orderId`:
  - carga `orders + order_items + order_payments`.
  - lista `payment_methods` activos.
  - permite subir imagen (max 10MB) a bucket `order-proofs`.
  - inserta `order_payments` con `status='pending'`, `proof_url` público, `reference_number`, `notes`.
  - cambia `orders.status` a `payment_pending`.

6) Pedidos del usuario
- `/orders` lista pedidos con badges por status.
- Permite “ver factura” cuando status sea `paid|processing|shipped|delivered`.

7) Facturas
- Tabla `invoices` + `invoice_lines`.
- RPC `generate_invoice_number()` usando secuencia `invoice_number_seq`.
- `/orders/invoice/:invoiceId` renderiza factura con logo, cliente parseado desde `shipping_address`, y botón “descargar” que dispara `window.print()`.

8) Admin
- Protección por rol (admin/manager) usando `user_roles` + RPC `has_role/is_admin`.
- AdminOrders:
  - lista pedidos, filtra.
  - abre detalle con items, pagos, datos cliente.
  - verifica pagos (approved/rejected) y actualiza `order_payments` + `orders.status`.
  - guarda auditoría con `log_audit`.
  - actualiza estado del pedido y envía email `status_changed` vía `send-order-email`.
  - si status cambia a `paid`, genera factura automáticamente (si no existe) creando `invoices` + `invoice_lines`.

10) UX consistente
- Mantén labels en español tal como están en la UI actual (ej: “Nuevo Producto”, “Nuevo Código”, “Gestionar Roles”, “Anular Factura”, “Enviar Comprobante”).
- Mantén los estados/disabled/loading (ej: “Guardando…”, “Enviando…”) y toasts de éxito/error.

9) Supabase (schema + RLS + triggers)
- Escribe migraciones SQL para:
  - tablas: `profiles`, `products`, `categories`, `cart_items`, `saved_carts`, `wishlist`, `orders`, `order_items`, `order_payments`, `order_shipping`, `order_status_history`, `discount_codes`, `discount_usages`, `payment_methods`, `store_settings`, `product_images`, `product_variants`, `product_nutrition`, `invoices`, `invoice_lines`, `audit_logs`.
  - policies RLS:
    - usuarios ven/crean sus pedidos (`orders`, `order_items`, `order_payments`) según `auth.uid()`.
    - admin/manager pueden gestionar (select/update) pedidos y pagos.
    - `payment_methods` select para usuarios (solo activos) y CRUD para admin.
    - storage policies para `order-proofs` y `shipping-vouchers`.
  - triggers `update_updated_at_column` para tablas con `updated_at`.
  - trigger `handle_new_user` para crear `profiles`.
- Genera `src/integrations/supabase/types.ts` (Database typing) coherente con el schema.

11) Edge Functions
- `send-order-email`:
  - Deno function.
  - Usa Resend (`RESEND_API_KEY`).
  - Acepta payload `type: 'order_created' | 'status_changed'`.
  - Plantillas HTML simples con lista de items y total.
- `ai-nutrition` (opcional):
  - permite a admin generar nutrición del producto y guardar en `product_nutrition`.
  - NO crear nada de consultas/nutricionistas.

12) Variables de entorno
- Frontend:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase Edge Functions:
  - `RESEND_API_KEY`
  - (si incluyes `ai-nutrition`) tu API key correspondiente.

13) Scripts
- Incluye scripts Node (en `scripts/`) para:
  - verificar conexión (`verify-live-connection.mjs`),
  - cargar productos/imágenes a Supabase (upload).

Entregables:
- Código completo compila.
- README con pasos:
  - instalar deps
  - configurar env
  - correr `vite dev`
  - aplicar migraciones con Supabase CLI
  - desplegar Edge Functions

---

## 8) Pregunta rápida (para afinar el alcance)

¿Quieres que el prompt **mantenga** `ai-nutrition` (IA para nutrición del producto) o prefieres que también lo quite por completo y dejar solo CRUD manual de `product_nutrition`?
