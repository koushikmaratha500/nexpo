import { TransactionRepository } from '../repositories/transaction.repository';

export class DashboardService {
  static async getCustomerDashboard(userId: string) {
    const [debitSum, creditSum, recentTransactions] = await Promise.all([
      TransactionRepository.aggregateByType('DEBIT', { userId }),
      TransactionRepository.aggregateByType('CREDIT', { userId }),
      TransactionRepository.findRecentForUser(userId, 5),
    ]);

    return {
      totalExpenses: Number(debitSum._sum.amount || 0),
      totalBudgets: Number(creditSum._sum.amount || 0),
      recentExpenses: recentTransactions.filter((t) => t.type === 'DEBIT'),
      recentBudgets: recentTransactions.filter((t) => t.type === 'CREDIT'),
    };
  }
}
