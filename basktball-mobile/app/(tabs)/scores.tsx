import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

const API_BASE = 'https://www.basktball.com';
const SEGMENTS = ['SCORES', 'STANDINGS', 'SCHEDULE'];

type League = 'nba' | 'wnba' | 'ncaam' | 'ncaaw';
const LEAGUES: { id: League; label: string }[] = [
  { id: 'nba', label: 'NBA' },
  { id: 'wnba', label: 'WNBA' },
  { id: 'ncaam', label: 'NCAA M' },
  { id: 'ncaaw', label: 'NCAA W' },
];

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDates(): Array<{ label: string; day: string; date: string; isToday: boolean }> {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const today = new Date();
  const result = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      label: days[d.getDay()],
      day: d.getDate().toString(),
      date: toLocalDateStr(d),
      isToday: i === 0,
    });
  }
  return result;
}

const WEEK_DATES = getWeekDates();

// Normalize API game to display format
interface GameDisplay {
  id: string;
  away: string;
  home: string;
  awayLogo: string;
  homeLogo: string;
  awayScore: number;
  homeScore: number;
  status: string;
  isLive: boolean;
  gameDate: string;
  broadcast?: string;
}

interface StandingTeam {
  abbreviation: string;
  name: string;
  logoUrl: string;
  wins: number;
  losses: number;
  winPct: string;
  gamesBehind: string;
  streak: string;
  seed: number;
}

function formatGameStatus(game: any): { status: string; isLive: boolean } {
  if (game.status === 'live') {
    const raw = game.quarter?.toString() || '';
    const q = raw.startsWith('Q') ? raw : raw ? `Q${raw}` : '';
    const c = game.clock || '';
    return { status: `${q} ${c}`.trim(), isLive: true };
  }
  if (game.status === 'final') {
    return { status: 'FINAL', isLive: false };
  }
  // Upcoming - format the time
  const d = new Date(game.gameDate);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = mins.toString().padStart(2, '0');
  return { status: `${h}:${m} ${ampm}`, isLive: false };
}

