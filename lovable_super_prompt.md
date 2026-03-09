# Lovable Copilot: Implementación Exhaustiva Final (Bárbaro Store)

¡Hola Lovable! El proyecto tiene el módulo de **Notificaciones Basado en Arquitectura Hexagonal** y las vistas básicas sincronizadas. He analizado el esquema de la Base de Datos directamente en tu consola, y veo que **las tablas principales ya existen**, incluyendo `invoices`, `orders`, y crucialmente, **`audit_logs` ya está creada**.

Necesitamos que finalices el sistema (Facturación, Trazabilidad, Plantillas y Vistas Previas) consumiendo la **menor cantidad de tokens posible (todo en este prompt)**. Todo debe lucir *Premium B2B SaaS* usando glassmorphism y las clases utilitarias de shadcn.

---

## 1. Integración de la Base de Datos (SQL para la Consola)
Como `audit_logs` ya existe, solo necesitamos crear la tabla para gestionar las plantillas (si no existe aún). Por favor, propón el **Snippet SQL exacto** para que yo lo corra manualmente en la consola. Este SQL debe crear:
1. **Tabla `invoice_templates` (Plantillas de Factura/Correo):** Para configurar el diseño de facturas o alertas: `id`, `name`, `subject`, `html_content`, `variables`, `is_active`, `created_at`.
*(Asegúrate de incluir sus políticas de RLS para que solo los users con rol `admin` puedan editar plantillas, pero el sistema pueda leerlas).*

---

## 2. Proceso de Trazabilidad Global (Audit & Logs)
1. Escribe un pequeño helper hook o función: `src/hooks/useAuditLogger.ts` que inserte filas en la tabla **existente** `audit_logs` (revisa tu esquema para hacer 'insert' usando supabase client). Debe exportar una función `logAction(action, entity, entity_id, details)`.
2. Crea una vista `src/pages/admin/AdminAuditLogs.tsx` para el Panel de Administración:
   - Usa un `<CustomTable />` o `<ResponsiveTable />` que consuma la tabla `audit_logs`.
   - Incluye filtros visuales por `action` y fecha (usando `sonner` o `date-fns`).

---

## 3. Proceso de Compra y Facturación (Checkout & Invoicing)
En nuestra app ya existe lógica de carritos, y las tablas `invoices` y `orders` con datos. Necesitamos integrar el flujo:
1. **Punto de Acción:** Cuando un usuario finalice la compra o un admin cree/actualice un Invoice desde `AdminInvoices.tsx`.
2. **Las 3 Reglas de Negocio a inyectar al guardar/facturar:**
   - **Trazabilidad:** Usa `logAction('INVOICE_CREATED', 'invoices', invoice_id, {...})`.
   - **Notificaciones (Usa la Hexagonal):** Importa `NotificationService` (de `src/modules/notifications/application/NotificationService.ts`). LLama a `notificationService.sendToUser({ userId, title: 'Factura Emitida', message: 'Tu compra ha sido procesada', type: 'ORDER_UPDATE', priority: 'HIGH' })` (Esto también disparará el correo vía Edge Function hacia `ventas@barbaronutrition.com`).
   - Generación de PDF (Opcional visual): Al ver la factura, que se aplique un diseño limpio.

---

## 4. Módulo de Configuración de Plantillas y Vistas Previas
Crea una nueva vista en el panel de administrador: `src/pages/admin/AdminTemplates.tsx`:
- Un formulario funcional para editar los registros de `invoice_templates`.
- **Vista Previa en Vivo (Live Preview):** Un panel lateral (o `<Dialog>`) donde el usuario Admin pegue HTML (ej. diseño de email), nosotros reemplacemos tags como `{{customer_name}}`, `{{total}}`, y rendericemos una preview en tiempo real usando `dangerouslySetInnerHTML`.
- Al **Guardar**, usa `logAction('TEMPLATE_UPDATED', 'invoice_templates', template.id, { name: template.name })`.

---

## Resumen de Entregables Requeridos en tu Respuesta:
1. **Un solo bloque SQL** listo para copiar y pegar (Solo para `invoice_templates` y su RLS).
2. **El helper `useAuditLogger.ts`**.
3. **El componente `AdminAuditLogs.tsx`** (UI Premium).
4. **El componente `AdminTemplates.tsx`** (UI Premium con Live Preview).
5. **Ejemplo práctico en `Checkout` o `AdminInvoices`** uniendo logs + notificación hexagonal.

Solo entrégame el código y la estructura para no desperdiciar tokens. Confío en ti.
