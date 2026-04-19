import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

interface Metric {
  key: string;
  name: string;
  description: string;
  formula: string;
  benchmark: string;
}

const METRICS: Metric[] = [
  { key: 'per', name: 'PER', description: 'Player Efficiency Rating — a per-minute production metric standardized so the league average is 15.0.', formula: '(FGM × 85.910 + STL × 53.897 + 3PM × 51.757 + FTM × 46.845 + BLK × 39.190 + AST × 34.677 − PF × 17.174 − (FTA − FTM) × 20.091 − (FGA − FGM) × 39.190 − TO × 53.897) × (1/MIN)', benchmark: '>25 MVP level • >20 All-Star • 15 Average • <10 Below average' },
  { key: 'ts', name: 'TS%', description: 'True Shooting Percentage — measures shooting efficiency accounting for 2s, 3s, and free throws.', formula: 'PTS / (2 × (FGA + 0.44 × FTA))', benchmark: '>60% Elite • 55-60% Good • 50-55% Average • <50% Below average' },
  { key: 'efg', name: 'eFG%', description: 'Effective Field Goal Percentage — adjusts FG% to account for the extra value of 3-pointers.', formula: '(FGM + 0.5 × 3PM) / FGA', benchmark: '>55% Elite • 50-55% Good • 45-50% Average • <45% Below average' },
  { key: 'vorp', name: 'VORP', description: 'Value Over Replacement Player — estimates how many points per 100 possessions a player contributes above a replacement-level player.', formula: '[BPM − (−2.0)] × (% of possessions played) × (team games / 82)', benchmark: '>6.0 MVP level • >3.0 All-Star • >1.0 Starter • <0 Replacement' },
  { key: 'bpm', name: 'BPM', description: 'Box Plus/Minus — a box-score estimate of the points per 100 possessions a player contributes above the league average.', formula: 'Based on box-score stats, adjusted for team performance and league averages', benchmark: '>8 MVP level • >5 All-Star • >2 Starter • 0 Average • <−2 Below average' },
  { key: 'ws', name: 'Win Shares', description: 'An estimate of the number of wins a player has contributed to their team over the course of a season.', formula: 'Offensive Win Shares + Defensive Win Shares', benchmark: '>10 All-Star season • >5 Good starter • >2 Solid contributor • <1 Minimal impact' },
  { key: 'usg', name: 'USG%', description: 'Usage Rate — the percentage of team plays used by a player while they are on the floor.', formula: '100 × ((FGA + 0.44 × FTA + TOV) × (Tm MP / 5)) / (MIN × (Tm FGA + 0.44 × Tm FTA + Tm TOV))', benchmark: '>30% High-usage star • 20-25% Average • <15% Low usage role player' },
  { key: 'ast', name: 'AST%', description: 'Assist Percentage — the percentage of teammate field goals a player assisted while on the floor.', formula: '100 × AST / (((MP / (Tm MP / 5)) × Tm FGM) − FGM)', benchmark: '>30% Elite playmaker • 20-30% Good passer • 10-20% Average • <10% Non-playmaker' },
];

