-- ============================================================================
-- Migration: Credit Notes, Payment Gateway & Invoice Improvements
-- Date: 2026-03-10
-- Description: Adds credit notes (notas de crédito), AZUL/gateway payment support,
--              invoice status state machine, and payment analytics views
-- ============================================================================

-- ============================================================================
-- 1. CREDIT NOTES TABLE (Notas de Crédito - Requerido por DGII RD)
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 5),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.18,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'applied', 'cancelled')),
  refund_method TEXT CHECK (refund_method IN ('original_payment', 'store_credit', 'bank_transfer', 'cash')),
  refund_reference TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit note line items
CREATE TABLE IF NOT EXISTS credit_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  invoice_line_id UUID REFERENCES invoice_lines(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequence for credit note numbers
CREATE SEQUENCE IF NOT EXISTS credit_note_number_seq START WITH 1001;

-- Function to generate credit note numbers
CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  SELECT nextval('credit_note_number_seq') INTO seq_val;
  RETURN 'NC-' || to_char(now(), 'YYYY') || '-' || lpad(seq_val::text, 6, '0');
END;
$$;

-- RLS for credit_notes
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit notes"
  ON credit_notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all credit notes"
  ON credit_notes FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can view own credit note lines"
  ON credit_note_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credit_notes cn
      WHERE cn.id = credit_note_lines.credit_note_id
      AND cn.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all credit note lines"
  ON credit_note_lines FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_order ON credit_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_user ON credit_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_status ON credit_notes(status);
CREATE INDEX IF NOT EXISTS idx_credit_note_lines_cn ON credit_note_lines(credit_note_id);

-- ============================================================================
-- 2. PAYMENT GATEWAY SUPPORT (AZUL, transferencia, efectivo)
-- ============================================================================

-- Add gateway-specific columns to order_payments
ALTER TABLE order_payments
  ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'manual'
    CHECK (gateway IN ('manual', 'azul', 'paypal', 'cardnet')),
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_session_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'DOP',
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Payment gateway webhook events log (idempotency & audit)
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  gateway TEXT NOT NULL DEFAULT 'azul',
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook events"
  ON payment_webhook_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON payment_webhook_events(event_type);

-- ============================================================================
-- 3. INVOICE STATUS HISTORY (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice status history"
  ON invoice_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_status_history.invoice_id
      AND (i.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
    )
  );

CREATE POLICY "Admins can insert invoice status history"
  ON invoice_status_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE INDEX IF NOT EXISTS idx_invoice_status_history_invoice ON invoice_status_history(invoice_id);

-- ============================================================================
-- 4. ADD DISCOUNT TRACKING TO INVOICES
-- ============================================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_rnc TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS credit_note_id UUID REFERENCES credit_notes(id);

-- ============================================================================
-- 5. CUSTOMER BALANCE / STORE CREDIT
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  source TEXT NOT NULL CHECK (source IN ('refund', 'promotion', 'manual', 'order_payment')),
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON customer_credits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage credits"
  ON customer_credits FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE INDEX IF NOT EXISTS idx_customer_credits_user ON customer_credits(user_id);

-- ============================================================================
-- 6. PAYMENT ANALYTICS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW payment_analytics AS
SELECT
  date_trunc('day', op.created_at) AS payment_date,
  op.gateway,
  op.payment_method,
  op.status,
  COUNT(*) AS payment_count,
  SUM(op.amount) AS total_amount,
  SUM(op.fee_amount) AS total_fees,
  SUM(op.amount) - SUM(COALESCE(op.fee_amount, 0)) AS net_amount
FROM order_payments op
GROUP BY date_trunc('day', op.created_at), op.gateway, op.payment_method, op.status;

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  date_trunc('month', o.created_at) AS month,
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'processing', 'packed', 'shipped', 'delivered') THEN o.id END) AS paid_orders,
  SUM(CASE WHEN o.status IN ('paid', 'processing', 'packed', 'shipped', 'delivered') THEN o.total ELSE 0 END) AS gross_revenue,
  SUM(COALESCE(o.discount_amount, 0)) AS total_discounts,
  SUM(CASE WHEN o.status = 'refunded' THEN o.total ELSE 0 END) AS total_refunds,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders
FROM orders o
GROUP BY date_trunc('month', o.created_at);

-- ============================================================================
-- 7. TRIGGER: Auto-log invoice status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO invoice_status_history (invoice_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_invoice_status_change ON invoices;
CREATE TRIGGER trigger_invoice_status_change
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_status_change();

-- ============================================================================
-- 8. UPDATE updated_at triggers for new tables
-- ============================================================================
CREATE TRIGGER set_credit_notes_updated_at
  BEFORE UPDATE ON credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
