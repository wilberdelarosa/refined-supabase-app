# Guía de Base de Datos Local - Supabase

## Configuración del Proyecto

**Project ID:** `xuhvlomytegdbifziilf`  
**Supabase URL:** `https://xuhvlomytegdbifziilf.supabase.co`  
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 1. Estructura de Archivos

```
supabase/
├── config.toml              # Configuración del proyecto
├── functions/               # Edge Functions
│   └── send-order-email/
└── migrations/              # Migraciones de base de datos
    ├── 20251230230821_*.sql
    ├── 20251230234014_*.sql
    ├── 20251230234827_*.sql
    ├── 20251231153916_*.sql
    ├── 20251231155612_*.sql
    ├── 20251231160515_*.sql
    ├── 20251231182426_*.sql
    ├── 20251231212941_*.sql
    └── 20260101_seed_assets_template.sql
```

---

## 2. Trabajar con Migraciones

### Crear Nueva Migración

```bash
# Generar nueva migración automáticamente
supabase migration new nombre_de_migracion

# Ejemplo
supabase migration new add_product_reviews
```

Esto crea un archivo en `supabase/migrations/` con timestamp.

### Estructura de Migración

```sql
-- Migración: 20260101_add_product_reviews.sql

-- Crear tabla
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Anyone can view reviews"
ON public.product_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);

-- Trigger para updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### Aplicar Migraciones

```bash
# Aplicar migraciones pendientes
supabase db push

# Ver estado de migraciones
supabase migration list

# Aplicar migraciones a DB remota
supabase db push --db-url "postgresql://..."
```

---

## 3. Iterar sobre la Base de Datos

### A. Desde Scripts Node.js

```javascript
// scripts/iterate-products.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseKey);

async function iterateProducts() {
  // Autenticar si es necesario
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password'
  });

  if (authError) throw authError;

  // Obtener todos los productos
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw error;

  // Iterar y procesar
  for (const product of products) {
    console.log(`Procesando: ${product.name}`);
    
    // Operaciones por producto
    await processProduct(product);
  }
}

async function processProduct(product) {
  // Ejemplo: Actualizar campo
  const { error } = await supabase
    .from('products')
    .update({ 
      slug: product.name.toLowerCase().replace(/\s+/g, '-') 
    })
    .eq('id', product.id);

  if (error) console.error('Error:', error);
}

iterateProducts();
```

### B. Paginación para Tablas Grandes

```javascript
async function iterateProductsPaginated() {
  const pageSize = 100;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    // Procesar batch
    for (const product of products) {
      await processProduct(product);
    }

    page++;
    console.log(`Procesada página ${page}`);
  }
}
```

### C. Bulk Update/Insert

```javascript
async function bulkUpdateProducts(updates) {
  // Batch de updates
  const { error } = await supabase
    .from('products')
    .upsert(updates, { onConflict: 'id' });

  if (error) throw error;
}

// Uso
await bulkUpdateProducts([
  { id: 'uuid-1', price: 50 },
  { id: 'uuid-2', price: 75 },
  // ...
]);
```

---

## 4. Crear Nuevas Tablas

### Template de Migración Completa

```sql
-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS public.nombre_tabla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Foreign keys
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT unique_nombre UNIQUE(nombre)
);

-- 2. Comentarios
COMMENT ON TABLE public.nombre_tabla IS 'Descripción de la tabla';
COMMENT ON COLUMN public.nombre_tabla.nombre IS 'Nombre descriptivo';

-- 3. Habilitar RLS
ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Public read access"
ON public.nombre_tabla FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert"
ON public.nombre_tabla FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own records"
ON public.nombre_tabla FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do everything"
ON public.nombre_tabla FOR ALL
USING (public.is_admin(auth.uid()));

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_nombre_tabla_user_id 
ON public.nombre_tabla(user_id);

CREATE INDEX IF NOT EXISTS idx_nombre_tabla_created_at 
ON public.nombre_tabla(created_at DESC);

-- 6. Triggers
CREATE TRIGGER update_nombre_tabla_updated_at
BEFORE UPDATE ON public.nombre_tabla
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Datos iniciales (opcional)
INSERT INTO public.nombre_tabla (nombre, descripcion) VALUES
('Item 1', 'Descripción 1'),
('Item 2', 'Descripción 2')
ON CONFLICT DO NOTHING;
```

---

## 5. Funciones Útiles

### Función Helper: update_updated_at

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Función Helper: is_admin

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Comandos Útiles

### Inspeccionar Base de Datos

```bash
# Ver esquema de una tabla
supabase db diff

# Exportar esquema actual
supabase db dump > backup.sql

# Ejecutar SQL directamente
supabase db execute --file migration.sql
```

### Trabajar con Storage

```javascript
// Listar archivos en bucket
const { data: files } = await supabase.storage
  .from('products')
  .list();

// Subir archivo
const { error } = await supabase.storage
  .from('products')
  .upload('filename.png', fileBuffer);

// Obtener URL pública
const { data } = supabase.storage
  .from('products')
  .getPublicUrl('filename.png');
```

---

## 7. Best Practices

### ✅ Hacer

- Usar migraciones para todos los cambios de esquema
- Siempre habilitar RLS en tablas públicas
- Crear índices en foreign keys
- Usar UUIDs como primary keys
- Incluir `created_at` y `updated_at` en todas las tablas
- Documentar con comentarios SQL

### ❌ Evitar

- Modificar migraciones ya aplicadas
- Hacer cambios directos en producción sin migración
- Olvidar políticas RLS (seguridad)
- Crear tablas sin índices apropiados
- Usar DELETE CASCADE sin pensar en implicaciones

---

## 8. Workflow Completo

```bash
# 1. Crear migración
supabase migration new add_feature

# 2. Editar archivo de migración
# (Agregar CREATE TABLE, políticas, etc.)

# 3. Probar localmente
supabase db reset  # Reinicia DB local
supabase db push   # Aplica migraciones

# 4. Verificar con script
node scripts/test-migration.mjs

# 5. Commit y push
git add supabase/migrations/
git commit -m "feat: add new feature migration"
git push

# 6. Aplicar en producción
supabase db push --db-url $DATABASE_URL
```

---

## Enlaces Útiles

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
