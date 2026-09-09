'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackBilling } from '@/lib/analytics/track';
import type { PlanEntitlement } from '@/lib/billing/types';
import { PLAN_ERROR_CODES } from '@/lib/billing/types';
import { PLAN_PRICES_INR, TRIAL_DAYS } from '@/lib/billing/catalog';
import { useAuth } from '@/components/auth/AuthContext';

export interface PlanCatalog {
  trialDays: number;
  pricesInr: typeof PLAN_PRICES_INR;
  checkoutAvailable: boolean;
  activeCheckoutProvider?: 'razorpay' | 'stripe';
  configuredProviders?: string[];
  razorpayKeyId?: string | null;
}

export interface PlanPayload extends PlanEntitlement {
  catalog: PlanCatalog;
}

interface PlanContextValue {
  plan: PlanPayload | null;
  loading: boolean;
  refresh: () => Promise<void>;
  upgradeOpen: boolean;
  setUpgradeOpen: (open: boolean) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const prevUpgradeOpen = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await axios.get<PlanPayload>('/api/user/plan');
      setPlan(response.data);
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
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 402) {
          const payload = error.response.data as {
            code?: string;
            plan?: string;
            writesLocked?: boolean;
          };
          const code = payload?.code;
          const isPlanError =
            payload?.writesLocked ||
            code === PLAN_ERROR_CODES.WRITE_LOCKED ||
            code === PLAN_ERROR_CODES.LIMIT ||
            code === PLAN_ERROR_CODES.FEATURE;

          if (isPlanError) {
            setUpgradeOpen(true);
            const search =
              typeof window !== 'undefined' ? window.location.search : searchParams.toString() ? `?${searchParams.toString()}` : '';
            trackBilling(
              typeof window !== 'undefined' ? window.location.pathname : pathname,
              search,
              {
                action:
                  code === PLAN_ERROR_CODES.WRITE_LOCKED ? 'write_locked' : 'plan_limit_hit',
                plan: payload?.plan,
                errorCode: code,
              },
              user?.role,
            );
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [pathname, searchParams, user?.role]);

  useEffect(() => {
    if (upgradeOpen && !prevUpgradeOpen.current) {
      trackBilling(
        pathname,
        searchParams.toString() ? `?${searchParams.toString()}` : '',
        { action: 'upgrade_view', plan: plan?.plan },
        user?.role,
      );
    }
    prevUpgradeOpen.current = upgradeOpen;
  }, [upgradeOpen, pathname, searchParams, plan?.plan, user?.role]);

  const value = useMemo(
    () => ({ plan, loading, refresh, upgradeOpen, setUpgradeOpen }),
    [plan, loading, refresh, upgradeOpen],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
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

export function useRequiredPlan() {
  return useContext(PlanContext);
}

export const DEFAULT_CATALOG: PlanCatalog = {
  trialDays: TRIAL_DAYS,
  pricesInr: PLAN_PRICES_INR,
  checkoutAvailable: false,
};
