# Microservicio de Citas con Nutricionistas

Microservicio desacoplado para agenda de citas, formularios dinámicos y cotizaciones.

## Estructura
- `supabase/migrations/20260103_appointments_schema.sql`: esquema y RLS
- `lib/appointments-api.ts`: cliente API para frontend
- `components/`: UI reutilizable (catálogo, booking, mis citas)
- `docs/`: API, base de datos e integración

## Pasos rápidos
1) Ejecuta la migración en Supabase (SQL Editor o `supabase db push`).
2) Seed opcional: crear perfiles y nutricionistas (tablas `profiles` y `nutritionists`).
3) Habilita el feature flag en `APPOINTMENTS_CONFIG.ENABLED` (ya en `true`).
4) Prueba en la app: `/appointments` (catálogo), `/appointments/book/:id`, `/account/appointments`.

## Dependencias
- Supabase (Postgres + Auth)
- Edge Functions opcionales para notificaciones / pagos
- Email (Resend/SendGrid) y SMS (Twilio) opcionales
