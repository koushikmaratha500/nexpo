import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatPaiseAsInr } from './config';

export interface InvoicePdfInput {
  invoiceNumber: string;
  issuedAt: Date;
  legalName: string;
  gstin: string;
  sac: string;
  billingAddress: string;
  customerName: string;
  customerEmail: string;
  buyerGstin?: string | null;
  planLabel: string;
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  let y = height - 48;

  const draw = (text: string, x: number, size = 11, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 6;
  };

  draw('TAX INVOICE', 48, 18, true);
  draw(`Invoice No: ${input.invoiceNumber}`, 48, 11, true);
  draw(`Date: ${input.issuedAt.toLocaleDateString('en-IN')}`, 48);
  y -= 8;
  draw('Seller', 48, 12, true);
  draw(input.legalName, 48);
  draw(`GSTIN: ${input.gstin}`, 48);
  draw(`SAC: ${input.sac}`, 48);
  for (const line of input.billingAddress.split('\n')) {
    draw(line, 48);
  }
  y -= 8;
  draw('Bill To', 48, 12, true);
  draw(input.customerName, 48);
  draw(input.customerEmail, 48);
  if (input.buyerGstin) {
    draw(`Buyer GSTIN: ${input.buyerGstin}`, 48);
  }
  y -= 8;
  draw(`Description: ${input.planLabel}`, 48);
  draw(`Taxable value: ${formatPaiseAsInr(input.subtotalPaise)}`, 48);
  if (input.cgstPaise > 0) draw(`CGST: ${formatPaiseAsInr(input.cgstPaise)}`, 48);
  if (input.sgstPaise > 0) draw(`SGST: ${formatPaiseAsInr(input.sgstPaise)}`, 48);
  if (input.igstPaise > 0) draw(`IGST: ${formatPaiseAsInr(input.igstPaise)}`, 48);
  draw(`Total: ${formatPaiseAsInr(input.totalPaise)}`, 48, 12, true);
  draw('This is a computer-generated GST invoice.', 48, 9);

  return doc.save();
}
