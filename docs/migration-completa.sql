-- ============================================================
-- MIGRACIÓN COMPLETA - BARBARO NUTRITION
-- Generado: 2026-02-17
-- Incluye: Enums, Funciones, Tablas, RLS, Triggers, Storage
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'editor', 'support', 'customer');

-- ============================================================
-- 2. FUNCIONES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text, p_table_name text,
  p_record_id uuid DEFAULT NULL, p_old_data jsonb DEFAULT NULL, p_new_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Secuencia para facturas
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE next_num INTEGER; year_prefix TEXT;
BEGIN
  next_num := nextval('invoice_number_seq');
  year_prefix := to_char(now(), 'YYYY');
  RETURN 'INV-' || year_prefix || '-' || lpad(next_num::text, 6, '0');
END;
$$;

-- ============================================================
-- 3. TABLAS
-- ============================================================

-- ---------- profiles ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  address text,
  city text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- user_roles ----------
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ---------- products ----------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  featured boolean DEFAULT false,
  low_stock_threshold integer DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- product_images ----------
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- product_variants ----------
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric,
  stock integer DEFAULT 0,
  image_url text,
  attributes jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- product_nutrition ----------
CREATE TABLE public.product_nutrition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  serving_size text,
  servings_per_container integer,
  ingredients text,
  allergens text[],
  nutrition_facts jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- categories ----------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- cart_items ----------
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- saved_carts ----------
CREATE TABLE public.saved_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cart_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- wishlist ----------
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shopify_product_id text NOT NULL,
  product_handle text NOT NULL,
  product_title text NOT NULL,
  product_image_url text,
  product_price text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- discount_codes ----------
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  min_purchase_amount numeric DEFAULT 0,
  max_uses integer,
  uses_count integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- orders ----------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total numeric NOT NULL,
  subtotal numeric,
  status text NOT NULL DEFAULT 'pending',
  shipping_address text,
  discount_code_id uuid REFERENCES public.discount_codes(id),
  discount_amount numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- order_items ----------
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL
);

-- ---------- order_payments ----------
CREATE TABLE public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  amount numeric NOT NULL,
  reference_number text,
  proof_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- order_shipping ----------
CREATE TABLE public.order_shipping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier text,
  tracking_number text,
  shipping_cost numeric DEFAULT 0,
  estimated_delivery date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  voucher_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- order_status_history ----------
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  notes text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- discount_usages ----------
CREATE TABLE public.discount_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  discount_amount numeric NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- invoices ----------
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL DEFAULT now(),
  subtotal numeric NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 0.18,
  tax_amount numeric NOT NULL,
  total numeric NOT NULL,
  billing_name text,
  billing_address text,
  billing_rnc text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- invoice_lines ----------
CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL
);

-- ---------- payment_methods ----------
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'bank_transfer',
  bank_name text,
  account_type text,
  account_number text,
  account_holder text,
  rnc text,
  instructions text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- stock_locations ----------
CREATE TABLE public.stock_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- stock_movements ----------
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.stock_locations(id),
  movement_type text NOT NULL,
  quantity_change integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- store_settings ----------
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- audit_logs ----------
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- customer_notes ----------
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  note text NOT NULL,
  is_important boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- MÓDULO: CITAS / NUTRICIONISTAS
-- ============================================================

-- ---------- nutritionists ----------
CREATE TABLE public.nutritionists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  specialization text[] DEFAULT ARRAY['Nutrición deportiva'],
  bio text,
  price_per_session numeric NOT NULL DEFAULT 1500,
  consultation_duration integer NOT NULL DEFAULT 60,
  rating numeric DEFAULT 5.0,
  total_consultations integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK a profiles
ALTER TABLE public.nutritionists
  ADD CONSTRAINT nutritionists_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- ---------- appointment_slots ----------
CREATE TABLE public.appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- appointments ----------
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id),
  slot_id uuid REFERENCES public.appointment_slots(id),
  consultation_type text NOT NULL DEFAULT 'pre_purchase',
  status text NOT NULL DEFAULT 'pending',
  client_data jsonb DEFAULT '{}'::jsonb,
  total_price numeric NOT NULL DEFAULT 0,
  paid boolean DEFAULT false,
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- appointment_notes ----------
CREATE TABLE public.appointment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  recommendations jsonb DEFAULT '[]'::jsonb,
  is_private boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- appointment_reviews ----------
CREATE TABLE public.appointment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- quotes ----------
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id),
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  valid_until timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- dynamic_forms ----------
CREATE TABLE public.dynamic_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  form_type text NOT NULL DEFAULT 'pre_consultation',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  nutritionist_id uuid REFERENCES public.nutritionists(id),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. POLÍTICAS RLS
-- ============================================================

-- ---- profiles ----
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ---- user_roles ----
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---- products ----
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- product_images ----
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- product_variants ----
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- product_nutrition ----
CREATE POLICY "Anyone can view product nutrition" ON public.product_nutrition FOR SELECT USING (true);
CREATE POLICY "Admins can manage product nutrition" ON public.product_nutrition FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- categories ----
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- cart_items ----
CREATE POLICY "Users can view their cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove from cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- ---- saved_carts ----
CREATE POLICY "Users can view their own cart" ON public.saved_carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart" ON public.saved_carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.saved_carts FOR UPDATE USING (auth.uid() = user_id);

