# Guion profesional para video demo y guía exhaustiva por apartado — Barbaro Nutrition

Este documento sirve para:
- **Narrar el video de demostración** (voz clonada, ElevenLabs, etc.) con un guion completo de unos **10 minutos**.
- **Consultar el uso detallado** de cada apartado: no se omite ningún pantalla ni detalle.

---

## Uso con ElevenLabs (voz clonada)

1. Crea o usa un **Voice Clone** en [ElevenLabs](https://elevenlabs.io) (o Clawd / tu proveedor).
2. Configura **`ELEVENLABS_API_KEY`** (y si aplica **`ELEVENLABS_VOICE_ID`**) en tu entorno; no guardes claves en el repositorio.
3. Copia cada bloque del **Guion de narración** (Parte 1) en orden y genera el audio por escena.
4. Sincroniza con el video: el recorrido del video sigue el orden de las escenas; las pausas están pensadas para que quepa la narración (~10–12 s por pantalla en las principales). Monta el audio en tu editor (DaVinci Resolve, Premiere, etc.) o usa un script que superponga la voz al video.

---

# Parte 1 — Guion de narración profesional (video ~10 min)

Usa este texto como narración en orden. Cada bloque corresponde a una escena del video. Ritmo sugerido: pausado y claro, unas 140–150 palabras por minuto.

---

## Bloque 0 — Apertura (0:00)

«Hola. En este video te presento la plataforma completa de **Barbaro Nutrition**: la tienda online de suplementos deportivos y el panel de administración para gestionar catálogo, pedidos, pagos y clientes. Recorreremos cada apartado para que no se te escape ningún detalle. Empezamos por la parte pública.»

---

## Bloque 1 — Página de inicio (0:30)

«Estamos en la **página de inicio**. El cliente ve el mensaje principal de la marca, las categorías de productos, los **productos destacados** y una sección de testimonios. Desde aquí puede ir directo a la tienda, explorar categorías o leer sobre la marca en “Sobre nosotros”. La navegación es clara tanto en escritorio como en móvil.»

---

## Bloque 2 — Tienda: catálogo y herramientas (1:00)

«En la **tienda** se muestra todo el catálogo. Arriba hay una barra de **búsqueda** que busca por nombre, descripción o marca en tiempo real. Los botones de **categoría** permiten filtrar por tipo de producto: todos, creatinas, proteínas, etc. Se puede **ordenar** por más recientes, precio de menor a mayor o al revés, por nombre o por productos con descuento. Los **filtros** permiten ver solo productos en stock, solo destacados, o acotar por precio mínimo y máximo. La vista se puede cambiar entre **cuadrícula** y **lista**. Un contador muestra cuántos productos hay y un botón permite **limpiar todos los filtros**. En móvil los filtros se abren en un panel desplegable.»

---

## Bloque 3 — Detalle de producto (2:00)

«Al entrar a un **producto** vemos la **galería de imágenes**, el nombre, la categoría y la descripción. El precio se muestra destacado; si hay descuento, aparece el precio anterior tachado y el porcentaje. Una barra indica el **stock** disponible; si quedan pocas unidades se muestra el aviso “Últimas unidades”, y si está agotado el botón de agregar al carrito se deshabilita. El cliente elige la **cantidad**, puede **agregar al carrito** o **guardar en favoritos** con el corazón. En la ficha está la **tabla nutricional** —porción, calorías, proteínas, carbohidratos, grasas, ingredientes, alérgenos e instrucciones— si el administrador la completó. Un botón **“Generar recomendación”** usa **inteligencia artificial** para sugerir el mejor momento para tomarlo, con qué combinarlo y para qué perfil es ideal; se puede pedir otra recomendación. Abajo se muestran **productos relacionados** de la misma categoría para seguir navegando.»

---

## Bloque 4 — Carrito (2:45)

«El **carrito** se abre desde el ícono en la barra superior: es un panel deslizable. Ahí se ven los productos añadidos, se puede subir o bajar la cantidad por ítem o quitar un producto. El total se actualiza al instante. El carrito **se guarda en el navegador** entre sesiones. El botón **“Proceder al pago”** lleva al checkout por transferencia.»

---

## Bloque 5 — Sobre nosotros (3:15)

«En **“Sobre nosotros”** el cliente encuentra la información de la marca, su historia y valores. Es la pantalla ideal para generar confianza antes de comprar.»

---

## Bloque 6 — Iniciar sesión y registro (3:35)

«Desde **Iniciar sesión** el usuario ingresa con su correo y contraseña. En la misma pantalla puede **registrarse** con nombre, correo y contraseña. Una vez dentro tendrá acceso a **Mi cuenta**, **Favoritos**, **Mis pedidos** y al **Panel de administración** si tiene permisos.»

---

## Bloque 7 — Mi cuenta y perfil (4:00)

«Con la sesión iniciada, en **Mi cuenta** el cliente ve un resumen de su perfil y accesos rápidos a Mis Pedidos, Favoritos y Editar perfil. Si es administrador, aparece el enlace al Panel Admin. En **Editar perfil** puede actualizar nombre, teléfono, dirección, ciudad y el resto de datos de envío y facturación.»

---

## Bloque 8 — Favoritos (4:25)

«En **Favoritos** —o lista de deseos— se guardan los productos marcados con el corazón. Desde cada uno puede añadirlo al carrito o quitarlo de favoritos. Muy útil para comparar o comprar más tarde.»

---

## Bloque 9 — Checkout y pago por transferencia (4:50)

«En el **checkout** el cliente ve el **resumen** de productos, cantidades y precios, el **subtotal** y, si aplica un cupón, el **descuento** y el **total**. Hay un campo para **código de descuento** y un botón para aplicar o quitar. Se muestran los **datos bancarios** activos configurados por el admin —banco, número de cuenta, titular— para copiar y hacer la transferencia. El formulario pide nombre, email, teléfono, dirección, ciudad y notas opcionales. El sistema **no deja confirmar** si falta stock en algún producto. Al **confirmar** se crea el pedido, se descuenta el stock, se aplica el cupón si lo hay, se envía un email de confirmación y se redirige a la página del pedido.»

---

## Bloque 10 — Página del pedido y comprobante (5:30)

«En la **página del pedido** el cliente ve el **estado** actual, la lista de productos y los totales. Vuelve a ver los **datos bancarios** por si aún no ha transferido. Puede **subir el comprobante de pago**: arrastrando una imagen o eligiendo un archivo —JPG, PNG o WebP, hasta 10 megas— y opcionalmente indicar número de referencia y notas. Los estados posibles son: Pendiente de pago, Verificando pago, Pagado, Procesando, Empacado, Enviado, Entregado, Cancelado o Reembolsado. Cada cambio de estado puede enviar un correo automático al cliente.»

---

## Bloque 11 — Mis pedidos y factura (5:55)

«En **Mis pedidos** el cliente ve la lista con fecha, estado, total y cantidad de ítems. Puede **expandir** cada fila para ver productos y dirección de envío. Desde ahí puede **Ver detalles** —ir a la página del pedido— o **Ver factura** cuando el pedido está pagado o en proceso y ya existe factura. Un botón **Exportar CSV** descarga todos sus pedidos con número, fecha, estado, total y productos. La **factura** se muestra con número, fecha, datos de facturación, líneas con producto, cantidad y precio, y totales. Tiene botón para **descargar o imprimir**, que abre el diálogo de impresión del navegador para guardar como PDF.»

---

## Bloque 12 — Transición al panel admin (6:20)

«A partir de aquí entramos al **panel de administración**. Solo usuarios con rol de administrador o staff ven el enlace “Panel Admin” en el menú y pueden acceder a estas pantallas.»

---

## Bloque 13 — Dashboard admin (6:35)

«El **dashboard** es el inicio del panel. Se ven **tres tarjetas de estadísticas**: ventas totales según pedidos completados, pedidos recientes en los últimos 30 días y usuarios registrados. Hay un **gráfico de actividad** y **accesos rápidos** a Gestionar Productos, Ver Facturas, Crear Oferta —descuentos— y Nuevo Usuario. La tabla de **pedidos recientes** muestra hasta los últimos cinco con ID, cliente, fecha, estado, total y una acción para abrir el detalle. Un enlace lleva a ver todos los pedidos.»

---

## Bloque 14 — Pedidos: listado y filtros (7:10)

«En **Pedidos** el administrador ve el listado completo. Puede **filtrar** por estado —pendiente, verificación, pagado, enviado, etc.— y **buscar** por ID de pedido. Un botón **Exportar CSV** descarga el listado filtrado con columnas de pedido, fecha, estado, total, cliente y email. Cada fila se puede abrir para ver el detalle.»

---

## Bloque 15 — Detalle del pedido: pagos y factura (7:45)

«En el **detalle del pedido** se ven los datos del pedido —ID, fecha, estado, total, subtotal, descuento—, los datos del **cliente** —nombre, email, teléfono, dirección— y la **lista de ítems** con producto, cantidad, precio y subtotal. En la sección de **pagos** aparecen los comprobantes subidos: para cada uno, monto, estado —Pendiente, Verificado o Rechazado—, referencia, notas y la **imagen del comprobante** con opción de ver completa en otra pestaña. El admin puede **Aprobar** o **Rechazar** el pago. Al aprobar, el pedido pasa a Pagado y se puede generar la factura si no existe. Con el selector de **estado** se puede cambiar a Procesando, Empacado, Enviado, Entregado, Cancelado o Reembolsado; al guardar se registra y se envía el email al cliente. Un botón **Crear factura** genera la factura de ese pedido con número automático y datos del pedido.»

---

## Bloque 16 — Productos: listado y acciones (8:25)

«En **Productos** se gestiona el catálogo. Hay **búsqueda** por nombre y **filtro por categoría**, con paginación. La tabla muestra imagen, nombre, categoría, precio, stock y si es destacado. Por cada producto hay acciones: **Información nutricional** —abre un diálogo con tabla de nutrientes y opción de generarla con IA—, **Editar** —abre el formulario— y **Eliminar** —con confirmación. Al **crear o editar** se completan nombre, descripción, precio, precio original opcional, categoría, stock, imagen —subida o URL— y un switch de “Producto destacado”. En el diálogo de **información nutricional** el botón “Generar con IA” rellena porción, porciones por envase, calorías, proteína, carbohidratos, grasa, ingredientes; el resto de campos son editables y se guarda en la ficha del producto.»

---

## Bloque 17 — Inventario (8:55)

«En **Inventario** se ve el stock de todos los productos: búsqueda por nombre o categoría, indicadores de bajo stock o sin stock, y una tabla con stock actual. Desde cada fila se puede **ajustar stock**: en modo “establecer” se fija la cantidad absoluta; en modo “ajustar” se suma o resta una cantidad. No se permite stock negativo; si se intenta, se muestra validación y mensaje de error. Al guardar aparece un toast de éxito o error.»

---

## Bloque 18 — Categorías (9:15)

«En **Categorías** se listan todas con nombre, slug, cantidad de productos y estado activa o inactiva. Se puede **crear** una nueva con nombre —que puede autogenerar el slug—, slug editable, descripción y switch “Categoría activa”. **Editar** usa el mismo formulario. **Eliminar** solo está permitido si la categoría no tiene productos; si tiene, se muestra un aviso; si no tiene, se pide confirmación y se borra.»

---

## Bloque 19 — Métodos de pago (9:35)

«En **Métodos de pago** se configuran las **cuentas bancarias** que ve el cliente en checkout y en la página del pedido. Cada método tiene nombre, banco, tipo de cuenta, número, titular, RNC, instrucciones, **orden de visualización** y estado activo o inactivo. Solo los **activos** se muestran al cliente. Se pueden crear, editar y eliminar métodos; al eliminar se pide confirmación.»

---

## Bloque 20 — Descuentos (9:50)

«En **Descuentos** se gestionan los **cupones**. El listado muestra código, tipo —porcentaje o monto fijo—, valor, usos —cuántos usados y cuántos máximos— y estado. Se puede **copiar** el código al portapapeles, **activar o desactivar** sin borrarlo, **crear** códigos con descripción, tipo, valor, compra mínima, usos máximos, usos por usuario, fechas desde y hasta, y **editar** o **eliminar** con confirmación.»

---

## Bloque 21 — Facturas (10:05)

«En **Facturas** se ve el listado con número, fecha, pedido asociado, cliente y total. Se puede **buscar** por número o cliente. Por cada factura: **Ver detalle** —la misma vista imprimible que el cliente—, **Descargar PDF** —abre en nueva pestaña para imprimir o guardar— y **Anular factura** cuando el estado lo permita.»

---

## Bloque 22 — Usuarios y roles (10:20)

«En **Usuarios** el administrador ve todos los usuarios: búsqueda por email o nombre, listado con nombre, email, **roles** en badges y fecha de registro. El botón **Gestionar roles** abre un diálogo con la lista de roles —Administrador, Manager, Editor, Soporte, Cliente— y checkboxes para asignar o quitar. Al guardar se actualizan los roles del usuario y se registra en auditoría. Los módulos que cada usuario ve en el panel dependen de su rol.»

---

## Bloque 23 — Cierre (10:40)

«Las acciones importantes del admin —cambios de estado de pedidos, aprobar o rechazar pago, crear factura, cambiar roles— quedan registradas en el sistema para **auditoría y trazabilidad**. Esto es el recorrido completo de la plataforma Barbaro Nutrition: tienda, cliente y administración. Si necesitas más detalle de alguna pantalla, en la documentación del proyecto está la guía exhaustiva por apartado. Gracias por tu atención.»

---

# Parte 2 — Guía exhaustiva por apartado (ningún detalle omitido)

A continuación se describe **cada** pantalla y **cada** acción disponible: qué ve el usuario, qué puede hacer y qué ocurre en cada caso.

---

## 1. Parte pública (sin login)

### 1.1 Página de inicio (`/`)

| Elemento | Descripción |
|----------|-------------|
| Hero | Mensaje principal, imagen o banner, llamada a la acción hacia la tienda. |
| Categorías | Enlaces o botones por categoría (ej. Creatinas, Proteínas). |
| Productos destacados | Grid o lista de productos marcados como destacados por el admin. |
| Testimonios | Sección de opiniones o frases de clientes. |
| Newsletter | Opcional: campo para suscripción. |
| Header | Logo, enlaces a Inicio, Tienda, Sobre nosotros, ícono carrito, menú usuario (o Iniciar sesión). |
| Footer | Enlaces, redes, legal si aplica. |

**Acciones:** clic en categoría → filtrar tienda; clic en producto → detalle; clic en “Tienda” → `/shop`; clic en “Sobre nosotros” → `/about`; clic en carrito → abrir drawer del carrito.

---

### 1.2 Tienda (`/shop`)

| Elemento | Descripción |
|----------|-------------|
| Barra de búsqueda | Campo de texto; busca en nombre, descripción o marca; **debounce** al escribir (no busca en cada tecla). |
| Filtro categoría | Botones: “Todos” + uno por cada categoría activa. Al elegir, se filtra el listado. |
| Ordenar | Select o botones: Más recientes, Precio menor a mayor, Precio mayor a menor, Nombre A–Z, Con descuento primero, Destacados primero. |
| Filtros adicionales | Solo en stock (checkbox), Solo destacados (checkbox), Precio mínimo (número), Precio máximo (número). En móvil: panel colapsable “Filtros”. |
| Vista | Toggle o botones: Grid (cuadrícula de tarjetas) o Lista (filas con más detalle). |
| Contador | Texto “X productos” según filtros aplicados. |
| Botón “Limpiar filtros” | Quita todos los filtros y vuelve al estado por defecto. |
| Listado de productos | Tarjetas o filas según vista. Por producto: imagen, nombre, categoría, precio, % descuento si hay, indicador stock, botón “Agregar al carrito”, ícono corazón (favoritos). |
| Paginación o scroll | Si hay muchos productos, paginación “Anterior / Siguiente” o scroll infinito según implementación. |

**Acciones:** escribir en búsqueda → filtra; clic categoría → filtra; cambiar orden → reordena; marcar filtros → filtra; cambiar vista → cambia layout; “Limpiar filtros” → resetea; clic producto → `/producto/:id`; agregar al carrito → añade y puede mostrar toast; corazón → añade o quita de favoritos (si no hay sesión puede pedir login).

---

### 1.3 Detalle de producto (`/producto/:id`)

| Elemento | Descripción |
|----------|-------------|
| Galería de imágenes | Una o varias imágenes; posible zoom o lightbox. |
| Nombre | Título del producto. |
| Categoría | Enlace o texto a la categoría. |
| Descripción | Texto o HTML de la descripción. |
| Precio | Precio actual; si hay descuento: precio anterior tachado y % de descuento. |
| Stock | Barra o texto; “Últimas unidades” si poco stock; “Agotado” si 0. |
| Selector de cantidad | Control numérico (+, −) con mínimo 1 y máximo según stock. |
| Botón “Agregar al carrito” | Añade la cantidad elegida; deshabilitado si stock 0. |
| Botón / ícono Favoritos | Añade o quita de la lista de favoritos. |
| Tabla nutricional | Si existe: tamaño porción, porciones por envase, calorías, proteína, carbohidratos, grasa, otros nutrientes, ingredientes, alérgenos, instrucciones de uso. |
| Bloque “Recomendación IA” | Botón “Generar recomendación”: llama a Edge Function y muestra “Mejor momento”, “Combinar con”, “Perfil ideal”. Botón “Generar otra” para nueva sugerencia. Estados: loading (skeleton), contenido, error con “Reintentar”. |
| Productos relacionados | Hasta 4 productos de la misma categoría (excluyendo el actual); enlaces a su detalle. |

**Acciones:** cambiar cantidad; agregar al carrito; toggle favoritos; generar recomendación IA; clic en relacionado → otro producto.

---

### 1.4 Carrito (drawer / panel)

| Elemento | Descripción |
|----------|-------------|
| Trigger | Ícono de carrito en header; muestra badge con cantidad de ítems si hay. |
| Panel | Deslizable desde la derecha (o según diseño); lista de ítems. |
| Por ítem | Imagen, nombre, precio unitario, selector cantidad (+/−), subtotal, botón quitar. |
| Subtotal / Total | Suma de ítems; si hay descuento de cupón aplicado en checkout, aquí puede no mostrarse hasta checkout. |
| Botón “Proceder al pago” | Navega a `/checkout/transferencia`. |
| Persistencia | Carrito guardado en `localStorage` o backend (saved_carts); persiste entre sesiones. |

**Acciones:** subir/bajar cantidad; quitar ítem; cerrar drawer (clic fuera o botón); “Proceder al pago” → checkout.

---

### 1.5 Sobre nosotros (`/about`)

Contenido estático: texto e imágenes de la marca, misión, valores, contacto si aplica. Sin acciones críticas más que navegación.

---

### 1.6 Iniciar sesión / Registro (`/auth`)

| Modo | Campos | Botón |
|------|--------|--------|
| Iniciar sesión | Email, Contraseña | “Iniciar sesión” |
| Registro | Nombre, Email, Contraseña | “Registrarse” |

**Acciones:** enviar formulario → auth con Supabase; éxito → redirige a inicio o a la ruta previa; error → mensaje en pantalla. Enlace “¿Olvidaste tu contraseña?” si está implementado.

---

## 2. Parte cliente (con login)

### 2.1 Mi cuenta (`/account`)

Resumen del perfil (nombre, email), enlaces a: **Mis Pedidos** (`/orders`), **Favoritos** (`/wishlist`), **Editar perfil** (`/profile/edit`). Si el usuario tiene rol admin/staff: enlace **Panel Admin** (`/admin`). Menú usuario: Cerrar sesión.

---

### 2.2 Editar perfil (`/profile/edit`)

Campos editables: nombre, teléfono, dirección (calle, número), ciudad, código postal si aplica, etc. Botón **Guardar cambios**. Toast de éxito o error. Los datos se usan en checkout y en facturación.

---

### 2.3 Favoritos (`/wishlist`)

Lista de productos guardados (tabla `wishlist` o equivalente). Por cada uno: imagen, nombre, precio, botón **Añadir al carrito**, botón o ícono para **Quitar de favoritos**. Si la lista está vacía: mensaje “No tienes favoritos” o similar.

---

### 2.4 Checkout por transferencia (`/checkout/transferencia`)

| Bloque | Contenido |
|--------|-----------|
| Resumen | Lista de productos del carrito: nombre, cantidad, precio unitario, subtotal por línea. Subtotal global. Si hay cupón aplicado: línea de descuento y total. |
| Cupón | Campo para código, botón “Aplicar”; si es válido se muestra el ahorro y botón “Quitar”. |
| Datos bancarios | Lista de métodos de pago **activos** configurados por admin: nombre del método, banco, tipo de cuenta, número de cuenta (copiable), titular, RNC si aplica, instrucciones. |
| Formulario | Nombre, Email, Teléfono, Dirección, Ciudad, Notas (opcional). Pueden venir precargados del perfil. |
| Validación | No permite confirmar si algún producto del carrito ya no tiene stock. Mensaje claro si falta stock. |
| Botón “Confirmar pedido” | Crea el pedido (tabla `orders`, `order_items`, `order_shipping`), descuenta stock, aplica cupón si hay (`discount_usages`), envía email de confirmación (Resend/Supabase), redirige a `/order/:id`. |

---

### 2.5 Página del pedido (`/order/:id`)

| Elemento | Descripción |
|----------|-------------|
| Estado | Badge o texto: Pendiente de pago, Verificando pago, Pagado, Procesando, Empacado, Enviado, Entregado, Cancelado, Reembolsado. |
| Resumen | Lista de ítems, cantidades, precios, subtotal, descuento si hay, total. |
| Datos bancarios | Mismas cuentas que en checkout (por si el cliente aún no ha transferido). |
| Subir comprobante | Zone de drag & drop o “Elegir archivo”; formatos JPG, PNG, WebP; máximo 10 MB. Campos opcionales: número de referencia, notas. Al subir se crea registro en `order_payments` y el estado puede pasar a “Verificando pago”. Notificación de éxito o error. |
| Historial o mensajes | Opcional: mensajes al subir comprobante o al cambiar estado. |

---

### 2.6 Mis pedidos (`/orders`)

Lista de pedidos del usuario: para cada uno, fecha, estado, total, cantidad de ítems. **Expandir fila**: muestra productos y dirección de envío. **Ver detalles** → navega a `/order/:id` (cuando está pendiente o en verificación). **Ver factura** → navega a `/orders/invoice/:invoiceId` (cuando el pedido está pagado o en proceso y existe factura). **Exportar CSV** → descarga archivo con todos los pedidos del usuario (número, fecha, estado, total, productos).

---

### 2.7 Factura (`/orders/invoice/:invoiceId`)

Vista imprimible: número de factura, fecha, datos de facturación (nombre, dirección, RNC si aplica), tabla de líneas (producto, cantidad, precio unitario, total por línea), subtotal, impuestos si aplican, total. Botón **Descargar / Imprimir** → abre `window.print()` para guardar como PDF desde el diálogo del navegador. Si hay NCF o comprobante fiscal, se muestra según implementación.

---

### 2.8 Emails automáticos

- **Al crear pedido:** email de confirmación con resumen y enlace a la página del pedido para subir comprobante.
- **Al cambiar estado:** email al cliente con el nuevo estado (Pagado, Procesando, Empacado, Enviado, Entregado, Cancelado, Reembolsado) según configuración del backend.

---

## 3. Panel de administración

**Acceso:** solo usuarios con rol que tenga permiso (administrador, manager, etc.). Enlace “Panel Admin” en menú de usuario → `/admin`. La barra lateral muestra solo los módulos permitidos para ese rol.

---

### 3.1 Dashboard (`/admin`)

| Elemento | Descripción |
|----------|-------------|
| Tarjeta ventas totales | Cálculo sobre pedidos con estado “completado” o equivalente. |
| Tarjeta pedidos recientes | Cantidad de pedidos en los últimos 30 días. |
| Tarjeta usuarios registrados | Total de perfiles en la base de datos. |
| Gráfico de actividad | Visualización de ventas o pedidos en el tiempo (según implementación). |
| Accesos rápidos | Enlaces: Gestionar Productos, Ver Facturas, Crear Oferta (descuentos), Nuevo Usuario. |
| Tabla pedidos recientes | Hasta 5 últimos: ID, cliente, fecha, estado, total, acción (Ver). Enlace “Ver todos los pedidos” → `/admin/orders`. |

---

### 3.2 Pedidos (`/admin/orders`)

**Listado:** filtro por estado (todos, pendiente, payment_pending, paid, processing, shipped, delivered, cancelled, refunded), búsqueda por ID. Botón **Exportar CSV** (columnas: pedido, fecha, estado, total, cliente, email). Tabla: columnas según diseño; clic en fila o botón “Ver” → abre detalle.

**Detalle (modal o panel):** datos del pedido (ID, fecha, estado, total, subtotal, descuento); cliente (nombre, email, teléfono, dirección); ítems (producto, cantidad, precio, subtotal); **Pagos:** por cada `order_payments`: monto, estado (Pendiente/Verificado/Rechazado), referencia, notas, imagen del comprobante (miniatura + “Ver completo” en nueva pestaña). Botones **Aprobar pago** / **Rechazar pago**. Selector **Cambiar estado** con todos los estados; al guardar → actualiza pedido, registra en auditoría, envía email al cliente. Botón **Crear factura** → genera registro en `invoices` + `invoice_lines` con número automático (`generate_invoice_number`), datos del pedido.

---

### 3.3 Productos (`/admin/products`)

**Listado:** búsqueda por nombre (debounce), filtro por categoría, paginación. Tabla: imagen, nombre, categoría, precio, stock, destacado (sí/no). Acciones: **Info nutricional** (diálogo), **Editar** (formulario), **Eliminar** (confirmación).

**Crear / Editar:** nombre, descripción, precio, precio original (opcional), categoría (select), stock, imagen (upload o URL), switch “Producto destacado”. Cancelar, Crear producto / Guardar cambios.

**Diálogo información nutricional:** tamaño porción, porciones por envase, calorías, proteína, carbohidratos, grasa, otros nutrientes, ingredientes, alérgenos (lista editable). Botón **Generar con IA** → Edge Function rellena campos; el usuario puede editar. Guardar → graba en `product_nutrition`; toast de confirmación.

---

### 3.4 Inventario (`/admin/inventory`)

Búsqueda por nombre o categoría. KPIs o indicadores: total en stock, bajo stock, sin stock (umbrales según UI). Tabla: producto, stock actual, acción “Ajustar”. **Diálogo ajustar:** modo Establecer (valor absoluto) o Ajustar (+/−); no permite valor negativo; validación y toast de éxito o error.

---

### 3.5 Categorías (`/admin/categories`)

Listado: nombre, slug, cantidad de productos, estado (activa/inactiva), editar, eliminar. **Nueva categoría:** nombre, slug (autogenerable desde nombre), descripción, activa. **Editar:** mismos campos. **Eliminar:** solo si la categoría no tiene productos; si tiene, aviso; si no, confirmación y borrado.

---

### 3.6 Métodos de pago (`/admin/payment-methods`)

Listado: nombre, banco, tipo cuenta, número, titular, RNC, instrucciones, orden de visualización, activo (toggle). Crear, Editar, Eliminar (confirmación). Solo métodos **activos** se muestran en checkout y en página del pedido.

---

### 3.7 Descuentos (`/admin/discounts`)

Listado: código, tipo (porcentaje/monto fijo), valor, usos (usados/máximos), activo, acciones. **Copiar código** → portapapeles + toast. Activar/Desactivar (toggle). **Crear:** código, descripción, tipo, valor, compra mínima, usos máximos, usos por usuario, fecha desde/hasta, activo. Editar, Eliminar con confirmación.

---

### 3.8 Facturas (`/admin/invoices`)

Listado: número, fecha, pedido, cliente, total, estado. Búsqueda por número o cliente. Acciones: Ver detalle (vista imprimible), Descargar PDF (nueva pestaña), Anular (si aplica).

---

### 3.9 Usuarios (`/admin/users`)

Búsqueda por email o nombre. Listado: nombre, email, roles (badges), fecha registro. **Gestionar roles:** diálogo con roles (Administrador, Manager, Editor, Soporte, Cliente); checkboxes; al guardar se actualizan roles y se registra en auditoría. Los módulos visibles en el panel dependen del rol.

---

### 3.10 Auditoría

Las acciones críticas (cambio de estado de pedido, aprobar/rechazar pago, crear factura, cambiar roles de usuario, etc.) se registran en tabla de auditoría o logs para trazabilidad. No se describe aquí una pantalla de consulta si existe una específica; el dato queda en backend.

---

*Guion y guía exhaustiva para Barbaro Nutrition. Video demo: Parte 1. Consulta detallada: Parte 2.*
