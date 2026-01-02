# Propuesta de sitio web - Barbaro Nutrition

## Objetivo
Presentar un sitio ecommerce moderno con catalogo, carrito, checkout por transferencia y un panel de administracion completo para operar la tienda.

## Resumen ejecutivo
El proyecto incluye un frontend comercial listo para ventas y un backoffice para gestion diaria. La base de datos y autenticacion estan en Supabase, con roles y politicas de seguridad. Tambien hay notificaciones por email para pedidos.

## Alcance funcional (lo que ya incluye)
### Sitio publico
- Home con hero, categorias, productos destacados, testimonios y CTA.
- Tienda con listado de productos y filtros por categoria.
- Ficha de producto con imagen, precio, descuento, stock, wishlist y agregar al carrito.
- Carrito tipo drawer con cantidades y total.
- Checkout por transferencia con resumen, descuentos y datos bancarios.

### Cuenta de cliente
- Registro e inicio de sesion.
- Perfil editable con avatar y datos de envio.
- Wishlist de productos.
- Historial de pedidos y estados.
- Factura imprimible por pedido.

### Administracion
- Panel principal con modulos.
- Productos: CRUD, imagenes, precios, stock y destacados.
- Categorias: CRUD (listo para habilitar en rutas).
- Inventario: ajustes de stock y alertas basicas.
- Pedidos: cambio de estado, auditoria y envio de emails.
- Facturas: generacion automatica y listado.
- Usuarios y roles: gestion de permisos.

### Notificaciones
- Email de confirmacion y de cambio de estado de pedidos (Supabase Edge Function + Resend).

### Tecnologia
- React + Vite + TypeScript.
- Tailwind + shadcn-ui.
- Supabase Auth, Postgres, Storage y Edge Functions.

### Seguridad
- RLS en tablas clave.
- Roles admin/manager/support/customer.

## Beneficios para el cliente
- Lanzamiento rapido con base solida.
- Panel admin para operar sin terceros.
- Arquitectura escalable para nuevas funciones.

## Entregables
- Sitio publico listo para ventas.
- Panel admin operativo.
- Base de datos, migraciones y funciones.
- Configuracion de email transaccional.

## Requisitos para puesta en produccion
- Configurar dominio, variables de entorno y Resend API key.
- Cargar catalogo e imagenes reales.
- Ajustar textos, branding y SEO (titulo, og tags, meta).
- Definir politicas de envio, devoluciones y terminos.

## Siguientes pasos
- Validar contenido y catalogo.
- Prueba de compra end-to-end.
- Publicacion en hosting y dominio.
