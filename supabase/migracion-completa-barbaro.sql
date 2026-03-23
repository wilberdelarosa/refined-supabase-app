-- Archivo generado por Codex el 2026-03-22.
-- Incluye todas las migraciones SQL encontradas en supabase/migrations ordenadas por nombre.
-- Ejecutar en un proyecto Supabase nuevo o vacio usando SQL Editor.


-- >>> BEGIN 20240219_add_fiscal_columns.sql

-- Add fiscal columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rnc_cedula text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS ncf_type text DEFAULT '02'; -- '01' (Fiscal) or '02' (Consumidor Final)

-- Add comment
COMMENT ON COLUMN public.orders.rnc_cedula IS 'RNC or Cedula for fiscal invoicing';
COMMENT ON COLUMN public.orders.company_name IS 'Registered company name for fiscal invoicing';

-- <<< END 20240219_add_fiscal_columns.sql


-- >>> BEGIN 20251230230821_a132a020-8351-4e61-934e-a17cba775860.sql

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products are publicly viewable
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- <<< END 20251230230821_a132a020-8351-4e61-934e-a17cba775860.sql


-- >>> BEGIN 20251230234014_e96dca10-6b11-4924-b5b5-9605f6b5a66e.sql

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'editor', 'support', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert admin role for the specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('c429235e-bab4-42d3-95d3-0025d112dedb', 'admin');

-- <<< END 20251230234014_e96dca10-6b11-4924-b5b5-9605f6b5a66e.sql


-- >>> BEGIN 20251230234827_212c0048-d404-4af8-913f-e8f4458316ef.sql

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
('ProteÃ­nas', 'proteinas', 'ProteÃ­nas whey, isolate, caseÃ­na y mÃ¡s para construcciÃ³n muscular'),
('Creatina', 'creatina', 'Creatina monohidratada y HCl para fuerza y potencia'),
('Pre-Entrenos', 'pre-entrenos', 'Suplementos pre-workout para energÃ­a y enfoque'),
('Vitaminas', 'vitaminas', 'MultivitamÃ­nicos, omega-3 y minerales esenciales'),
('AminoÃ¡cidos', 'aminoacidos', 'BCAAs, EAAs y glutamina para recuperaciÃ³n');

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

-- <<< END 20251230234827_212c0048-d404-4af8-913f-e8f4458316ef.sql


-- >>> BEGIN 20251231153916_32cf5631-888f-4a7d-a3ca-e84c85a7699c.sql

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC NOT NULL DEFAULT 0.18,
    tax_amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued',
    pdf_url TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_rnc TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_lines table
CREATE TABLE public.invoice_lines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

-- Invoices policies - users can view their own invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
ON public.invoices
FOR SELECT
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Admins can create invoices
CREATE POLICY "Admins can create invoices"
ON public.invoices
FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Admins can update invoices
CREATE POLICY "Admins can update invoices"
ON public.invoices
FOR UPDATE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Invoice lines policies
CREATE POLICY "Users can view their invoice lines"
ON public.invoice_lines
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_lines.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Admins can manage invoice lines"
ON public.invoice_lines
FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    year_prefix TEXT;
BEGIN
    next_num := nextval('invoice_number_seq');
    year_prefix := to_char(now(), 'YYYY');
    RETURN 'INV-' || year_prefix || '-' || lpad(next_num::text, 6, '0');
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- <<< END 20251231153916_32cf5631-888f-4a7d-a3ca-e84c85a7699c.sql


-- >>> BEGIN 20251231155612_9bbcff76-a21b-4047-a36a-400173e923c5.sql

-- Create wishlist/favorites table for storing user favorites
CREATE TABLE public.wishlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    product_handle TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_image_url TEXT,
    product_price TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
ON public.wishlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlist
FOR DELETE
USING (auth.uid() = user_id);

-- Create saved_carts table for persisting carts per user
CREATE TABLE public.saved_carts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    cart_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

-- Users can view their own cart
CREATE POLICY "Users can view their own cart"
ON public.saved_carts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own cart
CREATE POLICY "Users can insert their own cart"
ON public.saved_carts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update their own cart"
ON public.saved_carts
FOR UPDATE
USING (auth.uid() = user_id);

-- Add avatar_url column if not exists (should exist but making sure)
-- Add indexes for better performance
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_saved_carts_user_id ON public.saved_carts(user_id);

-- Trigger to update updated_at on saved_carts
CREATE TRIGGER update_saved_carts_updated_at
BEFORE UPDATE ON public.saved_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- <<< END 20251231155612_9bbcff76-a21b-4047-a36a-400173e923c5.sql


-- >>> BEGIN 20251231160515_71a64c5b-2f4b-4300-bcb9-764171281cca.sql

