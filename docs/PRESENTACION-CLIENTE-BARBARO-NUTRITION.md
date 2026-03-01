# Barbaro Nutrition — Capacidades y funcionalidades

Documento de presentación para el cliente: todo lo que la plataforma permite hacer hoy.

**Índice:** 1. Resumen · 2. Cliente (navegación, tienda, productos, carrito, favoritos, checkout, pedidos, factura, emails) · 3. Área admin (rutas, dashboard, pedidos, productos, inventario, categorías, métodos de pago, descuentos, facturas, usuarios, auditoría) · 4. Seguridad · 5. Tecnología · 6. Resumen de flujos · 7. Notas adicionales

---

## 1. Resumen

**Barbaro Nutrition** es una tienda online de suplementos deportivos con panel de administración. Los clientes pueden explorar productos, comprar por transferencia bancaria, subir comprobantes de pago y seguir sus pedidos. El administrador gestiona catálogo, inventario, pedidos, facturas, descuentos y métodos de pago.

---

## 2. Lo que puede hacer el cliente (tienda pública)

Desglose por pantalla y acción.

---

### 2.1 Navegación y cuenta

| Dónde | Qué puede hacer |
|-------|------------------|
| **Inicio** (`/`) | Ver hero, categorías, productos destacados, testimonios, sección newsletter. Enlaces a tienda. |
| **Tienda** (`/shop`) | Ver todo el catálogo con filtros y orden (ver 2.2). |
| **Sobre nosotros** (`/about`) | Ver información de la marca. |
| **Iniciar sesión** (`/auth`) | Ingresar con email y contraseña. |
| **Crear cuenta** (`/auth`) | Registrarse con email, contraseña y nombre. |
| **Mi cuenta** (`/account`) | Ver perfil; accesos rápidos a Mis Pedidos, Favoritos; enlace a Panel Admin si tiene permiso. |
| **Editar perfil** (`/profile/edit`) | Actualizar nombre, teléfono, dirección, ciudad, etc. |
| **Menú usuario** | Cerrar sesión. |

---

### 2.2 Tienda: búsqueda, filtros y orden

| Tipo | Opciones |
|------|----------|
| **Búsqueda** | Por nombre, descripción o marca (espera automática al escribir). |
| **Categoría** | Botones: Todos, y una por cada categoría (ej. Creatinas, Proteínas). |
| **Ordenar** | Más recientes · Precio menor a mayor · Precio mayor a menor · Nombre A–Z · Con descuento primero · Destacados primero. |
| **Filtros** | Solo en stock · Solo destacados · Precio mínimo · Precio máximo. |
| **Vista** | Grid (cuadrícula) o Lista (filas). |
| **Otros** | Contador “X productos”; botón “Limpiar filtros”. En móvil, filtros en panel desplegable “Filtros”. |

---

### 2.3 Productos (ficha y detalle)

| Elemento | Descripción |
|----------|-------------|
| **Ficha (tarjeta)** | Imagen, nombre, categoría, precio, descuento % si aplica, stock, botón agregar al carrito, corazón favoritos. |
| **Página de detalle** | Galería de imágenes · Nombre · Categoría · Descripción · Precio (y tachado si hay descuento) · Barra de stock · Selector de cantidad · Agregar al carrito · Favoritos. |
| **Tabla nutricional** | Si el admin la completó: porción, calorías, macros, ingredientes, alérgenos, instrucciones de uso. |
| **Recomendación IA** | Botón “Generar recomendación”: muestra Mejor momento · Combinar con · Perfil ideal. Botón “Generar otra”. |
| **Productos relacionados** | Hasta 4 de la misma categoría para seguir navegando. |
| **Stock** | Mensaje “Últimas unidades” cuando hay poco stock; “Agotado” y botón deshabilitado si no hay. |

---

### 2.4 Carrito

