import { BRAND_NAME, getBrandEmailLogoUrl, getPublicAppUrl } from '@/lib/brand/constants';

const SUPPORT_EMAIL = 'support@paysasuchan.com';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(href: string, label: string, primary = true): string {
  const style = primary
    ? 'background:#7C3AED;color:#ffffff;border:1px solid #7C3AED;'
    : 'background:#ffffff;color:#5B21B6;border:1px solid #DDD6FE;';
  return `<a href="${href}" style="${style}display:inline-block;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">${label}</a>`;
}

function detailRows(rows: [string, string][]): string {
  return rows
    .map(
      ([k, v], i) => `
      <tr>
        <td style="padding:10px 0;${i ? 'border-top:1px solid #EDE9FE;' : ''}font-size:13px;color:#6B7280;">${k}</td>
        <td align="right" style="padding:10px 0;${i ? 'border-top:1px solid #EDE9FE;' : ''}font-size:14px;font-weight:700;color:#111827;">${v}</td>
      </tr>`,
    )
    .join('');
}

/** Shared billing email layout: brand header, content card, support footer. Table-based for email clients. */
export function billingEmailShell(opts: { preheader: string; title: string; body: string }): string {
  const appUrl = getPublicAppUrl();
  const logoUrl = getBrandEmailLogoUrl();
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${opts.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F3FF;font-family:Figtree,'Segoe UI',Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F3FF;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
            <tr>
              <td style="background:#ffffff;border-top:6px solid #7C3AED;border-radius:20px 20px 0 0;padding:24px 32px 8px;">
                <img src="${logoUrl}" alt="${BRAND_NAME}" width="220" style="display:block;width:220px;max-width:100%;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:16px 32px 32px;box-shadow:0 8px 24px rgba(76,29,149,0.08);">
                ${opts.body}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 16px 0;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#6B7280;">
                  Questions? Reply to this email or write to
                  <a href="mailto:${SUPPORT_EMAIL}" style="color:#7C3AED;text-decoration:none;">${SUPPORT_EMAIL}</a>.
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;">
                  &copy; ${new Date().getFullYear()} ${BRAND_NAME} &middot;
                  <a href="${appUrl}" style="color:#9CA3AF;text-decoration:underline;">${appUrl.replace(/^https?:\/\//, '')}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface PlanWelcomeEmailParams {
  firstName: string;
  planLabel: string;
  isLifetime: boolean;
  amount?: string;
  renewsOn?: string | null;
}

export function buildPlanWelcomeEmailHtml(params: PlanWelcomeEmailParams): string {
  const appUrl = getPublicAppUrl();
  const name = escapeHtml(params.firstName || 'there');
  const plan = escapeHtml(params.planLabel);
  const rows: [string, string][] = [['Plan', plan]];
  if (params.amount) rows.push(['Amount paid', `${escapeHtml(params.amount)} <span style="font-weight:400;color:#6B7280;">incl. GST</span>`]);
  rows.push(['Billing', params.isLifetime ? 'One-time, lifetime access' : params.renewsOn ? `Renews on ${escapeHtml(params.renewsOn)}` : 'Auto-renews']);

  const perks = [
    'Unlimited transactions, groups and reminders',
    'AI receipt scanning and the Finlit AI assistant',
    'CSV export and shareable receipts',
    params.isLifetime ? 'Priority support, forever' : 'Cancel anytime from Settings',
  ];

  const body = `
    <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#DCFCE7;color:#15803D;font-size:12px;font-weight:700;letter-spacing:.3px;">PAYMENT SUCCESSFUL</span>
    <h1 style="margin:16px 0 8px;font-size:26px;line-height:1.25;font-weight:800;color:#111827;">Welcome to ${plan}, ${name}!</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4B5563;">
      Your plan is active right now. Everything in ${BRAND_NAME} is unlocked, so you can track, split and plan without limits.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF8FF;border:1px solid #EDE9FE;border-radius:14px;padding:6px 18px;">
      ${detailRows(rows)}
    </table>
    <h2 style="margin:28px 0 12px;font-size:15px;font-weight:800;color:#111827;">What's included</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${perks
        .map(
          (p) => `<tr>
        <td width="28" valign="top" style="padding:5px 0;"><span style="display:inline-block;width:20px;height:20px;border-radius:999px;background:#EDE9FE;color:#7C3AED;font-size:12px;font-weight:800;line-height:20px;text-align:center;">&#10003;</span></td>
        <td style="padding:5px 0;font-size:14px;line-height:1.5;color:#374151;">${p}</td>
      </tr>`,
        )
        .join('')}
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:28px;">
      <tr>
        <td style="padding-right:10px;">${button(`${appUrl}/customer`, 'Open your dashboard')}</td>
        <td>${button(`${appUrl}/customer/orders`, 'View order', false)}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6B7280;">Your GST tax invoice is attached to a separate email and is always available under Orders.</p>`;

  return billingEmailShell({
    preheader: `Your ${params.planLabel} plan is active.`,
    title: `Welcome to ${params.planLabel}`,
    body,
  });
}

export function buildInvoiceEmailHtml(params: { invoiceNumber: string; planLabel: string; total: string }): string {
  const appUrl = getPublicAppUrl();
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Your tax invoice</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4B5563;">Thanks for your payment. Your GST invoice PDF is attached to this email.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF8FF;border:1px solid #EDE9FE;border-radius:14px;padding:6px 18px;">
      ${detailRows([
        ['Invoice', escapeHtml(params.invoiceNumber)],
        ['Plan', escapeHtml(params.planLabel)],
        ['Total paid', `${escapeHtml(params.total)} <span style="font-weight:400;color:#6B7280;">incl. GST</span>`],
      ])}
    </table>
    <div style="margin-top:28px;">${button(`${appUrl}/customer/orders`, 'View all orders')}</div>`;
  return billingEmailShell({ preheader: `Invoice ${params.invoiceNumber} for ${params.planLabel}`, title: 'Your tax invoice', body });
}

export function buildRefundEmailHtml(params: {
  firstName: string;
  planLabel: string;
  amount: string;
  fullRefund: boolean;
  invoiceNumber?: string | null;
}): string {
  const appUrl = getPublicAppUrl();
  const rows: [string, string][] = [
    ['Refund amount', escapeHtml(params.amount)],
    ['For', escapeHtml(params.planLabel)],
  ];
  if (params.invoiceNumber) rows.push(['Invoice', escapeHtml(params.invoiceNumber)]);
  rows.push(['Status', '<span style="color:#15803D;">Processed</span>']);
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Your refund is on its way</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4B5563;">
      Hi ${escapeHtml(params.firstName || 'there')}, we've processed a ${params.fullRefund ? 'full' : 'partial'} refund to your original payment method.
      Banks usually credit it within 5&ndash;7 working days.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF8FF;border:1px solid #EDE9FE;border-radius:14px;padding:6px 18px;">
      ${detailRows(rows)}
    </table>
    ${params.fullRefund ? '<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6B7280;">Because this payment was fully refunded, the plan it paid for is no longer active. Your data is safe and you can upgrade again anytime.</p>' : ''}
    <div style="margin-top:28px;">${button(`${appUrl}/customer/orders`, 'View order details')}</div>`;
  return billingEmailShell({ preheader: `Refund of ${params.amount} processed`, title: 'Refund processed', body });
}
