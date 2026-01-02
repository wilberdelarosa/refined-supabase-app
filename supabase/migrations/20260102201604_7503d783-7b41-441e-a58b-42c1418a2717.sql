-- Actualizar el bucket order-proofs para que sea público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'order-proofs';

-- Crear política de lectura pública para order-proofs
CREATE POLICY "Public read access for order proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-proofs');

-- Crear política de inserción para usuarios autenticados
CREATE POLICY "Authenticated users can upload order proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-proofs' AND auth.role() = 'authenticated');

-- Crear política de actualización para usuarios autenticados (sus propios archivos)
CREATE POLICY "Users can update their own order proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'order-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Crear política de eliminación para admins
CREATE POLICY "Admins can delete order proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-proofs' AND public.is_admin(auth.uid()));