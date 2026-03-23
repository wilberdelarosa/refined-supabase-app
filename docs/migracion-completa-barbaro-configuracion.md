# Migracion Completa Barbaro - Configuracion

## Objetivo

Mover la app a un Supabase externo sin perder la estructura del proyecto actual en Lovable.

## Estado actual

- El proyecto de Lovable usa `Lovable Cloud` como backend integrado.
- El archivo auto-generado de Lovable queda intacto en `src/integrations/supabase/client.ts`.
- El proyecto ahora redirige el import `@/integrations/supabase/client` hacia una capa propia en `src/lib/supabase/default-client.ts`.
- Si existen `VITE_EXTERNAL_SUPABASE_URL` y `VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY`, la app usara el proyecto externo por defecto.
- El cliente original de Lovable sigue disponible como escape hatch en `src/lib/supabase/lovable-client.ts`.

## Variables de entorno del frontend

Copiar los valores de `.env.external.example` hacia `.env` cuando exista el proyecto externo:

```env
VITE_EXTERNAL_SUPABASE_ENABLED="true"
VITE_EXTERNAL_SUPABASE_URL="https://TU_PROJECT_REF.supabase.co"
VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY="TU_ANON_KEY"
```

El alias exacto ya quedo configurado en:

- `vite.config.ts`
- `vitest.config.ts`
- `tsconfig.app.json`

## Secrets de Edge Functions

Configurar en el proyecto Supabase externo:

```text
ADMIN_EMAIL
LOVABLE_API_KEY
PUBLIC_SITE_URL
RESEND_API_KEY
WHOP_API_KEY
WHOP_COMPANY_ID
WHOP_ENVIRONMENT
WHOP_WEBHOOK_SECRET
```

## Storage buckets requeridos

Crear estos buckets:

- `products` public
- `avatars` public
- `order-proofs` public
- `shipping-vouchers` private

## Edge Functions a desplegar

Desplegar desde `supabase/functions/`:

- `ai-consultation-intake`
- `ai-nutrition`
- `ai-recommendation`
- `create-whop-checkout`
- `mcp-inventory`
- `populate-product-images`
- `seed-catalog`
- `send-notification`
- `send-order-email`
- `whop-webhook`

## MCP esperado

Cuando `mcp-inventory` este desplegado, el endpoint MCP quedara en este formato:

```text
https://TU_PROJECT_REF.supabase.co/functions/v1/mcp-inventory
```

## Corte recomendado

1. Crear o reactivar un proyecto Supabase externo.
2. Ejecutar `supabase/migracion-completa-barbaro.sql` en SQL Editor.
3. Crear buckets.
4. Cargar los secrets.
5. Desplegar edge functions.
6. Poner las variables `VITE_EXTERNAL_SUPABASE_*` en `.env`.
7. Ejecutar `npm run build` y probar login, catálogo, checkout y webhooks.

## Bloqueo encontrado

No fue posible crear ni reactivar un proyecto Supabase adicional en la cuenta actual porque el dashboard reporta que `wilberdelarosa` excedio el limite de proyectos gratis activos. Antes del corte final hace falta una de estas acciones:

- pausar o eliminar un proyecto activo existente
- actualizar la organizacion a Pro
- usar otro proyecto externo ya disponible y con acceso completo
