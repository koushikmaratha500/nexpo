import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  API_ROUTES,
  apiGet,
  formatCurrency,
  type PersonalReminder,
} from '@nexpo/shared';
import { useAuth } from '../../../src/context/AuthContext';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { Badge } from '../../../src/components/ui/Badge';
import { PageShell } from '../../../src/components/layout/PageShell';

interface DashboardPayload {
  totalSpend: number;
  todaySpend: number;
  totalDeposits: number;
  categoryBreakdown: { name: string; percentage: number }[];
  recentTransactions: Array<{
    id: string;
    type: 'DEBIT' | 'CREDIT';
    title: string;
    date: string;
    category: string;
    amount: number;
  }>;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [upcoming, setUpcoming] = useState<PersonalReminder[]>([]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void apiGet<DashboardPayload>(API_ROUTES.dashboard)
      .then(setDashboard)
      .catch(() => setDashboard(null));
    void apiGet<{ items: PersonalReminder[] }>(API_ROUTES.reminders.upcoming)
      .then((data) => setUpcoming(data.items || []))
      .catch(() => setUpcoming([]));
  }, []);

  const categoryBreakdown = dashboard?.categoryBreakdown ?? [];
  const recentTransactions = dashboard?.recentTransactions ?? [];

  return (
    <PageShell>
      <ScreenHeader
        title={`Welcome ${user?.firstName || 'User'}!`}
        subtitle="Your accounts are up to date as of today."
      />

      <View className="mb-lg flex-row gap-sm">
        <Card className="flex-1 p-md">
          <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Total expenses</Text>
          <Text className="mt-1 font-headline-sm text-headline-sm font-black text-primary">
            {formatCurrency(dashboard?.totalSpend ?? 0)}
          </Text>
        </Card>
        <Card className="flex-1 p-md">
          <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Today</Text>
          <Text className="mt-1 font-headline-sm text-headline-sm font-black text-primary">
            {formatCurrency(dashboard?.todaySpend ?? 0)}
          </Text>
        </Card>
        <Card className="flex-1 p-md">
          <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Deposits</Text>
          <Text className="mt-1 font-headline-sm text-headline-sm font-black text-secondary">
            {formatCurrency(dashboard?.totalDeposits ?? 0)}
          </Text>
        </Card>
      </View>

      {upcoming.length > 0 && (
        <Card className="mb-lg gap-md">
          <Text className="font-title-md text-title-md font-bold text-primary">Upcoming reminders</Text>
          {upcoming.slice(0, 3).map((item) => (
            <View key={item.id} className="border-t border-outline-variant/40 py-sm">
              <Text className="font-semibold text-on-surface">{item.title}</Text>
              <Text className="mt-0.5 text-sm text-on-surface-variant">
                Due {new Date(item.dueDate).toLocaleDateString()}
                {item.amount != null ? ` · ${formatCurrency(Number(item.amount))}` : ''}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <Card className="mb-lg gap-md">
        <Text className="font-title-md text-title-md font-bold text-primary">Category breakdown</Text>
        {categoryBreakdown.length === 0 ? (
          <Text className="text-on-surface-variant">No category data this month</Text>
        ) : (
          categoryBreakdown.map((cat) => (
            <View key={cat.name} className="flex-row justify-between py-xs">
              <Text className="text-on-surface-variant">{cat.name}</Text>
              <Text className="font-bold text-primary">{cat.percentage}%</Text>
            </View>
          ))
        )}
      </Card>

      <Card className="gap-md">
        <Text className="font-title-md text-title-md font-bold text-primary">Recent transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text className="text-on-surface-variant">No recent transactions</Text>
        ) : (
          recentTransactions.map((txn) => (
            <View key={txn.id} className="flex-row gap-md border-t border-outline-variant/40 py-sm">
              <View className="flex-1">
                <Text className="font-semibold text-on-surface">{txn.title}</Text>
                <Text className="text-sm text-on-surface-variant">
                  {txn.date} · {txn.category}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Badge label={txn.type} variant={txn.type === 'DEBIT' ? 'debit' : 'credit'} />
                <Text className="font-bold text-primary">{formatCurrency(txn.amount)}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </PageShell>
  );
}
