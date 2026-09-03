import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import {
  API_ROUTES,
  apiGet,
  apiPatch,
  apiPost,
  type NotificationItem,
  type NotificationListResponse,
} from '@nexpo/shared';
import { useToast } from '../../src/hooks/useToast';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { cn } from '../../src/lib/cn';

export default function NotificationsScreen() {
  const { addToast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await apiGet<NotificationListResponse>(`${API_ROUTES.notifications.list}?pageSize=50`);
        setItems(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        addToast('Failed to load notifications', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    await apiPatch(API_ROUTES.notifications.read(id));
    await load(true);
  };

  const markAllRead = async () => {
    await apiPost(API_ROUTES.notifications.readAll);
    await load(true);
  };

  if (loading) return <LoadingState message="Loading notifications..." />;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between p-lg">
        <Text className="text-on-surface-variant">{unreadCount} unread</Text>
        {unreadCount > 0 && <Button title="Mark all read" variant="secondary" onPress={markAllRead} />}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        contentContainerClassName="gap-sm px-lg pb-36"
        ListEmptyComponent={
          <Text className="p-2xl text-center text-on-surface-variant">Your inbox is empty.</Text>
        }
        renderItem={({ item }) => (
          <Card
            className={cn(
              'mb-sm',
              item.readAt ? 'opacity-75' : 'border-primary-container'
            )}
          >
            <Text className="font-title-md font-bold text-primary">{item.title}</Text>
            <Text className="mt-1 font-body-md leading-5 text-on-surface-variant">{item.body}</Text>
            <Text className="mt-2 text-xs text-on-surface-variant">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            {!item.readAt && (
              <Button title="Mark read" variant="secondary" onPress={() => markRead(item.id)} className="mt-sm" />
            )}
          </Card>
        )}
      />
    </View>
  );
}
