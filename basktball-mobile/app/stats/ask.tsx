import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';

const EXAMPLES = [
  'LeBron games with 30+ points',
  'Jokic with 10+ assists',
  'Curry games with 7+ threes',
  'Wemby with 5+ blocks',
];

const METRIC_LABEL: Record<string, string> = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
  steals: 'Steals',
  blocks: 'Blocks',
  threes: '3-Pointers',
  turnovers: 'Turnovers',
};
const COMPARATOR_LABEL: Record<string, string> = { gte: '≥', lte: '≤', eq: '=' };

type ParsedQuery = {
  playerName: string | null;
  metric: string | null;
  comparator: string | null;
  value: number | null;
  opponentTeam: string | null;
  opponentFilter: string | null;
  opponentRank: number | null;
  season: string | null;
  isHome: boolean | null;
  isClutch: boolean | null;
};

type ResultRow = {
  date: string;
  gameId: string;
  home: { abbreviation: string };
  away: { abbreviation: string };
  homeScore: number | null;
  awayScore: number | null;
  stats: { pts: number; reb: number; ast: number; stl: number; blk: number; tpm: number };
  player: { id: string; name: string };
};

type AskResponse = {
  parsed: ParsedQuery;
  resolvedPlayer: { id: string; name: string } | null;
  results: ResultRow[];
  count: number;
  limitations: string[];
  error?: string;
};

