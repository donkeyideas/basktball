import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';

type Player = {
  id: string;
  name: string;
  position?: string | null;
  jerseyNum?: number | null;
  headshotUrl?: string | null;
  team?: { id: string; name: string; abbreviation: string } | null;
};

type Shot = {
  id: string;
  x: number;
  y: number;
  made: boolean;
  zone: 'paint' | 'mid' | '3pt' | 'rim';
  distance: number;
  quarter: number;
};

type Zones = Record<'paint' | 'mid' | '3pt' | 'rim', { made: number; total: number; pct: number }>;

type Filter = 'all' | 'made' | 'missed' | 'clutch';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All Shots' },
  { id: 'made', label: 'Made' },
  { id: 'missed', label: 'Missed' },
  { id: 'clutch', label: 'Clutch' },
];

const ZONE_LABELS: Record<keyof Zones, string> = {
  rim: 'Restricted Area',
  paint: 'In the Paint',
  mid: 'Mid-Range',
  '3pt': '3-Point',
};
const LEAGUE_AVG: Record<keyof Zones, number> = { rim: 64, paint: 42, mid: 41, '3pt': 36 };

export default function ShotChartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ playerId?: string; playerName?: string }>();

  const [player, setPlayer] = useState<Player | null>(
    params.playerId
      ? {
          id: params.playerId,
          name: params.playerName || 'Player',
        }
      : null,
  );
  const [shots, setShots] = useState<Shot[]>([]);
  const [zones, setZones] = useState<Zones | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load a default player if none provided
  useEffect(() => {
    if (player) return;
    let cancelled = false;
    api
      .get<{ players?: Player[]; success?: boolean }>('/players?q=lebron')
      .then((d) => {
        if (cancelled) return;
        const first = d.players?.[0];
        if (first) setPlayer(first);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [player]);

  // Fetch shot data
  useEffect(() => {
    if (!player?.id) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<{ shots?: Shot[]; zones?: Zones; success?: boolean }>(`/shots/${player.id}`)
      .then((d) => {
        if (cancelled) return;
        setShots(d.shots || []);
        setZones(d.zones || null);
      })
      .catch(() => {
        if (!cancelled) {
          setShots([]);
          setZones(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [player?.id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return shots;
    if (filter === 'made') return shots.filter((s) => s.made);
    if (filter === 'missed') return shots.filter((s) => !s.made);
    if (filter === 'clutch') return shots.filter((s) => s.quarter === 4);
    return shots;
  }, [shots, filter]);

  const stats = useMemo(() => {
    const fga = filtered.length;
    const fgm = filtered.filter((s) => s.made).length;
    const fga3 = filtered.filter((s) => s.zone === '3pt').length;
    const fgm3 = filtered.filter((s) => s.zone === '3pt' && s.made).length;
    const fgm2 = fgm - fgm3;
    const fgPct = fga > 0 ? (fgm / fga) * 100 : 0;
    const tpPct = fga3 > 0 ? (fgm3 / fga3) * 100 : 0;
    const efg = fga > 0 ? ((fgm + 0.5 * fgm3) / fga) * 100 : 0;
    const ts = fga > 0 ? ((fgm2 * 2 + fgm3 * 3) / (2 * fga)) * 100 : 0;
    return { fga, fgm, fgPct, tpPct, efg, ts };
  }, [filtered]);

  const teamAbbr = player?.team?.abbreviation || '—';

  const onShareCard = () => {
    if (!player) return;
    router.push({
      pathname: '/share/take',
      params: {
        template: 'stat-line',
        theme: 'orange',
        tag: 'SHOT CHART',
        num: `${stats.fgPct.toFixed(0)}%`,
        unit: 'FG',
        context: `${player.name} — ${stats.fgm}/${stats.fga} from the field. 3P% ${stats.tpPct.toFixed(1)} · eFG ${stats.efg.toFixed(1)} · TS ${stats.ts.toFixed(1)}.`,
        meta: `${teamAbbr} · 2025-26`,
      },
    } as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>SHOT CHART</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Player pill */}
        <TouchableOpacity
          style={[styles.playerPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.headshot}>
            {player?.headshotUrl ? (
              <Image source={{ uri: player.headshotUrl }} style={styles.headshotImg} contentFit="cover" />
            ) : (
              <Text style={styles.headshotText}>
                {player?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '?'}
              </Text>
            )}
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
              {player?.name || 'Loading…'}
            </Text>
            <Text style={[styles.playerMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              <Text style={styles.playerMetaAccent}>{teamAbbr}</Text>
              {player?.position ? `  ·  ${player.position}` : ''}
              {`  ·  2025-26`}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  active && styles.filterPillActive,
                ]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterText, { color: colors.textSecondary }, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Court */}
        <View style={[styles.courtBox, { backgroundColor: '#0F0905', borderColor: colors.border }]}>
          {loading && (
            <View style={styles.courtLoading}>
              <ActivityIndicator color={Colors.orange} />
            </View>
          )}
          <CourtView shots={filtered} />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDotMade} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>MADE</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDotMiss} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>MISS</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.legendCount}>{filtered.length} ATTEMPTS</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Stat value={stats.fgPct.toFixed(1)} label="FG %" colors={colors} />
          <Stat value={stats.tpPct.toFixed(1)} label="3P %" colors={colors} />
          <Stat value={stats.efg.toFixed(1)} label="eFG %" colors={colors} />
          <Stat value={stats.ts.toFixed(1)} label="TS %" colors={colors} />
        </View>

        {/* Zone table */}
        {zones && (
          <View style={[styles.zoneTable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.zoneRow, styles.zoneHead]}>
              <Text style={styles.zoneHeadCell}>ZONE</Text>
              <Text style={[styles.zoneHeadCell, styles.zoneCellRight]}>FG%</Text>
              <Text style={[styles.zoneHeadCell, styles.zoneCellRight]}>VS LG</Text>
              <Text style={[styles.zoneHeadCell, styles.zoneCellRight]}>ATT</Text>
            </View>
            {(Object.keys(zones) as Array<keyof Zones>).map((z) => {
              const v = zones[z];
              const delta = v.pct - LEAGUE_AVG[z];
              return (
                <View key={z} style={[styles.zoneRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.zoneName, { color: colors.text }]}>{ZONE_LABELS[z]}</Text>
                  <Text style={[styles.zoneVal, { color: colors.text }]}>{v.pct.toFixed(1)}</Text>
                  <Text
                    style={[
                      styles.zoneDelta,
                      { color: delta >= 0 ? Colors.green : Colors.red },
                    ]}
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}
                  </Text>
                  <Text style={[styles.zoneVal, { color: colors.textSecondary }]}>{v.total}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Share */}
        <TouchableOpacity style={styles.shareBtn} onPress={onShareCard} activeOpacity={0.85}>
          <Ionicons name="share-social" size={18} color="#fff" />
          <Text style={styles.shareBtnText}>SHARE AS CARD</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      <PlayerPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(p) => {
          setPickerOpen(false);
          setPlayer(p);
        }}
        colors={colors}
      />
    </View>
  );
}

function Stat({
  value,
  label,
  colors,
}: {
  value: string;
  label: string;
  colors: { surface: string; border: string; textSecondary: string };
}) {
  return (
    <View style={[statStyles.cell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={statStyles.v}>{value}</Text>
      <Text style={[statStyles.l, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  cell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  v: { fontFamily: Fonts.mono, fontWeight: '700', fontSize: 17, color: Colors.orange },
  l: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, marginTop: 5, fontWeight: '700' },
});

/**
 * Pure-RN basketball half-court. No SVG dependency.
 * Coordinates are percentages 0-100 (matching the API shot data).
 * Basket sits near the top; half-court line at the bottom. We flip the
 * API's y (which is high near the basket) via 100 - y.
 *
 * Arcs are drawn by placing a circular View inside an `overflow: hidden`
 * window so only the visible portion shows.
 */
function CourtView({ shots }: { shots: Shot[] }) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Scale helpers
  const pct = (v: number, total: number) => (v / 100) * total;

  // Court geometry (in viewBox units, 0-100 each axis)
  // Half-court rendered as: basket at top (y=0..6), three-point arc spans top
  // portion, paint extends from baseline to y=38, FT circle at y=39.
  const arcRadius = 42; // 3-pt arc radius
  const arcCenterY = 6; // 3-pt arc center y
  const ftRadius = 12;
  const restrictedRadius = 9;

  const lineColor = 'rgba(255,255,255,0.45)';
  const lineW = 1.2;

  if (size.w === 0) {
    return (
      <View
        style={courtStyles.fill}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      />
    );
  }

  const W = size.w;
  const H = size.h;

  // Pixel positions
  const paintLeft = pct(34, W);
  const paintWidth = pct(32, W);
  const paintHeight = pct(38, H);

  // FT circle is centered ON the FT line (which sits at the bottom of the paint).
  const ftCenterPx = { x: pct(50, W), y: paintHeight };
  const ftDiameter = pct(ftRadius * 2, W);

  const restrictedCenterPx = { x: pct(50, W), y: pct(arcCenterY, H) };
  const restrictedDiameter = pct(restrictedRadius * 2, W);

  const arcCenterPx = { x: pct(50, W), y: pct(arcCenterY, H) };
  const arcDiameter = pct(arcRadius * 2, W);

  return (
    <View
      style={courtStyles.fill}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* Outline */}
      <View
        style={[
          courtStyles.absFill,
          { borderColor: lineColor, borderWidth: 1 },
        ]}
      />

      {/* Paint */}
      <View
        style={{
          position: 'absolute',
          left: paintLeft,
          top: 0,
          width: paintWidth,
          height: paintHeight,
          backgroundColor: 'rgba(255,107,53,0.04)',
          borderColor: lineColor,
          borderWidth: 1,
        }}
      />

      {/* 3pt sidelines (corner verticals) */}
      <View
        style={{
          position: 'absolute',
          left: pct(8, W),
          top: 0,
          width: 1,
          height: pct(20, H),
          backgroundColor: lineColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: pct(92, W) - 1,
          top: 0,
          width: 1,
          height: pct(20, H),
          backgroundColor: lineColor,
        }}
      />

      {/* 3pt arc — clip a full circle. Arc bottoms out at y = 6 + 42 = 48
          so the clip window must extend past 48% of court height. */}
      <ArcClip width={W} height={pct(52, H)} top={0}>
        <View
          style={{
            position: 'absolute',
            left: arcCenterPx.x - arcDiameter / 2,
            top: arcCenterPx.y - arcDiameter / 2,
            width: arcDiameter,
            height: arcDiameter,
            borderRadius: arcDiameter / 2,
            borderColor: lineColor,
            borderWidth: lineW,
          }}
        />
      </ArcClip>

      {/* Free throw line — sits flush at the bottom edge of the paint */}
      <View
        style={{
          position: 'absolute',
          left: paintLeft,
          top: paintHeight,
          width: paintWidth,
          height: 1.4,
          backgroundColor: lineColor,
        }}
      />

      {/* FT circle TOP half (the "key") — solid, inside the paint, curving toward basket */}
      <ArcClip
        width={ftDiameter}
        height={ftDiameter / 2}
        top={ftCenterPx.y - ftDiameter / 2}
        left={ftCenterPx.x - ftDiameter / 2}
      >
        <View
          style={{
            width: ftDiameter,
            height: ftDiameter,
            borderRadius: ftDiameter / 2,
            borderColor: lineColor,
            borderWidth: lineW,
          }}
        />
      </ArcClip>

      {/* FT circle BOTTOM half (the "top of the key") — dashed convention,
          approximated with reduced opacity since RN borderStyle:'dashed' is unreliable cross-platform. */}
      <ArcClip
        width={ftDiameter}
        height={ftDiameter / 2}
        top={ftCenterPx.y}
        left={ftCenterPx.x - ftDiameter / 2}
      >
        <View
          style={{
            position: 'absolute',
            top: -ftDiameter / 2,
            left: 0,
            width: ftDiameter,
            height: ftDiameter,
            borderRadius: ftDiameter / 2,
            borderColor: 'rgba(255,255,255,0.22)',
            borderWidth: lineW,
            borderStyle: 'dashed',
          }}
        />
      </ArcClip>

      {/* Restricted area arc — show BOTTOM half (curves away from basket into lane).
          Clip starts at basket level, child circle shifted up so only bottom half is in view. */}
      <ArcClip
        width={restrictedDiameter}
        height={restrictedDiameter / 2}
        top={restrictedCenterPx.y}
        left={restrictedCenterPx.x - restrictedDiameter / 2}
      >
        <View
          style={{
            position: 'absolute',
            top: -restrictedDiameter / 2,
            left: 0,
            width: restrictedDiameter,
            height: restrictedDiameter,
            borderRadius: restrictedDiameter / 2,
            borderColor: lineColor,
            borderWidth: lineW,
          }}
        />
      </ArcClip>

      {/* Backboard line */}
      <View
        style={{
          position: 'absolute',
          left: pct(44, W),
          top: pct(3, H),
          width: pct(12, W),
          height: 1,
          backgroundColor: lineColor,
        }}
      />

      {/* Rim */}
      <View
        style={{
          position: 'absolute',
          left: pct(50, W) - 4,
          top: pct(6, H) - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          borderColor: Colors.orange,
          borderWidth: 1.2,
        }}
      />

      {/* Half-court line */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: 1,
          backgroundColor: lineColor,
        }}
      />

      {/* Shots */}
      {shots.map((s) => {
        const cy = pct(100 - s.y, H);
        const cx = pct(s.x, W);
        const r = 3.5;
        return s.made ? (
          <View
            key={s.id}
            style={{
              position: 'absolute',
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              backgroundColor: Colors.orange,
              opacity: 0.85,
            }}
          />
        ) : (
          <View
            key={s.id}
            style={{
              position: 'absolute',
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              borderWidth: 1.2,
              borderColor: 'rgba(255,255,255,0.5)',
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Clips its child into a window of (width × height) at (left, top).
 * Use to show only the visible portion of a circular View.
 */
function ArcClip({
  width,
  height,
  top,
  left = 0,
  children,
}: {
  width: number;
  height: number;
  top: number;
  left?: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

const courtStyles = StyleSheet.create({
  fill: { flex: 1 },
  absFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

function PlayerPickerModal({
  visible,
  onClose,
  onPick,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (p: Player) => void;
  colors: { background: string; surface: string; border: string; text: string; textSecondary: string; textTertiary: string };
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      api
        .get<{ players?: Player[] }>(`/players?q=${encodeURIComponent(q)}`)
        .then((d) => {
          if (!cancelled) setResults(d.players || []);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose} />
      <View
        style={[
          pickerStyles.sheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={pickerStyles.grab} />
        <Text style={[pickerStyles.title, { color: colors.text }]}>CHANGE PLAYER</Text>
        <TextInput
          placeholder="Search players…"
          placeholderTextColor={colors.textTertiary}
          value={q}
          onChangeText={setQ}
          autoFocus
          style={[
            pickerStyles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
        />
        {searching && (
          <Text style={[pickerStyles.hint, { color: colors.textSecondary }]}>Searching…</Text>
        )}
        {!searching && q.trim().length >= 2 && results.length === 0 && (
          <Text style={[pickerStyles.hint, { color: colors.textSecondary }]}>No matches.</Text>
        )}
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
          {results.slice(0, 12).map((p) => (
            <TouchableOpacity key={p.id} style={pickerStyles.row} onPress={() => onPick(p)}>
              <Text style={[pickerStyles.rName, { color: colors.text }]}>{p.name}</Text>
              <Text style={[pickerStyles.rMeta, { color: colors.textSecondary }]}>
                {p.team?.abbreviation || '—'}
                {p.position && ` · ${p.position}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
  },
  grab: { width: 38, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  title: {
    fontFamily: Fonts.anton,
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.barlow,
    fontSize: 14,
  },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rName: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 14 },
  rMeta: { fontFamily: Fonts.mono, fontSize: 11 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.anton, fontSize: 18, letterSpacing: 1.5 },
  scroll: { padding: 16, paddingBottom: 0 },

  playerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  headshot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(29,66,138,0.5)',
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headshotImg: { width: '100%', height: '100%' },
  headshotText: { fontFamily: Fonts.anton, fontSize: 14, color: '#fff' },
  playerInfo: { flex: 1, minWidth: 0 },
  playerName: { fontFamily: Fonts.anton, fontSize: 17, letterSpacing: 1.5 },
  playerMeta: { fontFamily: Fonts.mono, fontSize: 10, marginTop: 3 },
  playerMetaAccent: { color: Colors.orange, fontWeight: '700' },

  filtersRow: { gap: 6, paddingBottom: 4, marginBottom: 12 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  filterPillActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  filterText: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 11, letterSpacing: 1.5 },
  filterTextActive: { color: '#fff' },

  courtBox: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    position: 'relative',
  },
  courtLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDotMade: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.orange },
  legendDotMiss: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  legendText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  legendCount: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.orange, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', gap: 6, marginBottom: 14 },

  zoneTable: { borderWidth: 1, borderRadius: 8, marginBottom: 14, overflow: 'hidden' },
  zoneHead: { backgroundColor: 'rgba(255,107,53,0.07)' },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  zoneHeadCell: {
    fontFamily: Fonts.anton,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.orange,
  },
  zoneName: { flex: 2.2, fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 13 },
  zoneVal: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
  },
  zoneDelta: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
  },
  zoneCellRight: { flex: 1, textAlign: 'right' },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shareBtnText: { color: '#fff', fontFamily: Fonts.anton, fontSize: 14, letterSpacing: 2.5 },
});
