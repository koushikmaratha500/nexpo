import { TransactionRepository } from '../repositories/transaction.repository';
import type { UserReportQueryDto } from '../dtos/report.dto';

export class ReportService {
  static async getCustomerReport(userId: string, query: UserReportQueryDto) {
    const types: ('DEBIT' | 'CREDIT')[] =
      query.type === 'ALL' ? ['DEBIT', 'CREDIT'] : query.type === 'CREDIT' ? ['CREDIT'] : ['DEBIT'];

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const [allMatching, paginated] = await Promise.all([
      TransactionRepository.findForUserReport({
        userId,
        types,
        categoryId: query.categoryId,
        startDate,
        endDate,
      }),
      TransactionRepository.findAll({
        userId,
        groupId: null,
        types,
        categoryId: query.categoryId,
        startDate,
        endDate,
        page: query.page,
        pageSize: query.pageSize,
      }),
    ]);

    const breakdownMap = new Map<string, { totalAmount: number; count: number }>();
    let totalAmount = 0;

    for (const txn of allMatching) {
      const label = txn.category?.name || txn.budgetDepositType?.name || 'Other';
      const amount = Number(txn.amount);
      totalAmount += amount;
      const entry = breakdownMap.get(label) || { totalAmount: 0, count: 0 };
      entry.totalAmount += amount;
      entry.count += 1;
      breakdownMap.set(label, entry);
    }

    const categoryBreakdown = Array.from(breakdownMap.entries())
      .map(([categoryName, { totalAmount: amount, count }]) => ({
        categoryId: null,
        categoryName,
        totalAmount: amount,
        count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      expenses: paginated.items,
      total: paginated.total,
      categoryBreakdown,
      totalAmount,
    };
  }
}