-- Add admin policies to view and manage all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'support'::app_role));

CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'support'::app_role));

-- Add admin policies for order_items
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'support'::app_role));

-- Create indexes for faster order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- <<< END 20251231160515_71a64c5b-2f4b-4300-bcb9-764171281cca.sql


-- >>> BEGIN 20251231182426_51cadeb7-c43b-4a6e-9b6f-cd6f49d72c62.sql

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- <<< END 20251231182426_51cadeb7-c43b-4a6e-9b6f-cd6f49d72c62.sql


-- >>> BEGIN 20251231212941_233e9ec2-dcd3-4a30-ac80-53dcb32dbaae.sql

-- Create discount_codes table for native discounts
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discount_usages table to track who used what code
CREATE TABLE public.discount_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discount_code_id, user_id, order_id)
);

-- Add discount columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES public.discount_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC;

-- Update existing orders to set subtotal = total for backwards compatibility
UPDATE public.orders SET subtotal = total WHERE subtotal IS NULL;

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_codes
CREATE POLICY "Anyone can view active discount codes" 
ON public.discount_codes 
FOR SELECT 
USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes 
FOR ALL 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for discount_usages
CREATE POLICY "Users can view their own discount usages" 
ON public.discount_usages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert discount usages" 
ON public.discount_usages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all discount usages" 
ON public.discount_usages 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_active ON public.discount_codes(is_active, starts_at, ends_at);
CREATE INDEX idx_discount_usages_user ON public.discount_usages(user_id);
CREATE INDEX idx_discount_usages_code ON public.discount_usages(discount_code_id);

-- <<< END 20251231212941_233e9ec2-dcd3-4a30-ac80-53dcb32dbaae.sql


-- >>> BEGIN 20260101_seed_assets_template.sql

-- Seed template generated by scripts/upload-assets.mjs
-- Replace <PUBLIC_URL> with the actual URL produced in scripts/uploads.json

-- Example insert using a known product name
-- INSERT INTO public.products (name, description, price, category, stock, image_url)
-- VALUES ('Imported: hero-fitness', 'Imported asset hero-fitness.png', 0.0, 'Imported', 0, '<PUBLIC_URL>');

-- Example update for existing product by name
-- UPDATE public.products SET image_url = '<PUBLIC_URL>' WHERE name ILIKE '%hero-fitness%';

-- <<< END 20260101_seed_assets_template.sql


-- >>> BEGIN 20260102_add_product_write_policies.sql

-- Allow admin/manager to insert/update/delete products via RLS
DO $$
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Manage products write'
  ) THEN
    CREATE POLICY "Manage products write" ON public.products
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin','manager')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin','manager')
        )
      );
  END IF;
END$$;

-- <<< END 20260102_add_product_write_policies.sql


-- >>> BEGIN 20260102_configure_storage_proofs.sql

-- ==============================================
-- CONFIGURACIÃ“N DE STORAGE PARA COMPROBANTES
-- ==============================================
-- Este script configura el bucket de Supabase Storage
-- para que las imÃ¡genes de comprobantes sean pÃºblicas

-- 1. Crear bucket si no existe (ejecutar desde Dashboard â†’ Storage)
-- Nombre: order-proofs
-- Public: YES
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- 2. PolÃ­tica para lectura pÃºblica
CREATE POLICY IF NOT EXISTS "Public read access for order proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-proofs');

-- 3. PolÃ­tica para usuarios autenticados puedan subir
CREATE POLICY IF NOT EXISTS "Authenticated users can upload proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-proofs' 
  AND auth.role() = 'authenticated'
);

-- 4. PolÃ­tica para usuarios solo puedan actualizar sus propios archivos
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

-- 5. PolÃ­tica para usuarios solo puedan eliminar sus propios archivos
CREATE POLICY IF NOT EXISTS "Users can delete own proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- VERIFICACIÃ“N
-- Ejecuta esto para verificar las polÃ­ticas:
SELECT * FROM storage.buckets WHERE name = 'order-proofs';
SELECT * FROM storage.policies WHERE bucket_id = 'order-proofs';

-- <<< END 20260102_configure_storage_proofs.sql


-- >>> BEGIN 20260102_create_pruebadev.sql

-- Create simple test table with 3 columns
CREATE TABLE IF NOT EXISTS public.pruebadev (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    edad INTEGER NOT NULL
);

-- Add comment
COMMENT ON TABLE public.pruebadev IS 'Tabla de prueba simple con 3 columnas';

-- Enable RLS
ALTER TABLE public.pruebadev ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Anyone can view pruebadev"
ON public.pruebadev FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert pruebadev"
ON public.pruebadev FOR INSERT
WITH CHECK (true);

