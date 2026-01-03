# Microservicio de Citas - Guía de Activación/Desactivación

## 🚀 Activar Microservicio

### 1. Configurar Feature Flag

Edita `src/features/appointments/config.ts`:

```typescript
export const APPOINTMENTS_CONFIG = {
  ENABLED: true, // ✅ Activado
  // ...
};
```

### 2. Aplicar Migración de Base de Datos

```bash
# En Supabase Dashboard > SQL Editor
# Ejecutar: supabase/migrations/appointments_schema.sql
```

### 3. Agregar Enlaces en Navbar (Opcional)

Si `SHOW_NAVBAR_LINK: true`:

```tsx
// src/components/layout/Navbar.tsx
import { useAppointmentFeature } from '@/features/appointments/config';

{useAppointmentFeature('SHOW_NAVBAR_LINK') && (
  <Link to="/appointments">
    <Button variant="ghost">Citas</Button>
  </Link>
)}
```

---

## ⏸️ Desactivar Microservicio

### Opción 1: Desactivación Total (Sin eliminar código)

```typescript
// src/features/appointments/config.ts
export const APPOINTMENTS_CONFIG = {
  ENABLED: false, // ❌ Desactivado
};
```

**Resultado:**
- Todos los componentes del microservicio dejan de renderizarse
- APIs no se ejecutan
- No hay impacto en el resto de la app

### Opción 2: Desactivación Parcial (Features específicas)

```typescript
FEATURES: {
  SHOW_PRODUCT_BANNER: false,     // Ocultar banner en productos
  SHOW_NAVBAR_LINK: false,        // Quitar enlace navbar
  SHOW_IN_USER_PROFILE: true,     // Mantener en perfil
  ENABLE_QUOTES: false,           // Desactivar cotizaciones
}
```

### Opción 3: Eliminación Completa

```bash
# 1. Eliminar carpeta del microservicio
rm -rf src/features/appointments

# 2. Eliminar migraciones (opcional)
rm supabase/migrations/appointments_*.sql

# 3. Limpiar base de datos (si ya fue aplicada)
# En Supabase SQL Editor:
DROP TABLE IF EXISTS appointment_reviews CASCADE;
DROP TABLE IF EXISTS appointment_notes CASCADE;
DROP TABLE IF EXISTS dynamic_forms CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS appointment_slots CASCADE;
DROP TABLE IF EXISTS nutritionists CASCADE;
```

---

## 📁 Estructura Desacoplada

```
src/features/appointments/          # TODO el microservicio aquí
├── config.ts                       # Feature flags
├── api.ts                          # API client
├── types.ts                        # TypeScript types
├── components/                     # Componentes UI
│   ├── client/
│   │   ├── NutritionistCard.tsx
│   │   ├── AppointmentBooking.tsx
│   │   └── MyAppointments.tsx
│   └── admin/
│       ├── AppointmentsDashboard.tsx
│       └── NutritionistManagement.tsx
├── hooks/                          # Custom hooks
│   ├── useNutritionists.ts
│   └── useAppointments.ts
└── utils/                          # Utilidades
    └── validators.ts

supabase/migrations/
└── appointments_schema.sql         # Base de datos

docs/appointments/                  # Documentación
├── INTEGRATION.md
└── API.md
```

---

## 🔌 Puntos de Integración

### 1. Navbar (Condicional)

```tsx
import { AppointmentsNavLink } from '@/features/appointments/components/NavLink';

<Navbar>
  {/* Resto de enlaces */}
  <AppointmentsNavLink />  {/* Solo se muestra si está enabled */}
</Navbar>
```

### 2. Perfil de Usuario (Condicional)

```tsx
import { MyAppointmentsSection } from '@/features/appointments/components/client/MyAppointments';

<AccountPage>
  {/* Secciones existentes */}
  <MyAppointmentsSection />  {/* Solo si está enabled */}
</AccountPage>
```

### 3. Productos (Banner Condicional)

```tsx
import { ConsultationBanner } from '@/features/appointments/components/ProductBanner';

<ProductDetail>
  <ConsultationBanner productId={product.id} />
</ProductDetail>
```

---

## ✅ Verificación de Estado

```typescript
import { APPOINTMENTS_CONFIG } from '@/features/appointments/config';

console.log('Appointments enabled:', APPOINTMENTS_CONFIG.ENABLED);
console.log('Features:', APPOINTMENTS_CONFIG.FEATURES);
```

---

## 🎯 Ventajas de esta Arquitectura

✅ **Totalmente desacoplado** - No afecta funcionalidad existente  
✅ **Feature flags** - Activar/desactivar sin redeployar  
✅ **Modular** - Fácil de mover a otro proyecto  
✅ **Type-safe** - TypeScript en todo el código  
✅ **Self-contained** - TODO en una carpeta  

---

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# .env
VITE_APPOINTMENTS_ENABLED=true
VITE_APPOINTMENTS_API_URL=/api/appointments
VITE_TWILIO_ENABLED=false
```

```typescript
// config.ts
export const APPOINTMENTS_CONFIG = {
  ENABLED: import.meta.env.VITE_APPOINTMENTS_ENABLED === 'true',
  // ...
};
```

---

**Conclusión:** El microservicio está diseñado para no interferir con el core de la aplicación. Puedes activarlo/desactivarlo en cualquier momento sin romper nada.
