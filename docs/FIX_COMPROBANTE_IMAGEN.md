# Solución: Imagen de Comprobante No Se Ve

## Problema
La imagen del comprobante de transferencia no se muestra en OrderConfirmation.

## Posibles Causas

### 1. **Permisos de Supabase Storage**
El bucket `order-proofs` necesita ser público para que las imágenes se puedan ver.

**Solución:**
1. Ve a Supabase Dashboard → Storage → order-proofs
2. Click en "Policies"
3. Asegúrate que existe esta política:

```sql
-- Permitir lectura pública de comprobantes
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-proofs');
```

### 2. **Bucket No Existe**
Si el bucket no existe, créalo:

1. Ve a Storage en Supabase Dashboard
2. Click "New Bucket"
3. Nombre: `order-proofs`
4. Public: `Yes` ✅
5. Create

### 3. **URL Incorrecta**
Verifica que la URL del comprobante sea pública:
- Debe ser: `https://[project].supabase.co/storage/v1/object/public/order-proofs/[filename]`
- NO debe ser: `https://[project].supabase.co/storage/v1/object/sign/...`

## Verificación

### Desde código (temporal para debug):
```typescript
// En OrderConfirmation.tsx, después de línea 131
console.log('Proof URL:', data.order_payments[0]?.proof_url);
```

### Desde navegador:
1. Inspeccionar elemento en la imagen rota
2. Ver la URL en src
3. Abrir esa URL en nueva pestaña
4. Si da error 403 → problema de permisos
5. Si da error 404 → archivo no existe

## Solución Aplicada en el Código

Ya agregué:
- ✅ `onError` handler para mostrar mensaje amigable
- ✅ Link para abrir en nueva pestaña si falla
- ✅ `loading="lazy"` para mejor performance
- ✅ Background gris para ver el área de la imagen

## Próximos Pasos

1. **Crear el bucket** si no existe
2. **Configurar permisos públicos**
3. **Probar subida de nuevo comprobante**
