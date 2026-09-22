import { describe, expect, it } from 'vitest';
import { formatBotReply } from '@/lib/bot/formatReply';

describe('formatBotReply', () => {
  it('formats expense created reply', () => {
    const text = formatBotReply({
      success: true,
      type: 'expense_created',
      display: {
        amount: '₹750',
        category: 'Food',
        description: 'Breakfast',
        merchant: 'Chandra mandalam restaurant',
        date_label: 'Today',
      },
    });

    expect(text).toContain('✅ Expense saved');
    expect(text).toContain('₹750');
    expect(text).toContain('Food');
  });

  it('formats user not linked error', () => {
    const text = formatBotReply({
      success: false,
      error_code: 'USER_NOT_LINKED',
    });

    expect(text).toContain('not linked');
  });
});
