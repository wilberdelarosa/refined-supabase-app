# Plan: Sistema Completo de Facturacion, Trazabilidad, Plantillas y Notificaciones

## Resumen

Implementar el sistema completo incluyendo: tabla `invoice_templates`, hook de audit logging, vistas admin (AuditLogs y Templates con live preview), integracion de notificaciones en checkout, y correccion de errores de build existentes.

---

## Fase 0: Corregir errores de build existentes

Hay 3 archivos con errores que bloquean la compilacion:

1. `**src/components/creative/animated-card.tsx**` - Conflicto de tipos entre `motion.div` y `HTMLDivElement` por `onAnimationStart`. Solucion: eliminar el spread de `...props` y pasar solo `className` y `children`.
2. `**src/components/product/AIRecommendation.tsx**` - Usa `{ data, err }` pero la API de Supabase devuelve `{ data, error }`. Cambiar `err` a `error`.
3. `**src/modules/notifications/infrastructure/SupabaseNotificationAdapter.ts**` - Los `@ts-expect-error` ya no son necesarios en algunos lugares y faltan en otros. Unificar todos los accesos a `notifications` con `@ts-expect-error` consistente.

---

## Fase 1: Migracion SQL - Tabla `invoice_templates`

Crear la tabla `invoice_templates` con RLS para admin-only write y lectura publica del sistema:

```text
Columnas:
- id (uuid, PK)
- name (text, NOT NULL)
- subject (text)
- html_content (text)
- variables (jsonb, default '[]')
- is_active (boolean, default true)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

RLS:
- Admins: ALL (using is_admin)
- Anyone authenticated: SELECT (for system reads)
```

---

## Fase 2: Hook `useAuditLogger.ts`

Crear `src/hooks/useAuditLogger.ts` que exponga una funcion `logAction(action, tableName, recordId, details)`.

- Usa `supabase.rpc('log_audit', ...)` que ya existe como funcion `SECURITY DEFINER` en la DB.
- Funcion fire-and-forget para no bloquear el flujo principal.
- Exporta tanto el hook como una funcion standalone para uso fuera de componentes.

---

## Fase 3: Vista `AdminAuditLogs.tsx`

Nueva pagina admin en `src/pages/admin/AdminAuditLogs.tsx`:

- Tabla responsive con columnas: Fecha, Usuario, Accion, Tabla, Detalles.
- Filtros por accion (dropdown) y rango de fechas (inputs date).
- Paginacion (50 registros por pagina).
- Diseno glassmorphism con cards y badges de colores por tipo de accion.
- Registrar ruta `/admin/audit-logs` en `App.tsx`.
- Agregar enlace en sidebar de `AdminLayout.tsx` (icono `ClipboardList`).

---

## Fase 4: Vista `AdminTemplates.tsx`

Nueva pagina admin en `src/pages/admin/AdminTemplates.tsx`:

- Lista de plantillas con nombre, estado y acciones (editar/eliminar).
- Formulario de edicion con campos: name, subject, html_content, variables.
- **Live Preview**: Panel lateral con `Dialog` que renderiza el HTML reemplazando variables como `{{customer_name}}`, `{{total}}`, `{{order_id}}` con valores de ejemplo.
- Al guardar, llama a `logAction('TEMPLATE_UPDATED', ...)`.
- Registrar ruta `/admin/templates` en `App.tsx`.
- Agregar enlace en sidebar de `AdminLayout.tsx` (icono `FileCode`).

---

## Fase 5: Integracion Checkout + Notificaciones Hexagonales

Modificar `src/pages/TransferCheckout.tsx` para que al crear un pedido:

