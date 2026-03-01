export interface ECFResponse {
  success: boolean;
  trackId: string;
  ncf: string;
  securityCode: string;
  qrCode: string;
  signedXml?: string;
  error?: string;
}

export const ecfService = {
  /**
   * Sends an invoice to be signed and reported to DGII
   */
  async signAndSendInvoice(invoiceData: any): Promise<ECFResponse> {
    try {
      const response = await fetch('/api/ecf/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Failed to sign invoice');
      }

      return await response.json();
    } catch (error) {
      console.error('e-CF Service Error:', error);
      throw error;
    }
  },

  /**
   * Utility to check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  }
};
