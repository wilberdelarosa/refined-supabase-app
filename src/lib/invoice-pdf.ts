import jsPDF from 'jspdf';

interface InvoicePDFData {
  invoiceNumber: string;
  issuedAt: string;
  status: string;
  orderId: string;

  // Issuer
  fiscalName: string;
  fiscalRnc: string;
  fiscalAddress: string;
  supportEmail: string;

  // Customer
  billingName: string;
  billingAddress: string;
  billingRnc?: string;
  billingEmail?: string;
  billingPhone?: string;

  // Lines
  lines: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  discountAmount?: number;
  discountCode?: string;

  // Payment
  paymentMethod?: string;
  paymentReference?: string;
}

function formatDOP(amount: number): string {
  return `DOP ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate a professional invoice PDF using jsPDF.
 * Compliant with Dominican Republic DGII requirements.
 */
export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [30, 30, 30];
  const accentColor: [number, number, number] = [43, 140, 238];
  const mutedColor: [number, number, number] = [120, 120, 120];

  // ── Header ──────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(...accentColor);
  doc.text(data.invoiceNumber, margin, y + 7);

  // Status badge
  const statusLabels: Record<string, string> = {
    issued: 'EMITIDA', paid: 'PAGADA', cancelled: 'ANULADA', draft: 'BORRADOR'
  };
  const statusLabel = statusLabels[data.status] || data.status.toUpperCase();
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  const statusWidth = doc.getTextWidth(statusLabel) + 6;
  doc.roundedRect(pageWidth - margin - statusWidth, y - 5, statusWidth, 7, 1, 1, 'S');
  doc.text(statusLabel, pageWidth - margin - statusWidth + 3, y);

  // Issuer info (right aligned)
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.fiscalName, pageWidth - margin, y + 15, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  if (data.fiscalRnc) doc.text(`RNC: ${data.fiscalRnc}`, pageWidth - margin, y + 20, { align: 'right' });
  doc.text(data.fiscalAddress, pageWidth - margin, y + 25, { align: 'right' });
  doc.text(data.supportEmail, pageWidth - margin, y + 30, { align: 'right' });

  y += 40;

  // Separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Invoice metadata ────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');

  const issuedDate = new Date(data.issuedAt).toLocaleDateString('es-DO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  doc.text('Fecha de emisión:', margin, y);
  doc.setTextColor(...primaryColor);
  doc.text(issuedDate, margin + 35, y);

  doc.setTextColor(...mutedColor);
  doc.text('Pedido:', margin + 100, y);
  doc.setTextColor(...primaryColor);
  doc.text(`#${data.orderId.slice(0, 8).toUpperCase()}`, margin + 115, y);

  y += 12;

  // ── Billing Info ────────────────────────────────────────────────────
  // Customer box
  const boxHeight = 35;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, y, contentWidth / 2 - 5, boxHeight, 2, 2, 'F');

  doc.setFontSize(7);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURADO A', margin + 5, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.billingName, margin + 5, y + 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  let customerY = y + 18;
  if (data.billingRnc) { doc.text(`RNC: ${data.billingRnc}`, margin + 5, customerY); customerY += 4; }
  if (data.billingEmail) { doc.text(data.billingEmail, margin + 5, customerY); customerY += 4; }
  if (data.billingPhone) { doc.text(data.billingPhone, margin + 5, customerY); customerY += 4; }
  if (data.billingAddress) {
    const addrLines = doc.splitTextToSize(data.billingAddress, contentWidth / 2 - 15);
    doc.text(addrLines, margin + 5, customerY);
  }

  // Payment box
  if (data.paymentMethod) {
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin + contentWidth / 2 + 5, y, contentWidth / 2 - 5, boxHeight, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉTODO DE PAGO', margin + contentWidth / 2 + 10, y + 6);

    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(data.paymentMethod, margin + contentWidth / 2 + 10, y + 13);

    if (data.paymentReference) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mutedColor);
      doc.text(`Ref: ${data.paymentReference}`, margin + contentWidth / 2 + 10, y + 18);
    }
  }

  y += boxHeight + 10;

  // ── Products Table ──────────────────────────────────────────────────
  const colWidths = [contentWidth * 0.45, contentWidth * 0.12, contentWidth * 0.2, contentWidth * 0.23];
  const colStarts = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

  // Table header
  doc.setFillColor(43, 140, 238);
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Producto', colStarts[0] + 3, y + 5.5);
  doc.text('Cant.', colStarts[1] + 3, y + 5.5);
  doc.text('Precio Unit.', colStarts[2] + 3, y + 5.5);
  doc.text('Total', colStarts[3] + colWidths[3] - 3, y + 5.5, { align: 'right' });

  y += 10;

  // Table rows
  doc.setFont('helvetica', 'normal');
  data.lines.forEach((line, i) => {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 3, contentWidth, 8, 'F');
    }

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);

    const nameLines = doc.splitTextToSize(line.productName, colWidths[0] - 6);
    doc.text(nameLines[0], colStarts[0] + 3, y + 2);
    doc.text(line.quantity.toString(), colStarts[1] + 3, y + 2);
    doc.text(formatDOP(line.unitPrice), colStarts[2] + 3, y + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDOP(line.total), colStarts[3] + colWidths[3] - 3, y + 2, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 8;
  });

  y += 5;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Totals ──────────────────────────────────────────────────────────
  const totalsX = pageWidth - margin - 70;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...primaryColor);
  doc.text(formatDOP(data.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 6;

  if (data.discountAmount && data.discountAmount > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text(`Descuento${data.discountCode ? ` (${data.discountCode})` : ''}`, totalsX, y);
    doc.text(`-${formatDOP(data.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
    y += 6;
  }

  doc.setTextColor(...mutedColor);
  doc.text(`ITBIS (${(data.taxRate * 100).toFixed(0)}%)`, totalsX, y);
  doc.setTextColor(...primaryColor);
  doc.text(formatDOP(data.taxAmount), pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Total line
  doc.setDrawColor(43, 140, 238);
  doc.setLineWidth(1);
  doc.line(totalsX, y - 2, pageWidth - margin, y - 2);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total', totalsX, y + 5);
  doc.text(formatDOP(data.total), pageWidth - margin, y + 5, { align: 'right' });

  y += 20;

  // ── Footer ──────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Gracias por tu compra', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Para consultas: ${data.supportEmail}`, pageWidth / 2, y, { align: 'center' });

  if (data.fiscalRnc) {
    y += 6;
    doc.setFontSize(7);
    doc.text(`Documento fiscal conforme a la DGII - RNC: ${data.fiscalRnc}`, pageWidth / 2, y, { align: 'center' });
  }

  return doc;
}

/**
 * Generate and download an invoice PDF
 */
export function downloadInvoicePDF(data: InvoicePDFData): void {
  const doc = generateInvoicePDF(data);
  doc.save(`Factura-${data.invoiceNumber}.pdf`);
}
