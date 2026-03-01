
# Plan: Sistema Robusto de Notificaciones por Correo en Todo el Ciclo de Pedido

## Problema Actual

1. **Resend "from" invalido**: `send-order-email` usa `onboarding@resend.dev` y `send-notification` usa `no-reply@barbarohub.com`. Los logs muestran error 403: "You can only send testing emails to your own email address". Se debe usar `onboarding@resend.dev` (unico dominio permitido sin verificar dominio propio en Resend) y enviar solo a la cuenta registrada, O verificar un dominio propio.
2. **Notificaciones al admin por correo**: Cuando se crea un pedido, se notifica al admin via tabla `notifications` pero NO se le envia email directamente. El edge function `send-notification` espera ser llamado como webhook de DB (formato `{record, type: 'INSERT'}`), pero NO hay webhook configurado.
3. **Gaps en el ciclo**: El upload de comprobante (`OrderConfirmation.tsx`) no notifica al admin. La verificacion/rechazo de pago (`AdminOrders.tsx`) no notifica al usuario por email. La creacion de factura no notifica.

## Solucion

Unificar todo el envio de correos en un unico edge function `send-order-email` mejorado que cubra todos los eventos del ciclo, y agregar notificaciones hexagonales en cada punto critico.

---

## Fase 1: Refactorizar `send-order-email` Edge Function

Reescribir `supabase/functions/send-order-email/index.ts` para soportar mas tipos de email:

- `order_created` (existente, mejorar)
- `status_changed` (existente, mejorar)
- `payment_proof_uploaded` (nuevo - notificar admin)
- `payment_verified` / `payment_rejected` (nuevo - notificar usuario)
- `invoice_created` (nuevo - notificar usuario)
- `admin_new_order` (nuevo - notificar admin de nuevo pedido)

Cambios clave:
- Aceptar campo `adminEmail` opcional para enviar al admin
- Usar `onboarding@resend.dev` como remitente (limitacion de Resend sin dominio verificado)
- Agregar links absolutos con la URL publicada (`https://barbaro-nutrition.lovable.app`)
- Templates HTML premium consistentes con la marca Barbaro

---

## Fase 2: Agregar notificaciones en `OrderConfirmation.tsx` (Upload de comprobante)

Cuando el usuario sube un comprobante de pago:
1. Audit log: `logAction('PAYMENT_PROOF_UPLOADED', 'order_payments', ...)`
2. Notificacion in-app al admin: `sendToAdmin({ title: 'Comprobante Recibido', type: 'ORDER_UPDATE', priority: 'HIGH' })`
3. Email al admin via `send-order-email` con tipo `payment_proof_uploaded`

---

## Fase 3: Agregar notificaciones en `AdminOrders.tsx` (Verificar/Rechazar pago y cambio de estado)

Al verificar o rechazar pago:
1. Notificacion in-app al usuario: `sendToUser({ title: 'Pago Verificado/Rechazado', ... })`
2. Email al usuario via `send-order-email` con tipo `payment_verified` o `payment_rejected`

Al cambiar estado de pedido (ya envia email, pero agregar notificacion in-app):
1. Notificacion in-app al usuario con `sendToUser`

Al crear factura:
1. Notificacion in-app y email al usuario

---

## Fase 4: Agregar email al admin en `TransferCheckout.tsx`

Ya envia notificacion in-app al admin. Agregar llamada a `send-order-email` con tipo `admin_new_order` enviando al `ADMIN_EMAIL`.

---

## Fase 5: Construir links absolutos correctos en emails

Todos los enlaces en los correos deben apuntar a la URL publicada:
- Pedido del usuario: `https://barbaro-nutrition.lovable.app/order/{id}`
- Panel de pedidos admin: `https://barbaro-nutrition.lovable.app/admin/orders`
- Factura: `https://barbaro-nutrition.lovable.app/orders/invoice/{id}`

---

## Archivos a Crear/Modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/send-order-email/index.ts` | Reescribir con todos los tipos de email |
| `src/pages/OrderConfirmation.tsx` | Agregar audit + notificaciones al subir comprobante |
| `src/pages/admin/AdminOrders.tsx` | Agregar notificaciones in-app en verify/reject/status + email invoice |
| `src/pages/TransferCheckout.tsx` | Agregar email admin_new_order |

## Nota sobre Resend

El error en los logs indica que con `onboarding@resend.dev` solo puedes enviar a tu propio email registrado en Resend. Para enviar a cualquier destinatario, se necesita verificar un dominio propio en resend.com/domains. Los correos se enviaran con `from: "Barbaro Nutrition <onboarding@resend.dev>"` y funcionaran para testing. Para produccion, habra que verificar el dominio.
