import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ROUTES, apiGet, setPlanLimitHandler } from '@nexpo/shared';

export interface MobilePlanCatalog {
  trialDays: number;
  pricesInr: {
    starterMonthly: number;
    starterYearly: number;
    proLifetime: number;
  };
  checkoutAvailable: boolean;
  activeCheckoutProvider?: 'razorpay' | 'stripe';
}

export interface MobilePlanPayload {
  plan: 'FREEMIUM' | 'STARTER' | 'PRO';
  status: string;
  billingInterval: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  trialDaysLeft: number;
  writesLocked: boolean;
  isPaid: boolean;
  limits: {
    personalTransactions: number;
    ocr: number;
    groups: number;
    membersPerGroup: number;
    activeReminders: number;
    aiMessages: number;
  } | null;
  usage: {
    personalTransactions: number;
    ocr: number;
    groups: number;
    activeReminders: number;
    aiMessages: number;
  };
  catalog: MobilePlanCatalog;
}

interface PlanContextValue {
  plan: MobilePlanPayload | null;
  loading: boolean;
  refresh: () => Promise<void>;
  upgradeOpen: boolean;
  setUpgradeOpen: (open: boolean) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<MobilePlanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<MobilePlanPayload>(API_ROUTES.plan);
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPlanLimitHandler(() => setUpgradeOpen(true));
    return () => setPlanLimitHandler(null);
  }, []);

  const value = useMemo(
    () => ({ plan, loading, refresh, upgradeOpen, setUpgradeOpen }),
    [plan, loading, refresh, upgradeOpen],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function useMobilePlanContext(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    return {
      plan: null,
      loading: false,
      refresh: async () => undefined,
      upgradeOpen: false,
      setUpgradeOpen: () => undefined,
    };
  }
  return ctx;
}
