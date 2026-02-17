
# Plan: Catalogo Completo de Productos Barbaro Nutrition

## Resumen

Este plan cubre: (1) corregir errores de build existentes, (2) borrar los productos actuales de la base de datos, (3) crear una edge function que use IA para buscar informacion precisa de cada producto del catalogo PDF y poblar la base de datos con ficha tecnica completa, (4) mejorar la pagina de detalle del producto con galeria de imagenes, tabla nutricional, recomendaciones IA, (5) agregar funcionalidad de exportar/importar productos en el admin, y (6) mejorar el control de stock.

---

## Productos del Catalogo (extraidos del PDF)

### Proteinas (21 productos)
ALLMAX ISOFLEX 5 LB, ANS PERFORMANCE N-WHEY 5 LB, BODY FORTRESS 100% PREMIUM PROTEIN 1.78LB, DYMATIZE ISO 100 HYDROLYZED 1.6 LB, DYMATIZE ISO 100 HYDROLYZED 6 LB, GOLIATH 100% WHEY PROTEIN 5 LB, ISOPURE INFUSIONS 14.1 OZ, ISOPURE ZERO CARB PROTEIN 3 LB, ISOPURE ZERO CARB PROTEIN 4.5 LB, MUSCLE TECH 100% GRASS WHEY PROTEIN 1.80 LB, MUSCLE TECH NITRO TECH 100% WHEY GOLD 2 LB, MUSCLE TECH NITRO TECH 100% WHEY GOLD 5 LB, MUSCLE TECH NITRO TECH CLASSIC WHEY PROTEIN 4 LB, MUSCLE TECH PLATINUM WHEY + MUSCLE BUILDER 1.80 LB, NUTREX 100% WHEY 5 LB, ON GOLD STANDARD 100% WHEY 1.47 LB, ON GOLD STANDARD 100% WHEY 5 LB, ON GOLD STANDARD 100% WHEY 5.47 LB, PATRIOT NUTRITION ISO WHEY 1.38 LB, PATRIOT NUTRITION SKIRLA WHEY CONCENTRATE 2 LB, RONNY COLEMAN KING MASS 3 LB

### Mass Gainers (13 productos)
ANS PERFORMANCE N-MASS 15 LB, ANS PERFORMANCE N-MASS 6 LB, DYMATIZE SUPER MASS GAINER 12 LB, DYMATIZE SUPER MASS GAINER 6 LB, GASPARI REAL MASS 12 LB, MUSCLE TECH MASS TECH EXTREME 2000 12 LB, MUSCLE TECH MASS TECH EXTREME 6 LB, MUSCLEMEDS CARNIVOR MASS 6 LB, MUTANT MASSS EXTREME 2500 12 LB, ON SERIOUS MASS 12 LB, ON SERIOUS MASS 6 LB, PATRIOT NUTRITION ATLAS GAINER 15 LB, SIMPLY MASS GAINER 13 LB

### Creatinas (9 productos)
Allmax creatina 80 servicios, BPI SPORT MICRONIZED CREATINA 120 servicios, CELL TECH CREATINA 6 LB, Muscle tech 100% creatina 80 servicios, NUTREX CREATINA MONOHIDRATADA 200 servicios, Nutrex creatina monohidratada 60 servicios, ON micronized creatina powder 120 servicios, PATRIOT CREATINE PUMP 3.4 LB, SIMPLY CREATINA 100% PURE MONOHYDRATE

### Pre-Entrenos (7 productos)
ALPHA SUPPS BETA-ALANINE 100 servicios, CELLUCOR C4 SPORTRIPPED 20 servicios, PATRIOT NUTRITION SUICIDE TEST PRE WORKOUT 50 servicios, ON GOLD STANDARD PRE-WORKOUT 30 servicios, PATRIOT NUTRITION MUSCLE PUMP 50 MG 120 capsulas, PATRIOT NUTRITION TESTO PUMP 90 capsulas, MHP ANADROX PUMP & BURN 112 capsulas

### Vitaminas y Minerales (24 productos)
Todos los listados en la pagina 3 del catalogo incluyendo productos Balkan Pharmaceuticals, Country Life, Earths Creation, Naturavit, NOW, Patriot, Swanson, y la linea Kids.

**Total: ~74 productos**

---

## Pasos de Implementacion

### Paso 1: Corregir errores de build
- **`src/lib/sentry.ts`**: Remover `new Sentry.Replay(...)` ya que no existe en la version instalada de `@sentry/react` v10. Usar solo `BrowserTracing`.
- **`vite.config.ts`**: Agregar `as const` al `registerType` para que TypeScript infiera el tipo literal correcto.

### Paso 2: Crear edge function `seed-catalog`
Una edge function que:
1. Borra todos los productos actuales (y sus registros relacionados en `product_nutrition`, `product_images`)
2. Inserta los ~74 productos del catalogo con datos basicos (nombre, categoria, precio DOP $0 placeholder, stock 0)
3. Para cada producto, llama a la IA (Lovable AI) para generar la ficha tecnica completa (informacion nutricional, ingredientes, alergenos, modo de uso)
4. Guarda la ficha tecnica en `product_nutrition`