| Acción | Cómo |
|--------|------|
| **Abrir** | Clic en ícono de carrito en la barra superior (panel deslizable). |
| **Persistencia** | Se guarda en el navegador entre sesiones. |
| **Cantidad** | Aumentar o disminuir por producto. |
| **Quitar** | Eliminar producto del carrito. |
| **Total** | Se actualiza en tiempo real. |
| **Ir a pagar** | Botón “Proceder al pago” → lleva a checkout por transferencia. |

---

### 2.5 Favoritos (Wishlist)

- Ver lista de productos guardados con corazón.
- Desde cada uno: añadir al carrito o quitar de favoritos.

---

### 2.6 Checkout (pago por transferencia)

| Bloque | Contenido |
|--------|-----------|
| **Resumen** | Productos, cantidades, precios, subtotal, descuento (si hay cupón), total. |
| **Cupón** | Campo para código; “Aplicar” / “Quitar”; se muestra el ahorro. |
| **Datos bancarios** | Cuentas activas configuradas por admin (copiar número de cuenta). |
| **Formulario** | Nombre · Email · Teléfono · Dirección · Ciudad · Notas (opcional). |
| **Validación** | No deja confirmar si falta stock en algún producto. |
| **Confirmar** | Crea el pedido, descuenta stock, aplica cupón, envía email, redirige a la página del pedido. |

---

### 2.7 Después de comprar (página del pedido)

| Elemento | Detalle |
|----------|---------|
| **Resumen** | Estado, lista de productos, totales. |
| **Datos para transferencia** | Mismas cuentas que en checkout (por si aún no ha transferido). |
| **Subir comprobante** | Arrastrar o elegir imagen (JPG, PNG, WebP; máx. 10 MB). Opcional: número de referencia y notas. |
| **Estados** | Pendiente de pago · Verificando pago · Pagado · Procesando · Empacado · Enviado · Entregado · Cancelado · Reembolsado. |
| **Notificaciones** | Mensajes en pantalla al subir comprobante y en otras acciones. |

---

### 2.8 Mis pedidos

- Lista con fecha, estado, total y cantidad de ítems.
- Expandir fila: ver productos y dirección de envío.
- **Ver detalles** → página del pedido (cuando está pendiente o en verificación).
- **Ver factura** → cuando el pedido está pagado/procesando/enviado/entregado y ya hay factura.
- **Exportar CSV** → descarga todos los pedidos del usuario (número, fecha, estado, total, productos).

---

### 2.9 Factura

- Vista con número, fecha, datos de facturación, líneas (producto, cantidad, precio), totales.
- Botón **Descargar / imprimir** → abre el diálogo de impresión del navegador (opción “Guardar como PDF”).

---

### 2.10 Emails automáticos

- **Al crear pedido:** confirmación con resumen y enlace para ver el pedido y subir comprobante.
- **Al cambiar estado:** aviso al cliente (Pagado, Procesando, Empacado, Enviado, Entregado, Cancelado, Reembolsado).

---

## 3. Área de administración (panel admin)

Acceso: menú de usuario → **Panel Admin**. Solo usuarios con rol de administrador o staff ven el enlace y pueden entrar.

### 3.1 Rutas del panel admin

| Ruta | Módulo | Descripción breve |
|------|--------|-------------------|
| `/admin` | Inicio | Dashboard con estadísticas y accesos rápidos. |
| `/admin/orders` | Pedidos | Listado, detalle, aprobar/rechazar pago, cambiar estado, factura, exportar CSV. |
| `/admin/products` | Productos | Listado, crear/editar/eliminar producto, información nutricional (incl. IA). |
| `/admin/inventory` | Inventario | Listado de productos con stock, búsqueda, ajustar stock. |
| `/admin/categories` | Categorías | Listado, crear/editar/eliminar categorías. |
| `/admin/payment-methods` | Métodos de pago | Cuentas bancarias para transferencia; activar/editar/eliminar. |
| `/admin/discounts` | Descuentos | Cupones; crear/editar/activar/desactivar/eliminar. |
| `/admin/invoices` | Facturas | Listado, ver detalle, imprimir/PDF, anular. |
| `/admin/users` | Usuarios | Listado de usuarios, búsqueda, gestionar roles. |

