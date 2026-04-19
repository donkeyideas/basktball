import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';

interface Prospect {
  rank: number; name: string; position: string; school: string;
  height: string; weight: string; age: number;
  ppg: number; rpg: number; apg: number;
  fgPct: number; threePct: number; ftPct: number;
  strengths: string[]; weaknesses: string[];
  comparison: string; projectedPick: number;
  espnId?: string;
}

const POSITIONS = ['ALL', 'PG', 'SG', 'SF', 'PF', 'C'];

export default function DraftScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');

  useEffect(() => {
    api.get<any>('/draft/prospects?year=2026')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.prospects || [];
        setProspects(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = prospects
    .filter((p) => posFilter === 'ALL' || p.position === posFilter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DRAFT ANALYZER</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.boardTitle}>2026 BIG BOARD</Text>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search prospects..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />

        {/* Position Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {POSITIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterChip, posFilter === p && styles.filterChipActive]}
              onPress={() => setPosFilter(p)}
            >
              <Text style={[styles.filterText, posFilter === p && styles.filterTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Prospect List */}
        {filtered.map((p) => (
          <TouchableOpacity
            key={p.rank}
            style={[styles.prospectRow, selected?.rank === p.rank && styles.prospectRowActive]}
            onPress={() => setSelected(p)}
          >
            <View style={[styles.rankBadge, p.rank <= 3 && styles.rankBadgeTop]}>
              <Text style={[styles.rankText, p.rank <= 3 && styles.rankTextTop]}>{p.rank}</Text>
            </View>
            <View style={[styles.prospectHeadshot, styles.initialsCircle]}>
              <Text style={styles.initials}>{p.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prospectName}>{p.name}</Text>
              <Text style={styles.prospectMeta}>{p.position} · {p.school}</Text>
            </View>
            <Text style={styles.projPick}>#{p.projectedPick}</Text>
          </TouchableOpacity>
        ))}

        {/* Selected Prospect Detail */}
        {selected && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailHeadshot, styles.initialsCircle]}>
                <Text style={[styles.initials, { fontSize: 28 }]}>{selected.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.rankBadge, selected.rank <= 3 && styles.rankBadgeTop, { alignSelf: 'flex-start', marginBottom: 4 }]}>
                  <Text style={[styles.rankText, selected.rank <= 3 && styles.rankTextTop]}>#{selected.rank}</Text>
                </View>
                <Text style={styles.detailName}>{selected.name}</Text>
                <Text style={styles.detailSchool}>{selected.position} · {selected.school}</Text>
              </View>
            </View>

            {/* Physical */}
            <View style={styles.physGrid}>
              {[
                { label: 'HEIGHT', value: selected.height },
                { label: 'WEIGHT', value: `${selected.weight} lbs` },
                { label: 'AGE', value: `${selected.age}` },
                { label: 'PROJECTED', value: `#${selected.projectedPick}` },
              ].map((item) => (
                <View key={item.label} style={styles.physBox}>
                  <Text style={styles.physLabel}>{item.label}</Text>
                  <Text style={styles.physValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <Text style={styles.sectionLabel}>2025-26 SEASON STATS</Text>
            <View style={styles.statsGrid}>
              {[
                { label: 'PPG', value: (selected.ppg ?? 0).toFixed(1) },
                { label: 'RPG', value: (selected.rpg ?? 0).toFixed(1) },
                { label: 'APG', value: (selected.apg ?? 0).toFixed(1) },
                { label: 'FG%', value: `${((selected.fgPct ?? 0) * 100).toFixed(1)}` },
                { label: '3P%', value: `${((selected.threePct ?? 0) * 100).toFixed(1)}` },
                { label: 'FT%', value: `${((selected.ftPct ?? 0) * 100).toFixed(1)}` },
              ].map((s) => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* Scouting Report */}
            <Text style={styles.sectionLabel}>SCOUTING REPORT</Text>
            <View style={styles.scoutGrid}>
              <View style={styles.scoutCol}>
                <Text style={styles.scoutHeading}>Strengths</Text>
                {selected.strengths?.map((s, i) => (
                  <View key={i} style={styles.scoutRow}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                    <Text style={styles.scoutText}>{s}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.scoutCol}>
                <Text style={styles.scoutHeading}>Improve</Text>
                {selected.weaknesses?.map((w, i) => (
                  <View key={i} style={styles.scoutRow}>
                    <Ionicons name="close-circle" size={14} color={Colors.red} />
                    <Text style={styles.scoutText}>{w}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Comparison */}
            {selected.comparison && (
              <View style={styles.compBox}>
                <Text style={styles.compLabel}>NBA COMPARISON</Text>
                <Text style={styles.compValue}>{selected.comparison}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  scroll: { padding: 16, paddingBottom: 60 },
  boardTitle: { fontFamily: Fonts.anton, fontSize: 22, color: Colors.orange, letterSpacing: 1, marginBottom: 12 },
  searchInput: {
    fontFamily: Fonts.barlow, fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.darkGray, marginBottom: 10,
  },
  filterRow: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
    backgroundColor: Colors.darkGray, marginRight: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: Colors.orange },
  filterText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.textSecondary, letterSpacing: 1 },
  filterTextActive: { color: Colors.orange },
  prospectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  prospectRowActive: { backgroundColor: 'rgba(255,107,53,0.06)', borderRadius: 8, paddingHorizontal: 8 },
  rankBadge: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.darkGray,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  rankBadgeTop: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  rankText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textSecondary },
  rankTextTop: { color: Colors.white },
  prospectHeadshot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.darkGray },
  initialsCircle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  initials: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 16, color: Colors.white },
  prospectName: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  prospectMeta: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
  projPick: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.green },
  detailCard: {
    backgroundColor: Colors.darkGray, borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginTop: 20,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  detailHeadshot: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.darkerGray },
  detailName: { fontFamily: Fonts.anton, fontSize: 22, color: Colors.white, letterSpacing: 0.5 },
  detailSchool: { fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  physGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  physBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  physLabel: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textTertiary, letterSpacing: 1 },
  physValue: { fontFamily: Fonts.monoBold, fontWeight: '700', fontSize: 14, color: Colors.textPrimary, marginTop: 2 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.orange, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox: {
    width: '30%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1 },
  statValue: { fontFamily: Fonts.monoBold, fontWeight: '700', fontSize: 18, color: Colors.textPrimary, marginTop: 2 },
  scoutGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  scoutCol: { flex: 1 },
  scoutHeading: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  scoutRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  scoutText: { fontFamily: Fonts.barlow, fontSize: 12, color: Colors.textPrimary, lineHeight: 16, flex: 1 },
  compBox: {
    backgroundColor: 'rgba(255,107,53,0.06)', borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)', alignItems: 'center',
  },
  compLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1 },
  compValue: { fontFamily: Fonts.anton, fontSize: 18, color: Colors.orange, marginTop: 4, letterSpacing: 0.5 },
});
