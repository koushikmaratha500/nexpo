import { FREEMIUM_LIMITS, PLAN_PRICES_INR, TRIAL_DAYS, formatInr } from '@/lib/billing/catalog';

/** Shown on every legal page; bump when any policy changes. */
export const LEGAL_LAST_UPDATED = '24 November 2026';

// Set NEXT_PUBLIC_SHOW_PRICING=false to hide every price on the marketing site (mirrors the admin pricing switch).
export const SHOW_PRICING = process.env.NEXT_PUBLIC_SHOW_PRICING !== 'false';

export const FAQS = [
  { q: 'What is PaysaSuchan?', a: 'PaysaSuchan is a money app for individuals and groups. You keep a personal ledger of income and expenses, split shared costs with friends or flatmates, set payment reminders, and ask an AI assistant questions about your own spending.' },
  { q: 'How does group expense splitting work?', a: 'Create a group, invite people by username, email or phone, and add an expense. Split it equally, by custom amounts, by percentages, or leave specific members out. Balances show who owes what. Any leftover paisa goes to the payer so totals always match.' },
  {
    q: 'What does it cost?',
    a: `Every account starts with a ${TRIAL_DAYS}-day free trial. After that, Starter is ${formatInr(PLAN_PRICES_INR.starterMonthly)} a month or ${formatInr(PLAN_PRICES_INR.starterYearly)} a year, and Pro is a one-time ${formatInr(PLAN_PRICES_INR.proLifetime)} for lifetime access. Prices are before GST, and you get a GST invoice by email.`,
  },
  {
    q: 'What happens when my trial ends?',
    a: `You can still view all your data, but adding or editing needs a paid plan. The trial includes up to ${FREEMIUM_LIMITS.personalTransactions} personal transactions, ${FREEMIUM_LIMITS.groups} groups of up to ${FREEMIUM_LIMITS.membersPerGroup} people, and limited AI messages and receipt scans.`,
  },
  {
    q: 'Can I share a receipt with someone who has no account?',
    a: 'Yes. Create a view-only link to a transaction. Anyone can open it without logging in, it shows a clean preview in chat apps, and it expires after a set time. You can revoke it any time.',
  },
  { q: 'Can I scan receipts?', a: 'Yes. Upload a receipt image or PDF and AI reads the amount, date, merchant, type and category into the form. You review it before saving.' },
  { q: 'What can the AI assistant see?', a: 'Only your own transactions, read-only. It cannot add, edit or delete anything, and every figure it quotes comes from your data, not from guesswork. It is not professional financial advice.' },
  { q: 'Is my data secure?', a: 'Sessions use signed tokens checked against our database, sign-in and API calls are rate limited, uploads are type- and size-checked, and one-time codes expire after 15 minutes with limited attempts. See our Privacy Policy for details.' },
  { q: 'How do payment reminders work?', a: 'Set a due date and repeat rule (none, weekly or monthly) for personal bills or group dues. You are notified in the app inbox and, if you opt in, by email or browser push. You choose the channels in Settings.' },
  { q: 'Can I export my data?', a: 'You can export filtered reports and group settlement summaries as CSV, and import transactions from CSV.' },
  { q: 'Can I reset or delete my account?', a: 'Yes, from Settings → Account data with an email or SMS code. A reset hides your personal transactions and a delete schedules account removal. Both can be undone by signing in within 7 days.' },
  { q: 'Is there a mobile app?', a: 'The web app is live. The mobile app is in testing and will reach the App Store and Google Play after that.' },
  { q: 'How do I get help?', a: 'Submit a ticket from the Help Center inside the app. Our team triages every ticket and replies with a status update.' },
];

export type Section = { h: string; p: string[] };