-- Insert 10 sample records
INSERT INTO public.pruebadev (nombre, edad) VALUES
('Juan PÃ©rez', 25),
('MarÃ­a GarcÃ­a', 30),
('Carlos LÃ³pez', 28),
('Ana MartÃ­nez', 22),
('Pedro RodrÃ­guez', 35),
('Laura SÃ¡nchez', 27),
('Miguel Torres', 31),
('Isabel RamÃ­rez', 24),
('Diego Flores', 29),
('Carmen GonzÃ¡lez', 26)
ON CONFLICT DO NOTHING;

-- <<< END 20260102_create_pruebadev.sql


-- >>> BEGIN 20260102_rename_wishlist_product_id.sql

-- Rename wishlist column to remove provider-specific naming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'wishlist' 
      AND column_name = 'shopify_product_id'
  ) THEN
    ALTER TABLE public.wishlist RENAME COLUMN shopify_product_id TO product_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'wishlist_user_id_shopify_product_id_key'
  ) THEN
    ALTER INDEX wishlist_user_id_shopify_product_id_key RENAME TO wishlist_user_id_product_id_key;
  END IF;
END$$;

-- <<< END 20260102_rename_wishlist_product_id.sql


-- >>> BEGIN 20260102152845_49f761b5-05f7-43f8-83f5-ac1cf58852ec.sql

-- =============================================
-- STORE SETTINGS - ConfiguraciÃ³n personalizable de la tienda
-- =============================================
CREATE TABLE public.store_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key text NOT NULL UNIQUE,
    setting_value jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insertar configuraciones iniciales
INSERT INTO public.store_settings (setting_key, setting_value) VALUES
    ('branding', '{"logo_url": null, "store_name": "Barbaro Nutrition", "slogan": "Suplementos deportivos premium"}'),
    ('invoicing', '{"itbis_enabled": true, "itbis_rate": 0.18, "rnc": "", "fiscal_name": "Barbaro Nutrition SRL", "fiscal_address": "", "allow_non_fiscal": true}'),
    ('notifications', '{"email_on_new_order": true, "email_on_payment": true}');

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage store settings"
ON public.store_settings FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Anyone can view store settings"
ON public.store_settings FOR SELECT
USING (true);

CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STOCK LOCATIONS - Ubicaciones de inventario
-- =============================================
CREATE TABLE public.stock_locations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    address text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO public.stock_locations (name, is_default) VALUES ('AlmacÃ©n Principal', true);

ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stock locations"
ON public.stock_locations FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can view stock locations"
ON public.stock_locations FOR SELECT
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- =============================================
-- STOCK MOVEMENTS - Movimientos de inventario
-- =============================================
CREATE TABLE public.stock_movements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    location_id uuid REFERENCES public.stock_locations(id) ON DELETE SET NULL,
    quantity_change integer NOT NULL,
    previous_stock integer NOT NULL,
    new_stock integer NOT NULL,
    movement_type text NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return', 'transfer')),
    reference_id uuid,
    reference_type text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stock movements"
ON public.stock_movements FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can view stock movements"
ON public.stock_movements FOR SELECT
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON public.stock_movements(created_at DESC);

-- =============================================
-- ORDER SHIPPING - InformaciÃ³n de envÃ­o
-- =============================================
CREATE TABLE public.order_shipping (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    carrier text,
    tracking_number text,
    shipping_cost numeric(10,2) DEFAULT 0,
    estimated_delivery date,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    voucher_url text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_shipping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order shipping"
ON public.order_shipping FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

CREATE POLICY "Users can view their order shipping"
ON public.order_shipping FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_shipping.order_id
    AND orders.user_id = auth.uid()
));

CREATE TRIGGER update_order_shipping_updated_at
    BEFORE UPDATE ON public.order_shipping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ORDER PAYMENTS - Pagos y comprobantes
-- =============================================
CREATE TABLE public.order_payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method text NOT NULL CHECK (payment_method IN ('transfer', 'cash', 'card', 'other')),
    amount numeric(10,2) NOT NULL,
    reference_number text,
    proof_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by uuid,
    verified_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order payments"
ON public.order_payments FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

CREATE POLICY "Users can view their order payments"
ON public.order_payments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_payments.order_id
    AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can insert payment proof"
ON public.order_payments FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_payments.order_id
    AND orders.user_id = auth.uid()
));

CREATE TRIGGER update_order_payments_updated_at
    BEFORE UPDATE ON public.order_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_order_payments_order ON public.order_payments(order_id);

-- =============================================
-- CUSTOMER NOTES - Notas internas de clientes
-- =============================================
CREATE TABLE public.customer_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL,
    note text NOT NULL,
    is_important boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer notes"
ON public.customer_notes FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

CREATE INDEX idx_customer_notes_customer ON public.customer_notes(customer_id);

