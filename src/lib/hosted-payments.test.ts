import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getHostedProviderLabel,
  isHostedPaymentProvider,
  submitHostedPaymentForm,
} from './hosted-payments';

describe('hosted payments', () => {
  afterEach(() => {
    document.querySelectorAll('form[data-test-payment-form]').forEach((form) => form.remove());
    vi.restoreAllMocks();
  });

  it('recognizes only supported hosted providers', () => {
    expect(isHostedPaymentProvider('azul')).toBe(true);
    expect(isHostedPaymentProvider('cardnet')).toBe(true);
    expect(isHostedPaymentProvider('payment_link')).toBe(true);
    expect(isHostedPaymentProvider('transfer')).toBe(false);
    expect(getHostedProviderLabel('cardnet')).toBe('CardNET');
  });

  it('builds a secure POST form with provider fields', () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function mockSubmit() {
      this.dataset.testPaymentForm = 'true';
    });

    submitHostedPaymentForm({
      method: 'POST',
      url: 'https://pruebas.azul.com.do/PaymentPage/',
      fields: { MerchantId: '123', Amount: '15000', AuthHash: 'hash' },
    });

    expect(submit).toHaveBeenCalledOnce();
    const form = document.querySelector('form[data-test-payment-form]') as HTMLFormElement;
    expect(form.action).toBe('https://pruebas.azul.com.do/PaymentPage/');
    expect(form.method).toBe('post');
    expect((form.elements.namedItem('Amount') as HTMLInputElement).value).toBe('15000');
    expect((form.elements.namedItem('AuthHash') as HTMLInputElement).value).toBe('hash');
  });

  it('rejects insecure non-local gateway URLs', () => {
    expect(() => submitHostedPaymentForm({
      method: 'POST',
      url: 'http://payments.example.com/checkout',
      fields: {},
    })).toThrow('HTTPS');
  });
});
