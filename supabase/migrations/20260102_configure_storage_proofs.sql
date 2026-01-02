-- ==============================================
-- CONFIGURACIÓN DE STORAGE PARA COMPROBANTES
-- ==============================================
-- Este script configura el bucket de Supabase Storage
-- para que las imágenes de comprobantes sean públicas

-- 1. Crear bucket si no existe (ejecutar desde Dashboard → Storage)
-- Nombre: order-proofs
-- Public: YES
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- 2. Política para lectura pública
CREATE POLICY IF NOT EXISTS "Public read access for order proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-proofs');

-- 3. Política para usuarios autenticados puedan subir
CREATE POLICY IF NOT EXISTS "Authenticated users can upload proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-proofs' 
  AND auth.role() = 'authenticated'
);

-- 4. Política para usuarios solo puedan actualizar sus propios archivos
CREATE POLICY IF NOT EXISTS "Users can update own proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'order-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'order-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política para usuarios solo puedan eliminar sus propios archivos
CREATE POLICY IF NOT EXISTS "Users can delete own proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- VERIFICACIÓN
-- Ejecuta esto para verificar las políticas:
SELECT * FROM storage.buckets WHERE name = 'order-proofs';
SELECT * FROM storage.policies WHERE bucket_id = 'order-proofs';
