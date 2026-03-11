import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'game', icon: 'basketball' as const, title: 'Lakers vs Celtics starting now!', time: '2m ago', read: false },
  { id: '2', type: 'reply', icon: 'chatbubble' as const, title: 'HoopsAnalyst replied to your take', time: '1h ago', read: false },
  { id: '3', type: 'fire', icon: 'flame' as const, title: 'Your take got 100 fires!', time: '3h ago', read: false },
  { id: '4', type: 'game', icon: 'basketball' as const, title: 'Thunder 110 - Nuggets 105 (FINAL)', time: '5h ago', read: true },
  { id: '5', type: 'follow', icon: 'person-add' as const, title: 'CourtVision started following you', time: '8h ago', read: true },
  { id: '6', type: 'game', icon: 'basketball' as const, title: 'Warriors vs Suns starting soon', time: '1d ago', read: true },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.notifRow, !item.read && styles.notifUnread]} activeOpacity={0.7}>
            <View style={[styles.notifIcon, !item.read && styles.notifIconUnread]}>
              <Ionicons name={item.icon} size={20} color={!item.read ? Colors.orange : Colors.textSecondary} />
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifText, !item.read && styles.notifTextUnread]}>{item.title}</Text>
              <Text style={styles.notifTime}>{item.time}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
      />
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
