import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  API_ROUTES,
  apiGet,
  formatCurrency,
  parseDate,
  type PersonalReminder,
} from '@nexpo/shared';
import { useAuth } from '../../../src/context/AuthContext';
import { useTransactionStore } from '../../../src/store/transactionStore';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { Badge } from '../../../src/components/ui/Badge';
import { PageShell } from '../../../src/components/layout/PageShell';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { transactions, fetchTransactions } = useTransactionStore();
  const hasFetched = useRef(false);
  const [upcoming, setUpcoming] = useState<PersonalReminder[]>([]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchTransactions();
    void apiGet<{ items: PersonalReminder[] }>(API_ROUTES.reminders.upcoming)
      .then((data) => setUpcoming(data.items || []))
      .catch(() => setUpcoming([]));
  }, [fetchTransactions]);

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = parseDate(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [transactions]);

  const expenses = useMemo(() => monthTransactions.filter((t) => t.type === 'DEBIT'), [monthTransactions]);
  const credits = useMemo(() => monthTransactions.filter((t) => t.type === 'CREDIT'), [monthTransactions]);

  const totalSpend = expenses.reduce((sum, item) => sum + item.amount, 0);
  const todaySpend = expenses
    .filter((e) => parseDate(e.date).toDateString() === new Date().toDateString())
    .reduce((sum, item) => sum + item.amount, 0);
  const totalDeposits = credits.reduce((sum, c) => sum + c.amount, 0);

  const categoryBreakdown = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const groups: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      groups[cat] = (groups[cat] || 0) + e.amount;
    });
    return Object.entries(groups)
      .map(([name, amount]) => ({
        name,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [expenses]);

  const recentTransactions = [...monthTransactions]
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
    .slice(0, 3);

  return (
    <PageShell>
      <ScreenHeader
        title={`Welcome ${user?.firstName || 'User'}!`}
        subtitle="Your accounts are up to date as of today."
      />

      <View className="mb-lg flex-row gap-sm">
        <Card className="flex-1 p-md">
          <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Month spend</Text>
          <Text className="mt-1 font-headline-sm text-headline-sm font-black text-primary">
            {formatCurrency(totalSpend)}
          </Text>
        </Card>
        <Card className="flex-1 p-md">
          <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Today</Text>
          <Text className="mt-1 font-headline-sm text-headline-sm font-black text-primary">
            {formatCurrency(todaySpend)}
          </Text>
        </Card>
        <Card className="flex-1 p-md">
          <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Deposits</Text>
          <Text className="mt-1 font-headline-sm text-headline-sm font-black text-secondary">
            {formatCurrency(totalDeposits)}
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
          <Text className="text-on-surface-variant">No transactions this month</Text>
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