-- ---- wishlist ----
CREATE POLICY "Users can view their own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- ---- discount_codes ----
CREATE POLICY "Anyone can view active discount codes" ON public.discount_codes FOR SELECT USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins can manage discount codes" ON public.discount_codes FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- orders ----
CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- ---- order_items ----
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- ---- order_payments ----
CREATE POLICY "Users can view their order payments" ON public.order_payments FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_payments.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert payment proof" ON public.order_payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_payments.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order payments" ON public.order_payments FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- ---- order_shipping ----
CREATE POLICY "Users can view their order shipping" ON public.order_shipping FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_shipping.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order shipping" ON public.order_shipping FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- ---- order_status_history ----
CREATE POLICY "Users can view their order status history" ON public.order_status_history FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order status history" ON public.order_status_history FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- ---- discount_usages ----
CREATE POLICY "Users can view their own discount usages" ON public.discount_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all discount usages" ON public.discount_usages FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "System can insert discount usages" ON public.discount_usages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- invoices ----
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can create invoices" ON public.invoices FOR INSERT WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can update invoices" ON public.invoices FOR UPDATE USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- invoice_lines ----
CREATE POLICY "Users can view their invoice lines" ON public.invoice_lines FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_lines.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Admins can manage invoice lines" ON public.invoice_lines FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- payment_methods ----
CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- stock_locations ----
CREATE POLICY "Staff can view stock locations" ON public.stock_locations FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));
CREATE POLICY "Admins can manage stock locations" ON public.stock_locations FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- stock_movements ----
CREATE POLICY "Staff can view stock movements" ON public.stock_movements FOR SELECT USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));
CREATE POLICY "Admins can manage stock movements" ON public.stock_movements FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- store_settings ----
CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- audit_logs ----
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin(auth.uid()));

-- ---- customer_notes ----
CREATE POLICY "Admins can manage customer notes" ON public.customer_notes FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'support'));

-- ---- nutritionists ----
CREATE POLICY "Anyone can view active nutritionists" ON public.nutritionists FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage nutritionists" ON public.nutritionists FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- appointment_slots ----
CREATE POLICY "Anyone can view available slots" ON public.appointment_slots FOR SELECT USING (is_available = true);
CREATE POLICY "Admins can manage all slots" ON public.appointment_slots FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Nutritionists can manage their slots" ON public.appointment_slots FOR ALL USING (EXISTS (SELECT 1 FROM nutritionists WHERE nutritionists.id = appointment_slots.nutritionist_id AND nutritionists.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM nutritionists WHERE nutritionists.id = appointment_slots.nutritionist_id AND nutritionists.user_id = auth.uid()));

-- ---- appointments ----
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can create their own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Nutritionists can view their appointments" ON public.appointments FOR SELECT USING (EXISTS (SELECT 1 FROM nutritionists WHERE nutritionists.id = appointments.nutritionist_id AND nutritionists.user_id = auth.uid()));
CREATE POLICY "Nutritionists can update their appointments" ON public.appointments FOR UPDATE USING (EXISTS (SELECT 1 FROM nutritionists WHERE nutritionists.id = appointments.nutritionist_id AND nutritionists.user_id = auth.uid()));
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ---- appointment_notes ----
CREATE POLICY "Users can view their appointment notes" ON public.appointment_notes FOR SELECT USING (EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_notes.appointment_id AND appointments.client_id = auth.uid()) AND is_private = false);
CREATE POLICY "Nutritionists can manage notes for their appointments" ON public.appointment_notes FOR ALL USING (EXISTS (SELECT 1 FROM appointments a JOIN nutritionists n ON n.id = a.nutritionist_id WHERE a.id = appointment_notes.appointment_id AND n.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM appointments a JOIN nutritionists n ON n.id = a.nutritionist_id WHERE a.id = appointment_notes.appointment_id AND n.user_id = auth.uid()));
CREATE POLICY "Admins can manage all notes" ON public.appointment_notes FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---- appointment_reviews ----
CREATE POLICY "Anyone can view reviews" ON public.appointment_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their appointments" ON public.appointment_reviews FOR INSERT WITH CHECK (auth.uid() = client_id AND EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_reviews.appointment_id AND appointments.client_id = auth.uid() AND appointments.status = 'completed'));
CREATE POLICY "Admins can manage all reviews" ON public.appointment_reviews FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---- quotes ----
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Nutritionists can manage quotes" ON public.quotes FOR ALL USING (EXISTS (SELECT 1 FROM nutritionists WHERE nutritionists.id = quotes.nutritionist_id AND nutritionists.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM nutritionists WHERE nutritionists.id = quotes.nutritionist_id AND nutritionists.user_id = auth.uid()));
CREATE POLICY "Admins can manage all quotes" ON public.quotes FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---- dynamic_forms ----
CREATE POLICY "Anyone can view active forms" ON public.dynamic_forms FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage forms" ON public.dynamic_forms FOR ALL USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager')) WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'));

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_nutrition_updated_at BEFORE UPDATE ON public.product_nutrition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_carts_updated_at BEFORE UPDATE ON public.saved_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_payments_updated_at BEFORE UPDATE ON public.order_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_shipping_updated_at BEFORE UPDATE ON public.order_shipping FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_locations_updated_at BEFORE UPDATE ON public.stock_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON public.customer_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nutritionists_updated_at BEFORE UPDATE ON public.nutritionists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointment_notes_updated_at BEFORE UPDATE ON public.appointment_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dynamic_forms_updated_at BEFORE UPDATE ON public.dynamic_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('order-proofs', 'order-proofs', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('shipping-vouchers', 'shipping-vouchers', false) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read order-proofs" ON storage.objects FOR SELECT USING (bucket_id = 'order-proofs');
CREATE POLICY "Auth users upload to products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users upload order-proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'order-proofs' AND auth.role() = 'authenticated');

-- ============================================================
-- 8. EDGE FUNCTIONS CONFIG (supabase/config.toml)
-- ============================================================
-- [functions.send-order-email]
-- verify_jwt = false
--
-- [functions.ai-nutrition]
-- verify_jwt = false
--
-- [functions.ai-consultation-intake]
-- verify_jwt = false

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
