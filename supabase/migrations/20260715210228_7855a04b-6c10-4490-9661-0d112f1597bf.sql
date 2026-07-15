
-- Enable RLS on all sensitive tables that have policies defined but RLS off
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_sequences ENABLE ROW LEVEL SECURITY;

-- Locked-down policies for tables without any policies today
DO $$ BEGIN
  CREATE POLICY "Admins can read audit logs"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage fiscal sequences"
    ON public.fiscal_sequences FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Remove public read on order-proofs storage, keep authenticated owner/admin access
DROP POLICY IF EXISTS "Public read access for order proofs" ON storage.objects;

DO $$ BEGIN
  CREATE POLICY "Owners can read their order proofs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'order-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read all order proofs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'order-proofs' AND public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can upload order proofs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'order-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all order proofs"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'order-proofs' AND public.is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'order-proofs' AND public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