La barra lateral del admin muestra solo los módulos a los que el usuario tiene permiso (según su rol).

---

### 3.2 Dashboard (`/admin`)

**Qué se ve:**

- **Tres tarjetas de estadísticas:**
  - Ventas totales (pedidos con estado “completado”).
  - Pedidos recientes (últimos 30 días).
  - Usuarios registrados (total de perfiles).
- **Gráfico de actividad** (resumen visual).
- **Accesos rápidos** (enlaces): Gestionar Productos, Ver Facturas, Crear Oferta (descuentos), Nuevo Usuario.
- **Tabla “Pedidos recientes”:** hasta 5 últimos pedidos con ID, cliente, fecha, estado, total y acción. Enlace “Ver todos los pedidos” a `/admin/orders`.

---

### 3.3 Pedidos (`/admin/orders`)

**Pantalla principal**

- **Filtros:** búsqueda por ID de pedido, selector de estado (todos, pendiente, payment_pending, paid, etc.).
- **Botón Exportar CSV:** descarga el listado filtrado (columnas: pedido, fecha, estado, total, cliente, email).
- **Tabla:** columnas según diseño (ID, cliente, fecha, estado, total, acciones). Clic en fila o botón para abrir el **detalle del pedido**.

**Detalle del pedido (modal o panel)**

- **Datos del pedido:** ID, fecha, estado actual, total, subtotal, descuento.
- **Cliente:** nombre, email (desde perfil o dirección de envío), teléfono, dirección de envío.
- **Ítems:** producto, cantidad, precio unitario, subtotal por línea.
- **Pagos (`order_payments`):**
  - Listado de registros de pago (comprobantes subidos).
  - Para cada uno: monto, estado (Pendiente / Verificado / Rechazado), referencia, notas, **imagen del comprobante** (vista y opción “Ver completo” en nueva pestaña).
  - **Acciones:** **Aprobar pago** y **Rechazar pago**.
    - Al aprobar: se marca el pago como verificado, el pedido pasa a “Pagado” y se puede crear la factura automáticamente si no existe.
    - Al rechazar: el pago queda rechazado y el pedido puede volver a “Pendiente”.
- **Cambiar estado del pedido:** selector con todos los estados (Pendiente, Comprobante enviado, Pagado, Procesando, Empacado, Enviado, Entregado, Cancelado, Reembolsado). Al guardar se registra en auditoría y se envía el **email de cambio de estado** al cliente.
- **Crear factura:** botón para generar la factura de ese pedido (si aún no existe). Número de factura automático, datos de facturación desde el pedido.

---

### 3.4 Productos (`/admin/products`)

**Listado**

- **Búsqueda** por nombre (con espera al escribir).
- **Filtro por categoría:** todas o una categoría concreta.
- **Paginación:** anterior / siguiente.
- **Tabla:** imagen, nombre, categoría, precio, stock, destacado (sí/no), **acciones por fila:**
  - **Info nutricional** (ícono): abre el diálogo de información nutricional (ver abajo).
  - **Editar** (lápiz): abre formulario de edición.
  - **Eliminar** (papelera): confirmación y borrado.

**Crear / Editar producto (formulario)**

- **Campos:** nombre, descripción, precio, precio original (opcional; si es mayor que precio se muestra descuento en tienda), categoría (selector), stock, imagen (subir archivo o URL), switch “Producto destacado”.
- **Botones:** Cancelar, Crear producto / Guardar cambios.

**Información nutricional (diálogo)**

- **Botón “Generar con IA”:** llama a la Edge Function y rellena automáticamente tamaño de porción, porciones por envase, calorías, proteína, carbohidratos, grasa, otros nutrientes, ingredientes (según respuesta de la IA).
- **Campos editables:** tamaño de porción, porciones por envase, tabla de nutrientes (calorías, proteína, carbohidratos, grasa, otros), ingredientes, alérgenos (lista que se puede añadir/quitar).
- **Guardar:** graba en `product_nutrition` asociado al producto. Toast de confirmación.

---

