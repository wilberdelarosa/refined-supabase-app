const WHOP_SESSION_PREFIX = 'whop-checkout-session:';

export interface WhopPaymentLike {
  payment_method?: string | null;
  provider?: string | null;
  notes?: string | null;
  reference_number?: string | null;
  provider_checkout_id?: string | null;
  provider_payload?: unknown;
}

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export function getWhopSessionStorageKey(orderId: string) {
  return `${WHOP_SESSION_PREFIX}${orderId}`;
}

export function saveWhopSession(orderId: string, sessionId: string) {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.setItem(getWhopSessionStorageKey(orderId), sessionId);
}

export function loadWhopSession(orderId: string) {
  const storage = getSessionStorage();
  if (!storage) return null;
  return storage.getItem(getWhopSessionStorageKey(orderId));
}

export function clearWhopSession(orderId: string) {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(getWhopSessionStorageKey(orderId));
}

export function isWhopPayment(payment?: WhopPaymentLike | null) {
  if (!payment) return false;

  return payment.provider === 'whop' ||
    payment.provider_checkout_id != null ||
    (payment.payment_method === 'card' && typeof payment.notes === 'string' && payment.notes.includes('[whop]'));
}

export function getWhopSessionId(payment?: WhopPaymentLike | null) {
  if (!payment || !isWhopPayment(payment)) return null;

  return payment.provider_checkout_id || payment.reference_number || null;
}

export function getWhopPurchaseUrl(payment?: WhopPaymentLike | null) {
  if (!payment) return null;

  const payload = payment.provider_payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const purchaseUrl = (payload as Record<string, unknown>).purchase_url ?? (payload as Record<string, unknown>).purchaseUrl;
  return typeof purchaseUrl === 'string' ? purchaseUrl : null;
}
