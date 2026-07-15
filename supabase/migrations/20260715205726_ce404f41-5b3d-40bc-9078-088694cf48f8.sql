
DO $$ BEGIN
  CREATE POLICY "Admins can upload site images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'products' AND (storage.foldername(name))[1] = 'site' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update site images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'products' AND (storage.foldername(name))[1] = 'site' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete site images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'products' AND (storage.foldername(name))[1] = 'site' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