export default function MetricsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [selectedKey, setSelectedKey] = useState('per');
  const selected = METRICS.find((m) => m.key === selectedKey)!;

  // Quick calculator state
  const [pts, setPts] = useState('');
  const [fga, setFga] = useState('');
  const [fta, setFta] = useState('');
  const [ftm, setFtm] = useState('');
  const [threes, setThrees] = useState('');

  const tsResult = pts && fga && fta
    ? (parseFloat(pts) / (2 * (parseFloat(fga) + 0.44 * parseFloat(fta)))).toFixed(3)
    : null;
  const efgResult = fga && threes
    ? (((parseFloat(fga) * 0.45) + 0.5 * parseFloat(threes)) / parseFloat(fga)).toFixed(3)
    : null;

  const scrollRef = useRef<ScrollView>(null);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADVANCED METRICS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Metric selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {METRICS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.tab, selectedKey === m.key && styles.tabActive]}
              onPress={() => setSelectedKey(m.key)}
            >
              <Text style={[styles.tabText, selectedKey === m.key && styles.tabTextActive]}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected metric detail */}
        <View style={styles.metricCard}>
          <Text style={styles.metricName}>{selected.name}</Text>
          <Text style={styles.metricDesc}>{selected.description}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>FORMULA</Text>
          <Text style={styles.formula}>{selected.formula}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>WHAT'S GOOD?</Text>
          <Text style={styles.benchmark}>{selected.benchmark}</Text>
        </View>

        {/* Quick Calculator */}
        <View style={styles.calcCard}>
          <Text style={styles.calcTitle}>QUICK CALCULATOR</Text>
          <Text style={styles.calcSubtitle}>Calculate TS% and eFG% with your own numbers</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PTS</Text>
              <TextInput style={styles.calcInput} value={pts} onChangeText={setPts} keyboardType="numeric" placeholderTextColor={Colors.textTertiary} placeholder="0" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FGA</Text>
              <TextInput style={styles.calcInput} value={fga} onChangeText={setFga} keyboardType="numeric" placeholderTextColor={Colors.textTertiary} placeholder="0" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FTA</Text>
              <TextInput style={styles.calcInput} value={fta} onChangeText={setFta} keyboardType="numeric" placeholderTextColor={Colors.textTertiary} placeholder="0" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            </View>
          </View>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FTM</Text>
              <TextInput style={styles.calcInput} value={ftm} onChangeText={setFtm} keyboardType="numeric" placeholderTextColor={Colors.textTertiary} placeholder="0" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>3PM</Text>
              <TextInput style={styles.calcInput} value={threes} onChangeText={setThrees} keyboardType="numeric" placeholderTextColor={Colors.textTertiary} placeholder="0" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            </View>
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>TS%</Text>
              <Text style={[styles.resultVal, tsResult && parseFloat(tsResult) > 0.55 ? styles.resultGood : null]}>
                {tsResult ? `${(parseFloat(tsResult) * 100).toFixed(1)}%` : '—'}
              </Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>eFG%</Text>
              <Text style={[styles.resultVal, efgResult && parseFloat(efgResult) > 0.50 ? styles.resultGood : null]}>
                {efgResult ? `${(parseFloat(efgResult) * 100).toFixed(1)}%` : '—'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: Fonts.anton, fontSize: 18, color: Colors.white, letterSpacing: 1.5 },
  scroll: { padding: 16, paddingBottom: 300 },
  tabs: { marginBottom: 16 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6,
    backgroundColor: Colors.darkGray, marginRight: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: Colors.orange },
  tabText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textSecondary, letterSpacing: 1 },
  tabTextActive: { color: Colors.orange },
  metricCard: {
    backgroundColor: Colors.darkGray, borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  metricName: { fontFamily: Fonts.anton, fontSize: 28, color: Colors.orange, letterSpacing: 1 },
  metricDesc: { fontFamily: Fonts.barlow, fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, letterSpacing: 2, marginBottom: 8 },
  formula: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.textPrimary, lineHeight: 18 },
  benchmark: { fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  calcCard: {
    backgroundColor: Colors.darkGray, borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
  },
  calcTitle: { fontFamily: Fonts.anton, fontSize: 16, color: Colors.orange, letterSpacing: 1 },
  calcSubtitle: { fontFamily: Fonts.barlow, fontSize: 12, color: Colors.textTertiary, marginTop: 2, marginBottom: 14 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1 },
  inputLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, letterSpacing: 1, marginBottom: 4 },
  calcInput: {
    fontFamily: Fonts.mono, fontSize: 16, color: Colors.textPrimary, textAlign: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  resultRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  resultBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  resultLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, letterSpacing: 1 },
  resultVal: { fontFamily: Fonts.anton, fontSize: 24, color: Colors.textPrimary, marginTop: 4 },
  resultGood: { color: Colors.green },
});
