import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { API_ROUTES, apiGet, apiPost, type GroupListResponse, type GroupSummary } from '@nexpo/shared';
import { useToast } from '../../../../src/hooks/useToast';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { ScreenHeader } from '../../../../src/components/ui/ScreenHeader';
import { LoadingState } from '../../../../src/components/ui/LoadingState';

export default function GroupsScreen() {
  const { addToast } = useToast();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await apiGet<GroupListResponse>(API_ROUTES.groups.list);
        setGroups(data.items);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to load groups', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const adminCount = groups.filter((g) => g.myRole === 'ADMIN').length;
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const created = await apiPost<{ id: string }>(API_ROUTES.groups.list, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      addToast('Group created successfully.', 'success');
      setCreateOpen(false);
      setName('');
      setDescription('');
      await loadGroups();
      if (created.id) router.push(`/(app)/groups/${created.id}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create group', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading groups..." />;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadGroups(true)} />}
        contentContainerClassName="gap-sm p-lg pb-36"
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Groups"
              subtitle="Split shared expenses with roommates, trips, and teams."
              action={<Button title="Create" onPress={() => setCreateOpen(true)} />}
            />
            {groups.length > 0 && (
              <View className="mb-lg flex-row gap-sm">
                <Card className="flex-1 p-md">
                  <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Your groups</Text>
                  <Text className="mt-1 font-headline-sm font-black text-primary">{groups.length}</Text>
                </Card>
                <Card className="flex-1 p-md">
                  <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Admin of</Text>
                  <Text className="mt-1 font-headline-sm font-black text-primary">{adminCount}</Text>
                </Card>
                <Card className="flex-1 p-md">
                  <Text className="text-[10px] font-bold uppercase text-on-surface-variant">Members</Text>
                  <Text className="mt-1 font-headline-sm font-black text-primary">{totalMembers}</Text>
                </Card>
              </View>
            )}
            {groups.length > 0 && (
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerClassName="mb-lg"
              />
            )}
          </>
        }
        ListEmptyComponent={
          <Card>
            <Text className="text-center text-on-surface-variant">
              No groups yet. Create one to start splitting expenses.
            </Text>
            <Button title="Create Group" onPress={() => setCreateOpen(true)} className="mt-md" />
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/groups/${item.id}`)}>
            <Card className="mb-sm">
              <Text className="font-headline-sm font-bold text-primary">{item.name}</Text>
              {item.description ? (
                <Text className="mt-1 text-on-surface-variant">{item.description}</Text>
              ) : null}
              <Text className="mt-2 text-xs capitalize text-on-surface-variant">
                {item.memberCount} member{item.memberCount === 1 ? '' : 's'} · {item.myRole}
              </Text>
            </Card>
          </Pressable>
        )}
      />

      <Modal visible={createOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-lg p-xl pb-36">
          <Text className="font-headline-md font-black text-primary">Create Group</Text>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Trip to Goa" />
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Shared expenses for..."
            multiline
          />
          <View className="mt-lg flex-row gap-md">
            <Button title="Cancel" variant="secondary" onPress={() => setCreateOpen(false)} className="flex-1" />
            <Button title="Create" loading={submitting} onPress={handleCreate} className="flex-1" />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
