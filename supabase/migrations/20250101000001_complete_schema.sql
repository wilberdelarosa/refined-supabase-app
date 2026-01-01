-- =============================================
-- COMPLETE DATABASE SCHEMA
-- =============================================

-- =============================================
-- ENUMS
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'editor', 'support', 'customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- SEQUENCES
-- =============================================
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

-- =============================================
-- TABLES
-- =============================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  country text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  original_price numeric,
  image_url text,
  category text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CART_ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SAVED_CARTS
CREATE TABLE IF NOT EXISTS public.saved_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  cart_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  shipping_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL
);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'issued',
  subtotal numeric NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 0.18,
  tax_amount numeric NOT NULL,
  total numeric NOT NULL,
  billing_name text,
  billing_address text,
  billing_rnc text,
  pdf_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- INVOICE_LINES
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL
);

-- WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  shopify_product_id text NOT NULL,
  product_handle text NOT NULL,
  product_title text NOT NULL,
  product_image_url text,
  product_price text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shopify_product_id)
);

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  next_num := nextval('public.invoice_number_seq');
  year_prefix := to_char(now(), 'YYYY');
  RETURN 'INV-' || year_prefix || '-' || lpad(next_num::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_carts_updated_at ON public.saved_carts;
CREATE TRIGGER update_saved_carts_updated_at
  BEFORE UPDATE ON public.saved_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own profile" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all roles" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage roles" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view categories" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage categories" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view products" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert products" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update products" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete products" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can add to cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can remove from cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own cart" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their orders" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can create orders" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all orders" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update orders" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their order items" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can create order items" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all order items" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own invoices" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all invoices" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can create invoices" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update invoices" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their invoice lines" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage invoice lines" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view audit logs" ON public.' || r.tablename;
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- CATEGORIES
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- PRODUCTS
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- CART_ITEMS
CREATE POLICY "Users can view their cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove from cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- SAVED_CARTS
CREATE POLICY "Users can view their own cart" ON public.saved_carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart" ON public.saved_carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.saved_carts FOR UPDATE USING (auth.uid() = user_id);

-- ORDERS
CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- ORDER_ITEMS
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- INVOICES
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can create invoices" ON public.invoices FOR INSERT WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can update invoices" ON public.invoices FOR UPDATE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- INVOICE_LINES
CREATE POLICY "Users can view their invoice lines" ON public.invoice_lines FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_lines.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Admins can manage invoice lines" ON public.invoice_lines FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- WISHLIST
CREATE POLICY "Users can view their own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- AUDIT_LOGS
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin(auth.uid()));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
