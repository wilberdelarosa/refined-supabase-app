-- Hosted card payments: Azul, CardNET and external payment links.
-- Secrets remain in Supabase Edge Function secrets, never in this table.

CREATE TABLE IF NOT EXISTS public.payment_gateway_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE CHECK (provider IN ('azul', 'cardnet', 'payment_link', 'whop')),
  display_name text NOT NULL,
  description text,
  checkout_mode text NOT NULL DEFAULT 'hosted_page'
    CHECK (checkout_mode IN ('hosted_page', 'embedded', 'payment_link')),
  environment text NOT NULL DEFAULT 'sandbox'
    CHECK (environment IN ('sandbox', 'production')),
  is_active boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  payment_link_url text,
  supported_cards text[] NOT NULL DEFAULT ARRAY['visa', 'mastercard']::text[],
  supports_credit boolean NOT NULL DEFAULT true,
  supports_debit boolean NOT NULL DEFAULT true,
  supports_payment_links boolean NOT NULL DEFAULT false,
  public_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_status text NOT NULL DEFAULT 'not_configured'
    CHECK (health_status IN ('not_configured', 'ready', 'warning', 'error')),
  health_message text,
  last_health_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_provider_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('azul', 'cardnet', 'payment_link')),
  session_id text,
  session_key text,
  order_reference text NOT NULL,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_return_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  event_key text NOT NULL UNIQUE,
  outcome text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  response_code text,
  sanitized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_return_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Public reads active payment gateways"
  ON public.payment_gateway_settings FOR SELECT
  USING (
    is_active
    OR is_admin(auth.uid())
    OR has_role(auth.uid(), 'manager'::app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Admins manage payment gateways"
  ON public.payment_gateway_settings FOR ALL
  USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Admins inspect payment return events"
  ON public.payment_return_events FOR SELECT
  USING (
    is_admin(auth.uid())
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'support'::app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_gateways_active_order
  ON public.payment_gateway_settings(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_provider
  ON public.payment_provider_sessions(provider, expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_return_events_order
  ON public.payment_return_events(order_id, received_at DESC);

GRANT SELECT ON public.payment_gateway_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_gateway_settings TO authenticated;
REVOKE ALL ON public.payment_provider_sessions FROM anon, authenticated;
GRANT SELECT ON public.payment_return_events TO authenticated;

INSERT INTO public.payment_gateway_settings (
  provider,
  display_name,
  description,
  checkout_mode,
  environment,
  is_active,
  display_order,
  supported_cards,
  supports_payment_links,
  public_config
)
VALUES
  (
    'azul',
    'Azul',
    'Tarjetas de credito y debito mediante la Pagina de Pago Azul con 3DS.',
    'hosted_page',
    'sandbox',
    false,
    10,
    ARRAY['visa', 'mastercard', 'amex', 'discover', 'diners']::text[],
    true,
    '{"redirect_notice":"Seras redirigido al portal seguro de Azul."}'::jsonb
  ),
  (
    'cardnet',
    'CardNET',
    'Boton de Pago CardNET con pagina alojada, sesion temporal y autenticacion 3DS.',
    'hosted_page',
    'sandbox',
    false,
    20,
    ARRAY['visa', 'mastercard', 'amex']::text[],
    true,
    '{"redirect_notice":"Seras redirigido al portal seguro de CardNET."}'::jsonb
  ),
  (
    'payment_link',
    'Link de pago',
    'Enlace externo de cobro para operaciones asistidas.',
    'payment_link',
    'production',
    false,
    30,
    ARRAY[]::text[],
    true,
    '{"requires_manual_confirmation":true}'::jsonb
  )
ON CONFLICT (provider) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_payment_configuration_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_gateway_settings_updated_at ON public.payment_gateway_settings;
CREATE TRIGGER payment_gateway_settings_updated_at
BEFORE UPDATE ON public.payment_gateway_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_payment_configuration_updated_at();

DROP TRIGGER IF EXISTS payment_provider_sessions_updated_at ON public.payment_provider_sessions;
CREATE TRIGGER payment_provider_sessions_updated_at
BEFORE UPDATE ON public.payment_provider_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_payment_configuration_updated_at();

CREATE OR REPLACE FUNCTION public.settle_hosted_order_payment(
  p_order_id uuid,
  p_provider text,
  p_provider_reference_id text,
  p_authorization_code text DEFAULT NULL,
  p_response_code text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_order public.orders%ROWTYPE;
  payment_id uuid;
  invoice_id uuid;
  invoice_number text;
  invoice_ncf text;
  usage_id uuid;
  item_record record;
  previous_stock integer;
  new_stock integer;
  already_settled boolean;
  paid_timestamp timestamptz := now();
  net_subtotal numeric(10,2);
  tax_amount numeric(10,2);
  address_lines text[];
BEGIN
  IF p_provider NOT IN ('azul', 'cardnet') THEN
    RAISE EXCEPTION 'Unsupported hosted payment provider: %', p_provider;
  END IF;

  SELECT *
  INTO current_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT id
  INTO payment_id
  FROM public.order_payments
  WHERE order_id = p_order_id
    AND provider = p_provider
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF payment_id IS NULL THEN
    RAISE EXCEPTION 'Payment record not found';
  END IF;

  already_settled := current_order.status IN ('paid', 'processing', 'packed', 'shipped', 'delivered');

  UPDATE public.order_payments
  SET status = 'verified',
      provider_payment_id = p_provider_reference_id,
      reference_number = COALESCE(NULLIF(p_authorization_code, ''), p_provider_reference_id),
      paid_at = COALESCE(paid_at, paid_timestamp),
      verified_at = COALESCE(verified_at, paid_timestamp),
      provider_payload = COALESCE(p_payload, '{}'::jsonb),
      notes = '[' || p_provider || '] payment verified',
      failure_reason = NULL,
      updated_at = paid_timestamp
  WHERE id = payment_id;

  UPDATE public.orders
  SET status = 'paid',
      payment_provider = p_provider,
      provider_reference_id = p_provider_reference_id,
      paid_at = COALESCE(paid_at, paid_timestamp),
      payment_metadata = jsonb_build_object(
        'source', p_provider,
        'response_code', p_response_code,
        'authorization_code', p_authorization_code
      )
  WHERE id = p_order_id;

  IF already_settled THEN
    RETURN jsonb_build_object('already_settled', true, 'invoice_id', NULL);
  END IF;

  IF current_order.discount_code_id IS NOT NULL
     AND COALESCE(current_order.discount_amount, 0) > 0 THEN
    INSERT INTO public.discount_usages (
      discount_code_id,
      user_id,
      order_id,
      discount_amount
    )
    VALUES (
      current_order.discount_code_id,
      current_order.user_id,
      current_order.id,
      current_order.discount_amount
    )
    ON CONFLICT (discount_code_id, user_id, order_id) DO NOTHING
    RETURNING id INTO usage_id;

    IF usage_id IS NOT NULL THEN
      UPDATE public.discount_codes
      SET uses_count = COALESCE(uses_count, 0) + 1
      WHERE id = current_order.discount_code_id;
    END IF;
  END IF;

  FOR item_record IN
    SELECT product_id, product_name, quantity, price
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    IF item_record.product_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT stock
    INTO previous_stock
    FROM public.products
    WHERE id = item_record.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    new_stock := previous_stock - item_record.quantity;

    UPDATE public.products
    SET stock = new_stock,
        updated_at = paid_timestamp
    WHERE id = item_record.product_id;

    INSERT INTO public.stock_movements (
      product_id,
      quantity_change,
      previous_stock,
      new_stock,
      movement_type,
      reference_id,
      reference_type,
      notes
    )
    VALUES (
      item_record.product_id,
      -item_record.quantity,
      previous_stock,
      new_stock,
      'sale',
      p_order_id,
      p_provider || '_payment',
      'Stock descontado automaticamente por pago ' || p_provider
    );
  END LOOP;

  SELECT id
  INTO invoice_id
  FROM public.invoices
  WHERE order_id = p_order_id
  LIMIT 1;

  IF invoice_id IS NULL THEN
    invoice_number := public.generate_invoice_number();
    net_subtotal := round((current_order.total / 1.18)::numeric, 2);
    tax_amount := round((current_order.total - net_subtotal)::numeric, 2);
    address_lines := regexp_split_to_array(COALESCE(current_order.shipping_address, ''), E'\\n');
    invoice_ncf := current_order.ncf_generated;

    IF invoice_ncf IS NULL THEN
      BEGIN
        invoice_ncf := public.get_next_ncf('B', COALESCE(current_order.ncf_type, '02'));
        IF invoice_ncf IS NOT NULL THEN
          UPDATE public.orders
          SET ncf_generated = invoice_ncf
          WHERE id = p_order_id;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        invoice_ncf := NULL;
      END;
    END IF;

    INSERT INTO public.invoices (
      order_id,
      invoice_number,
      user_id,
      issued_at,
      subtotal,
      tax_rate,
      tax_amount,
      total,
      status,
      billing_name,
      billing_address,
      billing_rnc,
      ncf
    )
    VALUES (
      p_order_id,
      invoice_number,
      current_order.user_id,
      paid_timestamp,
      net_subtotal,
      0.18,
      tax_amount,
      current_order.total,
      'issued',
      COALESCE(NULLIF(current_order.company_name, ''), NULLIF(address_lines[1], ''), 'Cliente'),
      array_to_string(address_lines[2:4], ', '),
      current_order.rnc_cedula,
      invoice_ncf
    )
    RETURNING id INTO invoice_id;

    INSERT INTO public.invoice_lines (invoice_id, product_name, quantity, unit_price, total)
    SELECT
      invoice_id,
      product_name,
      quantity,
      price,
      round((price * quantity)::numeric, 2)
    FROM public.order_items
    WHERE order_id = p_order_id;

    IF COALESCE(current_order.discount_amount, 0) > 0 THEN
      INSERT INTO public.invoice_lines (invoice_id, product_name, quantity, unit_price, total)
      VALUES (
        invoice_id,
        'Descuento aplicado',
        1,
        -current_order.discount_amount,
        -current_order.discount_amount
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('already_settled', false, 'invoice_id', invoice_id);
END;
$$;

REVOKE ALL ON FUNCTION public.settle_hosted_order_payment(uuid, text, text, text, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_hosted_order_payment(uuid, text, text, text, text, jsonb)
TO service_role;