CREATE TRIGGER update_customer_notes_updated_at
    BEFORE UPDATE ON public.customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PRODUCT VARIANTS - Variantes de productos
-- =============================================
CREATE TABLE public.product_variants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name text NOT NULL,
    sku text,
    price numeric(10,2),
    stock integer DEFAULT 0,
    attributes jsonb DEFAULT '{}',
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product variants"
ON public.product_variants FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Anyone can view product variants"
ON public.product_variants FOR SELECT
USING (true);

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PRODUCT IMAGES - ImÃ¡genes mÃºltiples de productos
-- =============================================
CREATE TABLE public.product_images (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt_text text,
    display_order integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product images"
ON public.product_images FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Anyone can view product images"
ON public.product_images FOR SELECT
USING (true);

CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- =============================================
-- NUTRITIONAL INFO - InformaciÃ³n nutricional
-- =============================================
CREATE TABLE public.product_nutrition (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    serving_size text,
    servings_per_container integer,
    nutrition_facts jsonb DEFAULT '{}',
    ingredients text,
    allergens text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_nutrition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product nutrition"
ON public.product_nutrition FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Anyone can view product nutrition"
ON public.product_nutrition FOR SELECT
USING (true);

CREATE TRIGGER update_product_nutrition_updated_at
    BEFORE UPDATE ON public.product_nutrition
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- LOW STOCK ALERTS CONFIG
-- =============================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;

-- =============================================
-- ORDER STATUS HISTORY
-- =============================================
CREATE TABLE public.order_status_history (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_by uuid,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order status history"
ON public.order_status_history FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

CREATE POLICY "Users can view their order status history"
ON public.order_status_history FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status_history.order_id
    AND orders.user_id = auth.uid()
));

CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);

-- =============================================
-- STORAGE BUCKET FOR ORDER PROOFS
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-proofs', 'order-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order proofs
CREATE POLICY "Users can upload their order proofs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'order-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their order proofs"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'order-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all order proofs"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'order-proofs' AND
    (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
);

-- =============================================
-- STORAGE BUCKET FOR SHIPPING VOUCHERS
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shipping-vouchers', 'shipping-vouchers', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload shipping vouchers"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'shipping-vouchers' AND
    (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
);

CREATE POLICY "Admins can view shipping vouchers"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'shipping-vouchers' AND
    (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
);

CREATE POLICY "Users can view their shipping vouchers"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'shipping-vouchers' AND
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.order_shipping os ON os.order_id = o.id
        WHERE o.user_id = auth.uid()
        AND os.voucher_url LIKE '%' || name || '%'
    )
);

-- <<< END 20260102152845_49f761b5-05f7-43f8-83f5-ac1cf58852ec.sql


-- >>> BEGIN 20260102155618_56df81e9-a879-4194-bf6b-84517fe745ff.sql

-- Create avatars bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- <<< END 20260102155618_56df81e9-a879-4194-bf6b-84517fe745ff.sql


-- >>> BEGIN 20260102160005_77f43077-36f9-4b92-8414-69b15098e74b.sql

-- Create payment_methods table for bank accounts that admin can manage
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  rnc TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment methods (for checkout)
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, bank_name, account_type, account_number, account_holder, rnc, display_order)
VALUES 
  ('Banco Popular Dominicano', 'bank_transfer', 'Banco Popular Dominicano', 'Cuenta Corriente', '123-456789-0', 'Barbaro Nutrition SRL', '1-31-12345-6', 1),
  ('Banreservas', 'bank_transfer', 'Banreservas', 'Cuenta de Ahorros', '987-654321-0', 'Barbaro Nutrition SRL', '1-31-12345-6', 2);

-- Update trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix order-proofs bucket: allow authenticated users to upload
CREATE POLICY "Users can upload order proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-proofs');

-- Admins can view all order proofs
CREATE POLICY "Admins can view order proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-proofs');

-- <<< END 20260102160005_77f43077-36f9-4b92-8414-69b15098e74b.sql


-- >>> BEGIN 20260102201604_7503d783-7b41-441e-a58b-42c1418a2717.sql

-- Actualizar el bucket order-proofs para que sea pÃºblico
UPDATE storage.buckets 
SET public = true 
WHERE id = 'order-proofs';

-- Crear polÃ­tica de lectura pÃºblica para order-proofs
CREATE POLICY "Public read access for order proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-proofs');

-- Crear polÃ­tica de inserciÃ³n para usuarios autenticados
CREATE POLICY "Authenticated users can upload order proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-proofs' AND auth.role() = 'authenticated');

-- Crear polÃ­tica de actualizaciÃ³n para usuarios autenticados (sus propios archivos)
CREATE POLICY "Users can update their own order proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'order-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Crear polÃ­tica de eliminaciÃ³n para admins
CREATE POLICY "Admins can delete order proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-proofs' AND public.is_admin(auth.uid()));

