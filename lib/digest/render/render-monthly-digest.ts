import { render } from '@react-email/render';
import { MonthlyDigestEmail } from '@/emails/MonthlyDigest';
import type { MonthlyDigestViewModel } from '../types';
import { BRAND_NAME } from '@/lib/brand/constants';

export async function renderMonthlyDigestEmail(digest: MonthlyDigestViewModel) {
  const subject =
    digest.variant === 'quiet'
      ? `Your ${digest.period.label} — quiet month`
      : `Your ${digest.period.label} Money Digest`;

  const html = await render(MonthlyDigestEmail({ digest }));
  const text = buildPlainText(digest);

  return { subject, html, text };
}

function buildPlainText(digest: MonthlyDigestViewModel): string {
  const sym = digest.currencySymbol;
  const lines = [
    `${BRAND_NAME} — Monthly Money Digest`,
    digest.period.label,
    '',
  ];

  if (digest.variant === 'quiet') {
    lines.push(`A quiet month — no transactions recorded in ${digest.period.label}.`);
    return lines.join('\n');
  }

  lines.push(
    `You spent: ${sym}${digest.summary.totalDebit}`,
    `Money in: ${sym}${digest.summary.totalCredit}`,
    `Money out: ${sym}${digest.summary.totalDebit}`,
    `Net: ${sym}${digest.summary.netCashFlow}`,
    '',
    'Categories:',
  );

  for (const e of digest.expenses) {
    lines.push(`- ${e.categoryName}: ${sym}${e.amount} (${e.percentage}%)`);
  }

  return lines.join('\n');
}