### 3.5 Inventario (`/admin/inventory`)

- **Búsqueda:** por nombre de producto o categoría.
- **Indicadores/KPIs:** cantidad de productos en stock, bajo stock, sin stock (según umbrales de la UI).
- **Tabla:** productos con stock actual y acciones.
- **Ajustar stock (diálogo):**
  - Modo **establecer:** fija la cantidad absoluta.
  - Modo **ajustar:** suma o resta una cantidad al stock actual.
  - No se permite dejar stock negativo; validación y mensaje de error si aplica.
- Toasts de éxito o error al guardar.

---

### 3.6 Categorías (`/admin/categories`)

- **Listado:** tabla con nombre, slug, cantidad de productos en la categoría, estado (activa/inactiva), acciones (editar, eliminar).
- **Crear categoría:** botón “Nueva categoría”. Campos: nombre (puede autogenerar slug), slug (editable), descripción, switch “Categoría activa”. Botones: Cancelar, Crear.
- **Editar:** mismo formulario; Guardar cambios.
- **Eliminar:** solo permitido si la categoría **no tiene productos** asociados; si tiene, se muestra aviso. Si no tiene, confirmación y borrado.

---

### 3.7 Métodos de pago (`/admin/payment-methods`)

- **Listado:** cada método con nombre, banco, tipo de cuenta, número, titular, RNC, instrucciones, **orden de visualización** (`display_order`) y estado (activo/inactivo).
- **Activar / Desactivar:** toggle por método. Solo los **activos** se muestran al cliente en checkout y en la página de confirmación del pedido.
- **Crear método:** Nombre, banco, tipo de cuenta, número de cuenta, titular, RNC, instrucciones, orden de visualización, activo. Botones: Cancelar, Crear.
- **Editar:** mismos campos. Guardar cambios.
- **Eliminar:** confirmación (AlertDialog) y borrado.

---

### 3.8 Descuentos (`/admin/discounts`)

- **Listado:** código, tipo (porcentaje / monto fijo), valor, usos (ej. usados / máximos), estado activo/inactivo, acciones.
- **Copiar código:** botón que copia el código al portapapeles y muestra toast.
- **Activar / Desactivar:** switch por fila sin borrar el cupón.
- **Crear código:** Código (texto, suele ir en mayúsculas), descripción, tipo (porcentaje | monto fijo), valor, compra mínima, usos máximos (total), usos por usuario, fecha desde/hasta, activo. Cancelar / Crear código.
- **Editar:** mismos campos. Guardar cambios.
- **Eliminar:** confirmación y borrado.

---

### 3.9 Facturas (`/admin/invoices`)

- **Listado:** número de factura, fecha, pedido asociado, cliente, total, estado. Búsqueda por número o cliente.
- **Acciones por factura:**
  - **Ver detalle:** abre la misma vista imprimible que ve el cliente (número, datos de facturación, líneas, totales).
  - **Descargar PDF:** abre la factura en nueva pestaña para imprimir o guardar como PDF.
  - **Anular factura:** cambia el estado a “anulada” cuando corresponda (si el estado lo permite).

---

### 3.10 Usuarios (`/admin/users`)

- **Búsqueda:** por email o nombre.
- **Listado:** en desktop tabla; en móvil tarjetas. Columnas/datos: nombre, email, roles (badges), fecha de registro.
- **Gestionar roles (diálogo):** al hacer clic en “Gestionar roles” para un usuario se abre un diálogo con la lista de roles disponibles (Administrador, Manager, Editor, Soporte, Cliente). Checkboxes para asignar o quitar. Al guardar se reemplazan los roles del usuario y se registra en auditoría.
- **Permisos:** qué módulos ve cada usuario en el panel depende de su rol (por ejemplo solo admin para Descuentos, Usuarios, Métodos de pago; gestión de pedidos/productos según roles configurados).

---

### 3.11 Auditoría

- Las acciones relevantes (cambios de estado de pedidos, aprobar/rechazar pago, crear factura, cambiar roles de usuario, etc.) quedan registradas en el sistema (tabla de auditoría / logs) para trazabilidad. No se describe aquí la pantalla de consulta si existe una específica; el dato queda guardado en backend.

