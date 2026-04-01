

# Plan: Corregir Build, Integrar Whop, Pulir Diseño y Completar Módulos

## Resumen

Corregir todos los errores de build existentes, agregar las columnas faltantes para la integración Whop, y pulir el diseño general de la aplicación para que sea más robusta y completa.

---

## Fase 1: Corregir Errores de Build (Crítico)

### 1.1 Edge Functions — errores de TypeScript
| Archivo | Error | Fix |
|---|---|---|
| `supabase/functions/mcp-inventory/index.ts:291` | `'err' is of type 'unknown'` | Cast: `(err as Error).message` |
| `supabase/functions/send-notification/index.ts:96` | `'error' is of type 'unknown'` | Cast: `(error as Error).message` |
| `supabase/functions/whop-webhook/index.ts:414` | `event.data?.metadata` no existe en el tipo | Cast: `(event.data as any)?.metadata?.order_id` |

### 1.2 Frontend — errores de TypeScript
| Archivo | Error | Fix |
|---|---|---|
| `src/components/creative/animated-card.tsx:15` | Conflicto `onAnimationStart` entre motion y React HTML | Separar props: excluir `onAnimationStart` del spread con `Omit` |
| `src/components/product/AIRecommendation.tsx:33` | `err` no existe en `FunctionsResponse` | Cambiar `{ data, err }` a `{ data, error }` |
| `src/modules/notifications/infrastructure/SupabaseNotificationAdapter.ts` | `@ts-expect-error` innecesarios (la tabla `notifications` ya está en los types) | Remover los 6 `@ts-expect-error` |
| `src/pages/TransferCheckout.tsx:142` | `provider` column no existe en `order_payments` | Ver Fase 2 (migración) |
| `src/test/setup.ts:29` | `global` no definido | Usar `globalThis` en su lugar |
| `src/lib/whop-checkout.test.ts` | `describe`, `it`, `expect` no encontrados | Agregar referencia de tipos vitest en tsconfig o importar de vitest |

---

## Fase 2: Migración — Columnas Faltantes para Whop

La tabla `order_payments` necesita columnas que el `create-whop-checkout` Edge Function ya escribe pero que no existen en el esquema:

```sql
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_checkout_id text;
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_currency text;
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_payload jsonb;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_checkout_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_metadata jsonb;
```

Tambien crear la tabla para idempotencia del webhook:
```sql
CREATE TABLE IF NOT EXISTS whop_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb,
  status text DEFAULT 'received',
  order_id text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE whop_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage webhook events" ON whop_webhook_events
  FOR ALL USING (is_admin(auth.uid()));
```

---

## Fase 3: Corregir TransferCheckout para Whop

Después de la migración, `TransferCheckout.tsx` línea 132 puede hacer `.select('provider, provider_checkout_id, ...')` sin error. Pero necesitamos esperar a que los types se regeneren. Mientras tanto, usar un cast temporal o seleccionar solo las columnas existentes y verificar via `notes` (que ya funciona con `isWhopPayment`).

---

## Fase 4: Pulir Diseño

### 4.1 Mejoras generales de UI
- **Navbar**: Agregar icono de notificaciones (campana) con badge de conteo no leído junto al carrito
- **Footer**: Verificar que links funcionen y estén completos
- **Shop page**: Mejorar estado vacío cuando no hay productos con ilustración
- **ProductCard**: Agregar badge de "Agotado" cuando stock=0, badge de descuento cuando `original_price > price`
- **NotificationCenter**: Integrar en el Navbar para que sea accesible desde cualquier página

### 4.2 Admin Dashboard
- Verificar que `/admin` muestre resumen con métricas (total pedidos, ingresos, productos, usuarios)
- Asegurar que las notificaciones admin lleguen al centro de notificaciones

---

## Fase 5: Desplegar Edge Functions Corregidas

Redesplegar las 3 edge functions corregidas:
- `mcp-inventory`
- `send-notification`
- `whop-webhook`

---

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/mcp-inventory/index.ts` | Fix `err` unknown cast |
| `supabase/functions/send-notification/index.ts` | Fix `error` unknown cast |
| `supabase/functions/whop-webhook/index.ts` | Fix `metadata` type cast |
| `src/components/creative/animated-card.tsx` | Fix motion props conflict |
| `src/components/product/AIRecommendation.tsx` | Fix `err` → `error` |
| `src/modules/notifications/infrastructure/SupabaseNotificationAdapter.ts` | Remove `@ts-expect-error` |
| `src/pages/TransferCheckout.tsx` | Fix provider column select |
| `src/test/setup.ts` | Fix `global` → `globalThis` |
| `src/lib/whop-checkout.test.ts` | Add vitest imports |
| Migración SQL | Agregar columnas Whop a `order_payments` y `orders` + crear `whop_webhook_events` |
| `src/components/layout/Navbar.tsx` | Agregar icono de notificaciones |

## Detalles Técnicos

- La integración Whop ya está funcionalmente completa en las Edge Functions (`create-whop-checkout` y `whop-webhook`). Solo faltan las columnas en la DB y los fixes de tipos.
- Los secrets de Whop (`WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_WEBHOOK_SECRET`) necesitan estar configurados. Actualmente NO aparecen en los secrets del proyecto — habrá que agregarlos si se quiere usar Whop en producción.
- El diseño actual ya es sólido (monochromático, Inter font, dark mode). Las mejoras son incrementales: notificaciones visibles, estados vacíos, badges informativos.

