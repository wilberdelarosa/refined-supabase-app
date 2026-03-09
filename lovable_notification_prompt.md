# Lovable Copilot: Activación Masiva de Notificaciones y Email (Bárbaro Store)

¡Hola Lovable! Hemos avanzado mucho. Ya tenemos el módulo de **Notificaciones Basado en Arquitectura Hexagonal** (`src/modules/notifications/...`) y una **Edge Function** en Supabase lista para enviar correos vía Resend.

Necesito que actives el sistema para que las notificaciones "cobren vida" y los correos lleguen correctamente. Sigue estas instrucciones al pie de la letra para ahorrar tokens.

---

## 1. Configuración de Base de Datos (SQL para la Consola)
Por favor, genera el SQL para crear el **Webhook** en Supabase. Este webhook debe disparar nuestra Edge Function cada vez que se inserte una fila en `public.notifications`.

**Snippet SQL Requerido:**
```sql
-- 1. Asegúrate de que las extensiones necesarias estén activas
create extension if not exists "http" with schema "extensions";

-- 2. Crear el trigger para el Webhook de Notificaciones
-- Cambia 'TU_PROYECTO_ID' por el ID real si es necesario, 
-- o usa la URL de la Edge Function: send-notification
create or replace trigger on_notification_inserted
  after insert on public.notifications
  for each row execute function supabase_functions.http_request(
    'https://d99ade28-307c-4ccc-aaf5-ddebe23c62ed.supabase.co/functions/v1/send-notification',
    'POST',
    '{"Content-Type":"application/json", "Authorization":"Bearer YOUR_ANON_KEY"}',
    '{}',
    '1000'
  );
```
*(Nota: Ajusta el SQL si Lovable tiene una mejor forma de crear triggers de Edge Functions en su entorno).*

---

## 2. Integración en el Frontend (Puntos de Disparo)
Quiero que inyectes el envío de notificaciones en los siguientes procesos clave:

1.  **Checkout / Compra Finalizada:**
    - Al completar una orden exitosamente, usa `notificationService.sendToUser` para avisar al cliente.
    - **Prioridad:** HIGH (esto disparará el correo).
    - **Tipo:** `ORDER_UPDATE`.

2.  **Nueva Factura (Admin):**
    - En `AdminInvoices.tsx`, cuando un administrador emita o cambie el estado de una factura a "Pagada".
    - Envía una notificación al usuario dueño de la factura.

3.  **Alertas de Sistema (Admin):**
    - Si un stock baja de cierto límite (opcional si ya existe la lógica) o cuando se registra un nuevo usuario.

---

## 3. Verificación de Notificaciones (UI)
- Asegúrate de que el componente `NotificationCenter.tsx` (que ya está en los Layouts) esté suscrito correctamente al canal `public:notifications` mediante el repositorio de Supabase que ya creamos (`SupabaseNotificationAdapter.ts`).
- Los puntos rojos de "No leído" deben actualizarse en tiempo real.

---

## 4. Instrucciones de Envío de Email
Para que los correos lleguen:
- Si no hay dominio verificado, dile al usuario que la Edge Function usará por defecto `onboarding@resend.dev`.
- El usuario debe configurar en los **Secrets de Supabase**:
  - `RESEND_API_KEY`: Su llave de Resend.
  - `ADMIN_EMAIL`: `ventas@barbaronutrition.com` (ya configurado localmente).
  - `RESEND_SENDER_EMAIL`: (Opcional, `onboarding@resend.dev` por defecto).

---

**Entregables:**
1. SQL final para el Webhook.
2. Modificaciones en `Checkout` y `AdminInvoices` para disparar las notificaciones.
3. Confirmación de que el Realtime está activo para que el usuario "vea" la campana sonar.

¡Hagamos que las notificaciones funcionen ahora mismo!
