/**
 * Creates (or finds) the Razorpay subscription plans for the recurring SKUs, priced
 * exactly as checkout charges them (catalog price + GST), and prints the env lines.
 * Idempotent: an existing plan with the same sku note, amount and period is reused.
 *
 *   npx tsx scripts/razorpay-setup-plans.ts
 *
 * Uses RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET from .env (test or live mode).
 */
import 'dotenv/config';
import Razorpay from 'razorpay';
import { CheckoutSku } from '@prisma/client';
import { SKU_CATALOG } from '../lib/billing/skus';
import { computeGstBreakdown } from '../lib/billing/config';

const ENV_NAME: Partial<Record<CheckoutSku, string>> = {
  STARTER_MONTHLY: 'RAZORPAY_PLAN_STARTER_MONTHLY',
  STARTER_YEARLY: 'RAZORPAY_PLAN_STARTER_YEARLY',
};

type Period = 'monthly' | 'yearly';

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set');
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  console.log(`Razorpay mode: ${keyId.startsWith('rzp_live_') ? 'LIVE' : 'test'}`);

  const existing = await razorpay.plans.all({ count: 100 });

  for (const def of Object.values(SKU_CATALOG)) {
    const envName = ENV_NAME[def.sku];
    if (!def.recurring || !envName) continue;

    const amount = computeGstBreakdown(def.subtotalPaise).totalPaise;
    const period: Period = def.billingInterval === 'YEAR' ? 'yearly' : 'monthly';

    const match = existing.items.find(
      (plan) =>
        (plan.notes as Record<string, string> | undefined)?.sku === def.sku &&
        Number(plan.item.amount) === amount &&
        plan.item.currency === 'INR' &&
        plan.period === period &&
        plan.interval === 1,
    );

    const plan =
      match ??
      (await razorpay.plans.create({
        period,
        interval: 1,
        item: {
          name: `PaysaSuchan ${def.label}`,
          amount,
          currency: 'INR',
          description: `${def.label}, incl. GST`,
        },
        notes: { sku: def.sku },
      }));

    console.log(`${match ? 'found  ' : 'created'} ${def.sku}: ${plan.id} (${amount} paise ${period})`);
    console.log(`${envName}=${plan.id}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
