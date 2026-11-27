/**
 * Measures auto-capture accuracy on a labelled corpus.
 *
 *   npx tsx scripts/eval-capture.ts scripts/capture-corpus.sample.json
 *
 * Corpus: JSON array of { text, sender, source, expected: { isTransaction, kind?, amount? } }.
 * Needs OPENROUTER_API_KEY (same AI setup as the app). Use anonymized real messages, including
 * negatives (offers, OTPs, failed payments, requests, mandates, balance and bill messages).
 */
import { readFileSync } from 'node:fs';
import { assessCaptureMessages } from '@/lib/ai/agents/capture.agent';

interface Sample {
  text: string;
  sender: string;
  source?: 'sms' | 'notification';
  expected: { isTransaction: boolean; kind?: 'DEBIT' | 'CREDIT'; amount?: number };
}

const CATEGORIES = ['Food', 'Travel', 'Fuel', 'Shopping', 'Healthcare', 'Entertainment', 'Utilities', 'Loans', 'CreditCard',
  'Education', 'Rent', 'Insurance', 'Taxes', 'Miscellaneous', 'Salary', 'Investments', 'Freelance', 'Gift', 'Refund'];
const PAYMENT_MODES = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Net Banking', 'UPI', 'Wallet', 'Cheque'];

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: tsx scripts/eval-capture.ts <corpus.json>');
  const corpus = JSON.parse(readFileSync(path, 'utf8')) as Sample[];

  const stats = new Map<string, { tp: number; fp: number; fn: number; tn: number; wrongFields: number }>();
  const misses: string[] = [];
  for (let start = 0; start < corpus.length; start += 20) {
    const batch = corpus.slice(start, start + 20);
    const { results } = await assessCaptureMessages({
      items: batch.map((s, i) => ({
        id: String(start + i),
        source: s.source ?? 'sms',
        sender: s.sender,
        text: s.text,
        receivedAt: new Date().toISOString(),
      })),
      categories: CATEGORIES,
      paymentModes: PAYMENT_MODES,
      merchantHistory: [],
    });
    batch.forEach((sample, i) => {
      const r = results.find((x) => x.id === String(start + i));
      const key = sample.sender.replace(/^[A-Z]{2}-/, '').replace(/-[A-Z]$/, '');
      const s = stats.get(key) ?? { tp: 0, fp: 0, fn: 0, tn: 0, wrongFields: 0 };
      const got = r?.isTransaction ?? false;
      if (got && sample.expected.isTransaction) {
        s.tp++;
        const kindOk = !sample.expected.kind || r?.kind === sample.expected.kind;
        const amountOk = sample.expected.amount == null || r?.amount === sample.expected.amount;
        if (!kindOk || !amountOk) {
          s.wrongFields++;
          misses.push(`FIELDS ${r?.kind} ${r?.amount} <- ${sample.text}`);
        }
      } else if (got) {
        s.fp++;
        misses.push(`FALSE POSITIVE <- ${sample.text}`);
      } else if (sample.expected.isTransaction) {
        s.fn++;
        misses.push(`MISSED (${r?.rejectReason ?? 'no result'}) <- ${sample.text}`);
      } else {
        s.tn++;
      }
      stats.set(key, s);
    });
  }

  let tp = 0, fp = 0, fn = 0;
  for (const [sender, s] of stats) {
    tp += s.tp; fp += s.fp; fn += s.fn;
    console.log(`${sender.padEnd(12)} tp=${s.tp} fp=${s.fp} fn=${s.fn} tn=${s.tn} wrongFields=${s.wrongFields}`);
  }
  const precision = tp + fp ? tp / (tp + fp) : 1;
  const recall = tp + fn ? tp / (tp + fn) : 1;
  console.log(`\nprecision ${(precision * 100).toFixed(1)}%  recall ${(recall * 100).toFixed(1)}%  (target ≥99% / ≥97%)`);
  if (misses.length) console.log(`\n${misses.join('\n')}`);
  process.exitCode = precision >= 0.99 && recall >= 0.97 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