-- <<< END 20260102201604_7503d783-7b41-441e-a58b-42c1418a2717.sql


-- >>> BEGIN 20260103_appointments_schema.sql

-- Appointments microservice schema
-- Run in Supabase to enable nutritionist bookings

-- Extensions (idempotent)
create extension if not exists "uuid-ossp";

-- TABLE: nutritionists
create table if not exists public.nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade,
  specialization text[] default '{}'::text[],
  bio text,
  certifications jsonb,
  availability jsonb,
  price_per_session numeric(10,2) not null default 0,
  consultation_duration int not null default 60,
  is_active boolean not null default true,
  rating numeric(3,2) not null default 0,
  total_consultations int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointment_slots
create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references public.nutritionists(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_slots_nutritionist_date on public.appointment_slots(nutritionist_id, date);

-- TABLE: quotes
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(user_id) on delete set null,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  services jsonb,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'draft',
  valid_until date,
  client_notes text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(user_id) on delete cascade,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  slot_id uuid references public.appointment_slots(id) on delete set null,
  status text not null default 'pending',
  consultation_type text,
  client_data jsonb,
  notes text,
  attachments text[],
  quote_id uuid references public.quotes(id) on delete set null,
  total_price numeric(10,2),
  paid boolean not null default false,
  payment_id uuid,
  reminder_sent boolean not null default false,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appointments_client on public.appointments(client_id);
create index if not exists idx_appointments_nutritionist on public.appointments(nutritionist_id);
create index if not exists idx_appointments_status on public.appointments(status);

-- TABLE: dynamic_forms
create table if not exists public.dynamic_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  fields jsonb not null,
  form_type text not null,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointment_notes
create table if not exists public.appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  author_id uuid references public.profiles(user_id) on delete set null,
  content text not null,
  recommendations jsonb,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABLE: appointment_reviews
create table if not exists public.appointment_reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  client_id uuid references public.profiles(user_id) on delete cascade,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(appointment_id)
);

-- RLS
alter table public.nutritionists enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.quotes enable row level security;
alter table public.dynamic_forms enable row level security;
alter table public.appointment_notes enable row level security;
alter table public.appointment_reviews enable row level security;

-- POLICIES: nutritionists
create policy if not exists "Nutritionists are public" on public.nutritionists for select using (true);
create policy if not exists "Admins manage nutritionists" on public.nutritionists for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointment_slots
create policy if not exists "Slots are public" on public.appointment_slots for select using (true);
create policy if not exists "Admins manage slots" on public.appointment_slots for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointments
create policy if not exists "Users view own appointments" on public.appointments for select
  using (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));
create policy if not exists "Users create own appointments" on public.appointments for insert
  with check (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));
create policy if not exists "Users update own appointments" on public.appointments for update
  using (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: quotes
create policy if not exists "View related quotes" on public.quotes for select
  using (auth.uid() = client_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));
create policy if not exists "Admins manage quotes" on public.quotes for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: dynamic_forms
create policy if not exists "Forms are public" on public.dynamic_forms for select using (is_active);
create policy if not exists "Admins manage forms" on public.dynamic_forms for all
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointment_notes
create policy if not exists "View related notes" on public.appointment_notes for select
  using (
    exists(select 1 from public.appointments a where a.id = appointment_id and (a.client_id = auth.uid() or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role)))
  );
create policy if not exists "Manage own notes" on public.appointment_notes for all
  using (auth.uid() = author_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role))
  with check (auth.uid() = author_id or is_admin(auth.uid()) or has_role(auth.uid(), 'manager'::app_role));

-- POLICIES: appointment_reviews
create policy if not exists "View appointment reviews" on public.appointment_reviews for select using (true);
create policy if not exists "Clients add review" on public.appointment_reviews for insert
  with check (auth.uid() = client_id);

-- Triggers for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'update_nutritionists_updated_at') then
    create trigger update_nutritionists_updated_at before update on public.nutritionists
    for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_appointments_updated_at') then
    create trigger update_appointments_updated_at before update on public.appointments
    for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_quotes_updated_at') then
    create trigger update_quotes_updated_at before update on public.quotes
    for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_dynamic_forms_updated_at') then
    create trigger update_dynamic_forms_updated_at before update on public.dynamic_forms
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- Seed base data (safe, idempotent)
insert into public.dynamic_forms (id, name, description, fields, form_type, is_active)
values (
  '11111111-1111-1111-1111-111111111111',
  'Pre-consulta bÃ¡sica',
  'Formulario inicial para conocer al cliente',
  '[{"id":"age","type":"number","label":"Edad","required":true},{"id":"goal","type":"select","label":"Objetivo","required":true,"options":["PÃ©rdida de peso","Ganancia muscular","Rendimiento deportivo"]},{"id":"allergies","type":"textarea","label":"Alergias/Intolerancias","required":false}]'::jsonb,
  'pre_consultation',
  true
) on conflict (id) do nothing;