export default function ScoresScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [selectedSegment, setSelectedSegment] = useState('SCORES');
  const [selectedDate, setSelectedDate] = useState(WEEK_DATES.find(d => d.isToday)?.date || '');
  const [selectedConference, setSelectedConference] = useState<'EAST' | 'WEST'>('EAST');
  const [selectedLeague, setSelectedLeague] = useState<League>('nba');

  // Live data state
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState<GameDisplay[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [eastStandings, setEastStandings] = useState<StandingTeam[]>([]);
  const [westStandings, setWestStandings] = useState<StandingTeam[]>([]);
  const [allConferences, setAllConferences] = useState<{ name: string; teams: StandingTeam[] }[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);

  const fetchGames = useCallback(async (date: string, league: League = 'nba') => {
    setGamesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/games?date=${date}&league=${league}`);
      const data = await res.json();
      if (data.success && data.games) {
        const mapped: GameDisplay[] = data.games.map((g: any) => {
          const { status, isLive } = formatGameStatus(g);
          return {
            id: g.id,
            away: g.awayTeam?.abbreviation || '???',
            home: g.homeTeam?.abbreviation || '???',
            awayLogo: g.awayTeam?.logoUrl || '',
            homeLogo: g.homeTeam?.logoUrl || '',
            awayScore: g.awayScore || 0,
            homeScore: g.homeScore || 0,
            status,
            isLive,
            gameDate: g.gameDate,
            broadcast: g.broadcast || undefined,
          };
        });
        setGames(mapped);
      } else {
        setGames([]);
      }
    } catch (err) {
      console.warn('Failed to fetch games:', err);
      setGames([]);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  function mapTeams(teams: any[]): StandingTeam[] {
    return teams.map((t: any, i: number) => ({
      abbreviation: t.abbreviation,
      name: t.name?.split(' ').pop() || t.name,
      logoUrl: t.logoUrl || '',
      wins: t.wins,
      losses: t.losses,
      winPct: t.winPct || `.${Math.round((t.wins / (t.wins + t.losses)) * 1000)}`,
      gamesBehind: t.gamesBehind || '-',
      streak: t.streak || '-',
      seed: t.seed || i + 1,
    }));
  }

  const fetchStandings = useCallback(async (league: League = 'nba') => {
    setStandingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/standings?league=${league}`);
      const data = await res.json();
      if (data.success && data.conferences) {
        const isProLeague = league === 'nba' || league === 'wnba';
        if (isProLeague) {
          const east = data.conferences.find((c: any) => c.name?.toLowerCase().includes('east'));
          const west = data.conferences.find((c: any) => c.name?.toLowerCase().includes('west'));
          setEastStandings(east?.teams ? mapTeams(east.teams) : []);
          setWestStandings(west?.teams ? mapTeams(west.teams) : []);
          setAllConferences([]);
        } else {
          setAllConferences(
            data.conferences
              .filter((c: any) => c.teams?.length > 0)
              .map((c: any) => ({ name: c.name, teams: mapTeams(c.teams) }))
          );
          setEastStandings([]);
          setWestStandings([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch standings:', err);
    } finally {
      setStandingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(selectedDate, selectedLeague);
  }, [selectedDate, selectedLeague, fetchGames]);

  useEffect(() => {
    fetchStandings(selectedLeague);
  }, [selectedLeague, fetchStandings]);

  // Auto-refresh live games every 30s
  useEffect(() => {
    if (selectedSegment !== 'SCORES') return;
    const hasLive = games.some(g => g.isLive);
    if (!hasLive) return;
    const interval = setInterval(() => fetchGames(selectedDate, selectedLeague), 30000);
    return () => clearInterval(interval);
  }, [selectedSegment, games, selectedDate, selectedLeague, fetchGames]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchGames(selectedDate, selectedLeague),
        fetchStandings(selectedLeague),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate, selectedLeague, fetchGames, fetchStandings]);

  function renderGameRow({ item }: { item: GameDisplay }) {
    const isUpcoming = item.awayScore === 0 && item.homeScore === 0 && !item.isLive;
    return (
      <TouchableOpacity
        style={styles.gameRow}
        activeOpacity={0.7}
        onPress={() => router.push(`/game/${item.id}?league=${selectedLeague}`)}
      >
        <View style={styles.gameRowLeft}>
          <View style={styles.teamRow}>
            <View style={styles.teamInfo}>
              {item.awayLogo ? (
                <Image source={{ uri: item.awayLogo }} style={styles.teamLogo} contentFit="contain" />
              ) : null}
              <Text style={styles.teamAbbr}>{item.away}</Text>
            </View>
            {!isUpcoming && (
              <Text style={[styles.score, item.awayScore > item.homeScore && styles.scoreWinning]}>
                {item.awayScore}
              </Text>
            )}
          </View>
          <View style={styles.teamRow}>
            <View style={styles.teamInfo}>
              {item.homeLogo ? (
                <Image source={{ uri: item.homeLogo }} style={styles.teamLogo} contentFit="contain" />
              ) : null}
              <Text style={styles.teamAbbr}>{item.home}</Text>
            </View>
            {!isUpcoming && (
              <Text style={[styles.score, item.homeScore > item.awayScore && styles.scoreWinning]}>
                {item.homeScore}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.gameRowRight}>
          {item.isLive ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDotSmall} />
              <Text style={styles.liveText}>{item.status}</Text>
            </View>
          ) : (
            <Text style={[styles.statusText, item.status === 'FINAL' && styles.finalText]}>
              {item.status}
            </Text>
          )}
          {item.broadcast ? (
            <Text style={styles.broadcastText} numberOfLines={1}>{item.broadcast}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  function renderStandingsTable(standings: StandingTeam[], showPlayoffIndicators: boolean) {
    return (
      <>
        <View style={styles.standingsHeader}>
          <Text style={[styles.standingsHeaderText, { flex: 1 }]}>TEAM</Text>
          <Text style={[styles.standingsHeaderText, styles.statCol]}>W</Text>
          <Text style={[styles.standingsHeaderText, styles.statCol]}>L</Text>
          <Text style={[styles.standingsHeaderText, styles.statCol]}>PCT</Text>
          <Text style={[styles.standingsHeaderText, styles.statCol]}>GB</Text>
          <Text style={[styles.standingsHeaderText, styles.streakCol]}>STRK</Text>
        </View>
        {standings.map((team, index) => (
          <View
            key={team.abbreviation}
            style={[
              styles.standingsRow,
              showPlayoffIndicators && index < 6 && styles.playoffTeam,
              showPlayoffIndicators && index === 5 && styles.playoffCutoff,
              showPlayoffIndicators && index >= 6 && index < 10 && styles.playInTeam,
              showPlayoffIndicators && index === 9 && styles.playInCutoff,
            ]}
          >
            <View style={styles.standingsTeam}>
              <Text style={styles.rankText}>{team.seed}</Text>
              {team.logoUrl ? (
                <Image source={{ uri: team.logoUrl }} style={styles.standingsLogo} contentFit="contain" />
              ) : null}
              <Text style={styles.standingsTeamAbbr}>{team.abbreviation}</Text>
              <Text style={styles.standingsTeamName} numberOfLines={1}>{team.name}</Text>
            </View>
            <Text style={[styles.statText, styles.statCol]}>{team.wins}</Text>
            <Text style={[styles.statText, styles.statCol]}>{team.losses}</Text>
            <Text style={[styles.statText, styles.statCol]}>{team.winPct}</Text>
            <Text style={[styles.statText, styles.statCol]}>{team.gamesBehind}</Text>
            <Text style={[
              styles.statText,
              styles.streakCol,
              team.streak.startsWith('W') ? styles.streakWin : styles.streakLoss,
            ]}>
              {team.streak}
            </Text>
          </View>
        ))}
      </>
    );
  }

  function renderStandings() {
    if (standingsLoading) {
      return <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />;
    }

    const isProLeague = selectedLeague === 'nba' || selectedLeague === 'wnba';

    if (isProLeague) {
      const standings = selectedConference === 'EAST' ? eastStandings : westStandings;
      if (standings.length === 0) {
        return <Text style={styles.emptyText}>Standings not available</Text>;
      }
      return (
        <ScrollView
          style={styles.standingsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
          }
        >
          <View style={styles.confRow}>
            <TouchableOpacity
              style={[styles.confTab, selectedConference === 'EAST' && styles.confTabActive]}
              onPress={() => setSelectedConference('EAST')}
            >
              <Text style={[styles.confTabText, selectedConference === 'EAST' && styles.confTabTextActive]}>
                EASTERN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confTab, selectedConference === 'WEST' && styles.confTabActive]}
              onPress={() => setSelectedConference('WEST')}
            >
              <Text style={[styles.confTabText, selectedConference === 'WEST' && styles.confTabTextActive]}>
                WESTERN
              </Text>
            </TouchableOpacity>
          </View>
          {renderStandingsTable(standings, true)}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(255,107,53,0.3)' }]} />
              <Text style={styles.legendText}>Playoff (1-6)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
              <Text style={styles.legendText}>Play-In (7-10)</Text>
            </View>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      );
    }

    // NCAA - show all conferences
    if (allConferences.length === 0) {
      return <Text style={styles.emptyText}>Standings not available</Text>;
    }
    return (
      <ScrollView
        style={styles.standingsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
        }
      >
        {allConferences.map((conf) => (
          <View key={conf.name} style={styles.confSection}>
            <Text style={styles.confSectionTitle}>{conf.name.toUpperCase()}</Text>
            {renderStandingsTable(conf.teams, false)}
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }

  function renderSchedule() {
    return (
      <ScrollView
        style={styles.scheduleContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
        }
      >
        {renderDateStrip()}

        {gamesLoading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginTop: 20 }} />
        ) : games.length === 0 ? (
          <Text style={styles.emptyText}>No games scheduled</Text>
        ) : (
          games.map((game) => {
            const isUpcoming = game.awayScore === 0 && game.homeScore === 0 && !game.isLive;
            const d = new Date(game.gameDate);
            const hours = d.getHours();
            const mins = d.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h = hours % 12 || 12;
            const m = mins.toString().padStart(2, '0');
            const timeStr = `${h}:${m} ${ampm}`;
            return (
              <TouchableOpacity
                key={game.id}
                style={styles.scheduleRow}
                onPress={() => router.push(`/game/${game.id}?league=${selectedLeague}`)}
              >
                <View style={styles.scheduleTime}>
                  <Text style={styles.scheduleTimeText}>
                    {game.isLive ? game.status : isUpcoming ? timeStr : 'FINAL'}
                  </Text>
                  {game.isLive && <View style={styles.scheduleLiveDot} />}
                </View>
                <View style={styles.scheduleMatchup}>
                  <Text style={styles.scheduleTeam}>{game.away}</Text>
                  <Text style={styles.scheduleAt}>
                    {isUpcoming ? '@' : `${game.awayScore} - ${game.homeScore}`}
                  </Text>
                  <Text style={styles.scheduleTeam}>{game.home}</Text>
                </View>
                {game.broadcast ? (
                  <Text style={styles.broadcastText} numberOfLines={1}>{game.broadcast}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }

  function renderDateStrip() {
    return (
      <View style={styles.dateStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {WEEK_DATES.map((date) => (
            <TouchableOpacity
              key={date.date}
              style={[styles.dateItem, selectedDate === date.date && styles.dateItemActive]}
              onPress={() => setSelectedDate(date.date)}
            >
              <Text style={[styles.dateLabel, selectedDate === date.date && styles.dateLabelActive]}>
                {date.label}
              </Text>
              <Text style={[styles.dateDay, selectedDate === date.date && styles.dateDayActive]}>
                {date.day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  function renderScoresContent() {
    return (
      <>
        {renderDateStrip()}

        {gamesLoading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />
        ) : games.length === 0 ? (
          <Text style={styles.emptyText}>No games on this date</Text>
        ) : (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            renderItem={renderGameRow}
            contentContainerStyle={styles.gamesList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
            }
          />
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SCORES</Text>
      </View>

      <View style={styles.segmentRow}>
        {SEGMENTS.map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[styles.segment, selectedSegment === seg && styles.segmentActive]}
            onPress={() => setSelectedSegment(seg)}
          >
            <Text style={[styles.segmentText, selectedSegment === seg && styles.segmentTextActive]}>
              {seg}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.leagueStrip}>
        {LEAGUES.map((lg) => (
          <TouchableOpacity
            key={lg.id}
            style={[styles.leagueTab, selectedLeague === lg.id && styles.leagueTabActive]}
            onPress={() => setSelectedLeague(lg.id)}
          >
            <Text style={[styles.leagueTabText, selectedLeague === lg.id && styles.leagueTabTextActive]}>
              {lg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSegment === 'SCORES' && renderScoresContent()}
      {selectedSegment === 'STANDINGS' && renderStandings()}
      {selectedSegment === 'SCHEDULE' && renderSchedule()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 24,
    color: colors.text,
    letterSpacing: 2,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: Colors.orange,
  },
  segmentText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  // League tabs
  leagueStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  leagueTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leagueTabActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  leagueTabText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  leagueTabTextActive: {
    color: '#FFFFFF',
  },
  // Date Strip
  dateStripWrapper: {
    flexShrink: 0,
  },
  dateStrip: {
    paddingHorizontal: 8,
    gap: 6,
    marginBottom: 16,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    minWidth: 60,
  },
  dateItemActive: {
    backgroundColor: Colors.orange,
  },
  dateLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateLabelActive: {
    color: '#FFFFFF',
  },
  dateDay: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: colors.text,
  },
  dateDayActive: {
    color: '#FFFFFF',
  },
  // Games
  gamesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  gameRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  gameRowLeft: {
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  teamAbbr: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  score: {
    fontFamily: Fonts.monoBold,
    fontSize: 22,
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  scoreWinning: {
    color: colors.text,
  },
  gameRowRight: {
    width: 90,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  liveIndicator: {
    alignItems: 'center',
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    marginBottom: 4,
  },
  liveText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  statusText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
  },
  finalText: {
    color: colors.textTertiary,
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
  },
  // Conference sections (NCAA)
  confSection: {
    marginBottom: 24,
  },
  confSectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.orange,
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Standings
  standingsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  confRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  confTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  confTabActive: {
    backgroundColor: Colors.orange,
  },
  confTabText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  confTabTextActive: {
    color: '#FFFFFF',
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  standingsHeaderText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  statCol: {
    width: 36,
    textAlign: 'center',
  },
  streakCol: {
    width: 36,
    textAlign: 'center',
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  playoffTeam: {
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  playoffCutoff: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.orange,
  },
  playInTeam: {
    backgroundColor: colors.borderLight,
  },
  playInCutoff: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textTertiary,
  },
  standingsTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: colors.textTertiary,
    width: 22,
  },
  standingsLogo: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  standingsTeamAbbr: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    width: 38,
  },
  standingsTeamName: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: colors.text,
  },
  streakWin: {
    color: '#10B981',
  },
  streakLoss: {
    color: Colors.red,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Schedule
  scheduleContainer: {
    flex: 1,
  },
  scheduleRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  scheduleTimeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.orange,
  },
  scheduleLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
  },
  scheduleMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleTeam: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: colors.text,
  },
  scheduleAt: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
  },
  broadcastText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  });
}
