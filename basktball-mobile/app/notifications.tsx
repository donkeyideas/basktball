import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { api } from '@/lib/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  data: Record<string, string> | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const NOTIF_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FIRE: 'flame',
  BRICK: 'cube',
  REPLY: 'chatbubble',
  REPOST: 'repeat',
  FOLLOW: 'person-add',
  CHALLENGE: 'flag',
  CHALLENGE_ACCEPT: 'checkmark-circle',
  CHALLENGE_VOTE: 'thumbs-up',
  CHALLENGE_RESULT: 'trophy',
  PREDICTION_RESOLVED: 'receipt',
  AGING_RESURFACED: 'time',
  STAT_CHECK: 'search',
  MENTION: 'at',
  POLL_ENDED: 'bar-chart',
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await api.get<{ notifications: Notification[] }>('/mobile/notifications?limit=50');
    },
    staleTime: 30000,
  });

  const notifications: Notification[] = data?.notifications || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleNotifPress = async (notif: Notification) => {
    // Mark as read
    if (!notif.read) {
      api.patch('/mobile/notifications', { notificationId: notif.id } as unknown).catch(() => {});
      queryClient.setQueryData(['notifications'], (old: { notifications: Notification[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) =>
            n.id === notif.id ? { ...n, read: true } : n
          ),
        };
      });
    }

    // Navigate based on type
    if (notif.data?.takeId) {
      router.push(`/take/${notif.data.takeId}` as never);
    }
  };

  const handleMarkAllRead = async () => {
    await api.patch('/mobile/notifications', { markAllRead: true } as unknown);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const iconName = NOTIF_ICONS[item.type] || 'notifications';

    return (
      <TouchableOpacity
        style={[styles.notifRow, !item.read && styles.notifUnread]}
        activeOpacity={0.7}
        onPress={() => handleNotifPress(item)}
      >
        <View style={[styles.notifIcon, !item.read && styles.notifIconUnread]}>
          <Ionicons name={iconName} size={20} color={!item.read ? Colors.orange : Colors.textSecondary} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifText, !item.read && styles.notifTextUnread]}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.notifBody} numberOfLines={1}>{item.body}</Text>
          ) : null}
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={{ padding: 8 }}>
          <Ionicons name="checkmark-done" size={22} color={Colors.orange} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Colors.orange} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="notifications-off" size={40} color={Colors.textTertiary} />
              <Text style={{ fontFamily: Fonts.barlow, fontSize: 14, color: Colors.textTertiary, marginTop: 12 }}>
                No notifications yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkGray,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold, fontSize: 20,
    color: Colors.white, letterSpacing: 2,
  },
  list: { paddingHorizontal: 16 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  notifUnread: { backgroundColor: 'rgba(255,107,53,0.05)' },
  notifIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkGray,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  notifIconUnread: { backgroundColor: 'rgba(255,107,53,0.15)' },
  notifContent: { flex: 1 },
  notifText: {
    fontFamily: Fonts.barlow, fontSize: 14,
    color: Colors.textSecondary, lineHeight: 20,
  },
  notifTextUnread: {
    fontFamily: Fonts.barlowSemiBold, color: Colors.white,
  },
  notifBody: {
    fontFamily: Fonts.barlow, fontSize: 12,
    color: Colors.textTertiary, marginTop: 2,
  },
  notifTime: {
    fontFamily: Fonts.mono, fontSize: 11,
    color: Colors.textTertiary, marginTop: 2,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.orange, marginLeft: 8,
  },
  separator: { height: 1, backgroundColor: Colors.border },
});
