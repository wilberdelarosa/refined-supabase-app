# E‑commerce de suplementos (Gym) — Requisitos, modelos y estimación (RD$)

Fecha: 2026-01-02

## 1) Flujo completo (cómo debe funcionar)

### 1.1 Visitante
- Navega catálogo por **categorías**, **marcas** y **objetivos** (masa/definición/energía).
- Búsqueda y filtros (precio, stock, sabor, tamaño, marca, rating).
- Ve ficha de producto: fotos, descripción, ingredientes, tabla nutricional, advertencias, variantes (sabor/tamaño), disponibilidad y reseñas.
- Agrega al carrito con validación de stock.
- Puede guardar en wishlist (opcional).
- Inicia checkout como invitado o inicia sesión.

### 1.2 Cliente autenticado
- Perfil: datos personales, teléfonos, direcciones, historial de pedidos y facturas.
- Checkout ordenado:
  1) Datos y dirección de envío
  2) Método de envío (costo/tiempo)
  3) Cupón/descuento (si aplica)
  4) Pago (transferencia/tarjeta/contraentrega; según alcance)
  5) Confirmación (pedido creado) + notificación por email/WhatsApp
- Post‑compra:
  - Seguimiento del estado (pendiente/pagado/preparando/enviado/entregado/cancelado/reembolsado).
  - Descarga de factura/recibo (PDF).
  - Soporte y devoluciones (si se incluye).

### 1.3 Operación (Admin/Staff)
- Catálogo: CRUD de productos, variantes, fotos, contenido nutricional, SEO y destacado.
- Inventario: stock por ubicación, movimientos, ajustes, alertas de stock bajo.
- Pedidos: ver detalle, cambiar estado, preparar (picking), registrar envío y tracking.
- Pagos: conciliación (ej. transferencias con comprobante) y reembolsos.
- Facturación: emisión de factura, numeración, PDF con logo y datos fiscales.
- Clientes: perfil, historial, notas internas.
- Reportes: ventas por período, productos top, stock crítico.

---

## 2) Modelos (data models) recomendados

> Nota: Este esquema es “completo”. Para MVP se puede recortar.

### 2.1 Identidad, roles y auditoría
- **profiles**
  - `user_id (PK/FK)`, `full_name`, `email`, `phone`, `created_at`, `updated_at`
- **user_roles**
  - `user_id`, `role` (admin/manager/support/customer), `created_at`
