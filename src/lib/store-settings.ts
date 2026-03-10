import { supabase } from '@/integrations/supabase/client';

export interface BrandingSettings {
  logo_url: string | null;
  store_name: string;
  slogan: string;
  sender_name: string;
  support_email: string;
}

export interface InvoicingSettings {
  itbis_enabled: boolean;
  itbis_rate: number;
  rnc: string;
  fiscal_name: string;
  fiscal_address: string;
  allow_non_fiscal: boolean;
}

export interface NotificationSettings {
  email_on_new_order: boolean;
  email_on_payment: boolean;
  email_on_invoice: boolean;
  admin_email: string;
}

export interface StoreSettingsSnapshot {
  branding: BrandingSettings;
  invoicing: InvoicingSettings;
  notifications: NotificationSettings;
}

const DEFAULT_SETTINGS: StoreSettingsSnapshot = {
  branding: {
    logo_url: null,
    store_name: 'Barbaro Nutrition',
    slogan: 'Suplementos deportivos premium',
    sender_name: 'Barbaro Nutrition',
    support_email: 'info@barbaronutrition.com',
  },
  invoicing: {
    itbis_enabled: true,
    itbis_rate: 0.18,
    rnc: '',
    fiscal_name: 'Barbaro Nutrition SRL',
    fiscal_address: 'Santo Domingo, República Dominicana',
    allow_non_fiscal: true,
  },
  notifications: {
    email_on_new_order: true,
    email_on_payment: true,
    email_on_invoice: true,
    admin_email: 'ventas@barbaronutrition.com',
  },
};

let cachedSettings: StoreSettingsSnapshot | null = null;
let cachedAt = 0;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeStoreSettingsRows(
  rows: Array<{ setting_key: string; setting_value: unknown }> | null | undefined
): StoreSettingsSnapshot {
  const snapshot: StoreSettingsSnapshot = {
    branding: { ...DEFAULT_SETTINGS.branding },
    invoicing: { ...DEFAULT_SETTINGS.invoicing },
    notifications: { ...DEFAULT_SETTINGS.notifications },
  };

  for (const row of rows || []) {
    const value = asRecord(row.setting_value);

    if (row.setting_key === 'branding') {
      snapshot.branding = {
        logo_url: typeof value.logo_url === 'string' ? value.logo_url : null,
        store_name: asString(value.store_name, snapshot.branding.store_name),
        slogan: asString(value.slogan, snapshot.branding.slogan),
        sender_name: asString(value.sender_name, asString(value.store_name, snapshot.branding.sender_name)),
        support_email: asString(value.support_email, snapshot.branding.support_email),
      };
    }

    if (row.setting_key === 'invoicing') {
      snapshot.invoicing = {
        itbis_enabled: asBoolean(value.itbis_enabled, snapshot.invoicing.itbis_enabled),
        itbis_rate: asNumber(value.itbis_rate, snapshot.invoicing.itbis_rate),
        rnc: asString(value.rnc, snapshot.invoicing.rnc),
        fiscal_name: asString(value.fiscal_name, snapshot.invoicing.fiscal_name),
        fiscal_address: asString(value.fiscal_address, snapshot.invoicing.fiscal_address),
        allow_non_fiscal: asBoolean(value.allow_non_fiscal, snapshot.invoicing.allow_non_fiscal),
      };
    }

    if (row.setting_key === 'notifications') {
      snapshot.notifications = {
        email_on_new_order: asBoolean(value.email_on_new_order, snapshot.notifications.email_on_new_order),
        email_on_payment: asBoolean(value.email_on_payment, snapshot.notifications.email_on_payment),
        email_on_invoice: asBoolean(value.email_on_invoice, snapshot.notifications.email_on_invoice),
        admin_email: asString(value.admin_email, snapshot.notifications.admin_email),
      };
    }
  }

  return snapshot;
}

export async function getStoreSettingsSnapshot(forceRefresh = false): Promise<StoreSettingsSnapshot> {
  const now = Date.now();

  if (!forceRefresh && cachedSettings && now - cachedAt < 60_000) {
    return cachedSettings;
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['branding', 'invoicing', 'notifications']);

  if (error) {
    if (cachedSettings) {
      return cachedSettings;
    }

    return DEFAULT_SETTINGS;
  }

  cachedSettings = normalizeStoreSettingsRows(data);
  cachedAt = now;

  return cachedSettings;
}

export function clearStoreSettingsCache() {
  cachedSettings = null;
  cachedAt = 0;
}