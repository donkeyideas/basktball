import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// -- Mock Data --

const STAT_CARDS = [
  {
    label: 'Revenue',
    value: '$12,847',
    change: '+18.2%',
    positive: true,
    icon: 'trending-up' as IoniconsName,
  },
  {
    label: 'Orders',
    value: '156',
    change: '+12.5%',
    positive: true,
    icon: 'cube-outline' as IoniconsName,
  },
  {
    label: 'Active Users',
    value: '2,341',
    change: '+8.4%',
    positive: true,
    icon: 'people-outline' as IoniconsName,
  },
  {
    label: 'Conversion',
    value: '3.2%',
    change: '-0.4%',
    positive: false,
    icon: 'analytics-outline' as IoniconsName,
  },
];

const RECENT_ORDERS = [
  {
    id: '#ORD-1247',
    customer: 'Marcus Johnson',
    amount: '$89.99',
    status: 'Shipped',
    statusColor: Colors.blue,
  },
  {
    id: '#ORD-1246',
    customer: 'Sarah Kim',
    amount: '$149.99',
    status: 'Pending',
    statusColor: Colors.yellow,
  },
  {
    id: '#ORD-1245',
    customer: 'Tyler Robinson',
    amount: '$59.99',
    status: 'Delivered',
    statusColor: Colors.green,
  },
];

const QUICK_ACTIONS = [
  { label: 'Add Product', icon: 'add-circle-outline' as IoniconsName },
  { label: 'View Reports', icon: 'bar-chart-outline' as IoniconsName },
  { label: 'Manage Users', icon: 'people-outline' as IoniconsName },
  { label: 'Moderation', icon: 'shield-checkmark-outline' as IoniconsName },
];

export default function AdminDashboard() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Stat Cards 2x2 Grid */}
      <View style={styles.statGrid}>
        {STAT_CARDS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Ionicons name={stat.icon} size={18} color={Colors.textSecondary} />
              <Text style={styles.statCardLabel}>{stat.label}</Text>
            </View>
            <Text style={styles.statCardValue}>{stat.value}</Text>
            <Text
              style={[
                styles.statCardChange,
                stat.positive ? styles.positive : styles.negative,
              ]}
            >
              {stat.change}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ORDERS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {RECENT_ORDERS.map((order) => (
          <View key={order.id} style={styles.orderRow}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderId}>{order.id}</Text>
              <Text style={styles.orderCustomer}>{order.customer}</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>{order.amount}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${order.statusColor}20` },
                ]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: order.statusColor }]}
                >
                  {order.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickActionCard}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIconContainer}>
                <Ionicons name={action.icon} size={24} color={Colors.orange} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Stat Cards
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statCardLabel: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statCardValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 26,
    color: Colors.white,
    marginBottom: 4,
  },
  statCardChange: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  positive: {
    color: Colors.green,
  },
  negative: {
    color: Colors.red,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  seeAll: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 13,
    color: Colors.orange,
    marginBottom: 12,
  },

  // Orders
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.white,
  },
  orderCustomer: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.orange,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47.5%',
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 14,
    color: Colors.white,
  },

  bottomSpacer: {
    height: 20,
  },
});
