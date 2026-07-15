
CREATE TABLE IF NOT EXISTS public.site_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL UNIQUE,
  image_url TEXT,
  alt_text TEXT,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  recommended_width INTEGER,
  recommended_height INTEGER,
  recommended_format TEXT,
  max_size_kb INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_images TO anon;
GRANT SELECT ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_images TO authenticated;

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active site images"
  ON public.site_images FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site images"
  ON public.site_images FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site images"
  ON public.site_images FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site images"
  ON public.site_images FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_images_set_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_images (slot, description, recommended_width, recommended_height, recommended_format, max_size_kb, sort_order, title) VALUES
  ('hero_banner_main', 'Banner principal en la portada (fondo del hero).', 1920, 1080, 'JPG/WebP', 500, 1, 'Hero principal'),
  ('category_proteinas', 'Tarjeta de categoría Proteínas en la portada.', 640, 800, 'JPG/WebP', 200, 10, 'Proteínas'),
  ('category_creatina', 'Tarjeta de categoría Creatina en la portada.', 640, 800, 'JPG/WebP', 200, 11, 'Creatina'),
  ('category_pre-entrenos', 'Tarjeta de categoría Pre-Entrenos en la portada.', 640, 800, 'JPG/WebP', 200, 12, 'Pre-Entrenos'),
  ('category_vitaminas', 'Tarjeta de categoría Vitaminas en la portada.', 640, 800, 'JPG/WebP', 200, 13, 'Vitaminas'),
  ('category_aminoacidos', 'Tarjeta de categoría Aminoácidos en la portada.', 640, 800, 'JPG/WebP', 200, 14, 'Aminoácidos'),
  ('newsletter_bg', 'Fondo de la sección Newsletter/CTA de la portada.', 1600, 600, 'JPG/WebP', 300, 20, 'Fondo newsletter'),
  ('about_hero', 'Imagen destacada de la página Sobre Nosotros.', 1600, 900, 'JPG/WebP', 400, 30, 'Hero Sobre Nosotros')
ON CONFLICT (slot) DO NOTHING;
