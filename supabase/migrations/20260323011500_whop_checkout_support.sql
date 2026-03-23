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
