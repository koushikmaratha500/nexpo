import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Share, Text, View } from 'react-native';
import { API_ROUTES, apiGet, formatCurrency, formatDate, type CategoryOption } from '@nexpo/shared';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { PillTabs } from '../../../src/components/ui/PillTabs';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';

type ReportType = 'ALL' | 'DEBIT' | 'CREDIT';

interface ExpenseItem {
  id: string;
  type?: 'DEBIT' | 'CREDIT';
  title?: string;
  merchant?: string;
  description?: string;
  category?: { name?: string };
  budgetDepositType?: { name?: string };
  transactionDate: string;
  amount: string | number;
}

interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  totalAmount: number;
}

export default function ReportsScreen() {
  const [typeFilter, setTypeFilter] = useState<ReportType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    void apiGet<{ categories: CategoryOption[] }>(API_ROUTES.metadata).then((res) =>
      setCategories(res.categories || [])
    );
  }, []);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('type', typeFilter);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const res = await apiGet<{
          expenses: ExpenseItem[];
          total: number;
          totalAmount: number;
          categoryBreakdown: CategoryBreakdownItem[];
        }>(`${API_ROUTES.reports}?${params.toString()}`);
        setExpenses(res.expenses || []);
        setReportTotal(res.total ?? 0);
        setTotalSpend(res.totalAmount || 0);
        setCategoryBreakdown(res.categoryBreakdown || []);
      } finally {
        setLoading(false);
      }
    }
    void fetchReport();
  }, [typeFilter, selectedCategory, startDate, endDate, page]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const titleVal = e.title || e.merchant || '';
      const descVal = e.description || '';
      return (
        titleVal.toLowerCase().includes(search.toLowerCase()) ||
        descVal.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [expenses, search]);

  const exportCsv = async () => {
    const header = 'Date,Type,Title,Category,Amount\n';
    const rows = filtered
      .map((e) => {
        const cat = e.category?.name || e.budgetDepositType?.name || '';
        const title = e.title || e.merchant || '';
        return `${formatDate(e.transactionDate)},${e.type || ''},"${title}",${cat},${e.amount}`;
      })
      .join('\n');
    await Share.share({ message: header + rows, title: 'nexpo-report.csv' });
  };

  const totalPages = Math.max(1, Math.ceil(reportTotal / pageSize));

  if (loading && expenses.length === 0) return <LoadingState message="Loading reports..." />;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-sm p-lg pb-36"
        ListHeaderComponent={
          <View className="mb-lg gap-md">
            <ScreenHeader title="Reports" subtitle="Filtered spend reports and export." />
            <Card>
              <Text className="text-[11px] font-bold uppercase text-on-surface-variant">Total spend</Text>
              <Text className="mt-1 font-headline-lg text-headline-lg font-black text-primary">
                {formatCurrency(totalSpend)}
              </Text>
            </Card>
            <PillTabs
              tabs={[
                { id: 'ALL' as ReportType, label: 'All' },
                { id: 'DEBIT' as ReportType, label: 'Debit' },
                { id: 'CREDIT' as ReportType, label: 'Credit' },
              ]}
              active={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            />
            <Input placeholder="Search..." value={search} onChangeText={setSearch} />
            <Input
              placeholder="Start date YYYY-MM-DD"
              value={startDate}
              onChangeText={(v) => {
                setStartDate(v);
                setPage(1);
              }}
            />
            <Input
              placeholder="End date YYYY-MM-DD"
              value={endDate}
              onChangeText={(v) => {
                setEndDate(v);
                setPage(1);
              }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
              <Button
                title="All categories"
                variant={selectedCategory === 'ALL' ? 'primary' : 'secondary'}
                onPress={() => {
                  setSelectedCategory('ALL');
                  setPage(1);
                }}
                className="mr-sm"
              />
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  title={cat.name}
                  variant={selectedCategory === cat.id ? 'primary' : 'secondary'}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className="mr-sm"
                />
              ))}
            </ScrollView>
            {categoryBreakdown.length > 0 && (
              <Card className="gap-sm">
                <Text className="font-bold text-primary">By category</Text>
                {categoryBreakdown.map((item) => (
                  <View key={item.categoryId || item.categoryName} className="flex-row justify-between">
                    <Text className="text-on-surface">{item.categoryName}</Text>
                    <Text className="font-bold text-primary">{formatCurrency(item.totalAmount)}</Text>
                  </View>
                ))}
              </Card>
            )}
            <Button title="Export CSV" variant="secondary" onPress={exportCsv} />
            <View className="flex-row items-center justify-between">
              <Button title="Prev" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} />
              <Text className="text-on-surface-variant">
                Page {page} / {totalPages}
              </Text>
              <Button
                title="Next"
                variant="secondary"
                disabled={page >= totalPages}
                onPress={() => setPage((p) => p + 1)}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="mb-sm">
            <View className="flex-row items-center justify-between">
              <Text className="mr-sm flex-1 font-bold text-on-surface">{item.title || item.merchant}</Text>
              <Badge label={item.type || 'DEBIT'} variant={item.type === 'CREDIT' ? 'credit' : 'debit'} />
            </View>
            <Text className="mt-1 text-sm text-on-surface-variant">
              {formatDate(item.transactionDate)} ·{' '}
              {item.category?.name || item.budgetDepositType?.name || '—'}
            </Text>
            <Text className="mt-1 font-black text-primary">{formatCurrency(Number(item.amount))}</Text>
          </Card>
        )}
      />
    </View>
  );
}
