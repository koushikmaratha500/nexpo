import { generateObject } from 'ai';
import { z } from 'zod';
import { withModelFallback } from '@/lib/ai/provider';

/** One captured message from the phone (balances and phone numbers already masked there). */
export interface CaptureInputItem {
  id: string;
  source: 'sms' | 'notification';
  sender: string;
  text: string;
  receivedAt: string;
  local?: { kind?: 'DEBIT' | 'CREDIT'; amount?: number; reference?: string; merchant?: string };
}

export interface MerchantCategory {
  merchant: string;
  category: string;
}

/** Enum when the list is known, so the model can only return an existing name. */
function nameField(names: string[]) {
  const unique = [...new Set(names.filter((n) => n.trim().length > 0))];
  return unique.length > 0
    ? z.enum(unique as [string, ...string[]]).nullable()
    : z.string().trim().max(100).nullable();
}

export function buildCaptureSchema(categories: string[], paymentModes: string[]) {
  return z.object({
    items: z.array(
      z.object({
        id: z.string(),
        isTransaction: z.boolean().describe('True only when money actually moved in or out of the user\'s account/card/wallet.'),
        rejectReason: z.string().trim().max(120).nullable().describe('Short reason when isTransaction is false.'),
        kind: z.enum(['DEBIT', 'CREDIT']).nullable(),
        amount: z.number().positive().nullable(),
        merchant: z.string().trim().max(100).nullable().describe('Clean payee/payer display name.'),
        counterparty: z.string().trim().max(100).nullable().describe('Raw UPI ID / account name if different from merchant.'),
        paymentMode: nameField(paymentModes),
        category: nameField(categories),
        reference: z.string().trim().max(40).nullable().describe('UPI Ref / UTR / RRN / Txn ID, digits and letters only.'),
        accountTail: z.string().trim().max(6).nullable().describe('Last digits of the account or card, e.g. "3504".'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
        confidence: z.number().min(0).max(1),
      }),
    ),
  });
}

export type CaptureAssessment = z.infer<ReturnType<typeof buildCaptureSchema>>['items'][number];

export function buildCaptureSystemPrompt(opts: {
  categories: string[];
  paymentModes: string[];
  merchantHistory: MerchantCategory[];
}): string {
  const history = opts.merchantHistory.length
    ? opts.merchantHistory.map((m) => `${m.merchant} => ${m.category}`).join('\n')
    : '(none yet)';
  return [
    'You verify bank SMS and payment-app notifications for an Indian personal finance app and extract the payment.',
    'For every input item return exactly one output item with the same id.',
    '',
    'isTransaction = true ONLY when money actually left or entered the user\'s bank account, card or wallet: UPI payments,',
    'card spends, ATM withdrawals, NEFT/IMPS/RTGS transfers, salary/refund/cashback that WAS credited, auto-debits that happened.',
    'isTransaction = false (give rejectReason) for: promotional credits or offers ("worth", vouchers, coupons, reward points,',
    'cashback offers, "T&C apply", gift cards, wallet promo cash), payment requests or collect requests, failed/declined/reversed',
    'attempts, mandates or debits that WILL happen, balance-only messages, OTPs, bill or due-date reminders, loan or limit offers.',
    '',
    'Fields:',
    '- kind: DEBIT for money out (sent, paid, spent, debited, withdrawn), CREDIT for money in (credited, received, refund).',
    '- amount: the transaction amount, never the balance or available limit.',
    '- merchant: a clean display name. For a UPI ID like "swiggy@icici" use "Swiggy" and put the UPI ID in counterparty.',
    '  Title-case ALL-CAPS names ("NEW BLUE SHARK AQUAR" -> "New Blue Shark Aquar"). Strip prefixes like "UPI/P2M/<ref>/",',
    '  "NEFT-", "IMPS-". Expand obvious aliases (AMZN -> Amazon, SWIGGY INSTAMART -> Swiggy Instamart). For person-to-person',
    '  payments use the person\'s name.',
    '- paymentMode: UPI / VPA / 12-digit RRN -> UPI; "Credit Card" -> Credit Card; "Debit Card" or POS -> Debit Card;',
    '  NEFT/IMPS/RTGS -> Bank Transfer; net banking -> Net Banking; wallet -> Wallet; ATM withdrawal -> Cash.',
    `  Allowed values: ${opts.paymentModes.join(', ') || '(any)'}. Use null if unclear.`,
    `- category: allowed values: ${opts.categories.join(', ') || '(any)'}. Pick by merchant type (food delivery, groceries and`,
    '  restaurants -> Food, fuel stations -> Fuel, cabs/trains/flights -> Travel, e-commerce -> Shopping, telecom/electricity',
    '  -> Utilities, pharmacy/hospital -> Healthcare, movies/OTT -> Entertainment). Salary credits -> Salary; refunds -> Refund.',
    '  Person-to-person transfers with no other clue -> Miscellaneous for DEBIT. Use null if no allowed value fits.',
    '- The user has categorized these merchants before; reuse their category for the same merchant:',
    history,
    '- reference: the UPI Ref / UTR / RRN / Ref no. / Txn ID. accountTail: last 3-4 digits of the account or card.',
    '- date: the transaction date in the message as YYYY-MM-DD (dd/mm/yy is day first); else the receivedAt date.',
    '- confidence: 0-1, how sure you are of isTransaction and the amount.',
    '',
    'Examples:',
    '"Credited Rs.1000 worth cash in Tata Cliq Wallet for BOSS merchandise shopping. Terms & conditions Apply"',
    '  -> isTransaction false, rejectReason "Promotional wallet credit".',
    '"Sent Rs.40000.00 From HDFC Bank A/C *3504 To PAVANI VADISA On 30/10/26 Ref 666919548464"',
    '  -> DEBIT 40000, merchant "Pavani Vadisa", paymentMode UPI, reference "666919548464", accountTail "3504", date 2026-10-30.',
    '"Transaction Successful! INR 120.00 spent on your IDFC FIRST Bank Credit Card ending XX0288 at NEW BLUE SHARK AQUAR',
    '  on 24 NOV 2026 at 12:44 PM Avbl Limit: [balance]" -> DEBIT 120, merchant "New Blue Shark Aquar",',
    '  paymentMode Credit Card, accountTail "0288", date 2026-11-24.',
    '"Ramesh has requested Rs 500 from you" -> isTransaction false, rejectReason "Payment request, not a payment".',
    '',
    'The "local" object is the phone\'s regex guess; correct it when the text says otherwise. Never invent values.',
  ].join('\n');
}

export async function assessCaptureMessages(opts: {
  items: CaptureInputItem[];
  categories: string[];
  paymentModes: string[];
  merchantHistory: MerchantCategory[];
}): Promise<{ results: CaptureAssessment[]; inputTokens: number; outputTokens: number }> {
  const schema = buildCaptureSchema(opts.categories, opts.paymentModes);
  const { object, usage } = await withModelFallback('structured', (model) =>
    generateObject({
      model,
      schema,
      system: buildCaptureSystemPrompt(opts),
      prompt: JSON.stringify({ items: opts.items }),
    }),
  );
  const wanted = new Set(opts.items.map((i) => i.id));
  return {
    results: object.items.filter((r) => wanted.has(r.id)),
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
  };
}
