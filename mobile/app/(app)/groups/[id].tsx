import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  API_ROUTES,
  SplitService,
  apiDelete,
  apiGet,
  apiPost,
  formatGroupAmount,
  type GroupBalanceMember,
  type GroupBalancesResponse,
  type GroupDetail,
  type GroupMemberItem,
  type GroupReminderItem,
  type GroupTransactionItem,
  type SplitMode,
} from '@nexpo/shared';
import { useAuth } from '../../../src/context/AuthContext';
import { useToast } from '../../../src/hooks/useToast';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { PillTabs } from '../../../src/components/ui/PillTabs';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { cn } from '../../../src/lib/cn';

type GroupTab = 'transactions' | 'balances' | 'members' | 'reminders';

function memberLabel(member: GroupMemberItem) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ');
  return member.username ? `@${member.username}` : name || member.userId.slice(0, 8);
}

export default function GroupDetailScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [transactions, setTransactions] = useState<GroupTransactionItem[]>([]);
  const [balances, setBalances] = useState<GroupBalancesResponse | null>(null);
  const [reminders, setReminders] = useState<GroupReminderItem[]>([]);
  const [activeTab, setActiveTab] = useState<GroupTab>('transactions');
  const [loading, setLoading] = useState(true);

  const [inviteMode, setInviteMode] = useState<'username' | 'email' | 'phone'>('username');
  const [inviteValue, setInviteValue] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [splitMode, setSplitMode] = useState<SplitMode>('EQUAL_INCLUDED');
  const [participants, setParticipants] = useState<{ userId: string; included: boolean; shareAmount: string; sharePercent: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [remTitle, setRemTitle] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [remDate, setRemDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await apiGet<GroupDetail>(API_ROUTES.groups.byId(groupId));
      setGroup(data);
      setParticipants(
        data.members.map((m) => ({ userId: m.userId, included: true, shareAmount: '', sharePercent: '' }))
      );
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load group', 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId, addToast]);

  const loadTransactions = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await apiGet<{ items: GroupTransactionItem[] }>(API_ROUTES.groups.transactions(groupId));
      setTransactions(data.items || []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load transactions', 'error');
    }
  }, [groupId, addToast]);

  const loadBalances = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await apiGet<GroupBalancesResponse>(API_ROUTES.groups.balances(groupId));
      setBalances(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load balances', 'error');
    }
  }, [groupId, addToast]);

  const loadReminders = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await apiGet<{ items: GroupReminderItem[] }>(API_ROUTES.groups.reminders(groupId));
      setReminders(data.items || []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load reminders', 'error');
    }
  }, [groupId, addToast]);

  useEffect(() => {
    void loadGroup();
    void loadBalances();
  }, [loadGroup, loadBalances]);

  useEffect(() => {
    if (activeTab === 'transactions') void loadTransactions();
    if (activeTab === 'balances') void loadBalances();
    if (activeTab === 'reminders') void loadReminders();
  }, [activeTab, loadTransactions, loadBalances, loadReminders]);

  const currentMember = group?.members.find(
    (m) => (user?.email && m.email === user.email) || (user?.username && m.username === user.username)
  );
  const currentUserId = currentMember?.userId;
  const currencySymbol = balances?.currencySymbol || '₹';
  const myBalance = balances?.members.find((m) => m.userId === currentUserId);
  const owedAmount = myBalance && myBalance.balance < 0 ? Math.abs(myBalance.balance) : 0;

  const splitPreview = useMemo(() => {
    const parsed = parseFloat(expAmount);
    if (!parsed || parsed <= 0 || !group) return null;
    try {
      return SplitService.calculate(
        splitMode,
        parsed,
        participants.map((p) => ({
          userId: p.userId,
          included: p.included,
          shareAmount: p.shareAmount ? parseFloat(p.shareAmount) : undefined,
          sharePercent: p.sharePercent ? parseFloat(p.sharePercent) : undefined,
        })),
        currentUserId || group.members[0]?.userId || ''
      );
    } catch {
      return null;
    }
  }, [expAmount, splitMode, participants, currentUserId, group]);

  const handleInvite = async () => {
    if (!groupId || !inviteValue.trim()) return;
    setSubmitting(true);
    try {
      const payload =
        inviteMode === 'username'
          ? { username: inviteValue.trim() }
          : inviteMode === 'email'
            ? { email: inviteValue.trim() }
            : { phone: inviteValue.trim() };
      const res = await apiPost<{ status: string }>(API_ROUTES.groups.members(groupId), payload);
      addToast(res.status === 'joined' ? 'Member added.' : 'Invite recorded.', 'success');
      setInviteValue('');
      await loadGroup();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Invite failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if (!groupId || !expTitle.trim() || !expAmount) return;
    setSubmitting(true);
    try {
      await apiPost(API_ROUTES.groups.createTransaction(groupId), {
        type: 'DEBIT',
        title: expTitle.trim(),
        amount: parseFloat(expAmount),
        transactionDate: expDate,
        category: 'Food',
        paymentType: 'UPI',
        split: {
          mode: splitMode,
          participants: participants.map((p) => ({
            userId: p.userId,
            included: p.included,
            ...(splitMode === 'CUSTOM_AMOUNT' && p.included ? { shareAmount: parseFloat(p.shareAmount) } : {}),
            ...(splitMode === 'CUSTOM_PERCENT' && p.included ? { sharePercent: parseFloat(p.sharePercent) } : {}),
          })),
        },
      });
      addToast('Group expense added.', 'success');
      setExpTitle('');
      setExpAmount('');
      await Promise.all([loadTransactions(), loadBalances()]);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareTxn = async (txnId: string) => {
    try {
      const res = await apiPost<{ url: string }>(API_ROUTES.transactions.share(txnId), { expiresInDays: 7 });
      await Share.share({ message: `Receipt from PaysaSuchan: ${res.url}`, url: res.url });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Share failed', 'error');
    }
  };

  const handleMoveToPersonal = (txnId: string) => {
    Alert.alert(
      'Move to personal ledger',
      'This removes the group expense and creates a personal transaction.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await apiPost(API_ROUTES.transactions.convert(txnId), { target: 'personal' });
              addToast('Moved to personal ledger', 'success');
              await loadTransactions();
              await loadBalances();
            } catch (err) {
              addToast(err instanceof Error ? err.message : 'Move failed', 'error');
            }
          },
        },
      ],
    );
  };

  const handleDeleteTxn = (txnId: string) => {
    Alert.alert('Delete expense', 'Remove this group expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(API_ROUTES.groups.deleteTransaction(groupId!, txnId));
            addToast('Expense deleted.', 'success');
            await Promise.all([loadTransactions(), loadBalances()]);
          } catch (err) {
            addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  const handlePromote = async (memberId: string) => {
    try {
      await apiPost(API_ROUTES.groups.promoteMember(groupId!, memberId));
      addToast('Member promoted.', 'success');
      await loadGroup();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Promote failed', 'error');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert('Remove member', 'Remove this member from the group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(API_ROUTES.groups.removeMember(groupId!, memberId));
            addToast('Member removed.', 'success');
            await loadGroup();
          } catch (err) {
            addToast(err instanceof Error ? err.message : 'Remove failed', 'error');
          }
        },
      },
    ]);
  };

  const handleCreateReminder = async () => {
    if (!groupId || !remTitle.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(API_ROUTES.groups.reminders(groupId), {
        title: remTitle.trim(),
        amount: remAmount ? parseFloat(remAmount) : undefined,
        dueDate: remDate,
        channel: 'IN_APP',
      });
      addToast('Group reminder created.', 'success');
      setRemTitle('');
      setRemAmount('');
      await loadReminders();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create reminder', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await apiDelete(API_ROUTES.groups.reminderById(groupId!, reminderId));
      addToast('Reminder removed.', 'success');
      await loadReminders();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  if (loading || !group) return <LoadingState message="Loading group..." />;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-lg p-lg pb-36">
      <Button title="← Back to groups" variant="secondary" onPress={() => router.back()} />
      <Text className="font-headline-md font-black text-primary">{group.name}</Text>
      {group.description ? <Text className="mt-1 text-on-surface-variant">{group.description}</Text> : null}

      <Card className="gap-1">
        <Text className="text-[11px] font-bold uppercase text-on-surface-variant">You owe</Text>
        <Text className={cn('font-headline-md font-black', owedAmount > 0 ? 'text-error' : 'text-on-surface')}>
          {formatGroupAmount(owedAmount, currencySymbol)}
        </Text>
      </Card>

      <PillTabs
        tabs={[
          { id: 'transactions' as GroupTab, label: 'Transactions' },
          { id: 'balances' as GroupTab, label: 'Balances' },
          { id: 'members' as GroupTab, label: 'Members' },
          { id: 'reminders' as GroupTab, label: 'Reminders' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'transactions' && (
        <View className="gap-md">
          {transactions.length === 0 ? (
            <Text className="text-on-surface-variant">No group expenses yet.</Text>
          ) : (
            transactions.map((txn) => (
              <Card key={txn.id} className="gap-1">
                <View className="flex-row items-center justify-between gap-md">
                  <View className="flex-1">
                    <Text className="font-bold text-on-surface">{txn.title}</Text>
                    <Text className="text-sm text-on-surface-variant">
                      {new Date(txn.transactionDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="font-black text-primary">
                    {formatGroupAmount(Number(txn.amount), currencySymbol)}
                  </Text>
                </View>
                {(group.myRole === 'ADMIN' || txn.createdByUserId === currentUserId) && (
                  <View className="mt-sm flex-row flex-wrap gap-sm">
                    <Button title="Share" variant="secondary" onPress={() => handleShareTxn(txn.id)} />
                    <Button title="To personal" variant="secondary" onPress={() => handleMoveToPersonal(txn.id)} />
                    <Button title="Delete" variant="danger" onPress={() => handleDeleteTxn(txn.id)} />
                  </View>
                )}
              </Card>
            ))
          )}

          <Card className="gap-md">
            <Text className="font-title-md font-bold text-primary">Add group expense</Text>
            <Input label="Title" value={expTitle} onChangeText={setExpTitle} />
            <Input label="Amount" value={expAmount} onChangeText={setExpAmount} keyboardType="decimal-pad" />
            <Input label="Date" value={expDate} onChangeText={setExpDate} />
            <View className="flex-row flex-wrap gap-sm">
              {(['EQUAL_INCLUDED', 'CUSTOM_AMOUNT', 'CUSTOM_PERCENT'] as SplitMode[]).map((mode) => (
                <Button
                  key={mode}
                  title={mode === 'EQUAL_INCLUDED' ? 'Equal' : mode === 'CUSTOM_AMOUNT' ? 'Custom ₹' : 'Custom %'}
                  variant={splitMode === mode ? 'primary' : 'secondary'}
                  onPress={() => setSplitMode(mode)}
                />
              ))}
            </View>
            {group.members.map((member) => {
              const p = participants.find((row) => row.userId === member.userId);
              if (!p) return null;
              return (
                <View key={member.userId} className="gap-sm border-t border-outline-variant/40 py-sm">
                  <View className="flex-row items-center justify-between gap-md">
                    <Text className="text-on-surface">{memberLabel(member)}</Text>
                    <Switch
                      value={p.included}
                      onValueChange={(val) =>
                        setParticipants((prev) =>
                          prev.map((row) => (row.userId === member.userId ? { ...row, included: val } : row))
                        )
                      }
                    />
                  </View>
                  {splitMode === 'CUSTOM_AMOUNT' && p.included && (
                    <Input
                      value={p.shareAmount}
                      onChangeText={(v) =>
                        setParticipants((prev) =>
                          prev.map((row) => (row.userId === member.userId ? { ...row, shareAmount: v } : row))
                        )
                      }
                      placeholder="Amount"
                      keyboardType="decimal-pad"
                    />
                  )}
                  {splitMode === 'CUSTOM_PERCENT' && p.included && (
                    <Input
                      value={p.sharePercent}
                      onChangeText={(v) =>
                        setParticipants((prev) =>
                          prev.map((row) => (row.userId === member.userId ? { ...row, sharePercent: v } : row))
                        )
                      }
                      placeholder="Percent"
                      keyboardType="decimal-pad"
                    />
                  )}
                </View>
              );
            })}
            {splitPreview && (
              <Text className="text-sm text-on-surface-variant">
                {splitPreview
                  .filter((r) => r.included)
                  .map((r) => {
                    const m = group.members.find((mem) => mem.userId === r.userId);
                    return `${m ? memberLabel(m) : r.userId}: ${formatGroupAmount(r.computedAmount, currencySymbol)}`;
                  })
                  .join(' · ')}
              </Text>
            )}
            <Button title="Add expense" loading={submitting} onPress={handleAddExpense} />
          </Card>
        </View>
      )}

      {activeTab === 'balances' && (
        <View className="gap-md">
          {(balances?.members || []).map((member: GroupBalanceMember) => (
            <Card key={member.userId} className="gap-1">
              <Text className="font-bold text-on-surface">
                {member.firstName} {member.lastName ?? ''}
              </Text>
              <Text className="text-sm text-on-surface-variant">
                Paid {formatGroupAmount(member.netPaid, currencySymbol)} · Share{' '}
                {formatGroupAmount(member.netOwed, currencySymbol)}
              </Text>
              <Text
                className={cn(
                  'font-black',
                  member.balance > 0 ? 'text-primary' : member.balance < 0 ? 'text-error' : 'text-on-surface'
                )}
              >
                Balance {member.balance >= 0 ? '+' : '−'}
                {formatGroupAmount(Math.abs(member.balance), currencySymbol)}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'members' && (
        <View className="gap-md">
          {group.myRole === 'ADMIN' && (
            <Card className="gap-md">
              <Text className="font-title-md font-bold text-primary">Invite member</Text>
              <View className="flex-row flex-wrap gap-sm">
                {(['username', 'email', 'phone'] as const).map((mode) => (
                  <Button
                    key={mode}
                    title={mode}
                    variant={inviteMode === mode ? 'primary' : 'secondary'}
                    onPress={() => setInviteMode(mode)}
                  />
                ))}
              </View>
              <Input
                value={inviteValue}
                onChangeText={setInviteValue}
                placeholder={
                  inviteMode === 'username'
                    ? 'jane_doe'
                    : inviteMode === 'email'
                      ? 'jane@example.com'
                      : '+919876543210'
                }
              />
              <Button title="Send invite" loading={submitting} onPress={handleInvite} />
            </Card>
          )}
          {group.members.map((member) => (
            <Card key={member.memberId} className="gap-1">
              <Text className="font-bold text-on-surface">{memberLabel(member)}</Text>
              <Text className="text-sm text-on-surface-variant">
                {member.role} · {member.email || member.phone || '—'}
              </Text>
              {group.myRole === 'ADMIN' && member.role === 'MEMBER' && (
                <View className="mt-sm flex-row gap-sm">
                  <Button title="Promote" variant="secondary" onPress={() => handlePromote(member.memberId)} className="flex-1" />
                  <Button title="Remove" variant="danger" onPress={() => handleRemoveMember(member.memberId)} className="flex-1" />
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'reminders' && (
        <View className="gap-md">
          {group.myRole === 'ADMIN' && (
            <Card className="gap-md">
              <Text className="font-title-md font-bold text-primary">Create group reminder</Text>
              <Input label="Title" value={remTitle} onChangeText={setRemTitle} />
              <Input label="Amount" value={remAmount} onChangeText={setRemAmount} keyboardType="decimal-pad" />
              <Input label="Due date" value={remDate} onChangeText={setRemDate} />
              <Button title="Add reminder" loading={submitting} onPress={handleCreateReminder} />
            </Card>
          )}
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="gap-1">
              <Text className="font-bold text-on-surface">{reminder.title}</Text>
              <Text className="text-sm text-on-surface-variant">
                Due {new Date(reminder.dueDate).toLocaleDateString()}
              </Text>
              {group.myRole === 'ADMIN' && (
                <Button title="Delete" variant="danger" onPress={() => handleDeleteReminder(reminder.id)} className="mt-sm" />
              )}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
