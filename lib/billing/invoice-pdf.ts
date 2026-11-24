import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { formatDate } from '../date';
import { INVOICE_LOGO_PNG_BASE64 } from './invoice-logo';

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
  /** Provider payment reference, e.g. Razorpay `pay_…`. */
  paymentRef?: string | null;
  /** e.g. "Razorpay" */
  paymentMethod?: string | null;
  gstRatePercent?: number;
  supportEmail?: string;
  website?: string;
}

/**
 * Standard PDF fonts only encode WinAnsi (Latin-1); "₹" or a Devanagari name throws and
 * fails invoicing for a paid checkout. shortcut: non-Latin text shows as "?", embed a
 * Unicode font (fontkit) when invoices must print native-script names.
 */
export function toWinAnsi(text: string): string {
  return text.replace(/₹/g, 'Rs. ').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

/** "Rs. 1,180.00" with Indian digit grouping. */
export function formatInvoiceMoney(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Indian-system words (crore/lakh/thousand), e.g. 118000 paise -> "Rupees One Thousand One Hundred Eighty Only". */
export function amountInWords(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  const words = parts.join(' ') || 'Zero';
  return `Rupees ${words}${p ? ` and ${belowHundred(p)} Paise` : ''} Only`;
}

const BRAND = rgb(0.486, 0.227, 0.929); // #7C3AED
const BRAND_DARK = rgb(0.357, 0.129, 0.714); // #5B21B6
const BRAND_TINT = rgb(0.953, 0.941, 1); // #F3F0FF
const INK = rgb(0.067, 0.094, 0.153); // #111827
const MUTED = rgb(0.42, 0.447, 0.502); // #6B7280
const LINE = rgb(0.898, 0.906, 0.922); // #E5E7EB
const GREEN = rgb(0.086, 0.639, 0.29); // #16A34A
const WHITE = rgb(1, 1, 1);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const raw of toWinAnsi(text).split('\n')) {
    let line = '';
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Tax Invoice ${input.invoiceNumber}`);
  doc.setAuthor(input.legalName);
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Buffer.from(INVOICE_LOGO_PNG_BASE64, 'base64'));
  const { width, height } = page.getSize();
  const M = 40; // page margin
  const right = width - M;

  const text = (
    p: PDFPage,
    value: string,
    x: number,
    y: number,
    opts: { size?: number; f?: PDFFont; color?: RGB; align?: 'left' | 'right' } = {},
  ) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const safe = toWinAnsi(value);
    const drawX = opts.align === 'right' ? x - f.widthOfTextAtSize(safe, size) : x;
    p.drawText(safe, { x: drawX, y, size, font: f, color: opts.color ?? INK });
  };

  // Accent bar + header
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: BRAND });
  const logoH = 60;
  const logoW = (logo.width / logo.height) * logoH;
  page.drawImage(logo, { x: M - 8, y: height - 30 - logoH, width: logoW, height: logoH });

  text(page, 'TAX INVOICE', right, height - 52, { size: 22, f: bold, color: BRAND_DARK, align: 'right' });
  text(page, `# ${input.invoiceNumber}`, right, height - 70, { size: 11, f: bold, align: 'right' });
  text(page, `Issued ${formatDate(input.issuedAt)}`, right, height - 85, { size: 9, color: MUTED, align: 'right' });

  // PAID pill
  const pill = 'PAID';
  const pillW = bold.widthOfTextAtSize(pill, 9) + 18;
  page.drawRectangle({ x: right - pillW, y: height - 108, width: pillW, height: 16, color: GREEN });
  text(page, pill, right - pillW / 2 - bold.widthOfTextAtSize(pill, 9) / 2, height - 103, { size: 9, f: bold, color: WHITE });

  // Parties
  let y = height - 140;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: LINE });
  y -= 22;
  const colW = (right - M - 20) / 2;
  const col2 = M + colW + 20;

  const block = (x: number, label: string, title: string, lines: string[]) => {
    let by = y;
    text(page, label, x, by, { size: 8, f: bold, color: BRAND });
    by -= 16;
    for (const l of wrap(title, bold, 11, colW)) {
      text(page, l, x, by, { size: 11, f: bold });
      by -= 14;
    }
    for (const line of lines) {
      for (const l of wrap(line, font, 9, colW)) {
        text(page, l, x, by, { size: 9, color: MUTED });
        by -= 12;
      }
    }
    return by;
  };

  const sellerEnd = block(M, 'BILLED BY', input.legalName, [
    input.billingAddress,
    `GSTIN: ${input.gstin}`,
    ...(input.supportEmail ? [input.supportEmail] : []),
  ]);
  const buyerEnd = block(col2, 'BILLED TO', input.customerName, [
    input.customerEmail,
    ...(input.buyerGstin ? [`GSTIN: ${input.buyerGstin}`] : []),
  ]);
  y = Math.min(sellerEnd, buyerEnd) - 14;

  // Meta strip
  const metaH = 40;
  page.drawRectangle({ x: M, y: y - metaH, width: right - M, height: metaH, color: BRAND_TINT });
  const meta: [string, string][] = [
    ['Invoice date', formatDate(input.issuedAt)],
    ['Payment ref', input.paymentRef || '-'],
    ['Paid via', input.paymentMethod || '-'],
    ['SAC', input.sac],
  ];
  const cellW = (right - M) / meta.length;
  meta.forEach(([k, v], i) => {
    const x = M + 12 + i * cellW;
    text(page, k.toUpperCase(), x, y - 15, { size: 7, f: bold, color: MUTED });
    text(page, v, x, y - 29, { size: 9, f: bold });
  });
  y -= metaH + 26;

  // Line items table
  // Right-aligned columns: qty/rate/amt are right edges.
  const cols = { idx: M + 10, desc: M + 34, sac: M + 250, qty: M + 340, rate: M + 420, amt: right - 10 };
  page.drawRectangle({ x: M, y: y - 8, width: right - M, height: 24, color: BRAND });
  const th = (v: string, x: number, align: 'left' | 'right' = 'left') =>
    text(page, v, x, y, { size: 8, f: bold, color: WHITE, align });
  th('#', cols.idx);
  th('DESCRIPTION', cols.desc);
  th('SAC', cols.sac);
  th('QTY', cols.qty, 'right');
  th('RATE', cols.rate, 'right');
  th('AMOUNT', cols.amt, 'right');
  y -= 30;
  text(page, '1', cols.idx, y, { size: 10 });
  text(page, `${input.planLabel} plan`, cols.desc, y, { size: 10, f: bold });
  text(page, 'PaysaSuchan subscription service', cols.desc, y - 13, { size: 8, color: MUTED });
  text(page, input.sac, cols.sac, y, { size: 10 });
  text(page, '1', cols.qty, y, { size: 10, align: 'right' });
  text(page, formatInvoiceMoney(input.subtotalPaise), cols.rate, y, { size: 10, align: 'right' });
  text(page, formatInvoiceMoney(input.subtotalPaise), cols.amt, y, { size: 10, align: 'right' });
  y -= 28;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: LINE });

  // Totals
  const rate = input.gstRatePercent ?? 18;
  const totals: [string, number][] = [['Taxable value', input.subtotalPaise]];
  if (input.cgstPaise > 0) totals.push([`CGST @ ${rate / 2}%`, input.cgstPaise]);
  if (input.sgstPaise > 0) totals.push([`SGST @ ${rate / 2}%`, input.sgstPaise]);
  if (input.igstPaise > 0) totals.push([`IGST @ ${rate}%`, input.igstPaise]);

  const tx = M + (right - M) * 0.55;
  let ty = y - 20;
  for (const [label, value] of totals) {
    text(page, label, tx, ty, { size: 9, color: MUTED });
    text(page, formatInvoiceMoney(value), right - 10, ty, { size: 10, align: 'right' });
    ty -= 18;
  }
  ty -= 4;
  page.drawRectangle({ x: tx - 10, y: ty - 10, width: right - tx + 10, height: 28, color: BRAND_DARK });
  text(page, 'Total (incl. GST)', tx, ty, { size: 10, f: bold, color: WHITE });
  text(page, formatInvoiceMoney(input.totalPaise), right - 10, ty, { size: 12, f: bold, color: WHITE, align: 'right' });
  ty -= 32;
  text(page, 'Amount paid', tx, ty, { size: 9, color: MUTED });
  text(page, formatInvoiceMoney(input.totalPaise), right - 10, ty, { size: 10, f: bold, color: GREEN, align: 'right' });
  ty -= 16;
  text(page, 'Balance due', tx, ty, { size: 9, color: MUTED });
  text(page, formatInvoiceMoney(0), right - 10, ty, { size: 10, align: 'right' });

  // Amount in words (left of totals)
  let wy = y - 20;
  text(page, 'AMOUNT IN WORDS', M, wy, { size: 7, f: bold, color: MUTED });
  wy -= 14;
  for (const l of wrap(amountInWords(input.totalPaise), font, 9, tx - M - 30)) {
    text(page, l, M, wy, { size: 9 });
    wy -= 12;
  }
  wy -= 10;
  text(page, 'TAX NOTE', M, wy, { size: 7, f: bold, color: MUTED });
  wy -= 14;
  const taxNote = input.igstPaise > 0 ? 'Inter-state supply: IGST charged.' : 'Intra-state supply: CGST + SGST charged.';
  for (const l of wrap(`${taxNote} Tax payable on reverse charge: No.`, font, 9, tx - M - 30)) {
    text(page, l, M, wy, { size: 9 });
    wy -= 12;
  }

  // Footer
  const fy = 70;
  page.drawLine({ start: { x: M, y: fy + 22 }, end: { x: right, y: fy + 22 }, thickness: 1, color: LINE });
  text(page, 'Thank you for choosing PaysaSuchan.', M, fy, { size: 10, f: bold, color: BRAND_DARK });
  text(page, 'This is a computer-generated invoice and does not require a signature.', M, fy - 14, { size: 8, color: MUTED });
  const contact = [input.website, input.supportEmail].filter(Boolean).join('  |  ');
  if (contact) text(page, contact, right, fy, { size: 8, color: MUTED, align: 'right' });
  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: BRAND });

  return doc.save();
}
