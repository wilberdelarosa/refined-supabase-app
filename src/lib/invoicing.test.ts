import { describe, expect, it } from 'vitest';

import { calculateInvoiceTotals, formatRnc, isPotentialRnc, normalizeRnc, resolveBillingData } from '@/lib/invoicing';
import { parseCustomerInfo } from '@/lib/order-contact';

describe('invoicing utilities', () => {
  it('calculates ITBIS using dynamic settings', () => {
    const totals = calculateInvoiceTotals(1180, {
      itbis_enabled: true,
      itbis_rate: 0.18,
      rnc: '',
      fiscal_name: 'Barbaro Nutrition SRL',
      fiscal_address: 'Santo Domingo',
      allow_non_fiscal: true,
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.taxAmount).toBe(180);
    expect(totals.taxRate).toBe(0.18);
  });

  it('returns zero taxes when ITBIS is disabled', () => {
    const totals = calculateInvoiceTotals(500, {
      itbis_enabled: false,
      itbis_rate: 0.18,
      rnc: '',
      fiscal_name: 'Barbaro Nutrition SRL',
      fiscal_address: 'Santo Domingo',
      allow_non_fiscal: true,
    });

    expect(totals.subtotal).toBe(500);
    expect(totals.taxAmount).toBe(0);
    expect(totals.taxRate).toBe(0);
  });

  it('normalizes and formats a Dominican RNC', () => {
    expect(normalizeRnc('1-31-12345-6')).toBe('131123456');
    expect(isPotentialRnc('131123456')).toBe(true);
    expect(formatRnc('131123456')).toBe('1-31-12345-6');
  });

  it('prefers explicit billing data over parsed shipping data', () => {
    const customer = parseCustomerInfo('Juan Perez\nAv. Winston Churchill\nSanto Domingo\n8095550101\njuan@example.com');
    const billing = resolveBillingData(
      {
        billing_name: 'Inversiones JP SRL',
        billing_rnc: '131123456',
        shipping_address: 'Juan Perez\nAv. Winston Churchill\nSanto Domingo\n8095550101\njuan@example.com',
      },
      customer
    );

    expect(billing.billingName).toBe('Inversiones JP SRL');
    expect(billing.billingRnc).toBe('131123456');
    expect(billing.billingAddress).toContain('Av. Winston Churchill');
  });
});