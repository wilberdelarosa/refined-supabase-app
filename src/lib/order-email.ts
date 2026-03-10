import { supabase } from '@/integrations/supabase/client';

export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderEmailPayload {
  type: 'order_created' | 'status_changed' | 'invoice_issued';
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderTotal: number;
  orderItems: OrderEmailItem[];
  newStatus?: string;
  oldStatus?: string;
  shippingAddress?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

export async function sendOrderEmail(payload: OrderEmailPayload) {
  const { data, error } = await supabase.functions.invoke('send-order-email', {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data;
}