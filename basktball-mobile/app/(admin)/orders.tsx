import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';

// -- Mock Data --

const FILTER_CHIPS = ['All', 'Pending', 'Shipped', 'Delivered'] as const;

const ORDERS = [
  {
    id: '#ORD-1247',
    customer: 'Marcus Johnson',
    date: 'Mar 5, 2026',
    amount: '$89.99',
    status: 'Shipped',
    statusColor: Colors.blue,
  },
  {
    id: '#ORD-1246',
    customer: 'Sarah Kim',
    date: 'Mar 5, 2026',
    amount: '$149.99',
    status: 'Pending',
    statusColor: Colors.yellow,
  },
  {
    id: '#ORD-1245',
    customer: 'Tyler Robinson',
    date: 'Mar 4, 2026',
    amount: '$59.99',
    status: 'Delivered',
    statusColor: Colors.green,
  },
  {
    id: '#ORD-1244',
    customer: 'DeAndre Williams',
    date: 'Mar 4, 2026',
    amount: '$224.97',
    status: 'Shipped',
    statusColor: Colors.blue,
  },
  {
    id: '#ORD-1243',
    customer: 'Jessica Torres',
    date: 'Mar 3, 2026',
    amount: '$74.99',
    status: 'Delivered',
    statusColor: Colors.green,
  },
  {
    id: '#ORD-1242',
    customer: 'Chris Anderson',
    date: 'Mar 3, 2026',
    amount: '$189.98',
    status: 'Pending',
    statusColor: Colors.yellow,
  },
  {
    id: '#ORD-1241',
    customer: 'Aisha Patel',
    date: 'Mar 2, 2026',
    amount: '$134.99',
    status: 'Delivered',
    statusColor: Colors.green,
  },
  {
    id: '#ORD-1240',
    customer: 'Brandon Lee',
    date: 'Mar 2, 2026',
    amount: '$49.99',
    status: 'Pending',
    statusColor: Colors.yellow,
  },
];

export default function OrdersScreen() {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filteredOrders =
    activeFilter === 'All'
      ? ORDERS
      : ORDERS.filter((order) => order.status === activeFilter);

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip;
          return (
            <TouchableOpacity
              key={chip}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(chip)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filteredOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderRow}
            activeOpacity={0.7}
            onPress={() => {
              // Placeholder navigation
            }}
          >
            <View style={styles.orderRowTop}>
              <Text style={styles.orderId}>{order.id}</Text>
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
            <View style={styles.orderRowBottom}>
              <View style={styles.orderDetail}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.orderDetailText}>{order.customer}</Text>
              </View>
              <View style={styles.orderDetail}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.orderDetailText}>{order.date}</Text>
              </View>
            </View>
            <View style={styles.orderRowFooter}>
              <Text style={styles.orderAmount}>{order.amount}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.textTertiary}
              />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  // Filters
  filterScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.darkGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  filterChipText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  filterChipTextActive: {
    color: Colors.white,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Order Row
  orderRow: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  orderRowBottom: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  orderDetailText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  orderAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.orange,
  },

  bottomSpacer: {
    height: 20,
  },
});
