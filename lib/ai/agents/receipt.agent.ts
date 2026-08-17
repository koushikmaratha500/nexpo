import { generateObject } from 'ai';
import { withModelFallback } from '@/lib/ai/provider';
import { ReceiptExtractionSchema, type ReceiptExtraction } from '@/lib/ai/types';

function categoryHint(names: string[]): string {
  if (names.length === 0) {
    return 'Suggest a plausible category name for this expense, or null if unsure.';
  }
  return `Choose the category strictly from this list (return the exact name): ${names.join(', ')}. If none fits, return null.`;
}

function paymentTypeHint(names: string[]): string {
  if (names.length === 0) {
    return 'For "paymentType", read the payment method shown on the receipt (e.g. CARD, CASH, UPI, NET BANKING) and return a natural name for it, or null if not shown.';
  }
  return `For "paymentType", read the payment method shown on the receipt (e.g. CARD, CASH, UPI, NET BANKING) and return the matching name strictly from this list: ${names.join(', ')}. If not shown or none fits, return null.`;
}

export interface ExtractReceiptOptions {
  imageBase64: string;
  mimeType: string;
  categoryNames?: string[];
  paymentTypeNames?: string[];
}

export interface ExtractReceiptResult {
  extraction: ReceiptExtraction;
  inputTokens: number;
  outputTokens: number;
}

export async function extractReceipt({
  imageBase64,
  mimeType,
  categoryNames = [],
  paymentTypeNames = [],
}: ExtractReceiptOptions): Promise<ExtractReceiptResult> {
  const { object, usage } = await withModelFallback('ocr', (model) =>
    generateObject({
      model,
      schema: ReceiptExtractionSchema,
      system: [
        'You are a receipt OCR assistant for an expense tracking app.',
        'Return exact figures from the image.',
        'Do not invent numbers; use null if a value is unreadable or missing.',
        'Tax lines (GST/VAT) are not the total unless clearly labeled as the total.',
        'The "title" must be a short human-readable description of the purchase, e.g. "Grocery shopping at Fresh Mart" — never copy a random word like TOTAL or GRAND TOTAL.',
        'For "type": a purchase, payment or billing receipt is ALWAYS "DEBIT". Use "CREDIT" ONLY if the document explicitly indicates money returned to the customer (e.g. REFUND, RETURN, CASHBACK, money-back voucher). When unsure, use "DEBIT".',
        'Return only the JSON matching the requested schema.',
        categoryHint(categoryNames),
        paymentTypeHint(paymentTypeNames),
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: imageBase64, mediaType: mimeType },
            { type: 'text', text: 'Extract the receipt fields.' },
          ],
        },
      ],
    })
  );

  return {
    extraction: object,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
