import type { ParsedCustomerInfo } from '@/lib/order-contact';
import type { InvoicingSettings } from '@/lib/store-settings';

export interface BillingSource {
  billing_name?: string | null;
  billing_rnc?: string | null;
  shipping_address?: string | null;
}

export interface InvoiceTotals {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface ResolvedBillingData {
  billingName: string;
  billingAddress: string;
  billingRnc: string | null;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeRnc(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

export function isPotentialRnc(value: string | null | undefined): boolean {
  return /^\d{9}$/.test(normalizeRnc(value));
}

export function formatRnc(value: string | null | undefined): string {
  const normalized = normalizeRnc(value);

  if (!/^\d{9}$/.test(normalized)) {
    return value?.trim() || '';
  }

  return `${normalized.slice(0, 1)}-${normalized.slice(1, 3)}-${normalized.slice(3, 8)}-${normalized.slice(8)}`;
}

export function calculateInvoiceTotals(total: number, settings: InvoicingSettings): InvoiceTotals {
  const effectiveTaxRate = settings.itbis_enabled ? Math.max(0, Math.min(settings.itbis_rate || 0, 1)) : 0;

  if (effectiveTaxRate === 0) {
    return {
      subtotal: roundCurrency(total),
      taxRate: 0,
      taxAmount: 0,
      total: roundCurrency(total),
    };
  }

  const subtotal = total / (1 + effectiveTaxRate);
  const taxAmount = total - subtotal;

  return {
    subtotal: roundCurrency(subtotal),
    taxRate: effectiveTaxRate,
    taxAmount: roundCurrency(taxAmount),
    total: roundCurrency(total),
  };
}

export function resolveBillingData(order: BillingSource, customer: ParsedCustomerInfo): ResolvedBillingData {
  const shippingLines = (order.shipping_address || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    billingName: order.billing_name?.trim() || customer.name || 'Cliente',
    billingAddress:
      [customer.address, customer.city].filter(Boolean).join(', ') || shippingLines.slice(1, 4).join(', '),
    billingRnc: isPotentialRnc(order.billing_rnc) ? normalizeRnc(order.billing_rnc) : null,
  };
}