import { BillingRepository } from '../repositories/billing.repository';
import { formatPaiseAsInr } from '@/lib/billing/config';

export class BillingAdminService {
  static async getOverview() {
    const data = await BillingRepository.getAdminOverview();
    return {
      ...data,
      totalRevenueInr: formatPaiseAsInr(data.totalRevenuePaise),
      mrrEstimateInr: formatPaiseAsInr(data.mrrEstimatePaise),
      recentPayments: data.recentPayments.map((payment) => ({
        ...payment,
        amountInr: formatPaiseAsInr(payment.amountPaise),
      })),
    };
  }
}
