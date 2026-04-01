ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_checkout_id text;
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_currency text;
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_payload jsonb;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_metadata jsonb;

CREATE TABLE IF NOT EXISTS public.whop_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb,
  status text DEFAULT 'received',
  order_id text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.whop_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook events" ON public.whop_webhook_events
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));