import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';

interface Team { id: string; name: string; abbreviation: string; logoUrl?: string; }
interface PredictionFactor { name: string; description: string; impact: number; }
interface Prediction {
  homeWinProb: number; awayWinProb: number;
  predictedHomeScore: number; predictedAwayScore: number;
  spread: number; total: number; confidence: number;
  factors?: PredictionFactor[];
}

const LEAGUES = [
  { key: 'nba', label: 'NBA' },
  { key: 'wnba', label: 'WNBA' },
  { key: 'ncaam', label: 'NCAAM' },
  { key: 'ncaaw', label: 'NCAAW' },
];

export default function PredictorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [league, setLeague] = useState('nba');
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [showHomePicker, setShowHomePicker] = useState(false);
  const [showAwayPicker, setShowAwayPicker] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    setTeamsLoading(true);
    setHomeTeam(null);
    setAwayTeam(null);
    setPrediction(null);
    api.get<any>(`/teams?league=${league}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.teams || [];
        setTeams(list);
      })
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, [league]);

  const predict = async () => {
    if (!homeTeam || !awayTeam) return;
    setLoading(true);
    setPrediction(null);
    try {
      const data = await api.post<any>('/predictions', {
        homeTeamId: homeTeam.id, awayTeamId: awayTeam.id,
      });
      // API returns { success, prediction: { ... }, homeTeam, awayTeam }
      const pred = data.prediction || data;
      setPrediction(pred);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getLogoUri = (team: Team) =>
    team.logoUrl || `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation?.toLowerCase()}.png`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>GAME PREDICTOR</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* League Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leagueRow}>
          {LEAGUES.map((l) => (
            <TouchableOpacity
              key={l.key}
              style={[styles.leagueChip, { backgroundColor: colors.surface, borderColor: colors.border }, league === l.key && styles.leagueChipActive]}
              onPress={() => setLeague(l.key)}
            >
              <Text style={[styles.leagueText, { color: colors.textSecondary }, league === l.key && styles.leagueTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {teamsLoading ? (
          <ActivityIndicator size="large" color={Colors.orange} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Team Selectors */}
            <View style={styles.matchup}>
              <TouchableOpacity style={[styles.teamBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => { setShowAwayPicker(!showAwayPicker); setShowHomePicker(false); }}>
                {awayTeam ? (
                  <>
                    <Image source={{ uri: getLogoUri(awayTeam) }} style={styles.logo} />
                    <Text style={[styles.teamName, { color: colors.text }]}>{awayTeam.abbreviation}</Text>
                    <Text style={[styles.teamRole, { color: colors.textTertiary }]}>AWAY</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="basketball-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.teamPlaceholder, { color: colors.textTertiary }]}>Select Away</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.atText, { color: colors.textTertiary }]}>@</Text>

              <TouchableOpacity style={[styles.teamBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => { setShowHomePicker(!showHomePicker); setShowAwayPicker(false); }}>
                {homeTeam ? (
                  <>
                    <Image source={{ uri: getLogoUri(homeTeam) }} style={styles.logo} />
                    <Text style={[styles.teamName, { color: colors.text }]}>{homeTeam.abbreviation}</Text>
                    <Text style={[styles.teamRole, { color: colors.textTertiary }]}>HOME</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="basketball-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.teamPlaceholder, { color: colors.textTertiary }]}>Select Home</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Pickers */}
            {(showHomePicker || showAwayPicker) && (
              <ScrollView style={[styles.pickerList, { backgroundColor: colors.surface, borderColor: colors.border }]} nestedScrollEnabled>
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      if (showHomePicker) { setHomeTeam(t); setShowHomePicker(false); }
                      else { setAwayTeam(t); setShowAwayPicker(false); }
                      setPrediction(null);
                    }}
                  >
                    <Image source={{ uri: getLogoUri(t) }} style={styles.pickerLogo} />
                    <Text style={[styles.pickerName, { color: colors.text }]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Predict Button */}
            {homeTeam && awayTeam && !showHomePicker && !showAwayPicker && (
              <TouchableOpacity style={styles.predictBtn} onPress={predict} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.predictBtnText}>GENERATE PREDICTION</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Results */}
            {prediction && (
              <View style={styles.results}>
                {/* Win Probability */}
                <Text style={styles.resultSectionTitle}>WIN PROBABILITY</Text>
                <View style={styles.probBar}>
                  <View style={[styles.probFillAway, { flex: prediction.awayWinProb ?? 50 }]} />
                  <View style={[styles.probFillHome, { flex: prediction.homeWinProb ?? 50 }]} />
                </View>
                <View style={styles.probLabels}>
                  <Text style={[styles.probPct, { color: colors.text }]}>{Math.round(prediction.awayWinProb ?? 0)}%</Text>
                  <Text style={[styles.probPct, { color: colors.text }]}>{Math.round(prediction.homeWinProb ?? 0)}%</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statCardLabel, { color: colors.textTertiary }]}>PREDICTED SCORE</Text>
                    <Text style={[styles.statCardVal, { color: colors.text }]}>
                      {prediction.predictedAwayScore ?? 0} - {prediction.predictedHomeScore ?? 0}
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statCardLabel, { color: colors.textTertiary }]}>SPREAD</Text>
                    <Text style={[styles.statCardVal, { color: colors.text }]}>
                      {(prediction.spread ?? 0) > 0 ? '+' : ''}{(prediction.spread ?? 0).toFixed(1)}
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statCardLabel, { color: colors.textTertiary }]}>TOTAL</Text>
                    <Text style={[styles.statCardVal, { color: colors.text }]}>{(prediction.total ?? 0).toFixed(1)}</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statCardLabel, { color: colors.textTertiary }]}>CONFIDENCE</Text>
                    <Text style={[
                      styles.statCardVal,
                      (prediction.confidence ?? 0) > 70 ? { color: Colors.green } :
                      (prediction.confidence ?? 0) > 50 ? { color: Colors.yellow } : { color: Colors.red }
                    ]}>
                      {Math.round(prediction.confidence ?? 0)}%
                    </Text>
                  </View>
                </View>

                {/* Factors */}
                {prediction.factors && prediction.factors.length > 0 && (
                  <>
                    <Text style={styles.resultSectionTitle}>KEY FACTORS</Text>
                    {prediction.factors.map((f, i) => (
                      <View key={i} style={[styles.factorRow, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.factorName, { color: colors.text }]}>{f.name}</Text>
                          <Text style={[styles.factorDesc, { color: colors.textTertiary }]}>{f.description}</Text>
                        </View>
                        <Text style={[styles.factorImpact, (f.impact ?? 0) > 0 ? { color: Colors.green } : { color: Colors.red }]}>
                          {(f.impact ?? 0) > 0 ? '+' : ''}{(f.impact ?? 0).toFixed(1)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>For entertainment purposes only. Not betting advice.</Text>
              </View>
            )}
          </>
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
  leagueRow: { marginBottom: 16 },
  leagueChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6,
    backgroundColor: Colors.darkGray, marginRight: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  leagueChipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: Colors.orange },
  leagueText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textSecondary, letterSpacing: 1 },
  leagueTextActive: { color: Colors.orange },
  matchup: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  teamBox: {
    flex: 1, backgroundColor: Colors.darkGray, borderRadius: 10, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, minHeight: 100,
  },
  logo: { width: 48, height: 48, marginBottom: 8 },
  teamName: { fontFamily: Fonts.anton, fontSize: 20, color: Colors.white, letterSpacing: 1 },
  teamRole: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 2, marginTop: 2 },
  teamPlaceholder: { fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textTertiary, marginTop: 8 },
  atText: { fontFamily: Fonts.anton, fontSize: 20, color: Colors.textTertiary },
  pickerList: {
    backgroundColor: Colors.darkGray, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    maxHeight: 300, marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerLogo: { width: 28, height: 28 },
  pickerName: { fontFamily: Fonts.barlow, fontSize: 14, color: Colors.textPrimary },
  predictBtn: {
    backgroundColor: Colors.orange, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginBottom: 20,
  },
  predictBtnText: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 14, color: Colors.white, letterSpacing: 1 },
  results: {},
  resultSectionTitle: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.orange, letterSpacing: 2, marginBottom: 10, marginTop: 8 },
  probBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  probFillAway: { backgroundColor: Colors.blue },
  probFillHome: { backgroundColor: Colors.orange },
  probLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 },
  probPct: { fontFamily: Fonts.mono, fontSize: 18, color: Colors.textPrimary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '48%', backgroundColor: Colors.darkGray, borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  statCardLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1 },
  statCardVal: { fontFamily: Fonts.anton, fontSize: 22, color: Colors.white, marginTop: 4 },
  factorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  factorName: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: Colors.textPrimary },
  factorDesc: { fontFamily: Fonts.barlow, fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  factorImpact: { fontFamily: Fonts.mono, fontSize: 14 },
  disclaimer: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, textAlign: 'center',
    marginTop: 20, letterSpacing: 0.5,
  },
});
