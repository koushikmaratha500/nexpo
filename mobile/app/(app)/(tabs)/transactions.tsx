import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  API_ROUTES,
  apiGet,
  dateToInputFormat,
  formatCurrency,
  type Transaction,
  type TransactionType,
  type UserMetadata,
} from '@nexpo/shared';
import { useTransactionStore } from '../../../src/store/transactionStore';
import { useToast } from '../../../src/hooks/useToast';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { PillTabs } from '../../../src/components/ui/PillTabs';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { cn } from '../../../src/lib/cn';

type FilterType = 'ALL' | TransactionType;

interface FormState {
  type: TransactionType;
  title: string;
  merchant: string;
  category: string;
  amount: string;
  date: string;
  currency: string;
  paymentType: string;
  notes: string;
  isRecurring: boolean;
  recurringDay: string;
}

const defaultForm = (): FormState => ({
  type: 'DEBIT',
  title: '',
  merchant: '',
  category: '',
  amount: '',
  date: dateToInputFormat(new Date()),
  currency: 'INR',
  paymentType: 'Credit Card',
  notes: '',
  isRecurring: false,
  recurringDay: '1',
});

export default function TransactionsScreen() {
  const { openAdd: openAddParam } = useLocalSearchParams<{ openAdd?: string }>();
  const { addToast } = useToast();
  const {
    transactions,
    isLoading,
    recurringItems,
    recurringLoading,
    fetchTransactions,
    fetchRecurring,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    approveRecurring,
  } = useTransactionStore();

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<UserMetadata | null>(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<Record<string, boolean>>({});
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    void fetchTransactions();
    void fetchRecurring();
    void apiGet<UserMetadata>(API_ROUTES.metadata)
      .then(setMetadata)
      .catch(() => addToast('Failed to load form options', 'error'));
  }, [fetchTransactions, fetchRecurring, addToast]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const categories = useMemo(() => {
    if (!metadata) return [];
    return metadata.categories.filter((c) =>
      form.type === 'CREDIT' ? c.type === 'CREDIT' || !c.type : c.type === 'DEBIT' || !c.type
    );
  }, [metadata, form.type]);

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm());
    setFile(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (openAddParam === '1') {
      openAdd();
    }
  }, [openAddParam]);

  const openEdit = (txn: Transaction) => {
    setEditing(txn);
    setForm({
      type: txn.type,
      title: txn.title,
      merchant: txn.merchant || txn.title,
      category: txn.category,
      amount: String(txn.amount),
      date: dateToInputFormat(txn.date),
      currency: txn.currency,
      paymentType: txn.paymentType,
      notes: txn.notes || '',
      isRecurring: txn.isRecurring ?? false,
      recurringDay: String(txn.recurringDay ?? 1),
    });
    setFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        title: form.merchant || form.title,
        merchant: form.merchant || form.title,
        category: form.category || categories[0]?.name || 'Food',
        amount: parseFloat(form.amount),
        date: form.date,
        currency: form.currency,
        paymentType: form.paymentType,
        notes: form.notes,
        isRecurring: form.isRecurring,
        recurringDay: form.isRecurring ? parseInt(form.recurringDay, 10) : null,
      };
      if (editing) {
        await updateTransaction(editing.id, payload, file);
        addToast('Transaction updated.', 'success');
      } else {
        await addTransaction(payload, file);
        addToast('Transaction added.', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (txn: Transaction) => {
    Alert.alert('Delete transaction', `Remove "${txn.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(txn.id);
            addToast('Transaction deleted.', 'success');
          } catch (err) {
            addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
    }
  };

  const approveSelectedRecurring = async () => {
    const items = recurringItems
      .filter((item) => selectedRecurring[`${item.transactionId}:${item.dueDate}`])
      .map((item) => ({ transactionId: item.transactionId, dueDate: item.dueDate }));
    if (items.length === 0) {
      addToast('Select at least one item', 'warning');
      return;
    }
    try {
      const result = await approveRecurring(items);
      addToast(`Approved ${result.approved}, skipped ${result.skipped}`, 'success');
      setRecurringOpen(false);
      setSelectedRecurring({});
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Approval failed', 'error');
    }
  };

  if (isLoading && transactions.length === 0) {
    return <LoadingState message="Loading personal ledger..." />;
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-sm p-lg pb-36"
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Personal Transactions"
              subtitle="Your personal ledger only. Group expenses live under Groups."
              action={<Button title="Add" onPress={openAdd} />}
            />
            <PillTabs
              tabs={[
                { id: 'ALL' as FilterType, label: 'All' },
                { id: 'DEBIT' as FilterType, label: 'Debit' },
                { id: 'CREDIT' as FilterType, label: 'Credit' },
              ]}
              active={filter}
              onChange={setFilter}
              className="mb-md"
            />
            {recurringItems.length > 0 && (
              <Button
                title={`Approve recurring (${recurringItems.length})`}
                variant="secondary"
                onPress={() => setRecurringOpen(true)}
                className="mb-md"
              />
            )}
          </>
        }
        ListEmptyComponent={
          <Text className="p-xl text-center text-on-surface-variant">No transactions found.</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
            <Card className="mb-sm">
              <View className="flex-row gap-md">
                <View className="flex-1">
                  <Text className="font-bold text-on-surface">{item.title}</Text>
                  <Text className="mt-0.5 text-sm text-on-surface-variant">
                    {item.date} · {item.category}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Badge label={item.type} variant={item.type === 'DEBIT' ? 'debit' : 'credit'} />
                  <Text className="font-bold text-primary">{formatCurrency(item.amount)}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md p-xl pb-36">
          <Text className="font-headline-md font-black text-primary">
            {editing ? 'Edit transaction' : 'Add transaction'}
          </Text>

          <View className="flex-row gap-sm">
            {(['DEBIT', 'CREDIT'] as TransactionType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setForm((f) => ({ ...f, type }))}
                className={cn(
                  'flex-1 items-center rounded-xl border-2 border-outline-variant p-md',
                  form.type === type &&
                    (type === 'DEBIT'
                      ? 'border-error bg-error-container/30'
                      : 'border-secondary bg-secondary-container/30')
                )}
              >
                <Text className="text-xs text-on-surface-variant">
                  {type === 'DEBIT' ? 'Money Out' : 'Money In'}
                </Text>
                <Text className="mt-1 font-black">{type}</Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Title / Merchant"
            value={form.merchant}
            onChangeText={(v) => setForm((f) => ({ ...f, merchant: v, title: v }))}
          />
          <Input
            label="Amount"
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            keyboardType="decimal-pad"
          />
          <Input
            label="Date (YYYY-MM-DD)"
            value={form.date}
            onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
          />
          <Input
            label="Category"
            value={form.category}
            onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
            placeholder={categories[0]?.name || 'Food'}
          />
          <Input
            label="Payment type"
            value={form.paymentType}
            onChangeText={(v) => setForm((f) => ({ ...f, paymentType: v }))}
          />
          <Input
            label="Notes"
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline
          />

          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-on-surface">Recurring monthly</Text>
            <Switch
              value={form.isRecurring}
              onValueChange={(v) => setForm((f) => ({ ...f, isRecurring: v }))}
            />
          </View>
          {form.isRecurring && (
            <Input
              label="Day of month (1-31)"
              value={form.recurringDay}
              onChangeText={(v) => setForm((f) => ({ ...f, recurringDay: v }))}
              keyboardType="number-pad"
            />
          )}

          <Button
            title={file ? `Attachment: ${file.name}` : 'Attach receipt (optional)'}
            variant="secondary"
            onPress={pickFile}
          />

          <View className="mt-lg flex-row gap-md">
            <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} className="flex-1" />
            <Button title="Save" loading={submitting} onPress={handleSubmit} className="flex-1" />
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={recurringOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-md p-xl pb-36">
          <Text className="font-headline-md font-black text-primary">Approve recurring</Text>
          {recurringLoading ? (
            <LoadingState />
          ) : (
            recurringItems.map((item) => {
              const key = `${item.transactionId}:${item.dueDate}`;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedRecurring((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={cn(
                    'mb-sm rounded-lg border border-outline-variant p-md',
                    selectedRecurring[key] && 'border-primary-container bg-primary-fixed/20'
                  )}
                >
                  <Text className="font-bold text-on-surface">{item.title}</Text>
                  <Text className="mt-0.5 text-sm text-on-surface-variant">
                    Due {item.dueDate} · {formatCurrency(item.amount)}
                  </Text>
                </Pressable>
              );
            })
          )}
          <Button title="Approve selected" onPress={approveSelectedRecurring} className="mt-lg" />
          <Button title="Close" variant="secondary" onPress={() => setRecurringOpen(false)} />
        </ScrollView>
      </Modal>
    </View>
  );
}