- **audit_logs**
  - `actor_user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `created_at`

### 2.2 Catálogo
- **categories**
  - `id`, `name`, `slug`, `parent_id?`, `sort_order`, `is_active`
- **brands** (opcional)
  - `id`, `name`, `slug`
- **products**
  - `id`, `name`, `slug`, `description`, `brand_id?`, `category_id`, `is_active`, `is_featured`, `created_at`, `updated_at`
- **product_variants** (muy recomendado)
  - `id`, `product_id`, `sku`, `variant_name` (ej. “Chocolate 2lb”), `attributes (json)` (sabor/tamaño),
    `price`, `compare_at_price?`, `cost?`, `weight?`, `barcode?`, `is_active`
- **product_images**
  - `id`, `product_id`, `variant_id?`, `url`, `alt`, `sort_order`
- **product_nutrition_facts**
  - `id`, `product_id` o `variant_id`, `serving_size`, `servings_per_container`, `calories`, `macros (json)`,
    `ingredients`, `allergens`, `warnings`
- **product_reviews**
  - `id`, `product_id`, `user_id`, `rating (1–5)`, `title?`, `body?`, `created_at`, `is_approved`

### 2.3 Inventario
- **inventory_locations**
  - `id`, `name`, `address`, `is_active`
- **inventory_levels**
  - `location_id`, `variant_id`, `on_hand`, `reserved`, `updated_at`
- **stock_movements**
  - `id`, `location_id`, `variant_id`, `type` (in/out/adjust), `qty`, `reason`, `reference_type?`, `reference_id?`, `created_at`

### 2.4 Carrito y wishlist
- **carts**
  - `id`, `user_id?`, `session_id?`, `status` (active/converted/abandoned), `created_at`, `updated_at`
- **cart_items**
  - `id`, `cart_id`, `variant_id`, `qty`, `unit_price_snapshot`, `added_at`
- **wishlists**
  - `id`, `user_id`, `created_at`
- **wishlist_items**
  - `wishlist_id`, `variant_id` (o `product_id`), `created_at`

### 2.5 Checkout, pedidos y pagos
- **addresses**
  - `id`, `user_id`, `name`, `line1`, `line2?`, `city`, `state?`, `postal_code?`, `country`, `phone`, `is_default`
- **shipping_methods**
  - `id`, `name`, `base_price`, `rules (json)` (por peso/zona), `is_active`
- **orders**
  - `id`, `order_number`, `user_id?`, `status`, `currency`,
    `subtotal`, `discount_total`, `tax_total`, `shipping_total`, `total`,
    `shipping_address_snapshot (json)`, `billing_address_snapshot (json)`,
    `notes_customer?`, `notes_internal?`, `created_at`
- **order_items**
  - `id`, `order_id`, `variant_id`, `product_name_snapshot`, `variant_snapshot`,
    `qty`, `unit_price`, `total`, `tax_rate_snapshot?`
- **payments**
  - `id`, `order_id`, `provider` (transfer/card/cash), `status` (pending/authorized/paid/failed/refunded),
    `amount`, `currency`, `provider_ref?`, `created_at`
- **payment_proofs** (para transferencias)
  - `id`, `payment_id`, `image_url`, `uploaded_by_user_id`, `review_status` (pending/approved/rejected), `review_note?`, `created_at`
- **refunds**
  - `id`, `payment_id`, `amount`, `reason`, `status`, `created_at`

### 2.6 Envíos
- **shipments**
  - `id`, `order_id`, `carrier`, `tracking_number`, `status`, `shipped_at?`, `delivered_at?`
- **shipment_items**
  - `shipment_id`, `order_item_id`, `qty`

### 2.7 Facturación
- **invoices**
  - `id`, `invoice_number`, `order_id`, `user_id?`, `issued_at`, `status`,
    `subtotal`, `tax_rate`, `tax_amount`, `total`, `billing_name`, `billing_address`, `pdf_url?`
- **invoice_lines**
  - `invoice_id`, `description`, `qty`, `unit_price`, `total`

### 2.8 Soporte y devoluciones (opcional)
- **returns**
  - `id`, `order_id`, `status` (requested/approved/received/rejected/refunded), `reason`, `created_at`
- **return_items**
  - `return_id`, `order_item_id`, `qty`, `condition`, `note?`
- **support_tickets**
  - `id`, `user_id`, `order_id?`, `subject`, `status`, `priority`, `created_at`
- **support_messages**
  - `ticket_id`, `sender_user_id`, `message`, `attachments?`, `created_at`

---

## 3) Funcionalidades (por módulo)

### 3.1 Cliente (frontend)
- Home + categorías + búsqueda + filtros
- Producto (variantes, stock, reseñas, nutrición)
- Carrito persistente
- Checkout (dirección → envío → cupón → pago)
- Confirmación + notificaciones
- Cuenta (perfil, direcciones, pedidos, facturas)
- Wishlist (opcional)
- Soporte/devoluciones (opcional)

### 3.2 Admin
- Productos + variantes + imágenes + SEO
- Inventario + movimientos + alertas
- Pedidos + cambios de estado + picking + tracking
- Pagos (conciliación y reembolsos)
- Facturación (PDF)
- Usuarios/roles
- Reportes básicos

### 3.3 Backoffice / Infra
- Auth + roles + permisos
- Reglas de stock y consistencia
- Emails transaccionales
- Generación de PDF
- Auditoría / trazabilidad
- Seguridad (validaciones server-side, rate limiting, etc.)

---

# Documento de Requisitos (SRS)

## Objetivo
Implementar una web e‑commerce para venta de suplementos con administración de catálogo, pedidos, pagos, facturas y envíos.

## Alcance MVP
- Catálogo + carrito + checkout + pedidos + panel admin + factura PDF + emails.

## Requisitos funcionales (RF)
- **RF‑01** Catálogo navegable por categorías, marcas, objetivos.
- **RF‑02** Búsqueda y filtros avanzados.
- **RF‑03** Ficha de producto con variantes, stock, nutrición, advertencias.
- **RF‑04** Carrito persistente con validación de stock.
- **RF‑05** Checkout guiado (dirección → envío → cupón → pago).
- **RF‑06** Creación de pedido y registro de ítems con snapshots de precio.
- **RF‑07** Gestión de estados del pedido.
- **RF‑08** Gestión de pagos (transferencia: comprobante + aprobación).
- **RF‑09** Factura: generación y descarga en PDF.
- **RF‑10** Panel admin para productos, inventario, pedidos y usuarios.
- **RF‑11** Notificaciones por email/WhatsApp (confirmación + cambios de estado).

## Requisitos no funcionales (RNF)
- **RNF‑01** Seguridad: roles, control de acceso, validación server-side.
- **RNF‑02** Rendimiento: paginación y optimización de imágenes.
- **RNF‑03** Disponibilidad: backups y monitoreo básico.
- **RNF‑04** Auditoría: registro de cambios en pedidos/pagos/inventario.
- **RNF‑05** UX responsive (mobile-first).

## Reglas de negocio (RB) sugeridas
- **RB‑01** No permitir comprar si no hay stock.
- **RB‑02** Reservar stock durante checkout (si aplica) y confirmar al pagar.
- **RB‑03** Cupones con expiración y límites de uso.
- **RB‑04** Factura se emite al marcar pago (configurable).

## Entregables
- Web app (cliente) + panel admin
- Base de datos + políticas de seguridad
- Emails transaccionales
- Facturas PDF
- Documentación de despliegue/operación

---

# Documento de Estimación (RD$)

> Estimación orientativa. El costo real depende de: pasarela de pago, requerimientos fiscales, integraciones (couriers/WhatsApp), y nivel de diseño.

## Suposiciones
- 1 tienda, moneda DOP.
- Variantes por producto (sabor/tamaño).
- ITBIS fijo o configurable.
- Equipo típico: 1 full‑stack + diseño part‑time + QA ligero.

## Fases y rangos

### Fase A — MVP (6 a 10 semanas)
Incluye: catálogo, producto, carrito, checkout, pedidos, admin básico, factura PDF, emails.
- **RD$ 280,000 – RD$ 650,000**

### Fase B — Profesional (10 a 16 semanas)
Incluye: variantes avanzadas, inventario por ubicación, cupones completos, devoluciones, reportes, hardening y UX.
- **RD$ 650,000 – RD$ 1,400,000**

### Fase C — Completa/Escala (16 a 26 semanas)
Incluye: tarjeta + webhooks robustos, tracking envíos, automatización, analítica, performance y seguridad avanzada.
- **RD$ 1,400,000 – RD$ 3,000,000+**

## Costos recurrentes (mensuales aproximados)
- Hosting/DB: **RD$ 2,500 – RD$ 25,000** (según tráfico)
- Email transaccional: **RD$ 500 – RD$ 6,000**
- Dominio/SSL: **RD$ 1,000 – RD$ 2,500/año**
- Mantenimiento (opcional): 10%–20% anual del costo del proyecto o bolsa mensual.

## Variables que cambian el precio
- Pago con tarjeta y conciliación.
- Facturación fiscal (NCF/series/RNC y reglas específicas).
- Integración con couriers y tracking.
- Migración/importación de catálogo.