export const TERMS_CONDITIONS: Section[] = [
  { h: 'Agreement', p: ['These Terms & Conditions form a binding agreement between you and PaysaSuchan ("we", "us"). By creating an account or using the service you accept them. If you do not agree, do not use the service.'] },
  { h: 'Eligibility and accounts', p: ['You must be at least 18 years old and able to enter a contract. You are responsible for keeping your password and one-time codes confidential and for all activity under your account. Give us accurate information and keep it up to date.'] },
  { h: 'Plans and pricing', p: [`New accounts start with a ${TRIAL_DAYS}-day Freemium trial with usage limits. After the trial you can always view your data, but adding or editing needs a paid plan. We offer Starter (monthly or yearly subscription) and Pro (one-time payment for lifetime access). Current prices are shown on the Pricing page and in the app, in Indian Rupees (INR), before GST.`, 'Lifetime means access for as long as we operate the PaysaSuchan service, not for your lifetime. We may change prices for new purchases; a price change for an active subscription applies only from your next renewal and we will tell you in advance.'] },
  { h: 'Payments, GST and invoices', p: ['Payments are processed securely by Razorpay Software Private Limited (and, where enabled, Stripe). We never see or store your full card, UPI PIN or bank login details. GST at the applicable rate (currently 18%) is added at checkout, and a GST tax invoice is emailed to you and kept under Orders in the app. Add your GSTIN in Settings before paying if you want it printed on the invoice.'] },
  { h: 'Subscriptions and auto-renewal', p: ['Starter renews automatically at the end of each billing period using the payment method or mandate (card, UPI Autopay or e-mandate) you authorise at checkout, until you cancel. You can cancel anytime in Settings; you keep access until the end of the period you have paid for and are not charged again. If a renewal payment fails we retry for a few days; if it keeps failing, paid features are paused until you pay again. Upgrading from Starter to Pro cancels your Starter subscription.'] },
  { h: 'Refunds and cancellations', p: ['Refunds are handled under our Refund & Cancellation Policy, which forms part of these terms. Approved refunds go back to the original payment method. If a payment is fully refunded, the plan it paid for ends.'] },
  { h: 'Your content', p: ['You own the transactions, notes and receipts you add. You grant us a limited licence to store, process and display them only to run the service for you and your group members. Group expenses are visible to the members of that group.'] },
  { h: 'AI features', p: ['Receipt scanning and the assistant use AI models and can be wrong. Check every extracted value before saving. Output is information, not financial, tax or legal advice.'] },
  { h: 'Service availability', p: ['We work to keep the service available but do not guarantee uninterrupted or error-free operation. We may change or discontinue features with reasonable notice where practical.'] },
  { h: 'Suspension and termination', p: ['You may stop using the service or delete your account at any time. We may suspend or terminate accounts that breach these terms or the Terms of Use, or that put other users or the service at risk.'] },
  { h: 'Liability', p: ['To the maximum extent permitted by law, the service is provided "as is", and we are not liable for indirect or consequential loss. Our total liability for any claim is limited to the fees you paid in the 12 months before the claim.'] },
  { h: 'Governing law and disputes', p: ['These terms are governed by the laws of India. Please contact support first so we can try to resolve any issue. Otherwise, courts in India have jurisdiction, without limiting any rights you have under the Consumer Protection Act, 2019.'] },
  { h: 'Changes and contact', p: ['We may update these terms and will post the new date here. Continued use after a change means you accept it. Questions: support@paysasuchan.com.'] },
];

export const TERMS_OF_USE: Section[] = [
  { h: 'Acceptable use', p: ['Use PaysaSuchan only for lawful personal or business bookkeeping. You agree not to:'
    , 'Access another person\'s account or data, or attempt to bypass authentication or rate limits.', 'Upload malware, files you do not have the right to share, or content that is unlawful, abusive or infringing.', 'Scrape, reverse engineer, overload or probe the service for vulnerabilities without written permission.', 'Use the service to launder money, defraud others or misrepresent what a group member owes.', 'Pay with a card or account you are not authorised to use, file false chargebacks, or abuse the refund policy.'] },
  { h: 'Groups and other members', p: ['You are responsible for what you add to a group. Group admins can manage members and reminders. Do not add people to groups or invite them repeatedly if they have not agreed; invitations may be rate limited.'] },
  { h: 'Uploads', p: ['Receipts and documents must be JPEG, PNG, WebP or PDF and no larger than 10 MB. We validate file contents and may reject or remove files that fail checks.'] },
  { h: 'Usage limits', p: ['We apply fair-use limits to protect the service, including limits on sign-in attempts, transaction writes, invitations and AI requests. Plan limits shown in the app apply to your account.'] },
  { h: 'Notifications', p: ['You can turn email, push and in-app notifications on or off in Settings. Administrators may disable a channel platform-wide.'] },
  { h: 'Intellectual property', p: ['The PaysaSuchan name, logo, design and software belong to us or our licensors. These terms give you a personal, non-transferable right to use the service, not ownership of it.'] },
  { h: 'Reporting problems', p: ['Report abuse or security issues from the in-app Help Center or at security@paysasuchan.com. We investigate and may act on the account concerned.'] },
];

