import { BRAND_NAME } from '@/lib/brand/constants';

export type FaqItem = {
  question: string;
  answer: string;
};

export const MARKETING_FAQ_ITEMS: FaqItem[] = [
  {
    question: `What is ${BRAND_NAME}?`,
    answer: `${BRAND_NAME} helps you track personal expenses, split group bills, and share receipts. This answer is placeholder copy.`,
  },
  {
    question: 'Is there a free plan?',
    answer:
      'We offer a freemium tier with optional paid plans. See Pricing on the home page for current limits (placeholder).',
  },
  {
    question: 'How do group splits work?',
    answer:
      'Create a group, add members, and record shared expenses. Splits can be equal or custom; balances show who owes whom.',
  },
  {
    question: 'How do I reset or delete my account?',
    answer:
      'In Settings → Account data, choose Email or SMS OTP, then Reset account or Delete account. You will verify with a one-time code.',
  },
  {
    question: 'Can I recover a deleted account?',
    answer:
      'Yes, within the recovery window shown in the app (typically seven days) by signing in again. After that, data is permanently removed.',
  },
  {
    question: 'How do I contact support?',
    answer: 'Use the Contact Us page or in-app Support. Final support channels and SLAs will be listed before launch.',
  },
];
