export const TRIAL_DAYS = 7;

export const PLAN_PRICES_INR = {
  starterMonthly: 100,
  starterYearly: 1000,
  proLifetime: 10000,
} as const;

export const FREEMIUM_LIMITS = {
  personalTransactions: 50,
  ocr: 10,
  groups: 2,
  membersPerGroup: 8,
  activeReminders: 10,
  aiMessages: 15,
} as const;

export const PAID_GROUP_MEMBER_CAP = 50;

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
