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

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// -- Mock Data --

const SEGMENTS = ['Revenue', 'Expenses', 'Profit'] as const;

const CHART_DATA = {
  Revenue: [
    { label: 'Jan', value: 0.65 },
    { label: 'Feb', value: 0.78 },
    { label: 'Mar', value: 0.55 },
    { label: 'Apr', value: 0.88 },
    { label: 'May', value: 1.0 },
    { label: 'Jun', value: 0.72 },
  ],
  Expenses: [
    { label: 'Jan', value: 0.45 },
    { label: 'Feb', value: 0.52 },
    { label: 'Mar', value: 0.40 },
    { label: 'Apr', value: 0.68 },
    { label: 'May', value: 0.60 },
    { label: 'Jun', value: 0.55 },
  ],
  Profit: [
    { label: 'Jan', value: 0.30 },
    { label: 'Feb', value: 0.42 },
    { label: 'Mar', value: 0.25 },
    { label: 'Apr', value: 0.55 },
    { label: 'May', value: 0.70 },
    { label: 'Jun', value: 0.38 },
  ],
};

const CHART_COLORS = {
  Revenue: Colors.orange,
  Expenses: Colors.red,
  Profit: Colors.green,
};

const SUMMARY_CARDS = [
  {
    label: 'Total Revenue',
    value: '$48,294',
    icon: 'trending-up-outline' as IoniconsName,
    color: Colors.orange,
  },
  {
    label: 'Total Expenses',
    value: '$31,847',
    icon: 'trending-down-outline' as IoniconsName,
    color: Colors.red,
  },
  {
    label: 'Net Profit',
    value: '$16,447',
    icon: 'wallet-outline' as IoniconsName,
    color: Colors.green,
  },
  {
    label: 'Avg Order Value',
    value: '$82.37',
    icon: 'cart-outline' as IoniconsName,
    color: Colors.blue,
  },
];

const RECENT_TRANSACTIONS = [
  {
    id: 'TXN-4501',
    description: 'Jersey order - Marcus J.',
    amount: '+$89.99',
    type: 'income' as const,
    date: 'Mar 5',
  },
  {
    id: 'TXN-4500',
    description: 'Supplier payment - NikeWholesale',
    amount: '-$1,240.00',
    type: 'expense' as const,
    date: 'Mar 5',
  },
  {
    id: 'TXN-4499',
    description: 'Shoe order - Sarah K.',
    amount: '+$149.99',
    type: 'income' as const,
    date: 'Mar 4',
  },
  {
    id: 'TXN-4498',
    description: 'Shipping costs - UPS batch',
    amount: '-$345.60',
    type: 'expense' as const,
    date: 'Mar 4',
  },
  {
    id: 'TXN-4497',
    description: 'Accessories bundle - Tyler R.',
    amount: '+$59.99',
    type: 'income' as const,
    date: 'Mar 3',
  },
];

export default function FinanceScreen() {
  const [activeSegment, setActiveSegment] =
    useState<(typeof SEGMENTS)[number]>('Revenue');

  const chartBars = CHART_DATA[activeSegment];
  const barColor = CHART_COLORS[activeSegment];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Segment Control */}
      <View style={styles.segmentControl}>
        {SEGMENTS.map((seg) => {
          const isActive = activeSegment === seg;
          return (
            <TouchableOpacity
              key={seg}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              onPress={() => setActiveSegment(seg)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {seg}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {activeSegment.toUpperCase()} - 6 MONTH TREND
        </Text>
        <View style={styles.chartContainer}>
          {chartBars.map((bar) => (
            <View key={bar.label} style={styles.chartBarColumn}>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${bar.value * 100}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartBarLabel}>{bar.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        {SUMMARY_CARDS.map((card) => (
          <View key={card.label} style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIconContainer,
                { backgroundColor: `${card.color}18` },
              ]}
            >
              <Ionicons name={card.icon} size={20} color={card.color} />
            </View>
            <Text style={styles.summaryLabel}>{card.label}</Text>
            <Text style={styles.summaryValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
        {RECENT_TRANSACTIONS.map((txn) => (
          <View key={txn.id} style={styles.transactionRow}>
            <View
              style={[
                styles.transactionIcon,
                txn.type === 'income'
                  ? styles.transactionIconIncome
                  : styles.transactionIconExpense,
              ]}
            >
              <Ionicons
                name={
                  txn.type === 'income'
                    ? 'arrow-down-outline'
                    : 'arrow-up-outline'
                }
                size={16}
                color={txn.type === 'income' ? Colors.green : Colors.red}
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDesc} numberOfLines={1}>
                {txn.description}
              </Text>
              <Text style={styles.transactionDate}>{txn.date}</Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                txn.type === 'income'
                  ? styles.transactionIncome
                  : styles.transactionExpense,
              ]}
            >
              {txn.amount}
            </Text>
          </View>
        ))}
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

  // Segment Control
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: Colors.orange,
  },
  segmentText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  segmentTextActive: {
    color: Colors.white,
  },

  // Chart
  chartCard: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  chartTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginTop: 16,
  },
  chartBarColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarTrack: {
    width: 28,
    height: 110,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
  },
  chartBarLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 6,
  },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: '47.5%',
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 20,
    color: Colors.white,
  },

  // Transactions
  transactionsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconIncome: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  transactionIconExpense: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionDesc: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 14,
    color: Colors.white,
    marginBottom: 2,
  },
  transactionDate: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  transactionAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
  },
  transactionIncome: {
    color: Colors.green,
  },
  transactionExpense: {
    color: Colors.red,
  },

  bottomSpacer: {
    height: 20,
  },
});
