import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type HostedPaymentProvider = 'azul' | 'cardnet' | 'payment_link';

export interface PaymentGatewaySetting {
  id: string;
  provider: HostedPaymentProvider;
  display_name: string;
  description: string | null;
  checkout_mode: 'hosted_page' | 'payment_link';
  environment: 'sandbox' | 'production';
  is_active: boolean;
  display_order: number;
  supported_cards: string[];
  supports_credit: boolean;
  supports_debit: boolean;
  supports_payment_links: boolean;
  public_config: Record<string, unknown>;
  health_status: 'not_configured' | 'ready' | 'warning' | 'error';
  health_message: string | null;
}

export interface HostedPaymentForm {
  method: 'POST' | 'GET';
  url: string;
  fields: Record<string, string>;
}

export interface HostedPaymentResponse {
  orderId: string;
  provider: HostedPaymentProvider;
  environment: 'sandbox' | 'production';
  total: number;
  form: HostedPaymentForm;
}

const gatewayClient = supabase as unknown as SupabaseClient;

export async function fetchActivePaymentGateways() {
  const { data, error } = await gatewayClient
    .from('payment_gateway_settings')
    .select('id, provider, display_name, description, checkout_mode, environment, is_active, display_order, supported_cards, supports_credit, supports_debit, supports_payment_links, public_config, health_status, health_message')
    .eq('is_active', true)
    .in('provider', ['azul', 'cardnet', 'payment_link'])
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PaymentGatewaySetting[];
}

export function isHostedPaymentProvider(value: string): value is HostedPaymentProvider {
  return value === 'azul' || value === 'cardnet' || value === 'payment_link';
}

export function getHostedProviderLabel(provider: HostedPaymentProvider) {
  if (provider === 'azul') return 'Azul';
  if (provider === 'cardnet') return 'CardNET';
  return 'Link de pago';
}

export function submitHostedPaymentForm(form: HostedPaymentForm) {
  const target = new URL(form.url, window.location.origin);
  const isLocalHttp = target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname);
  if (target.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('La pasarela debe usar una URL HTTPS segura.');
  }

  if (form.method === 'GET') {
    window.location.assign(target.toString());
    return;
  }

  const paymentForm = document.createElement('form');
  paymentForm.method = 'POST';
  paymentForm.action = target.toString();
  paymentForm.style.display = 'none';

  Object.entries(form.fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    paymentForm.appendChild(input);
  });

  document.body.appendChild(paymentForm);
  paymentForm.submit();
}
