-- Notification platform foundation for in-app + email delivery.
-- This file lives in the 2026-03-10 working folder on purpose.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS source_event TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivery_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_topic_created_at
  ON public.notifications (topic, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_dedupe_key
  ON public.notifications (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push', 'sms', 'whatsapp')),
  transport TEXT NOT NULL DEFAULT 'internal' CHECK (transport IN ('internal', 'react_email', 'provider_template')),
  provider TEXT,
  provider_template_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT,
  body_text_template TEXT,
  template_path TEXT,
  preview_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_transactional BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (template_key, channel, version)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Staff can read notification templates"
ON public.notification_templates
FOR SELECT
USING (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'support'::app_role)
);

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_notification_templates_lookup
  ON public.notification_templates (template_key, channel, is_active, version DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push', 'sms', 'whatsapp')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'user',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic, channel)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage any notification preferences"
ON public.notification_preferences
FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_topic
  ON public.notification_preferences (user_id, topic, channel);

CREATE TABLE IF NOT EXISTS public.notification_sender_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'workspace' CHECK (scope IN ('workspace', 'user')),
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'nylas', 'google', 'microsoft', 'smtp', 'other')),
  connection_mode TEXT NOT NULL DEFAULT 'api_key' CHECK (connection_mode IN ('api_key', 'oauth', 'smtp')),
  connection_status TEXT NOT NULL DEFAULT 'draft' CHECK (connection_status IN ('draft', 'pending', 'connected', 'failed', 'disabled')),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  reply_to_email TEXT,
  external_account_id TEXT,
  auth_link_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_sender_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workspace sender accounts"
ON public.notification_sender_accounts
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Users can manage their own sender accounts"
ON public.notification_sender_accounts
FOR ALL
USING (scope = 'user' AND owner_user_id = auth.uid())
WITH CHECK (scope = 'user' AND owner_user_id = auth.uid());

CREATE TRIGGER update_notification_sender_accounts_updated_at
  BEFORE UPDATE ON public.notification_sender_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_notification_sender_accounts_status
  ON public.notification_sender_accounts (provider, connection_status, is_default);

CREATE TABLE IF NOT EXISTS public.notification_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  topic TEXT NOT NULL DEFAULT 'system',
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push', 'sms', 'whatsapp')),
  provider TEXT,
  recipient TEXT,
  state TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'processing', 'sent', 'failed', 'skipped', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH')),
  dedupe_key TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  provider_message_id TEXT,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own dispatch history"
ON public.notification_dispatches
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notification dispatches"
ON public.notification_dispatches
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'support'::app_role)
)
WITH CHECK (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'support'::app_role)
);

