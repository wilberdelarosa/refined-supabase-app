-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories are public to view
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT USING (true);

-- Only admins/managers can manage categories
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing categories from products
INSERT INTO public.categories (name, slug, description) VALUES
('Proteínas', 'proteinas', 'Proteínas whey, isolate, caseína y más para construcción muscular'),
('Creatina', 'creatina', 'Creatina monohidratada y HCl para fuerza y potencia'),
('Pre-Entrenos', 'pre-entrenos', 'Suplementos pre-workout para energía y enfoque'),
('Vitaminas', 'vitaminas', 'Multivitamínicos, omega-3 y minerales esenciales'),
('Aminoácidos', 'aminoacidos', 'BCAAs, EAAs y glutamina para recuperación');

-- Add policies for products management
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);

-- Storage policies for products bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager')));

-- Create audit_logs table for tracking changes
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert audit logs (via security definer function)
CREATE OR REPLACE FUNCTION public.log_audit(
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;