-- <<< END 20260103_appointments_schema.sql


-- >>> BEGIN 20260103005244_19b55294-982c-482c-97e9-ad628397600d.sql

-- =====================================================
-- MICROSERVICIO DE CITAS CON NUTRICIONISTAS
-- =====================================================

-- Tabla de nutricionistas (referencia profiles existentes)
CREATE TABLE IF NOT EXISTS public.nutritionists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    specialization TEXT[] DEFAULT ARRAY['NutriciÃ³n deportiva'],
    bio TEXT,
    price_per_session NUMERIC NOT NULL DEFAULT 1500,
    consultation_duration INTEGER NOT NULL DEFAULT 60,
    rating NUMERIC DEFAULT 5.0,
    total_consultations INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Tabla de horarios disponibles
CREATE TABLE IF NOT EXISTS public.appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id),
    slot_id UUID REFERENCES public.appointment_slots(id),
    consultation_type TEXT NOT NULL DEFAULT 'pre_purchase',
    status TEXT NOT NULL DEFAULT 'pending',
    client_data JSONB DEFAULT '{}',
    total_price NUMERIC NOT NULL DEFAULT 0,
    paid BOOLEAN DEFAULT false,
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de cotizaciones (opcional)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id),
    services JSONB NOT NULL DEFAULT '[]',
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    valid_until TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ãndices para bÃºsquedas rÃ¡pidas
CREATE INDEX IF NOT EXISTS idx_appointment_slots_nutritionist_date ON public.appointment_slots(nutritionist_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON public.appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Enable RLS
ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para nutritionists
CREATE POLICY "Anyone can view active nutritionists"
ON public.nutritionists FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage nutritionists"
ON public.nutritionists FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies para appointment_slots
CREATE POLICY "Anyone can view available slots"
ON public.appointment_slots FOR SELECT
USING (is_available = true);

CREATE POLICY "Nutritionists can manage their slots"
ON public.appointment_slots FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointment_slots.nutritionist_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointment_slots.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all slots"
ON public.appointment_slots FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies para appointments
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Nutritionists can view their appointments"
ON public.appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointments.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Nutritionists can update their appointments"
ON public.appointments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointments.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies para quotes
CREATE POLICY "Users can view their own quotes"
ON public.quotes FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Users can update their own quotes"
ON public.quotes FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Nutritionists can manage quotes"
ON public.quotes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = quotes.nutritionist_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = quotes.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all quotes"
ON public.quotes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_nutritionists_updated_at
    BEFORE UPDATE ON public.nutritionists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- <<< END 20260103005244_19b55294-982c-482c-97e9-ad628397600d.sql


-- >>> BEGIN 20260103005912_5428eecb-1868-483d-9194-f5241c648429.sql

-- =====================================================
-- TABLAS ADICIONALES PARA MICROSERVICIO DE CITAS
-- =====================================================

-- Tabla de formularios dinÃ¡micos
CREATE TABLE IF NOT EXISTS public.dynamic_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    form_type TEXT NOT NULL DEFAULT 'pre_consultation',
    nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de notas de consulta
CREATE TABLE IF NOT EXISTS public.appointment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]',
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de reseÃ±as
CREATE TABLE IF NOT EXISTS public.appointment_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ãndices
CREATE INDEX IF NOT EXISTS idx_appointment_notes_appointment ON public.appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reviews_nutritionist ON public.appointment_reviews(nutritionist_id);

-- Enable RLS
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reviews ENABLE ROW LEVEL SECURITY;

-- RLS para dynamic_forms
CREATE POLICY "Anyone can view active forms"
ON public.dynamic_forms FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage forms"
ON public.dynamic_forms FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- RLS para appointment_notes
CREATE POLICY "Users can view their appointment notes"
ON public.appointment_notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_notes.appointment_id 
        AND client_id = auth.uid()
    )
    AND is_private = false
);

CREATE POLICY "Nutritionists can manage notes for their appointments"
ON public.appointment_notes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.nutritionists n ON n.id = a.nutritionist_id
        WHERE a.id = appointment_notes.appointment_id 
        AND n.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.nutritionists n ON n.id = a.nutritionist_id
        WHERE a.id = appointment_notes.appointment_id 
        AND n.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all notes"
