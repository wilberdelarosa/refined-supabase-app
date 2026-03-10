export interface ParsedCustomerInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  notes: string;
}

export interface ShippingAddressFields {
  fullName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  notes?: string;
}

export function parseCustomerInfo(shipping: string | null | undefined): ParsedCustomerInfo {
  if (!shipping) {
    return { name: 'Cliente', address: '', city: '', phone: '', email: '', notes: '' };
  }

  const lines = shipping
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    name: lines[0] || 'Cliente',
    address: lines[1] || '',
    city: lines[2] || '',
    phone: lines[3] || '',
    email: lines.find((line) => line.includes('@')) || lines[4] || '',
    notes: lines.find((line) => line.toLowerCase().startsWith('notas')) || '',
  };
}

export function buildShippingAddressInput(fields: ShippingAddressFields): string {
  return [
    fields.fullName,
    fields.address,
    fields.city,
    fields.phone,
    fields.email,
    fields.notes ? `Notas: ${fields.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function getPreferredCustomerEmail(options: {
  shippingAddress?: string | null;
  profileEmail?: string | null;
  fallbackEmail?: string | null;
}): string {
  const parsed = parseCustomerInfo(options.shippingAddress);

  return (options.profileEmail || parsed.email || options.fallbackEmail || '').trim();
}