-- =============================================
-- STORE SETTINGS - Configuración personalizable de la tienda
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

INSERT INTO public.stock_locations (name, is_default) VALUES ('Almacén Principal', true);

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
-- ORDER SHIPPING - Información de envío
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
-- PRODUCT IMAGES - Imágenes múltiples de productos
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
-- NUTRITIONAL INFO - Información nutricional
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