1. **Audit Log**: Llamar `logAction('ORDER_CREATED', 'orders', orderId, { total, items_count })`.
2. **Notificacion al usuario**: Usar `notificationAdapter.sendToUser({ userId, title: 'Pedido Confirmado', message, type: 'ORDER_UPDATE', priority: 'HIGH', linkUrl: '/orders' })`.
3. **Notificacion al admin**: Usar `notificationAdapter.sendToAdmin({ title: 'Nuevo Pedido', message, type: 'NEW_ORDER', priority: 'HIGH', linkUrl: '/admin/orders' })`.

Modificar `src/pages/admin/AdminInvoices.tsx` para que al anular factura:

1. Llamar `logAction('INVOICE_CANCELLED', 'invoices', invoiceId, { invoice_number })`.
2. Notificar al usuario via `sendToUser`.

---

## Fase 6: Tabla `notifications` en DB

La tabla `notifications` no existe en el esquema actual (los adapters usan `@ts-expect-error`). Crearla via migracion:

```text
Columnas:
- id (uuid, PK)
- user_id (uuid, nullable, FK -> auth.users ON DELETE CASCADE)
- title (text, NOT NULL)
- message (text, NOT NULL)
- type (text, NOT NULL)
- priority (text, default 'NORMAL')
- is_read (boolean, default false)
- link_url (text, nullable)
- created_at (timestamptz, default now())

RLS:
- Users can view their own notifications (user_id = auth.uid())
- Users can update their own (mark as read)
- Admins can view all
- Authenticated users can insert (for system use)
- Admin notifications (user_id IS NULL) visible to admins only

Realtime: Enable for notifications table
```

---

## Fase 7: Robustez del NotificationCenter

- Agregar `NotificationCenter` al `Navbar.tsx` del storefront (para usuarios normales, con `isAdmin={false}`).
- Esto permite que usuarios vean notificaciones de sus pedidos en tiempo real.

---

## Archivos a crear/modificar


| Archivo                                                                   | Accion                                 |
| ------------------------------------------------------------------------- | -------------------------------------- |
| Migracion SQL (invoice_templates + notifications)                         | Crear                                  |
| `src/hooks/useAuditLogger.ts`                                             | Crear                                  |
| `src/pages/admin/AdminAuditLogs.tsx`                                      | Crear                                  |
| `src/pages/admin/AdminTemplates.tsx`                                      | Crear                                  |
| `src/App.tsx`                                                             | Modificar (2 rutas nuevas)             |
| `src/components/layout/AdminLayout.tsx`                                   | Modificar (2 items nav)                |
| `src/components/layout/Navbar.tsx`                                        | Modificar (agregar NotificationCenter) |
| `src/pages/TransferCheckout.tsx`                                          | Modificar (audit + notificaciones)     |
| `src/pages/admin/AdminInvoices.tsx`                                       | Modificar (audit + notificaciones)     |
| `src/components/creative/animated-card.tsx`                               | Fix build error                        |
| `src/components/product/AIRecommendation.tsx`                             | Fix build error                        |
| `src/modules/notifications/infrastructure/SupabaseNotificationAdapter.ts` | Fix build errors                       |


---

## Detalles Tecnicos

- Se reutiliza la funcion existente `log_audit` (SECURITY DEFINER) via `supabase.rpc()`.
- Las notificaciones usan la arquitectura hexagonal existente (`NotificationSender`, `NotificationService`, `SupabaseNotificationAdapter`).
- El edge function `send-notification` ya esta preparado para enviar emails via Resend cuando se inserta en la tabla `notifications`.
- Live Preview de templates usa `dangerouslySetInnerHTML` con reemplazo de variables en un iframe sandboxed o div aislado.
- Todo el UI sigue el patron existente: `AdminLayout`, cards con `border-slate-200`, badges, iconos de Lucide, colores `#2b8cee`.  
  
  
  

- quiero que investigues y analices como deben ser y de uqe son las notificaciones y cada cosa que genera en un ciclo completo contempla cualquier accionde manera robusta los envio enlace de los correos que lleve al panel correspondiente que se envie al correo del ususario y del admin has eso muy robusto
- &nbsp;