ON public.appointment_notes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- RLS para appointment_reviews
CREATE POLICY "Anyone can view reviews"
ON public.appointment_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their appointments"
ON public.appointment_reviews FOR INSERT
WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_reviews.appointment_id 
        AND client_id = auth.uid()
        AND status = 'completed'
    )
);

CREATE POLICY "Admins can manage all reviews"
ON public.appointment_reviews FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_dynamic_forms_updated_at
    BEFORE UPDATE ON public.dynamic_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_notes_updated_at
    BEFORE UPDATE ON public.appointment_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- <<< END 20260103005912_5428eecb-1868-483d-9194-f5241c648429.sql


-- >>> BEGIN 20260217141314_9e9998c8-bea0-4712-bd10-a65042ece6f4.sql


ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_size text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS usage_instructions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS benefits jsonb DEFAULT '[]'::jsonb;

-- <<< END 20260217141314_9e9998c8-bea0-4712-bd10-a65042ece6f4.sql


-- >>> BEGIN 20260220_fiscal_invoicing.sql


-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. Add Fiscal Columns to Orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS rnc_cedula text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS ncf_type text, -- '01' (Credito Fiscal), '02' (Consumidor Final), etc.
ADD COLUMN IF NOT EXISTS ncf_generated text;

-- 2. Add NCF and e-CF columns to Invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS ncf text,
ADD COLUMN IF NOT EXISTS ncf_expiration_date date,
ADD COLUMN IF NOT EXISTS security_code text, -- For e-CF
ADD COLUMN IF NOT EXISTS electronic_sign text, -- For e-CF
ADD COLUMN IF NOT EXISTS track_id text, -- For e-CF provider tracking
ADD COLUMN IF NOT EXISTS messaje_date timestamp with time zone;

-- 3. Create Fiscal Sequences Table (Local Management)
CREATE TABLE IF NOT EXISTS fiscal_sequences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  series text NOT NULL, -- e.g., 'B' or 'E'
  type_code text NOT NULL, -- e.g., '01', '02', '31' (E-CF)
  current_sequence bigint DEFAULT 1,
  end_sequence bigint NOT NULL,
  expiration_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Initial Seed for Standard NCFs (Example)
INSERT INTO fiscal_sequences (series, type_code, current_sequence, end_sequence, expiration_date)
VALUES 
('B', '01', 1, 100, '2026-12-31'), -- Factura de CrÃ©dito Fiscal
('B', '02', 1, 100, '2026-12-31'), -- Factura de Consumidor Final
('E', '31', 1, 1000, '2027-12-31') -- e-CF Factura de CrÃ©dito Fiscal ElectrÃ³nica
ON CONFLICT DO NOTHING;

