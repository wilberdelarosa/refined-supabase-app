## Plan: Imágenes editables desde admin + mejoras generales

### 1. Sistema de imágenes editables desde el panel admin

**Nueva tabla `site_images`** (Lovable Cloud):
- `id`, `slot` (text unique), `image_url`, `alt_text`, `title`, `subtitle`, `link_url`, `sort_order`, `is_active`, `updated_at`
- RLS: lectura pública; escritura solo admin
- GRANT SELECT a `anon` y `authenticated`; ALL a `service_role` y admin write vía policy

**Slots iniciales que se poblarán con las imágenes actuales**:
- `hero_banner_main` (1920×1080, JPG, <500KB)
- `category_proteinas` / `_creatina` / `_pre-entrenos` / `_vitaminas` / `_aminoacidos` (640×800, 3:4)
- `newsletter_bg` (1600×600)
- `about_hero` (1600×900)

**Nueva página admin: `/admin/site-images`**
- Grid con cada slot mostrando: preview, dimensiones recomendadas, peso máximo, formato sugerido
- Botón "Cambiar imagen" -> sube a bucket `site-images` (nuevo bucket público)
- Editar `alt_text`, `title`, `subtitle`, `link_url`
- Validación cliente: avisa si la imagen difiere mucho de la relación de aspecto recomendada
- Añadir link en `AdminLayout` sidebar

**Hook `useSiteImages(slot | slots[])`** que consulta la tabla y hace fallback a los assets actuales si no hay registro.

**Refactor de componentes** para consumir el hook:
- `src/components/home/Hero.tsx` -> lee `hero_banner_main`
- `src/components/home/Categories.tsx` -> mapea slots `category_*`, mantiene fallback a los assets locales
- `src/components/home/Newsletter.tsx` -> `newsletter_bg`
- `src/pages/About.tsx` -> `about_hero`

### 2. Filtros y tienda más completos

En `src/pages/Shop.tsx` y `src/components/shop/ShopFilters.tsx`:
- Filtro por **marca** (multi-select) leyendo `products.brand` distinct
- Filtro de **peso/tamaño** (`weight_size`)
- Ordenar por: relevancia, precio asc/desc, nombre, más nuevos, más vendidos
- Chips de filtros activos con opción de quitar individualmente
- Contador "N productos encontrados"
- Rango de precios dinámico (min/max reales del catálogo, no fijo 50000)
- Mantener query params en la URL para compartir/volver
- Skeleton de carga y estado vacío mejorado con CTA "Limpiar filtros"

### 3. Recomendación con IA

Revisar `supabase/functions/ai-recommendation/index.ts` y `src/components/product/AIRecommendation.tsx`:
- Confirmar modelo válido del catálogo (usar `google/gemini-2.5-flash` vía Lovable AI Gateway)
- Manejo de 429 y 402 con mensaje claro al usuario
- Validar input con zod, CORS correcto
- Cache de respuesta por producto en sessionStorage para no reconsumir créditos
- Loader y estados de error visibles en UI

### 4. Ajustes / panel admin

- Recorrer rutas de `AdminLayout` y verificar que cada página carga sin error
- Corregir permisos: cualquier tabla nueva tiene RLS + GRANT
- Página de **Ajustes de tienda** (`store_settings`): editar nombre, logo, email de contacto, teléfono, horario, monedas, impuesto por defecto
- Verificar que `AdminPaymentMethods` guarda y lista correctamente

### 5. Detalles técnicos

- Bucket `site-images` público (SELECT), INSERT/UPDATE/DELETE restringido a admin
- Sin emojis en UI
- Sin cambios en `whop_*` (dejar como legacy hasta limpieza posterior)
- Tipos TS actualizados vía regeneración automática de `types.ts`

### Archivos a crear/modificar

**Crear**:
- `supabase/migrations/<timestamp>_site_images.sql`
- `src/hooks/useSiteImages.ts`
- `src/pages/admin/AdminSiteImages.tsx`
- `src/components/admin/ImageSlotCard.tsx`

**Modificar**:
- `src/components/home/Hero.tsx`, `Categories.tsx`, `Newsletter.tsx`
- `src/pages/About.tsx`
- `src/pages/Shop.tsx`, `src/components/shop/ShopFilters.tsx`
- `src/components/product/AIRecommendation.tsx`
- `supabase/functions/ai-recommendation/index.ts`
- `src/components/layout/AdminLayout.tsx`
- `src/App.tsx` (nueva ruta admin)