CREATE TRIGGER update_notification_dispatches_updated_at
  BEFORE UPDATE ON public.notification_dispatches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_notification_dispatches_queue
  ON public.notification_dispatches (state, channel, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notification_dispatches_user_created_at
  ON public.notification_dispatches (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_dispatches_dedupe
  ON public.notification_dispatches (channel, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.notification_channel_enabled(
  p_user_id UUID,
  p_topic TEXT,
  p_channel TEXT
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT np.is_enabled
      FROM public.notification_preferences AS np
      WHERE np.user_id = p_user_id
        AND np.topic = COALESCE(NULLIF(trim(p_topic), ''), 'system')
        AND np.channel = p_channel
      LIMIT 1
    ),
    (
      SELECT np.is_enabled
      FROM public.notification_preferences AS np
      WHERE np.user_id = p_user_id
        AND np.topic = '*'
        AND np.channel = p_channel
      LIMIT 1
    ),
    CASE
      WHEN p_channel IN ('email', 'in_app') THEN TRUE
      ELSE FALSE
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.queue_notification(
  p_user_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT 'SYSTEM',
  p_title TEXT DEFAULT '',
  p_message TEXT DEFAULT '',
  p_priority TEXT DEFAULT 'NORMAL',
  p_link_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_topic TEXT DEFAULT 'system',
  p_template_key TEXT DEFAULT NULL,
  p_channels TEXT[] DEFAULT ARRAY['in_app'],
  p_recipient_email TEXT DEFAULT NULL,
  p_dedupe_key TEXT DEFAULT NULL,
  p_source_event TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now()
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_template_id UUID;
  v_recipient_email TEXT;
  v_create_in_app BOOLEAN;
BEGIN
  IF p_priority NOT IN ('LOW', 'NORMAL', 'HIGH') THEN
    RAISE EXCEPTION 'Invalid notification priority: %', p_priority;
  END IF;

  v_create_in_app := p_user_id IS NOT NULL
    AND COALESCE(ARRAY_POSITION(COALESCE(p_channels, ARRAY['in_app']), 'in_app') IS NOT NULL, TRUE)
    AND public.notification_channel_enabled(p_user_id, p_topic, 'in_app');

  IF v_create_in_app THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      priority,
      link_url,
      metadata,
      topic,
      channel,
      template_key,
      dedupe_key,
      source_event,
      scheduled_for,
      delivery_metadata
    )
    VALUES (
      p_user_id,
      COALESCE(NULLIF(trim(p_type), ''), 'SYSTEM'),
      p_title,
      p_message,
      p_priority,
      p_link_url,
      COALESCE(p_metadata, '{}'::jsonb),
      COALESCE(NULLIF(trim(p_topic), ''), 'system'),
      'in_app',
      p_template_key,
      p_dedupe_key,
      p_source_event,
      COALESCE(p_scheduled_for, now()),
      jsonb_build_object('requested_channels', COALESCE(p_channels, ARRAY['in_app']))
    )
    RETURNING id INTO v_notification_id;

    INSERT INTO public.notification_dispatches (
      notification_id,
      user_id,
      topic,
      channel,
      state,
      priority,
      dedupe_key,
      scheduled_for,
      payload,
      metadata,
      sent_at
    )
    VALUES (
      v_notification_id,
      p_user_id,
      COALESCE(NULLIF(trim(p_topic), ''), 'system'),
      'in_app',
      'sent',
      p_priority,
      p_dedupe_key,
      COALESCE(p_scheduled_for, now()),
      COALESCE(p_metadata, '{}'::jsonb),
      jsonb_build_object('source', 'queue_notification'),
      now()
    );
  END IF;

  IF ARRAY_POSITION(COALESCE(p_channels, ARRAY['in_app']), 'email') IS NOT NULL
     AND (
       p_user_id IS NULL
       OR public.notification_channel_enabled(p_user_id, p_topic, 'email')
     ) THEN
    SELECT nt.id
    INTO v_template_id
    FROM public.notification_templates AS nt
    WHERE nt.template_key = p_template_key
      AND nt.channel = 'email'
      AND nt.is_active = TRUE
    ORDER BY nt.version DESC
    LIMIT 1;

    SELECT NULLIF(
      trim(
        COALESCE(
          p_recipient_email,
          p_metadata ->> 'recipient_email',
          (
            SELECT pr.email
            FROM public.profiles AS pr
            WHERE pr.user_id = p_user_id
            LIMIT 1
          ),
          ''
        )
      ),
      ''
    )
    INTO v_recipient_email;

    INSERT INTO public.notification_dispatches (
      notification_id,
      user_id,
      template_id,
      topic,
      channel,
      provider,
      recipient,
      state,
      priority,
      dedupe_key,
      scheduled_for,
      payload,
      metadata
    )
    VALUES (
      v_notification_id,
      p_user_id,
      v_template_id,
      COALESCE(NULLIF(trim(p_topic), ''), 'system'),
      'email',
      'resend',
      v_recipient_email,
      CASE
        WHEN v_recipient_email IS NULL THEN 'skipped'
        ELSE 'queued'
      END,
      p_priority,
      p_dedupe_key,
      COALESCE(p_scheduled_for, now()),
      COALESCE(p_metadata, '{}'::jsonb),
      jsonb_build_object(
        'source', 'queue_notification',
        'template_key', p_template_key
      )
    );
  END IF;

  RETURN v_notification_id;
END;
$$;

INSERT INTO public.notification_templates (
  template_key,
  channel,
  transport,
  provider,
  name,
  description,
  subject_template,
  body_text_template,
  template_path,
  preview_payload,
  is_transactional,
  is_active,
  version
)
VALUES
  (
    'order_created',
    'email',
    'react_email',
    'resend',
    'Order created email',
    'Customer confirmation after checkout is accepted.',
    'Pedido {{order_code}} recibido',
    'Hola {{customer_name}}, recibimos tu pedido {{order_code}} por {{order_total}}.',
    'emails/order-created.tsx',
    '{"customer_name":"Cliente","order_code":"BAR-1001","order_total":"RD$ 2,490.00","items":[{"name":"Creatina","quantity":1,"price":"RD$ 1,250.00"}]}'::jsonb,
    TRUE,
    TRUE,
    1
  ),
  (
    'order_created',
    'in_app',
    'internal',
    NULL,
    'Order created inbox notification',
    'In-app confirmation shown after checkout.',
    'Pedido recibido',
    'Tu pedido {{order_code}} fue recibido y esta pendiente de validacion.',
    NULL,
    '{"order_code":"BAR-1001"}'::jsonb,
    TRUE,
    TRUE,
    1
  ),
  (
    'order_status_changed',
    'email',
    'react_email',
    'resend',
    'Order status email',
    'Customer status updates for payment, shipping and delivery.',
    'Pedido {{order_code}} - {{status_label}}',
    'Tu pedido {{order_code}} cambio a {{status_label}}.',
    'emails/order-status-changed.tsx',
    '{"customer_name":"Cliente","order_code":"BAR-1001","status_label":"Pagado","status_note":"Ya validamos tu pago."}'::jsonb,
    TRUE,
    TRUE,
    1
  ),
  (
    'order_status_changed',
    'in_app',
    'internal',
    NULL,
    'Order status inbox notification',
    'In-app status update.',
    'Actualizacion de pedido',
    'Tu pedido {{order_code}} ahora esta {{status_label}}.',
    NULL,
    '{"order_code":"BAR-1001","status_label":"Pagado"}'::jsonb,
    TRUE,
    TRUE,
    1
  ),
  (
    'payment_verified',
    'email',
    'react_email',
    'resend',
    'Payment verified email',
    'Confirmation after a transfer or payment proof is verified.',
    'Pago verificado para {{order_code}}',
    'Validamos tu pago para el pedido {{order_code}}.',
    'emails/payment-verified.tsx',
    '{"customer_name":"Cliente","order_code":"BAR-1001","amount":"RD$ 2,490.00"}'::jsonb,
    TRUE,
    TRUE,
    1
  ),
  (
    'invoice_issued',
    'email',
    'react_email',
    'resend',
    'Invoice issued email',
    'Email that carries invoice reference and billing summary.',
    'Factura {{invoice_number}} disponible',
    'La factura {{invoice_number}} del pedido {{order_code}} ya esta disponible.',
    'emails/invoice-issued.tsx',
    '{"customer_name":"Cliente","order_code":"BAR-1001","invoice_number":"BNCF-0001","invoice_total":"RD$ 2,490.00"}'::jsonb,
    TRUE,
    TRUE,
    1
  )
ON CONFLICT (template_key, channel, version) DO NOTHING;

INSERT INTO public.store_settings (setting_key, setting_value)
VALUES (
  'notifications',
  '{
    "email_on_new_order": true,
    "email_on_payment": true,
    "email_on_invoice": true,
    "admin_email": "ventas@barbaronutrition.com",
    "in_app_enabled": true,
    "email_enabled": true,
    "default_channels": ["in_app", "email"],
    "provider": "resend",
    "template_renderer": "react_email",
    "sender_mode": "domain",
    "mailbox_connection_provider": null,
    "sender_name": "Barbaro Nutrition",
    "sender_email": "ventas@barbaronutrition.com",
    "reply_to_email": "soporte@barbaronutrition.com"
  }'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE
SET
  setting_value = COALESCE(public.store_settings.setting_value, '{}'::jsonb) || EXCLUDED.setting_value,
  updated_at = now();
