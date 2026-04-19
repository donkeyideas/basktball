import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';

const SALARY_CAP = 50000;
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
type Position = typeof POSITIONS[number];

interface FantasyPlayer {
  id: string; name: string; position: string; team: string;
  salary: number; projectedPts: number; value: number;
  status: 'healthy' | 'questionable' | 'out';
}

export default function FantasyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [players, setPlayers] = useState<FantasyPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineup, setLineup] = useState<Record<Position, FantasyPlayer | null>>({
    PG: null, SG: null, SF: null, PF: null, C: null,
  });
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'value' | 'projectedPts' | 'salary'>('value');
  const [healthyOnly, setHealthyOnly] = useState(false);

  useEffect(() => {
    api.get<any>('/fantasy/players')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.players || [];
        setPlayers(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const usedSalary = Object.values(lineup).reduce((sum, p) => sum + (p?.salary || 0), 0);
  const projectedPts = Object.values(lineup).reduce((sum, p) => sum + (p?.projectedPts || 0), 0);
  const selectedIds = new Set(Object.values(lineup).filter(Boolean).map((p) => p!.id));

  const filteredPlayers = players
    .filter((p) => !selectedIds.has(p.id))
    .filter((p) => posFilter === 'ALL' || p.position === posFilter)
    .filter((p) => !healthyOnly || p.status === 'healthy')
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const addPlayer = (player: FantasyPlayer) => {
    const pos = POSITIONS.find((p) => p === player.position && !lineup[p]);
    if (!pos) return;
    if (usedSalary + player.salary > SALARY_CAP) return;
    setLineup((prev) => ({ ...prev, [pos]: player }));
  };

  const removePlayer = (pos: Position) => {
    setLineup((prev) => ({ ...prev, [pos]: null }));
  };

  const autoOptimize = () => {
    const sorted = [...players].filter((p) => p.status !== 'out').sort((a, b) => b.value - a.value);
    const newLineup: Record<Position, FantasyPlayer | null> = { PG: null, SG: null, SF: null, PF: null, C: null };
    let budget = SALARY_CAP;
    const used = new Set<string>();

    for (const pos of POSITIONS) {
      const candidate = sorted.find((p) => p.position === pos && !used.has(p.id) && p.salary <= budget);
      if (candidate) {
        newLineup[pos] = candidate;
        budget -= candidate.salary;
        used.add(candidate.id);
      }
    }
    setLineup(newLineup);
  };

  const clearLineup = () => {
    setLineup({ PG: null, SG: null, SF: null, PF: null, C: null });
  };

  const statusColor = (s: string) => s === 'healthy' ? Colors.green : s === 'questionable' ? Colors.yellow : Colors.red;

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
        <Text style={styles.headerTitle}>FANTASY OPTIMIZER</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Salary Cap Bar */}
        <View style={styles.capSection}>
          <View style={styles.capBar}>
            <View style={[styles.capFill, { width: `${Math.min((usedSalary / SALARY_CAP) * 100, 100)}%` }, usedSalary > SALARY_CAP && { backgroundColor: Colors.red }]} />
          </View>
          <View style={styles.capLabels}>
            <Text style={styles.capText}>${usedSalary.toLocaleString()} / ${SALARY_CAP.toLocaleString()}</Text>
            <View style={styles.projBox}>
              <Text style={styles.projLabel}>PROJ</Text>
              <Text style={styles.projVal}>{projectedPts.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Lineup Slots */}
        <View style={styles.lineupSection}>
          {POSITIONS.map((pos) => {
            const p = lineup[pos];
            return (
              <View key={pos} style={styles.slotRow}>
                <Text style={styles.slotPos}>{pos}</Text>
                {p ? (
                  <View style={styles.slotFilled}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotName}>{p.name}</Text>
                      <Text style={styles.slotMeta}>{p.team} · ${p.salary.toLocaleString()} · {p.projectedPts.toFixed(1)} pts</Text>
                    </View>
                    <TouchableOpacity onPress={() => removePlayer(pos)}>
                      <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.slotEmpty}>Empty</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.optimizeBtn} onPress={autoOptimize}>
            <Ionicons name="flash" size={16} color={Colors.white} />
            <Text style={styles.optimizeBtnText}>AUTO-OPTIMIZE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearLineup}>
            <Text style={styles.clearBtnText}>CLEAR</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['ALL', ...POSITIONS].map((p) => (
              <TouchableOpacity
                key={p} style={[styles.filterChip, posFilter === p && styles.filterChipActive]}
                onPress={() => setPosFilter(p)}
              >
                <Text style={[styles.filterChipText, posFilter === p && styles.filterChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Healthy only</Text>
            <Switch value={healthyOnly} onValueChange={setHealthyOnly} trackColor={{ true: Colors.orange }} thumbColor={Colors.white} />
          </View>
        </View>

        {/* Sort */}
        <View style={styles.sortRow}>
          {([['value', 'Value'], ['projectedPts', 'Proj'], ['salary', 'Salary']] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.sortChip, sortBy === key && styles.sortChipActive]} onPress={() => setSortBy(key)}>
              <Text style={[styles.sortChipText, sortBy === key && styles.sortChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Player Pool */}
        {filteredPlayers.slice(0, 30).map((p) => (
          <View key={p.id} style={styles.playerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.pName}>{p.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: statusColor(p.status) }]} />
              </View>
              <Text style={styles.pMeta}>{p.position} · {p.team} · ${p.salary.toLocaleString()}</Text>
            </View>
            <View style={styles.pStats}>
              <Text style={styles.pProj}>{p.projectedPts.toFixed(1)}</Text>
              <Text style={styles.pVal}>{p.value.toFixed(1)}x</Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, (usedSalary + p.salary > SALARY_CAP || !POSITIONS.some((pos) => pos === p.position && !lineup[pos])) && styles.addBtnDisabled]}
              onPress={() => addPlayer(p)}
              disabled={usedSalary + p.salary > SALARY_CAP || !POSITIONS.some((pos) => pos === p.position && !lineup[pos])}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
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
  capSection: { marginBottom: 16 },
  capBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  capFill: { height: '100%', backgroundColor: Colors.orange, borderRadius: 4 },
  capLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  capText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textSecondary },
  projBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  projLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.green, letterSpacing: 1 },
  projVal: { fontFamily: Fonts.monoBold, fontWeight: '700', fontSize: 14, color: Colors.green },
  lineupSection: { marginBottom: 12 },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  slotPos: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.orange, width: 28, letterSpacing: 1 },
  slotFilled: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  slotName: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  slotMeta: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  slotEmpty: { fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  optimizeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.orange, borderRadius: 8, paddingVertical: 12,
  },
  optimizeBtnText: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 13, color: Colors.white, letterSpacing: 1 },
  clearBtn: {
    paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  clearBtnText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.textSecondary, letterSpacing: 1 },
  filterSection: { marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: Colors.darkGray,
    marginRight: 6, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: Colors.orange },
  filterChipText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.textSecondary, letterSpacing: 1 },
  filterChipTextActive: { color: Colors.orange },
  healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  healthLabel: { fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textSecondary },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  sortChipActive: { borderColor: Colors.orange, backgroundColor: 'rgba(255,107,53,0.1)' },
  sortChipText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textSecondary, letterSpacing: 1 },
  sortChipTextActive: { color: Colors.orange },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pName: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: Colors.textPrimary },
  pMeta: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  pStats: { alignItems: 'flex-end', marginRight: 8 },
  pProj: { fontFamily: Fonts.monoBold, fontWeight: '700', fontSize: 14, color: Colors.textPrimary },
  pVal: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.green, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.3 },
});
