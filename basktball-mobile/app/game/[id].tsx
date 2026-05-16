import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

const API_BASE = 'https://www.basktball.com';
const TABS = ['BOX SCORE', 'STATS', 'INSIGHTS'];

interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: number;
  winner?: boolean;
}

interface GameData {
  id: string;
  date: string;
  status: string;
  statusDescription: string;
  period: number;
  clock: string;
  venue?: string;
  location?: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

interface PlayerStat {
  id: string;
  name: string;
  shortName: string;
  headshot?: string;
  jersey?: string;
  position?: string;
  starter: boolean;
  dnp: boolean;
  dnpReason?: string;
  stats: Record<string, string>;
}

interface TeamPlayerStats {
  teamId: string;
  teamName: string;
  players: PlayerStat[];
}

interface GameDetail {
  game: GameData;
  teamStats: Record<string, Record<string, string>>;
  playerStats: TeamPlayerStats[];
  linescores: { home: string[]; away: string[] };
  records: { home: string; away: string };
  odds?: {
    spread: number;
    overUnder: number;
    details: string;
    provider: string;
  } | null;
  analytics: {
    winProbability: { home: number; away: number };
    momentum?: {
      score: number;
      label: string;
      factors: string[];
    } | null;
    insights: string[];
  };
}

export default function GameDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { id, league } = useLocalSearchParams<{ id: string; league?: string }>();
  const [selectedTab, setSelectedTab] = useState('BOX SCORE');
  const [data, setData] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchGameDetail();
  }, [id]);

  // Auto-refresh live and scheduled games (scheduled may transition to live)
  useEffect(() => {
    if (!data) return;
    if (data.game.status === 'final') return; // no need to refresh finished games
    const interval = setInterval(fetchGameDetail, data.game.status === 'live' ? 30000 : 60000);
    return () => clearInterval(interval);
  }, [data?.game.status]);

  async function fetchGameDetail() {
    try {
      const res = await fetch(`${API_BASE}/api/games/${id}?league=${league || 'nba'}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to fetch game detail:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GAME DETAIL</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GAME DETAIL</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Game data unavailable</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGameDetail}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { game, teamStats, playerStats, linescores, records, analytics } = data;
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  function renderBoxScoreHeader() {
    return (
      <View style={styles.boxHeader}>
        <Text style={[styles.boxHeaderCell, styles.boxPlayerCol]}>PLAYER</Text>
        <Text style={styles.boxHeaderCell}>MIN</Text>
        <Text style={styles.boxHeaderCell}>PTS</Text>
        <Text style={styles.boxHeaderCell}>REB</Text>
        <Text style={styles.boxHeaderCell}>AST</Text>
        <Text style={styles.boxHeaderCell}>FG</Text>
        <Text style={styles.boxHeaderCell}>+/-</Text>
      </View>
    );
  }

  function renderPlayerRow(player: PlayerStat, index: number) {
    if (player.dnp) {
      return (
        <View key={player.id} style={[styles.boxRow, index % 2 === 0 && styles.boxRowAlt]}>
          <Text style={[styles.boxCell, styles.boxPlayerCol, styles.boxPlayerName]}>{player.shortName}</Text>
          <Text style={[styles.boxCell, styles.dnpText]} numberOfLines={1}>
            DNP{player.dnpReason ? ` - ${player.dnpReason}` : ''}
          </Text>
        </View>
      );
    }
    return (
      <View key={player.id} style={[styles.boxRow, index % 2 === 0 && styles.boxRowAlt]}>
        <Text style={[styles.boxCell, styles.boxPlayerCol, styles.boxPlayerName]}>{player.shortName}</Text>
        <Text style={[styles.boxCell, styles.boxStatMono]}>{player.stats.MIN || '-'}</Text>
        <Text style={[styles.boxCell, styles.boxStatMono, styles.boxStatBold]}>{player.stats.PTS || '0'}</Text>
        <Text style={[styles.boxCell, styles.boxStatMono]}>{player.stats.REB || '0'}</Text>
        <Text style={[styles.boxCell, styles.boxStatMono]}>{player.stats.AST || '0'}</Text>
        <Text style={[styles.boxCell, styles.boxStatMono]}>{player.stats.FG || '-'}</Text>
        {(() => {
          const raw = player.stats['+/-'];
          const val = raw ? parseInt(raw, 10) : NaN;
          const pmColor = !isNaN(val) && val > 0 ? '#22c55e' : !isNaN(val) && val < 0 ? '#ef4444' : colors.textSecondary;
          const display = !isNaN(val) ? (val > 0 ? `+${val}` : `${val}`) : '-';
          return <Text style={[styles.boxCell, styles.boxStatMono, { color: pmColor, fontFamily: Fonts.monoBold }]}>{display}</Text>;
        })()}
      </View>
    );
  }

  function renderTeamBoxScore(teamData: TeamPlayerStats, teamInfo: TeamInfo) {
    const activePlayers = teamData.players.filter(p => !p.dnp);
    const pmValues = activePlayers
      .map(p => ({ name: p.shortName, val: parseInt(p.stats['+/-'] || '', 10) }))
      .filter(p => !isNaN(p.val));
    const bestPM = pmValues.length > 0 ? pmValues.reduce((a, b) => a.val > b.val ? a : b) : null;
    const worstPM = pmValues.length > 0 ? pmValues.reduce((a, b) => a.val < b.val ? a : b) : null;
    const showPM = bestPM && worstPM && (bestPM.val !== 0 || worstPM.val !== 0);

    return (
      <View style={styles.teamBoxSection}>
        <View style={styles.teamBoxHeader}>
          {teamInfo.logo ? (
            <Image source={{ uri: teamInfo.logo }} style={styles.teamLogo} />
          ) : (
            <View style={styles.teamDot} />
          )}
          <Text style={styles.teamBoxName}>{teamData.teamName}</Text>
        </View>
        {showPM && (
          <View style={{ flexDirection: 'row', gap: 16, paddingVertical: 6, paddingHorizontal: 4 }}>
            <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: '#22c55e' }}>
              ▲ {bestPM!.name} ({bestPM!.val > 0 ? '+' : ''}{bestPM!.val})
            </Text>
            <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: '#ef4444' }}>
              ▼ {worstPM!.name} ({worstPM!.val > 0 ? '+' : ''}{worstPM!.val})
            </Text>
          </View>
        )}
        {renderBoxScoreHeader()}
        {teamData.players.map((player, i) => renderPlayerRow(player, i))}
      </View>
    );
  }

  function renderBoxScoreTab() {
    if (playerStats.length === 0) {
      return <Text style={styles.emptyText}>Box score not available yet</Text>;
    }
    // Determine which team stats belong to away/home
    const awayStats = playerStats.find(t => t.teamId === game.awayTeam.id) || playerStats[0];
    const homeStats = playerStats.find(t => t.teamId === game.homeTeam.id) || playerStats[1];
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.boxScoreContainer}>
          {awayStats && renderTeamBoxScore(awayStats, game.awayTeam)}
          {homeStats && renderTeamBoxScore(homeStats, game.homeTeam)}
        </View>
      </ScrollView>
    );
  }

  function renderStatsTab() {
    const awayAbbr = game.awayTeam.abbreviation;
    const homeAbbr = game.homeTeam.abbreviation;
    const awayTeamStats = teamStats[awayAbbr] || {};
    const homeTeamStats = teamStats[homeAbbr] || {};

    const statRows = [
      { label: 'FG%', key: 'fieldGoalPct' },
      { label: '3PT%', key: 'threePointFieldGoalPct' },
      { label: 'FT%', key: 'freeThrowPct' },
      { label: 'Rebounds', key: 'totalRebounds' },
      { label: 'Assists', key: 'assists' },
      { label: 'Steals', key: 'steals' },
      { label: 'Blocks', key: 'blocks' },
      { label: 'Turnovers', key: 'turnovers', lower: true },
      { label: 'Fast Break Pts', key: 'fastBreakPoints' },
      { label: 'Pts in Paint', key: 'pointsInPaint' },
    ];

    const filteredStats = statRows.filter(s =>
      awayTeamStats[s.key] !== undefined || homeTeamStats[s.key] !== undefined
    );

    if (filteredStats.length === 0) {
      return <Text style={styles.emptyText}>Team stats not available yet</Text>;
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsTeamRow}>
          <Text style={styles.statsTeamLabel}>{awayAbbr}</Text>
          <Text style={styles.statsTeamLabel}>{homeAbbr}</Text>
        </View>
        {filteredStats.map((stat, i) => {
          const awayVal = awayTeamStats[stat.key] || '-';
          const homeVal = homeTeamStats[stat.key] || '-';
          const awayNum = parseFloat(awayVal);
          const homeNum = parseFloat(homeVal);
          const isAwayBetter = stat.lower ? awayNum < homeNum : awayNum > homeNum;
          const isHomeBetter = stat.lower ? homeNum < awayNum : homeNum > awayNum;
          return (
            <View key={i} style={styles.statRow}>
              <Text style={[styles.statValue, isAwayBetter && styles.statValueHighlight]}>{awayVal}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, styles.statValueRight, isHomeBetter && styles.statValueHighlight]}>{homeVal}</Text>
            </View>
          );
        })}

        {/* Win Probability */}
        {analytics.winProbability && (isLive || isFinal) && (
          <View style={styles.wpSection}>
            <Text style={styles.wpTitle}>WIN PROBABILITY</Text>
            <View style={styles.wpBar}>
              <View style={[styles.wpFill, { flex: analytics.winProbability.away }]} />
              <View style={[styles.wpFillHome, { flex: analytics.winProbability.home }]} />
            </View>
            <View style={styles.wpLabels}>
              <Text style={styles.wpLabel}>{awayAbbr} {analytics.winProbability.away}%</Text>
              <Text style={styles.wpLabel}>{homeAbbr} {analytics.winProbability.home}%</Text>
            </View>
          </View>
        )}

        {/* Momentum */}
        {analytics.momentum && isLive && (
          <View style={styles.momentumSection}>
            <Text style={styles.momentumTitle}>MOMENTUM</Text>
            <Text style={styles.momentumLabel}>{analytics.momentum.label}</Text>
            {analytics.momentum.factors.map((f, i) => (
              <Text key={i} style={styles.momentumFactor}>{f}</Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderInsightsTab() {
    if (!analytics.insights || analytics.insights.length === 0) {
      return <Text style={styles.emptyText}>Insights not available yet</Text>;
    }
    return (
      <View style={styles.insightsContainer}>
        {analytics.insights.map((insight, i) => (
          <View key={i} style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={18} color={Colors.orange} style={{ marginRight: 10, marginTop: 2 }} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GAME DETAIL</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Venue */}
        {game.venue && (
          <Text style={styles.venueText}>{game.venue}{game.location ? ` \u2022 ${game.location}` : ''}</Text>
        )}

        {/* Score Display */}
        <View style={styles.scoreBoard}>
          {/* Away Team */}
          <View style={styles.scoreTeam}>
            {game.awayTeam.logo ? (
              <Image source={{ uri: game.awayTeam.logo }} style={styles.teamCircle} />
            ) : (
              <View style={[styles.teamCircleFallback]}>
                <Text style={styles.teamCircleText}>{game.awayTeam.abbreviation}</Text>
              </View>
            )}
            <Text style={styles.scoreTeamName}>{game.awayTeam.name}</Text>
            <Text style={styles.scoreTeamRecord}>{records.away || ''}</Text>
          </View>

          {/* Score Center */}
          <View style={styles.scoreCenter}>
            <View style={styles.scoreNumbers}>
              <Text style={styles.scoreLarge}>{game.awayTeam.score}</Text>
              <Text style={styles.scoreDash}>-</Text>
              <Text style={styles.scoreLarge}>{game.homeTeam.score}</Text>
            </View>
            {isLive ? (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveStatus}>{game.statusDescription}</Text>
              </View>
            ) : (
              <Text style={styles.finalStatus}>{game.statusDescription}</Text>
            )}
          </View>

          {/* Home Team */}
          <View style={styles.scoreTeam}>
            {game.homeTeam.logo ? (
              <Image source={{ uri: game.homeTeam.logo }} style={styles.teamCircle} />
            ) : (
              <View style={[styles.teamCircleFallback]}>
                <Text style={styles.teamCircleText}>{game.homeTeam.abbreviation}</Text>
              </View>
            )}
            <Text style={styles.scoreTeamName}>{game.homeTeam.name}</Text>
            <Text style={styles.scoreTeamRecord}>{records.home || ''}</Text>
          </View>
        </View>

        {/* Quarter Scores */}
        {linescores.away.length > 0 && (
          <>
            <View style={styles.quarterRow}>
              {linescores.away.map((_, i) => (
                <View key={i} style={styles.quarterCell}>
                  <Text style={styles.quarterLabel}>{i < 4 ? `Q${i + 1}` : `OT${i - 3}`}</Text>
                </View>
              ))}
              <View style={styles.quarterCell}>
                <Text style={styles.quarterLabel}>T</Text>
              </View>
            </View>
            <View style={styles.quarterRow}>
              {linescores.away.map((q, i) => (
                <View key={i} style={styles.quarterCell}>
                  <Text style={styles.quarterScore}>{q}</Text>
                </View>
              ))}
              <View style={styles.quarterCell}>
                <Text style={[styles.quarterScore, styles.quarterTotal]}>{game.awayTeam.score}</Text>
              </View>
            </View>
            <View style={[styles.quarterRow, styles.quarterRowLast]}>
              {linescores.home.map((q, i) => (
                <View key={i} style={styles.quarterCell}>
                  <Text style={styles.quarterScore}>{q}</Text>
                </View>
              ))}
              <View style={styles.quarterCell}>
                <Text style={[styles.quarterScore, styles.quarterTotal]}>{game.homeTeam.score}</Text>
              </View>
            </View>
          </>
        )}

        {/* Tab Segments */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {selectedTab === 'BOX SCORE' && renderBoxScoreTab()}
        {selectedTab === 'STATS' && renderStatsTab()}
        {selectedTab === 'INSIGHTS' && renderInsightsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 20,
    color: colors.text,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Error
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  errorText: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
  },
  // Venue
  venueText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
  // Score Board
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  scoreTeam: {
    alignItems: 'center',
    flex: 1,
  },
  teamCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  teamCircleFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamCircleText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
    letterSpacing: 1,
  },
  scoreTeamName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scoreTeamRecord: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  scoreCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  scoreNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLarge: {
    fontFamily: Fonts.monoBold,
    fontSize: 40,
    color: colors.text,
  },
  scoreDash: {
    fontFamily: Fonts.monoBold,
    fontSize: 28,
    color: colors.textTertiary,
    marginHorizontal: 8,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    marginRight: 6,
  },
  liveStatus: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  finalStatus: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
  // Quarter Scores
  quarterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quarterRowLast: {
    borderBottomWidth: 0,
    marginBottom: 16,
  },
  quarterCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  quarterLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  quarterScore: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: colors.textSecondary,
  },
  quarterTotal: {
    fontFamily: Fonts.monoBold,
    color: colors.text,
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.orange,
  },
  tabText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  // Box Score
  boxScoreContainer: {
    paddingHorizontal: 16,
    minWidth: 550,
  },
  teamBoxSection: {
    marginBottom: 20,
  },
  teamBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange,
    marginRight: 8,
  },
  teamBoxName: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    letterSpacing: 0.5,
  },
  boxHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  boxHeaderCell: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 12,
    color: colors.textTertiary,
    width: 50,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  boxPlayerCol: {
    width: 100,
    textAlign: 'left',
  },
  boxRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  boxRowAlt: {
    backgroundColor: 'rgba(128,128,128,0.06)',
  },
  boxCell: {
    width: 50,
    textAlign: 'center',
  },
  boxPlayerName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.text,
    textAlign: 'left',
  },
  boxStatMono: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: colors.textSecondary,
  },
  boxStatBold: {
    fontFamily: Fonts.monoBold,
    color: colors.text,
  },
  dnpText: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textTertiary,
    flex: 1,
  },
  // Stats Tab
  statsContainer: {
    paddingHorizontal: 16,
  },
  statsTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  statsTeamLabel: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.orange,
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: colors.textSecondary,
    width: 50,
  },
  statValueRight: {
    textAlign: 'right',
  },
  statValueHighlight: {
    color: colors.text,
  },
  statLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    flex: 1,
  },
  // Win Probability
  wpSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wpTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  wpBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  wpFill: {
    backgroundColor: Colors.blue,
  },
  wpFillHome: {
    backgroundColor: Colors.orange,
  },
  wpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  wpLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Momentum
  momentumSection: {
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  momentumTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  momentumLabel: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  momentumFactor: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  // Insights Tab
  insightsContainer: {
    paddingHorizontal: 16,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
  },
  });
}
