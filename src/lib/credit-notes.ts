import { supabase } from '@/integrations/supabase/client';
import { getStoreSettingsSnapshot } from '@/lib/store-settings';

export interface CreditNoteInput {
  invoiceId: string;
  orderId: string;
  userId: string;
  reason: string;
  lines: Array<{
    invoiceLineId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  refundMethod: 'original_payment' | 'store_credit' | 'bank_transfer' | 'cash';
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  invoice_id: string;
  order_id: string;
  user_id: string;
  reason: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  refund_method: string;
  refund_reference: string | null;
  issued_at: string;
  applied_at: string | null;
}

/**
 * Create a credit note (nota de crédito) for an invoice.
 * Compliant with DGII Dominican Republic requirements.
 */
export async function createCreditNote(input: CreditNoteInput): Promise<{
  success: boolean;
  creditNote?: CreditNote;
  error?: string;
}> {
  try {
    const settings = await getStoreSettingsSnapshot();
    const taxRate = settings.invoicing.itbis_enabled ? settings.invoicing.itbis_rate : 0;

    // Calculate totals
    const linesTotal = input.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const subtotal = taxRate > 0 ? linesTotal / (1 + taxRate) : linesTotal;
    const taxAmount = linesTotal - subtotal;

    // Generate credit note number
    const { data: cnNumber, error: rpcError } = await supabase.rpc('generate_credit_note_number');
    if (rpcError) {
      return { success: false, error: 'Error generating credit note number' };
    }

    // Create credit note
    const { data: creditNote, error: cnError } = await supabase
      .from('credit_notes')
      .insert({
        credit_note_number: cnNumber || `NC-${Date.now()}`,
        invoice_id: input.invoiceId,
        order_id: input.orderId,
        user_id: input.userId,
        reason: input.reason,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_rate: taxRate,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total: Math.round(linesTotal * 100) / 100,
        status: 'issued',
        refund_method: input.refundMethod,
      })
      .select()
      .single();

    if (cnError) {
      return { success: false, error: cnError.message };
    }

    // Create credit note lines
    const cnLines = input.lines.map(line => ({
      credit_note_id: creditNote.id,
      invoice_line_id: line.invoiceLineId || null,
      product_name: line.productName,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      total: line.unitPrice * line.quantity,
    }));

    const { error: linesError } = await supabase
      .from('credit_note_lines')
      .insert(cnLines);

    if (linesError) {
      return { success: false, error: linesError.message };
    }

    // If refund method is store_credit, add credit to customer
    if (input.refundMethod === 'store_credit') {
      await supabase.from('customer_credits').insert({
        user_id: input.userId,
        amount: Math.round(linesTotal * 100) / 100,
        type: 'credit',
        source: 'refund',
        reference_id: creditNote.id,
        description: `Nota de crédito ${creditNote.credit_note_number}`,
      });
    }

    return { success: true, creditNote: creditNote as CreditNote };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply a credit note (mark as applied/used)
 */
export async function applyCreditNote(
  creditNoteId: string,
  refundReference?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('credit_notes')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString(),
      refund_reference: refundReference || null,
    })
    .eq('id', creditNoteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Cancel a credit note
 */
export async function cancelCreditNote(
  creditNoteId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('credit_notes')
    .update({ status: 'cancelled' })
    .eq('id', creditNoteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get customer credit balance
 */
export async function getCustomerCreditBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from('customer_credits')
    .select('amount, type')
    .eq('user_id', userId);

  if (!data) return 0;

  return data.reduce((balance, entry) => {
    return entry.type === 'credit' ? balance + entry.amount : balance - entry.amount;
  }, 0);
}
