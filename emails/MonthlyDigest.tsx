import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { MonthlyDigestViewModel } from '@/lib/digest/types';
import { pieSvgToDataUri } from '@/lib/digest/chart/pie-svg';
import { BRAND_NAME, getPublicAppUrl } from '@/lib/brand/constants';
import { getBrandEmailLogoUrl } from '@/lib/brand/logos';

function formatMoney(symbol: string, amount: number) {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatChange(percent: number | null | undefined) {
  if (percent == null || !Number.isFinite(percent)) return null;
  const arrow = percent > 0 ? '↑' : percent < 0 ? '↓' : '→';
  return `${arrow} ${Math.abs(percent).toFixed(1)}% vs prior month`;
}

export function MonthlyDigestEmail({ digest }: { digest: MonthlyDigestViewModel }) {
  const appUrl = getPublicAppUrl();
  const logoUrl = getBrandEmailLogoUrl();
  const chartUri = pieSvgToDataUri(digest.chartSvg);
  const spendChange = formatChange(digest.comparison?.debitChangePercent);

  return (
    <Html>
      <Head />
      <Preview>
        Your {digest.period.label} money summary — income, spending and where your money went.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} alt={BRAND_NAME} width="200" height="56" />
            <Text style={subtitle}>Your Monthly Money Digest</Text>
            <Heading style={monthTitle}>{digest.period.label}</Heading>
          </Section>

          {digest.variant === 'quiet' ? (
            <Section style={section}>
              <Heading as="h2" style={h2}>A quiet month</Heading>
              <Text style={bodyText}>
                You didn&apos;t record any transactions in {digest.period.label}. Start tracking to see
                your next digest.
              </Text>
            </Section>
          ) : (
            <>
              <Section style={section}>
                <Text style={label}>You spent</Text>
                <Heading style={heroAmount}>{formatMoney(digest.currencySymbol, digest.summary.totalDebit)}</Heading>
                {spendChange ? <Text style={muted}>{spendChange}</Text> : null}
              </Section>

              <Section style={cards}>
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  <tr>
                    <td style={cardCell}>
                      <Text style={cardLabel}>Money in</Text>
                      <Text style={cardValue}>{formatMoney(digest.currencySymbol, digest.summary.totalCredit)}</Text>
                    </td>
                    <td style={cardCell}>
                      <Text style={cardLabel}>Money out</Text>
                      <Text style={cardValue}>{formatMoney(digest.currencySymbol, digest.summary.totalDebit)}</Text>
                    </td>
                  </tr>
                </table>
                <Section style={netBox}>
                  <Text style={cardLabel}>Net cash flow</Text>
                  <Text style={netValue}>
                    {digest.summary.netCashFlow >= 0 ? '+' : ''}
                    {formatMoney(digest.currencySymbol, digest.summary.netCashFlow)}
                  </Text>
                </Section>
              </Section>

              <Section style={section}>
                <Heading as="h2" style={h2}>Where did your money go?</Heading>
                <Img src={chartUri} alt="Expense breakdown chart" width="200" height="200" style={chartImg} />
                {digest.expenses.map((row) => (
                  <Text key={`${row.categoryId}-${row.categoryName}`} style={rowText}>
                    {row.categoryName}
                    <span style={rowAmount}>
                      {formatMoney(digest.currencySymbol, row.amount)} · {row.percentage}%
                    </span>
                  </Text>
                ))}
              </Section>

              {digest.topCategories.length > 0 && (
                <Section style={section}>
                  <Heading as="h2" style={h2}>Top spending</Heading>
                  {digest.topCategories.map((row, i) => (
                    <Text key={row.categoryName} style={rowText}>
                      {i + 1}. {row.categoryName} — {formatMoney(digest.currencySymbol, row.amount)}
                    </Text>
                  ))}
                </Section>
              )}
            </>
          )}

          <Section style={ctaSection}>
            <Button href={`${appUrl}/customer`} style={button}>Open {BRAND_NAME}</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re receiving this because you use {BRAND_NAME}. Manage preferences in Settings →
            Notifications.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f3f0ff', fontFamily: 'Figtree, Arial, sans-serif' };
const container = { margin: '0 auto', padding: '24px 16px', maxWidth: '560px' };
const header = { backgroundColor: '#5b21b6', padding: '24px', borderRadius: '16px 16px 0 0' };
const subtitle = { color: '#ede9fe', fontSize: '13px', margin: '12px 0 0' };
const monthTitle = { color: '#ffffff', fontSize: '28px', margin: '8px 0 0' };
const section = { backgroundColor: '#ffffff', padding: '24px' };
const h2 = { fontSize: '18px', margin: '0 0 12px', color: '#14112b' };
const label = { fontSize: '14px', color: '#6b7280', margin: '0 0 4px' };
const heroAmount = { fontSize: '36px', margin: '0', color: '#14112b' };
const muted = { fontSize: '14px', color: '#6d28d9', margin: '8px 0 0' };
const bodyText = { fontSize: '16px', lineHeight: '24px', color: '#374151' };
const cards = { backgroundColor: '#ffffff', padding: '0 24px 24px' };
const cardCell = { padding: '12px', verticalAlign: 'top' as const };
const cardLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase' as const };
const cardValue = { fontSize: '20px', fontWeight: '700' as const, margin: '0', color: '#14112b' };
const netBox = { backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '16px', marginTop: '8px' };
const netValue = { fontSize: '24px', fontWeight: '800' as const, margin: '4px 0 0', color: '#6d28d9' };
const chartImg = { display: 'block', margin: '0 auto 16px' };
const rowText = { fontSize: '15px', margin: '8px 0', color: '#374151' };
const rowAmount = { float: 'right' as const, fontWeight: '600' as const };
const ctaSection = { backgroundColor: '#ffffff', padding: '8px 24px 32px', textAlign: 'center' as const };
const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '999px',
  fontWeight: '600' as const,
  textDecoration: 'none',
};
const hr = { borderColor: '#e5e7eb', margin: '0' };
const footer = { fontSize: '12px', color: '#9ca3af', padding: '16px 24px', backgroundColor: '#ffffff', borderRadius: '0 0 16px 16px' };
