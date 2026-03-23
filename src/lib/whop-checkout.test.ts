import {
  clearWhopSession,
  getWhopPurchaseUrl,
  getWhopSessionId,
  isWhopPayment,
  loadWhopSession,
  saveWhopSession,
} from '@/lib/whop-checkout';

describe('whop checkout helpers', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('stores and restores a checkout session by order id', () => {
    saveWhopSession('order-1', 'session-1');

    expect(loadWhopSession('order-1')).toBe('session-1');

    clearWhopSession('order-1');

    expect(loadWhopSession('order-1')).toBeNull();
  });

  it('detects whop payments and extracts the session id', () => {
    const payment = {
      payment_method: 'card',
      notes: '[whop] session=cfg_123',
      reference_number: 'cfg_123',
    };

    expect(isWhopPayment(payment)).toBe(true);
    expect(getWhopSessionId(payment)).toBe('cfg_123');
  });

  it('reads purchase urls from provider payloads', () => {
    expect(
      getWhopPurchaseUrl({
        provider_payload: {
          purchase_url: 'https://whop.com/checkout/session',
        },
      }),
    ).toBe('https://whop.com/checkout/session');
  });
});
