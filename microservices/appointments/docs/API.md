# API - Microservicio de Citas

## Cliente Público
- `GET /nutritionists?specialization=&available=`
- `GET /slots?nutritionistId=&date=`
- `POST /appointments` (body: nutritionistId, slotId, consultationType, clientData)
- `GET /appointments/my`
- `PATCH /appointments/:id/cancel`
- `GET /quotes/:id`
- `PATCH /quotes/:id/accept`

## Admin
- `POST /admin/nutritionists`
- `GET /admin/nutritionists`
- `PATCH /admin/nutritionists/:id`
- `DELETE /admin/nutritionists/:id`
- `POST /admin/slots/bulk`
- `GET /admin/slots?nutritionistId=`
- `DELETE /admin/slots/:id`
- `GET /admin/appointments?status=&nutritionist=`
- `PATCH /admin/appointments/:id/status`
- `POST /admin/appointments/:id/notes`
- `POST /admin/quotes`
- `PATCH /admin/quotes/:id/send`
- `POST /admin/forms`

## Eventos / Webhooks (opcional)
- `appointment.created`
- `appointment.cancelled`
- `quote.accepted`
- `quote.rejected`

> Implementación sugerida: Supabase Edge Functions o Next.js API Routes usando la BD definida en `/supabase/migrations/20260103_appointments_schema.sql`.