-- 5. Function to Increment and Get Next NCF
CREATE OR REPLACE FUNCTION get_next_ncf(seq_series text, seq_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_record record;
  next_val bigint;
  formatted_ncf text;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO seq_record
  FROM fiscal_sequences
  WHERE series = seq_series AND type_code = seq_type AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  IF seq_record.expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Sequence expired';
  END IF;
  
  IF seq_record.current_sequence > seq_record.end_sequence THEN
    RAISE EXCEPTION 'Sequence exhausted';
  END IF;
  
  next_val := seq_record.current_sequence;
  
  -- Update the sequence
  UPDATE fiscal_sequences
  SET current_sequence = current_sequence + 1,
      updated_at = now()
  WHERE id = seq_record.id;
  
  -- Format NCF (11 chars for Standard, 13 for e-CF sometimes varies but standard B0100000001)
  -- Standard B + 01 + 8 digits = 11 chars
  -- E-CF E + 31 + 10 digits approx
  
  IF seq_series = 'E' THEN
     -- Format for e-CF: E310000000001 (Example)
     formatted_ncf := seq_series || seq_type || LPAD(next_val::text, 10, '0');
  ELSE
     -- Format for Standard: B0100000001
     formatted_ncf := seq_series || seq_type || LPAD(next_val::text, 8, '0');
  END IF;
  
  RETURN formatted_ncf;
END;
$$;

-- <<< END 20260220_fiscal_invoicing.sql


-- >>> BEGIN 20260301095800_create_notifications_tables.sql

-- Migration to create the notifications table and related policies

CREATE TYPE notification_type AS ENUM ('ORDER_UPDATE', 'PROMO', 'SYSTEM_ALERT', 'NEW_ORDER', 'NEW_USER');

CREATE TYPE notification_priority AS ENUM ('LOW', 'NORMAL', 'HIGH');

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE, -- If null, it's a global notification (e.g., for all admins)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'SYSTEM_ALERT',
    priority notification_priority NOT NULL DEFAULT 'NORMAL',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can read their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (auth.uid () = user_id);

-- System can read notifications without user_id (global/admin notifications) for admins
CREATE POLICY "Admins can view global notifications" ON public.notifications FOR
SELECT USING (
        user_id IS NULL
        AND EXISTS (
            SELECT 1
            FROM user_roles
            WHERE
                user_id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR
UPDATE USING (auth.uid () = user_id);

-- Admins can create notifications
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM user_roles
            WHERE
                user_id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Trigger to notify on insert via realtime if needed (Supabase realtime handles this automatically if publication is enabled)
-- Ensure the table is added to the realtime publication
BEGIN;

DROP PUBLICATION IF EXISTS supabase_realtime;

CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

COMMIT;
-- Note: Often in Supabase, you want to selectively add tables. If supabase_realtime already exists, we alter it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- We'll assume the user has a way to manage publications via dashboard or we just add it to the logical replication.

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE
        pubname = 'supabase_realtime'
        AND tablename = 'notifications'
) THEN
EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';

EXCEPTION WHEN OTHERS THEN
-- Ignore if publication doesn't exist or table already added
END;

END $$;

-- <<< END 20260301095800_create_notifications_tables.sql


-- >>> BEGIN 20260323011500_whop_checkout_support.sql

-- Whop checkout support
-- This migration is additive and keeps the manual transfer flow intact.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_provider text,
ADD COLUMN IF NOT EXISTS provider_checkout_id text,
ADD COLUMN IF NOT EXISTS provider_reference_id text,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.order_payments
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS provider_payment_id text,
ADD COLUMN IF NOT EXISTS provider_invoice_id text,
ADD COLUMN IF NOT EXISTS provider_receipt_id text,
ADD COLUMN IF NOT EXISTS provider_checkout_id text,
ADD COLUMN IF NOT EXISTS provider_currency text,
ADD COLUMN IF NOT EXISTS provider_fee numeric(10,2),
ADD COLUMN IF NOT EXISTS provider_tax numeric(10,2),
ADD COLUMN IF NOT EXISTS provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS refunded_amount numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE public.fiscal_sequences
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.order_payments
    DROP CONSTRAINT IF EXISTS order_payments_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.order_payments
ADD CONSTRAINT order_payments_status_check
CHECK (status IN ('pending', 'verified', 'rejected', 'refunded'));

CREATE TABLE IF NOT EXISTS public.whop_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'received',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

ALTER TABLE public.whop_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Admins can manage Whop webhook events"
  ON public.whop_webhook_events
  FOR ALL
  USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'))
  WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_payments_provider_payment_id
  ON public.order_payments(provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_provider_checkout_id
  ON public.orders(provider_checkout_id)
  WHERE provider_checkout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whop_webhook_events_order
  ON public.whop_webhook_events(order_id)
  WHERE order_id IS NOT NULL;

-- <<< END 20260323011500_whop_checkout_support.sql


-- >>> BEGIN verify_invoices.sql

-- Script para verificar y arreglar problemas de facturas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si existe la funciÃ³n generate_invoice_number
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_invoice_number';

-- 2. Verificar si existe la secuencia
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
AND sequence_name = 'invoice_number_seq';

-- 3. Contar facturas existentes
SELECT COUNT(*) as total_invoices FROM public.invoices;

-- 4. Ver facturas recientes
SELECT 
    i.id,
    i.invoice_number,
    i.order_id,
    i.total,
    i.status,
    i.created_at,
    o.status as order_status
FROM public.invoices i
LEFT JOIN public.orders o ON o.id = i.order_id
ORDER BY i.created_at DESC
LIMIT 10;

-- 5. Ver pedidos sin factura
SELECT 
    o.id,
    o.status,
    o.total,
    o.created_at,
    COUNT(i.id) as invoice_count
FROM public.orders o
LEFT JOIN public.invoices i ON i.order_id = o.id
WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
GROUP BY o.id, o.status, o.total, o.created_at
HAVING COUNT(i.id) = 0
ORDER BY o.created_at DESC;

-- 6. Verificar permisos RLS en invoices
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('invoices', 'invoice_lines')
ORDER BY tablename, policyname;

-- 7. Si necesitas recrear la secuencia (OPCIONAL - solo si no existe)
-- DROP SEQUENCE IF EXISTS invoice_number_seq CASCADE;
-- CREATE SEQUENCE invoice_number_seq START 1001;

-- 8. Si necesitas recrear la funciÃ³n (OPCIONAL - solo si no existe)
/*
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    year_prefix TEXT;
BEGIN
    next_num := nextval('invoice_number_seq');
    year_prefix := to_char(now(), 'YYYY');
    RETURN 'INV-' || year_prefix || '-' || lpad(next_num::text, 6, '0');
END;
$$;
*/

-- 9. Probar la generaciÃ³n de nÃºmero de factura
SELECT public.generate_invoice_number() as test_invoice_number;

-- <<< END verify_invoices.sql