export default function AskLabScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [data, setData] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRun = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text);
    setSubmitted(text);
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const d = await api.post<AskResponse>('/lab/ask', { query: text });
      if (d.error) setError(d.error);
      setData(d);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      const low = msg.toLowerCase();
      // The api client throws "Request failed" / "Network request failed" / "HTTP 404"
      // for both 404 (route not deployed) and network failures. In either case the
      // remedy is the same: deploy the routes or point at a dev server.
      if (
        low.includes('request failed') ||
        low.includes('network') ||
        low.includes('404') ||
        low.includes('not found') ||
        low.includes('http 5')
      ) {
        setError(
          "The /api/lab/ask endpoint is not reachable. The new route is in your local Next.js code but has not been deployed to www.basktball.com yet. Either push the web changes to production, or set EXPO_PUBLIC_API_BASE in basktball-mobile/.env to point at your dev server.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        {/* Spacer — FloatingMenu's hamburger button overlays this position */}
        <View style={styles.headerBtn} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>ASK THE LAB</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.heroBlock}>
          <Text style={styles.kicker}>STAT LAB · AI POWERED</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>ASK ANYTHING</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            Type a plain-English basketball question. The Lab parses it, queries the database, and returns matching games.
          </Text>
        </View>

        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            placeholder="e.g. LeBron games with 30+ points"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { color: colors.text }]}
            multiline
            onSubmitEditing={() => onRun()}
            blurOnSubmit
          />
        </View>

        <TouchableOpacity
          style={[styles.runBtn, (!query.trim() || loading) && styles.runBtnDisabled]}
          onPress={() => onRun()}
          disabled={!query.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.runBtnText}>RUN QUERY</Text>
            </>
          )}
        </TouchableOpacity>

        {!data && !loading && (
          <View style={styles.examplesBlock}>
            <Text style={[styles.examplesLabel, { color: colors.textSecondary }]}>TRY ONE OF THESE</Text>
            {EXAMPLES.map((ex) => (
              <TouchableOpacity
                key={ex}
                style={[styles.exampleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => onRun(ex)}
              >
                <Text style={[styles.exampleText, { color: colors.text }]}>{ex}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {data?.parsed && (
          <View style={[styles.parsedCard, { borderColor: 'rgba(255,107,53,0.3)' }]}>
            <View style={styles.parsedHead}>
              <View style={styles.parsedDot} />
              <Text style={styles.parsedHeadText}>I FOUND</Text>
            </View>
            <ParsedLine label="Player" value={data.resolvedPlayer?.name || data.parsed.playerName || '—'} type="player" colors={colors} />
            {data.parsed.metric && data.parsed.comparator && data.parsed.value != null && (
              <ParsedLine
                label="Condition"
                value={`${METRIC_LABEL[data.parsed.metric] || data.parsed.metric} ${COMPARATOR_LABEL[data.parsed.comparator] || data.parsed.comparator} ${data.parsed.value}`}
                type="stat"
                colors={colors}
              />
            )}
            {data.parsed.opponentTeam && (
              <ParsedLine label="Opponent" value={data.parsed.opponentTeam} type="filter" colors={colors} />
            )}
            {data.parsed.isClutch && (
              <ParsedLine label="Filter" value="Clutch / 4th quarter" type="filter" colors={colors} />
            )}
            {!data.parsed.metric && !data.parsed.playerName && (
              <Text style={styles.parseWarn}>Could not parse this query — try mentioning a player and a stat.</Text>
            )}
          </View>
        )}

        {data?.limitations && data.limitations.length > 0 && (
          <View style={styles.limitsBox}>
            <Text style={styles.limitsHead}>HEADS UP</Text>
            {data.limitations.map((l, i) => (
              <Text key={i} style={styles.limitText}>
                {l}
              </Text>
            ))}
          </View>
        )}

        {data && (
          <View style={styles.resBlock}>
            <View style={[styles.resHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.resTitle, { color: colors.text }]}>RESULTS</Text>
              <Text style={styles.resCount}>
                {data.count} GAME{data.count === 1 ? '' : 'S'}
              </Text>
            </View>
            {data.count === 0 && !loading && (
              <Text style={[styles.resEmpty, { color: colors.textSecondary }]}>
                No games matched. Try a wider threshold or a different player.
              </Text>
            )}
            {data.results.map((r) => {
              const d = new Date(r.date);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
              return (
                <View key={r.gameId} style={[styles.resRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.resDate, { color: colors.textSecondary }]}>{dateStr}</Text>
                  <Text style={[styles.resMatch, { color: colors.text }]}>
                    {r.away.abbreviation} @ {r.home.abbreviation}
                  </Text>
                  <Text style={styles.resStats}>
                    <Text style={styles.resStatsHi}>{r.stats.pts}</Text>P ·{' '}
                    <Text style={styles.resStatsHi}>{r.stats.reb}</Text>R ·{' '}
                    <Text style={styles.resStatsHi}>{r.stats.ast}</Text>A
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function ParsedLine({
  label,
  value,
  type,
  colors,
}: {
  label: string;
  value: string;
  type: 'player' | 'stat' | 'filter';
  colors: { textSecondary: string };
}) {
  const color = type === 'player' ? Colors.green : type === 'stat' ? Colors.blue : Colors.orange;
  return (
    <View style={parsedStyles.row}>
      <Text style={[parsedStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[parsedStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const parsedStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 4, gap: 10 },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    width: 84,
    fontWeight: '700',
  },
  value: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 14, flex: 1 },
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

  heroBlock: { marginBottom: 16 },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.orange,
    fontWeight: '700',
  },
  heroTitle: {
    fontFamily: Fonts.anton,
    fontSize: 28,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  heroDesc: { fontFamily: Fonts.barlow, fontSize: 13, lineHeight: 19 },

  inputBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  input: {
    fontFamily: Fonts.barlow,
    fontSize: 15,
    minHeight: 48,
    textAlignVertical: 'top',
    padding: 0,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: '#fff', fontFamily: Fonts.anton, fontSize: 14, letterSpacing: 2.5 },

  examplesBlock: { marginTop: 4 },
  examplesLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  exampleText: { fontFamily: Fonts.barlow, fontSize: 14, flex: 1 },

  parsedCard: {
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  parsedHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  parsedDot: { width: 8, height: 8, backgroundColor: Colors.orange, borderRadius: 4 },
  parsedHeadText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.orange,
    fontWeight: '800',
  },
  parseWarn: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderLeftWidth: 2,
    borderLeftColor: Colors.yellow,
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.yellow,
  },

  limitsBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  limitsHead: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.yellow,
    fontWeight: '800',
    marginBottom: 6,
  },
  limitText: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
    paddingVertical: 3,
  },

  resBlock: { marginTop: 4 },
  resHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  resTitle: { fontFamily: Fonts.anton, fontSize: 16, letterSpacing: 2 },
  resCount: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.orange, fontWeight: '700' },
  resEmpty: {
    paddingVertical: 18,
    textAlign: 'center',
    fontFamily: Fonts.barlow,
    fontSize: 14,
  },
  resRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  resDate: { fontFamily: Fonts.mono, fontSize: 11, width: 60 },
  resMatch: { fontFamily: Fonts.anton, fontSize: 15, letterSpacing: 1, width: 100 },
  resStats: { fontFamily: Fonts.mono, fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 },
  resStatsHi: { color: Colors.orange, fontWeight: '700' },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: Colors.red,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: { color: Colors.red, fontFamily: Fonts.barlow, fontSize: 13 },
});