export const REFUND_POLICY: Section[] = [
  { h: 'Overview', p: ['This policy explains how cancellations and refunds work for paid PaysaSuchan plans. It is part of our Terms & Conditions. All prices are in INR and payments are processed by Razorpay (or Stripe, where enabled).'] },
  { h: 'Free trial first', p: [`Every account gets a ${TRIAL_DAYS}-day Freemium trial with no payment needed, so you can try the product before you buy. Please use it to check that PaysaSuchan fits your needs.`] },
  { h: 'Cancelling a subscription', p: ['You can cancel Starter anytime from Settings → Billing. Cancelling stops future renewals; you keep access until the end of the period you have already paid for. We do not charge cancellation fees.'] },
  { h: 'When you can get a refund', p: ['First purchase: if you are not satisfied, ask for a refund within 7 days of your first payment for Starter or Pro and we will refund it in full.', 'Errors on our side: duplicate charges, charges after a successful cancellation, or being charged while the service was unavailable for an extended period are refunded in full.', 'Renewals and partial periods: renewal payments and unused parts of a billing period are not refundable, except as above or where the law requires.'] },
  { h: 'How to request a refund', p: ['Open the order under Orders in the app and choose "Need help with this order?", or write to support@paysasuchan.com from your account email with the invoice number. We reply within 2 working days.'] },
  { h: 'How refunds are paid', p: ['Approved refunds are made to the original payment method only. We start the refund within 5 working days of approval; your bank or card issuer usually credits it within 5–7 working days after that. You can see the refund status under Orders.'] },
  { h: 'What happens to your plan', p: ['If a payment is fully refunded, the plan it paid for ends immediately and any linked subscription is cancelled. Your data stays in your account; you can view it and upgrade again anytime. Partial refunds do not change your plan.'] },
  { h: 'Contact', p: ['Questions about a charge or refund: support@paysasuchan.com.'] },
];

export const PRIVACY: Section[] = [
  { h: 'What we collect', p: ['Account details: name, email, optional phone, username, country and currency. Financial entries you create: transactions, categories, notes, receipts, group splits and reminders. Technical data: device and session information, IP address for security and rate limiting, and usage logs for AI features (feature, model, token counts, status; never your transaction data or chat content).'] },
  { h: 'How we use it', p: ['To run your account and ledger, calculate reports and group balances, send reminders and one-time codes, prevent abuse, provide support, and bill you if you subscribe. We do not sell your personal data.'] },
  { h: 'AI processing', p: ['When you scan a receipt or ask the assistant a question, the relevant image or summarised figures are sent to our AI provider to produce a response. The assistant reads only your own data and cannot change it.'] },
  { h: 'Payments', p: ['When you buy a plan, our payment partner Razorpay (or Stripe, where enabled) collects your payment details directly. We receive only what we need to run billing: a payment or subscription reference, amount, status, payment method type, and refund status. We never receive or store your full card number, CVV, UPI PIN or net-banking credentials. We keep your name, email, plan, payment references and GSTIN (if you add one) to issue GST invoices and handle refunds.'] },
  { h: 'Who we share with', p: ['Service providers that process data on our behalf: cloud hosting and database, file storage, email delivery, SMS delivery, browser push, AI model access and payment processing (Razorpay, Stripe). Other members of a group see the group expenses, splits and reminders you add to it, plus the profile fields needed to identify you in that group.'] },
  { h: 'Retention and deletion', p: ['We keep your data while your account is active. If you reset your account, personal transactions are hidden and permanently deleted after 7 days. If you delete your account, removal happens after 7 days. Signing in within that window cancels it. Billing records such as invoices and payment references are kept for as long as Indian tax law requires (currently at least six years), even after account deletion.'] },
  { h: 'Security', p: ['Sessions are validated server-side, one-time codes are random and expire after 15 minutes, uploads are validated, and requests are rate limited. No system is perfectly secure; tell us at once if you suspect misuse of your account.'] },
  { h: 'Your rights', p: ['You can view and edit your profile, export reports as CSV, correct or delete transactions, and reset or delete your account in Settings. To exercise other rights under applicable law, including India\'s Digital Personal Data Protection Act, 2023, write to privacy@paysasuchan.com.'] },
  { h: 'Children', p: ['PaysaSuchan is not intended for anyone under 18 and we do not knowingly collect their data.'] },
  { h: 'Changes and contact', p: ['We will post updates here with a new date and notify you of material changes. Contact: privacy@paysasuchan.com.'] },
];
