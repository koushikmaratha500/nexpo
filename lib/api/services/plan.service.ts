import { BillingInterval, BillingPlan, PlanStatus } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/user.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { GroupRepository } from '../repositories/group.repository';
import { ReminderRepository } from '../repositories/reminder.repository';
import { AiUsageRepository } from '../repositories/aiUsage.repository';
import { FREEMIUM_LIMITS, PAID_GROUP_MEMBER_CAP, PLAN_PRICES_INR, TRIAL_DAYS } from '@/lib/billing/catalog';
import { PLAN_ERROR_CODES, type PlanEntitlement, type PlanUsage } from '@/lib/billing/types';
import { BillingService } from './billing.service';
import { SettingsService } from './settings.service';

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function trialDaysLeft(trialEndsAt: Date, now: Date): number {
  const ms = startOfDay(trialEndsAt).getTime() - startOfDay(now).getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

const FULL_ACCESS_FEATURES = {
  csvExport: true,
  ai: true,
  ocr: true,
  groups: true,
  reminders: true,
  receiptShare: true,
} as const;

export class PlanService {
  static async catalog() {
    const pricingEnabled = await SettingsService.isPricingEnabled();
    const checkout = await BillingService.getCheckoutStatus();
    return {
      pricingEnabled,
      trialDays: TRIAL_DAYS,
      pricesInr: PLAN_PRICES_INR,
      freemiumLimits: FREEMIUM_LIMITS,
      checkoutAvailable: pricingEnabled && checkout.checkoutAvailable,
      activeCheckoutProvider: checkout.activeProvider,
      configuredProviders: checkout.configuredProviders,
      razorpayKeyId: checkout.razorpayKeyId,
    };
  }

  static async getEntitlement(userId: string, now = new Date()): Promise<PlanEntitlement> {
    const pricingEnabled = await SettingsService.isPricingEnabled();
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    if (!pricingEnabled) {
      return this.buildUnlimitedEntitlement(user);
    }

    let trialEndsAt = user.trialEndsAt;
    if (!trialEndsAt) {
      trialEndsAt = addDays(now, TRIAL_DAYS);
      await UserRepository.update(userId, {
        trialEndsAt,
        plan: BillingPlan.FREEMIUM,
        planStatus: PlanStatus.TRIALING,
        billingInterval: BillingInterval.NONE,
      });
    }

    let status = user.planStatus;

    if (
      user.plan === BillingPlan.STARTER &&
      user.currentPeriodEndsAt &&
      user.currentPeriodEndsAt.getTime() <= now.getTime() &&
      status !== PlanStatus.EXPIRED
    ) {
      status = PlanStatus.EXPIRED;
      await UserRepository.update(userId, {
        planStatus: PlanStatus.EXPIRED,
        razorpaySubscriptionId: null,
        stripeSubscriptionId: null,
      });
    }

    const isPro = user.plan === BillingPlan.PRO;
    const isStarterActive =
      user.plan === BillingPlan.STARTER &&
      user.currentPeriodEndsAt !== null &&
      user.currentPeriodEndsAt.getTime() > now.getTime() &&
      (status === PlanStatus.ACTIVE ||
        status === PlanStatus.PAST_DUE ||
        status === PlanStatus.CANCELED);
    const isPaid = isPro || isStarterActive;

    if (!isPaid && trialEndsAt.getTime() <= now.getTime() && status === PlanStatus.TRIALING) {
      status = PlanStatus.EXPIRED;
      if (user.planStatus !== PlanStatus.EXPIRED) {
        await UserRepository.update(userId, { planStatus: PlanStatus.EXPIRED });
      }
    }

    const inTrial = !isPaid && trialEndsAt.getTime() > now.getTime();
    const writesLocked = !isPaid && !inTrial;
    const usage = writesLocked || inTrial || isPaid
      ? await this.collectUsage(userId)
      : {
          personalTransactions: 0,
          ocr: 0,
          groups: 0,
          activeReminders: 0,
          aiMessages: 0,
        };

    return {
      plan: isPaid ? user.plan : BillingPlan.FREEMIUM,
      status: isPaid ? (user.planStatus === PlanStatus.TRIALING ? PlanStatus.ACTIVE : user.planStatus) : status,
      billingInterval: user.billingInterval,
      trialEndsAt: trialEndsAt.toISOString(),
      currentPeriodEndsAt: user.currentPeriodEndsAt?.toISOString() ?? null,
      trialDaysLeft: inTrial ? trialDaysLeft(trialEndsAt, now) : 0,
      writesLocked,
      isPaid,
      pricingEnabled: true,
      features: {
        csvExport: isPaid,
        ai: isPaid || inTrial,
        ocr: isPaid || inTrial,
        groups: isPaid || inTrial,
        reminders: isPaid || inTrial,
        receiptShare: isPaid || inTrial,
      },
      limits: isPaid ? null : FREEMIUM_LIMITS,
      usage,
    };
  }

  private static async buildUnlimitedEntitlement(user: {
    id: string;
    trialEndsAt: Date | null;
    currentPeriodEndsAt: Date | null;
  }): Promise<PlanEntitlement> {
    const usage = await this.collectUsage(user.id);
    return {
      plan: BillingPlan.PRO,
      status: PlanStatus.ACTIVE,
      billingInterval: BillingInterval.LIFETIME,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      currentPeriodEndsAt: user.currentPeriodEndsAt?.toISOString() ?? null,
      trialDaysLeft: 0,
      writesLocked: false,
      isPaid: true,
      pricingEnabled: false,
      features: FULL_ACCESS_FEATURES,
      limits: null,
      usage,
    };
  }

  static async assertWritesAllowed(userId: string): Promise<PlanEntitlement> {
    const entitlement = await this.getEntitlement(userId);
    if (entitlement.writesLocked) {
      const message =
        entitlement.status === PlanStatus.EXPIRED && entitlement.plan === BillingPlan.STARTER
          ? 'Your Starter subscription has ended. Renew or upgrade to Pro to keep adding and editing data.'
          : entitlement.status === PlanStatus.PAST_DUE
            ? 'Your last payment failed. Update billing or renew Starter to keep editing.'
            : 'Your 7-day trial has ended. Upgrade to Starter or Pro to keep adding and editing data.';
      throw new HttpError(402, message, {
        code: PLAN_ERROR_CODES.WRITE_LOCKED,
        plan: entitlement.plan,
        writesLocked: true,
        status: entitlement.status,
      });
    }
    return entitlement;
  }

  static async assertCanCreatePersonalTransactions(userId: string, additional = 1): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    if (entitlement.isPaid || !entitlement.limits) return;
    if (entitlement.usage.personalTransactions + additional > entitlement.limits.personalTransactions) {
      throw new HttpError(
        402,
        `Freemium allows ${entitlement.limits.personalTransactions} personal transactions during the trial.`,
        { code: PLAN_ERROR_CODES.LIMIT, limit: 'personalTransactions' },
      );
    }
  }

  static async assertCanRunOcr(userId: string): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    if (!entitlement.features.ocr) {
      throw new HttpError(402, 'Receipt scanning is not included on your current plan.', {
        code: PLAN_ERROR_CODES.FEATURE,
        feature: 'ocr',
      });
    }
    if (entitlement.isPaid || !entitlement.limits) return;
    if (entitlement.usage.ocr >= entitlement.limits.ocr) {
      throw new HttpError(402, `Freemium allows ${entitlement.limits.ocr} receipt scans during the trial.`, {
        code: PLAN_ERROR_CODES.LIMIT,
        limit: 'ocr',
      });
    }
  }

  static async assertCanUseAi(userId: string): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    if (!entitlement.features.ai) {
      throw new HttpError(402, 'Finlit is not included on your current plan.', {
        code: PLAN_ERROR_CODES.FEATURE,
        feature: 'ai',
      });
    }
    if (entitlement.isPaid || !entitlement.limits) return;
    if (entitlement.usage.aiMessages >= entitlement.limits.aiMessages) {
      throw new HttpError(
        402,
        `Freemium allows ${entitlement.limits.aiMessages} Finlit messages during the trial.`,
        { code: PLAN_ERROR_CODES.LIMIT, limit: 'aiMessages' },
      );
    }
  }

  static async assertCanCreateGroup(userId: string): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    if (entitlement.isPaid || !entitlement.limits) return;
    if (entitlement.usage.groups >= entitlement.limits.groups) {
      throw new HttpError(402, `Freemium allows ${entitlement.limits.groups} groups during the trial.`, {
        code: PLAN_ERROR_CODES.LIMIT,
        limit: 'groups',
      });
    }
  }

  static async assertCanAddGroupMember(userId: string, groupId: string): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    const cap = entitlement.isPaid || !entitlement.limits
      ? PAID_GROUP_MEMBER_CAP
      : entitlement.limits.membersPerGroup;
    const memberCount = await GroupRepository.countMembers(groupId);
    if (memberCount >= cap) {
      throw new HttpError(402, `This plan allows up to ${cap} members per group.`, {
        code: PLAN_ERROR_CODES.LIMIT,
        limit: 'membersPerGroup',
      });
    }
  }

  static async assertCanCreateReminder(userId: string): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    if (entitlement.isPaid || !entitlement.limits) return;
    if (entitlement.usage.activeReminders >= entitlement.limits.activeReminders) {
      throw new HttpError(
        402,
        `Freemium allows ${entitlement.limits.activeReminders} active reminders during the trial.`,
        { code: PLAN_ERROR_CODES.LIMIT, limit: 'activeReminders' },
      );
    }
  }

  static async assertCanExportCsv(userId: string): Promise<void> {
    const entitlement = await this.getEntitlement(userId);
    if (entitlement.writesLocked) {
      await this.assertWritesAllowed(userId);
    }
    if (!entitlement.features.csvExport) {
      throw new HttpError(402, 'CSV export is included on Starter and Pro.', {
        code: PLAN_ERROR_CODES.FEATURE,
        feature: 'csvExport',
      });
    }
  }

  static async assertCanShare(userId: string): Promise<void> {
    const entitlement = await this.assertWritesAllowed(userId);
    if (!entitlement.features.receiptShare) {
      throw new HttpError(402, 'Receipt sharing is not included on your current plan.', {
        code: PLAN_ERROR_CODES.FEATURE,
        feature: 'receiptShare',
      });
    }
  }

  static async grantPlan(
    userId: string,
    plan: BillingPlan,
    billingInterval?: BillingInterval,
  ) {
    const original = await UserRepository.findById(userId);
    if (!original) {
      throw new HttpError(404, 'User not found');
    }

    if (plan === BillingPlan.FREEMIUM) {
      return UserRepository.update(userId, {
        plan: BillingPlan.FREEMIUM,
        planStatus: PlanStatus.TRIALING,
        billingInterval: BillingInterval.NONE,
        trialEndsAt: addDays(new Date(), TRIAL_DAYS),
        currentPeriodEndsAt: null,
      });
    }

    if (plan === BillingPlan.PRO) {
      return UserRepository.update(userId, {
        plan: BillingPlan.PRO,
        planStatus: PlanStatus.ACTIVE,
        billingInterval: BillingInterval.LIFETIME,
        currentPeriodEndsAt: null,
      });
    }

    const interval = billingInterval === BillingInterval.YEAR ? BillingInterval.YEAR : BillingInterval.MONTH;
    const periodDays = interval === BillingInterval.YEAR ? 365 : 30;
    return UserRepository.update(userId, {
      plan: BillingPlan.STARTER,
      planStatus: PlanStatus.ACTIVE,
      billingInterval: interval,
      currentPeriodEndsAt: addDays(new Date(), periodDays),
    });
  }

  private static async collectUsage(userId: string): Promise<PlanUsage> {
    const [personalTransactions, groups, activeReminders, ocr, aiMessages] = await Promise.all([
      TransactionRepository.countPersonalByUser(userId),
      GroupRepository.countActiveMemberships(userId),
      ReminderRepository.countActivePersonal(userId),
      AiUsageRepository.countSuccessfulByFeatures(userId, ['ocr']),
      AiUsageRepository.countSuccessfulByFeatures(userId, ['chat', 'insights']),
    ]);

    return { personalTransactions, groups, activeReminders, ocr, aiMessages };
  }
}
