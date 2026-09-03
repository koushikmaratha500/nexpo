import { BRAND_NAME, getPublicAppUrl, getBrandEmailLogoUrl } from '@/lib/brand/constants';

function emailShell(title: string, bodyHtml: string, footerNote?: string): string {
  const appUrl = getPublicAppUrl();
  const logoUrl = getBrandEmailLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f0ff;font-family:Figtree,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f0ff;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%);padding:24px 28px;">
                <img src="${logoUrl}" alt="${BRAND_NAME}" width="280" height="80" style="display:block;max-width:100%;height:auto;" />
                <p style="margin:12px 0 0;font-size:13px;color:#ede9fe;">Smart expense tracking</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  ${footerNote || `You received this email because an action was requested on your ${BRAND_NAME} account.`}
                </p>
                <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
                  <a href="${appUrl}" style="color:#7C3AED;text-decoration:none;">${appUrl.replace(/^https?:\/\//, '')}</a>
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

export function buildVerificationEmailHtml(otp: string): string {
  return emailShell(
    `Verify your ${BRAND_NAME} account`,
    `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">Verify your email</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
        Enter this verification code to activate your account:
      </p>
      <div style="margin:0 0 20px;padding:16px 20px;border-radius:12px;background:#f3f0ff;text-align:center;">
        <span style="font-size:32px;font-weight:800;letter-spacing:0.35em;color:#7C3AED;">${otp}</span>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
        This code expires in <strong>15 minutes</strong>. If you did not create an account, you can ignore this email.
      </p>
    `,
  );
}

export function buildPasswordResetEmailHtml(resetLink: string, isAdmin = false): string {
  const accountLabel = isAdmin ? 'admin' : 'customer';
  return emailShell(
    `Reset your ${BRAND_NAME} password`,
    `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">Reset your password</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
        We received a request to reset the password for your ${accountLabel} account. Click the button below to choose a new password:
      </p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${resetLink}" style="display:inline-block;background:#7C3AED;color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;">
          Reset password
        </a>
      </p>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b7280;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 20px;word-break:break-all;font-size:12px;line-height:1.6;color:#7C3AED;">
        ${resetLink}
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
        This link expires in <strong>1 hour</strong>. If you did not request a reset, you can safely ignore this email.
      </p>
    `,
  );
}
