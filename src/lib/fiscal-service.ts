
import { supabase } from '@/integrations/supabase/client';

export type NCFType = '01' | '02' | 'E31' | 'E32';

interface FiscalData {
  companyName: string;
  rnc: string;
  ncfType: NCFType;
}

interface ECFResponse {
  trackId: string;
  ncf: string;
  securityCode: string;
  sign: string;
  qrCodeUrl?: string; // Optional for e-CF
}

/**
 * Service to handle Dominican Republic Fiscal Invoicing (NCF & e-CF)
 */
export class FiscalInvoicingService {
  
  /**
   * Validate RNC format (Cedula or RNC)
   * 11 digits (Cedula) or 9 digits (RNC)
   */
  static validateRNC(rnc: string): boolean {
    const cleanRNC = rnc.replace(/[^0-9]/g, '');
    
    if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
      return false;
    }
    
    // Algoritmo Luhn or specific DR algo (simplified for now)
    // 9 Digits: RNC Juridico
    // 11 Digits: Cedula Fisica
    
    // TODO: Implement full checksum validation if strict needed
    return true;
  }

  /**
   * Generate Next NCF from Local DB Sequence
   * Used for Standard B01/B02 or as fallback
   */
  static async startLocalSequence(type: NCFType): Promise<string | null> {
    const series = type.startsWith('E') ? 'E' : 'B';
    const typeCode = type.replace('E', ''); // '31', '01', etc.

    const { data, error } = await supabase
      .rpc('get_next_ncf', {
        seq_series: series,
        seq_type: typeCode
      });

    if (error) {
      console.error('Error generating NCF:', error);
      throw new Error('Error generando NCF local');
    }

    return data;
  }

  /**
   * Simulate or Call e-CF Provider (e.g., Alanube, Voxel)
   * This is a placeholder for the actual API call
   */
  static async generateElectronicInvoice(orderData: any, fiscalData: FiscalData): Promise<ECFResponse> {
    // MOCK Integration - To be replaced with actual fetch to provider
    console.log('Generating e-CF for:', fiscalData.companyName);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get sequence from local DB to maintain order (or usually provider gives it)
    // For e-CF, provider usually handles sequence, but we might track it too.
    const internalNCF = await this.startLocalSequence(fiscalData.ncfType);

    if (!internalNCF) throw new Error('Failed to get NCF sequence');

    return {
      trackId: `ECF-${Date.now()}`,
      ncf: internalNCF, // e.g., E3100000001
      securityCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      sign: 'MOCK_SIGNATURE_XML_BASE64_...',
      qrCodeUrl: `https://ecf.dgii.gov.do/consultas/${internalNCF}`
    };
  }

  /**
   * Main function to issue invoice based on mode
   */
  static async issueInvoice(orderId: string, mode: 'local' | 'electronic' = 'local'): Promise<any> {
    // 1. Get Order Data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error('Order not found');

    // 2. Determine Fiscal Type
    // If order has RNC -> B01 (Credit Fiscal) / E31
    // If not -> B02 (Consumidor Final) / E32
    
    const rnc = order.rnc_cedula;
    const hasRNC = !!rnc;
    const isElectronic = mode === 'electronic';
    
    let ncfType: NCFType = '02'; // Default B02
    
    if (isElectronic) {
        ncfType = hasRNC ? 'E31' : 'E32';
    } else {
        ncfType = hasRNC ? '01' : '02';
    }

    // 3. Generate NCF
    let invoiceData: any = {};
    
    if (isElectronic) {
      const ecf = await this.generateElectronicInvoice(order, {
        companyName: order.company_name || (order.shipping_address ? (order.shipping_address as string).split('\n')[0] : 'Cliente'),
        rnc: rnc || '000000000',
        ncfType
      });
      
      invoiceData = {
        ncf: ecf.ncf,
        security_code: ecf.securityCode,
        electronic_sign: ecf.sign,
        track_id: ecf.trackId,
        status: 'issued' // or 'signed'
      };
    } else {
      const ncf = await this.startLocalSequence(ncfType);
      invoiceData = {
        ncf,
        status: 'issued'
      };
    }

    // 4. Update Invoice Record
    // Assuming Invoice created in 'AdminOrders' or previously, we update it.
    // Or create new Invoice record if not exists.
    
    // Check if invoice exists
    const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();
        
    if (existingInvoice) {
         const { data, error } = await supabase
            .from('invoices')
            .update({
                ...invoiceData,
                issued_at: new Date().toISOString()
            })
            .eq('id', existingInvoice.id)
            .select()
            .single();
            
         if (error) throw error;
         return data;
    } else {
        // Build new invoice object (simplified)
         const { data, error } = await supabase
            .from('invoices')
            .insert({
                order_id: orderId,
                total: order.total,
                subtotal: order.subtotal,
                tax_amount: order.total - (order.subtotal || 0), // Calc proper tax
                ...invoiceData,
                issued_at: new Date().toISOString(),
                invoice_number: `INV-${Date.now()}` // Fallback if no NCF
            })
            .select()
            .single();

         if (error) throw error;
         return data;
    }
  }
}
