import { BillingPlan, PlanStatus } from '@prisma/client';
import { BillingRepository } from '../repositories/billing.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from './email.service';
import { TRIAL_DAYS } from '@/lib/billing/catalog';

export class BillingDispatchService {
  static async dispatch() {
    const [trialReminders, expired] = await Promise.all([
      this.sendTrialReminders(),
      this.expireSubscriptions(),
    ]);

    return {
      trialRemindersSent: trialReminders,
      subscriptionsExpired: expired,
    };
  }

  private static async sendTrialReminders(): Promise<number> {
    const users = await BillingRepository.findUsersNeedingTrialReminder(2);
    let sent = 0;

    for (const user of users) {
      if (!user.email || !user.trialEndsAt) continue;
      const daysLeft = Math.max(
        0,
        Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      );

      const result = await EmailService.sendTrialEndingEmail(user.email, {
        firstName: user.firstName,
        daysLeft,
        trialDays: TRIAL_DAYS,
      });

      if (result.success) {
        await BillingRepository.markTrialReminderSent(user.id);
        sent += 1;
      }
    }

    return sent;
  }

  private static async expireSubscriptions(): Promise<number> {
    const users = await BillingRepository.findStarterSubscriptionsToExpire();
    let expired = 0;

    for (const user of users) {
      if (user.plan !== BillingPlan.STARTER) continue;
      await UserRepository.update(user.id, {
        planStatus: PlanStatus.EXPIRED,
        razorpaySubscriptionId: null,
        stripeSubscriptionId: null,
      });
      if (user.email) {
        await EmailService.sendSubscriptionExpiredEmail(user.email, {
          firstName: user.firstName,
        });
      }
      expired += 1;
    }

    return expired;
  }
}
