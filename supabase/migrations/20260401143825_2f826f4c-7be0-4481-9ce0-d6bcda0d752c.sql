-- Add missing columns to orders for Whop traceability
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS provider_reference_id TEXT;

-- Add missing columns to order_payments for Whop traceability
ALTER TABLE public.order_payments
ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS provider_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS provider_tax NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;