### Paso 3: Mejorar la tabla `products` (migracion SQL)
Agregar columnas que faltan:
- `brand` (text) - marca del producto
- `weight_size` (text) - tamano/peso del producto (ej: "5 LB", "120 capsulas")
- `sku` (text) - codigo unico
- `usage_instructions` (text) - instrucciones de uso
- `benefits` (jsonb) - lista de beneficios

### Paso 4: Mejorar pagina de detalle del producto (`ProductDetail.tsx`)
- Galeria de imagenes con thumbnails (usando tabla `product_images`)
- Seccion de ficha tecnica/tabla nutricional con datos de `product_nutrition`
- Seccion de ingredientes y alergenos
- Modo de uso recomendado
- Recomendaciones con IA: un boton que genera sugerencias personalizadas (ej: "complementa con creatina si buscas fuerza")
- Productos relacionados de la misma categoria
- Mejor presentacion visual del stock disponible

### Paso 5: Exportar/Importar productos en Admin
En `AdminProducts.tsx`:
- **Boton "Exportar CSV/JSON"**: descarga todos los productos con su ficha tecnica
- **Boton "Importar"**: sube un archivo CSV/JSON para crear/actualizar productos en lote
- Formato incluye: nombre, descripcion, precio, stock, categoria, marca, tamano, informacion nutricional

### Paso 6: Mejor control de stock
- Indicador visual mejorado en la pagina de detalle (barra de progreso de stock)
- Alerta "ultimas unidades" cuando stock < low_stock_threshold
- Historial de movimientos de stock visible en admin (ya existe `stock_movements`)
- Impedir agregar al carrito mas del stock disponible (ya implementado)

---

## Detalles Tecnicos

### Edge Function `seed-catalog`
```text
POST /seed-catalog
Body: { action: "seed" | "clear" }

1. DELETE FROM product_nutrition
2. DELETE FROM product_images  
3. DELETE FROM cart_items (limpia carritos)
4. DELETE FROM products
5. INSERT productos del catalogo
6. Para cada producto -> llamar ai-nutrition para generar ficha tecnica
7. INSERT en product_nutrition
```

### Migracion SQL
```text
ALTER TABLE products ADD COLUMN brand text;
ALTER TABLE products ADD COLUMN weight_size text;
ALTER TABLE products ADD COLUMN sku text;
ALTER TABLE products ADD COLUMN usage_instructions text;
ALTER TABLE products ADD COLUMN benefits jsonb DEFAULT '[]'::jsonb;
```

### Pagina de Detalle Mejorada
```text
+------------------------------------------+
| <- Volver a la tienda                    |
+------------------------------------------+
| [Galeria Imagenes]  | Categoria          |
| [img1] [img2] [img3]| Nombre Producto    |
|                      | Marca - Tamano     |
|                      | Precio DOP         |
|                      | Stock: 44 unidades |
|                      | [Cantidad] [+][-]  |
|                      | [Agregar al Carrito]|
+------------------------------------------+
| Descripcion                              |
+------------------------------------------+
| TABLA NUTRICIONAL                        |
| Tamano porcion: 30g (1 scoop)            |
| Porciones: 73                            |
| Calorias: 120 | Proteina: 25g            |
| Carbohidratos: 2g | Grasa: 0.5g          |
| Aminoacidos: Leucina 5.5g, BCAA 11g      |
+------------------------------------------+
| Ingredientes                             |
| Alergenos: Lacteos, Soja                 |
+------------------------------------------+
| Modo de Uso                              |
+------------------------------------------+
| [Generar Recomendacion IA]               |
| "Este producto complementa bien con..."  |
+------------------------------------------+
| Productos Relacionados                   |
| [card] [card] [card] [card]              |
+------------------------------------------+
```

### Exportar/Importar
- Formato JSON con estructura: `{ products: [{ name, price, stock, category, brand, weight_size, nutrition: {...} }] }`
- CSV con columnas planas para compatibilidad con Excel
- Validacion al importar (campos requeridos, formato de precios)

---

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/lib/sentry.ts` | Fix build error (quitar Replay) |
| `vite.config.ts` | Fix build error (as const) |
| `supabase/functions/seed-catalog/index.ts` | Crear - poblar catalogo con IA |
| Migracion SQL | Agregar columnas brand, weight_size, sku, etc. |
| `src/pages/ProductDetail.tsx` | Reescribir con galeria, ficha tecnica, recomendaciones IA |
| `src/pages/admin/AdminProducts.tsx` | Agregar botones exportar/importar |
| `src/components/product/NutritionTable.tsx` | Crear - componente tabla nutricional |
| `src/components/product/ProductGallery.tsx` | Crear - galeria de imagenes |
| `src/components/product/AIRecommendation.tsx` | Crear - recomendaciones IA |
| `src/components/product/RelatedProducts.tsx` | Crear - productos relacionados |
| `src/hooks/useProductNutrition.ts` | Crear - hook para obtener datos nutricionales |
