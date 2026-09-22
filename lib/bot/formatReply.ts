import type { BotCommandResult } from '@/lib/api/services/bot-command.service';

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatBotReply(result: BotCommandResult): string {
  if (!result.success) {
    if (result.error_code === 'PLAN_WRITE_LOCKED') {
      return 'Your trial has ended. Please upgrade on the PaySaSuchan website to continue adding transactions.';
    }
    if (result.error_code === 'USER_NOT_LINKED') {
      return 'Your WhatsApp is not linked to PaySaSuchan yet. Open the app → Settings → Link WhatsApp to get started.';
    }
    if (result.error_code === 'DUPLICATE') {
      return result.message || 'This message was already processed.';
    }
    return result.message || 'Something went wrong. Please try again.';
  }

  switch (result.type) {
    case 'expense_created':
    case 'income_created':
      return [
        result.type === 'expense_created' ? '✅ Expense saved' : '✅ Income saved',
        '',
        `${result.display?.amount ?? ''} · ${result.display?.category ?? 'Other'}`,
        result.display?.description ? String(result.display.description) : '',
        result.display?.merchant ? String(result.display.merchant) : '',
        result.display?.date_label ? String(result.display.date_label) : '',
      ]
        .filter(Boolean)
        .join('\n');

    case 'daily_summary':
    case 'weekly_summary':
    case 'monthly_summary': {
      const label =
        result.type === 'daily_summary'
          ? 'Today'
          : result.type === 'weekly_summary'
            ? 'This week'
            : 'This month';
      const lines = [
        `📊 ${label} summary`,
        '',
        `Spent: ${formatInr(result.display?.total_spend ?? 0)}`,
        `Income: ${formatInr(result.display?.total_income ?? 0)}`,
        `Transactions: ${result.display?.transaction_count ?? 0}`,
      ];
      const top = result.display?.top_categories as Array<{ name: string; amount: number }> | undefined;
      if (top?.length) {
        lines.push('', 'Top categories:');
        for (const cat of top.slice(0, 5)) {
          lines.push(`• ${cat.name}: ${formatInr(cat.amount)}`);
        }
      }
      return lines.join('\n');
    }

    case 'category_summary':
      return [
        `📊 ${result.display?.category ?? 'Category'} summary`,
        '',
        `Total: ${formatInr(result.display?.total_amount ?? 0)}`,
        `Transactions: ${result.display?.transaction_count ?? 0}`,
      ].join('\n');

    case 'transaction_list': {
      const items = result.display?.items as Array<{ amount: string; title: string; date: string }> | undefined;
      if (!items?.length) return 'No transactions found for that period.';
      const lines = ['Recent transactions:', ''];
      for (const item of items) {
        lines.push(`• ${item.date} — ${item.amount} — ${item.title}`);
      }
      return lines.join('\n');
    }

    case 'help':
      return [
        'PaySaSuchan on WhatsApp:',
        '• Spent 500 on lunch',
        '• Salary 50000',
        '• What did I spend today?',
        '• How much on food this month?',
        '• Last 10 expenses',
      ].join('\n');

    case 'clarification':
      return result.message || 'Could you provide more details?';

    default:
      return result.message || 'Done.';
  }
}