---

## 4. Seguridad y privacidad

- **Autenticación** — Inicio de sesión y registro con Supabase Auth.
- **Permisos** — Solo usuarios con rol adecuado acceden al panel admin.
- **Políticas de base de datos (RLS)** — Cada usuario solo ve sus propios pedidos, facturas y datos; el admin ve lo necesario según su rol.
- **Comprobantes** — Subida a un almacenamiento seguro; solo el cliente dueño del pedido y el admin pueden verlos.

---

## 5. Tecnología (resumen para el cliente)

- **Frontend** — Aplicación web moderna (React), adaptable a móvil y escritorio. Puede instalarse como aplicación (PWA) desde el navegador.
- **Backend** — Supabase (base de datos, autenticación, almacenamiento de archivos, envío de emails y funciones en la nube).
- **Pagos** — Transferencia bancaria; las cuentas se configuran desde el panel (Métodos de pago). Precios en pesos dominicanos (DOP).
- **Emails** — Envío automático de confirmación de pedido y de cambios de estado (vía Resend/Supabase).
- **IA** — Usada para recomendaciones por producto (mejor momento, con qué combinar, perfil ideal) y para generar información nutricional en el admin.

---

## 6. Resumen de flujos principales

| Quién        | Acción principal                                      |
|-------------|--------------------------------------------------------|
| Cliente     | Buscar y filtrar productos, ver detalle, usar IA      |
| Cliente     | Añadir al carrito, aplicar cupón, confirmar pedido    |
| Cliente     | Subir comprobante, ver pedidos y facturas, exportar CSV|
| Administrador | Gestionar productos, inventario, categorías           |
| Administrador | Gestionar pedidos, aprobar pagos, cambiar estados     |
| Administrador | Gestionar facturas, descuentos, métodos de pago      |
| Administrador | Gestionar usuarios y roles, exportar pedidos a CSV    |

---

## 7. Notas adicionales

- **Idioma y moneda** — La interfaz está en español y los precios en pesos dominicanos (DOP).
- **Acceso al panel admin** — Solo usuarios con rol de administrador o staff ven el enlace “Panel Admin” en el menú y pueden entrar a las rutas `/admin/*`.
- **Factura** — La genera el administrador (manualmente o al aprobar el pago). El cliente solo puede verla e imprimirla cuando ya existe.

---

---

## 8. Capturas de pantalla (web y móvil)

Para tener **capturas de cada apartado** en versión **web** y **móvil**:

1. **Script automático:** con la app en marcha (`npm run dev`), ejecutar:
   ```bash
   npm run screenshots
   ```
   Las imágenes se guardan en `docs/screenshots/web/` y `docs/screenshots/mobile/`.

2. **Listado y checklist** de todas las pantallas a capturar (públicas, con usuario, admin y extras):  
   [docs/screenshots/README.md](screenshots/README.md)

3. **Opcional:** para incluir pantallas que requieren login (Mi cuenta, Pedidos, Admin, etc.), definir variables de entorno `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` antes de ejecutar el script. Ver instrucciones en el README de screenshots.

### Video de uso (demo)

Se puede generar un **video de demostración** del recorrido por la página (inicio, tienda, producto, sobre nosotros, auth y opcionalmente panel admin):

- Con la app en marcha: `npm run demo-video`
- El archivo se guarda en **`docs/videos/barbaro-demo.webm`** (WebM, reproducible en navegador).
- Para incluir el panel admin en el video: definir `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` antes de ejecutar. Ver [docs/videos/README.md](videos/README.md).
- **Guion para narración (voz clonada / ElevenLabs)** y **guía ampliada del uso de cada apartado:** [docs/videos/guion-demo-y-guia-uso.md](videos/guion-demo-y-guia-uso.md).

---

*Documento generado para presentación al cliente. Refleja las funcionalidades disponibles en la plataforma Barbaro Nutrition.*
