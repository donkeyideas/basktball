import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { AutoImage } from '@/components/feed/AutoImage';
import { ImageGrid } from '@/components/feed/ImageGrid';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { LinkifiedText } from '@/components/content/LinkifiedText';
import { LinkPreview, extractFirstUrl, stripFirstUrl } from '@/components/content/LinkPreview';

const API_BASE = 'https://www.basktball.com';

type League = 'nba' | 'wnba' | 'ncaam' | 'ncaaw' | 'euro' | 'intl';
const LEAGUES: { id: League; label: string }[] = [
  { id: 'nba', label: 'NBA' },
  { id: 'wnba', label: 'WNBA' },
  { id: 'ncaam', label: 'NCAAM' },
  { id: 'ncaaw', label: 'NCAAW' },
  { id: 'euro', label: 'EURO' },
  { id: 'intl', label: 'INTL' },
];

interface LiveGame {
  id: string;
  away: string;
  home: string;
  awayLogo: string | null;
  homeLogo: string | null;
  awayScore: number;
  homeScore: number;
  quarter: string;
  time: string;
  isLive: boolean;
}

interface Performer {
  playerId: string;
  name: string;
  team: string;
  points: number;
  rebounds: number;
  assists: number;
  imageUrl: string | null;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

interface TrendingTake {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
  createdAt: string;
  mediaUrl?: string | null;
  mediaUrls?: string[];
  linkPreview?: {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    videoEmbedUrl: string | null;
    videoProvider: string | null;
  } | null;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    avatarUrl: string | null;
  };
}

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  league: string;
  imageUrl: string | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function leagueBadgeColor(league: string): string {
  switch (league?.toLowerCase()) {
    case 'nba': return Colors.red;
    case 'wnba': return Colors.orange;
    case 'ncaam': return '#10B981';
    case 'euro': return Colors.blue;
    default: return Colors.blue;
  }
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [performersLoading, setPerformersLoading] = useState(true);
  const [trendingTakes, setTrendingTakes] = useState<TrendingTake[]>([]);
  const [takesLoading, setTakesLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<League>('nba');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
    fetchPerformers();
    fetchTrendingTakes();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTodayGames(selectedLeague),
        fetchNews(),
        fetchPerformers(),
        fetchTrendingTakes(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    setGamesLoading(true);
    fetchTodayGames(selectedLeague);
  }, [selectedLeague]);

  async function fetchTodayGames(league: League = 'nba') {
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
      const res = await fetch(`${API_BASE}/api/games?date=${today}&league=${league}`);
      const data = await res.json();
      if (data.success && data.games) {
        const mapped: LiveGame[] = data.games.map((g: any) => {
          const isLive = g.status === 'live';
          const isFinal = g.status === 'final';
          let quarter = '';
          let time = '';
          if (isLive) {
            const raw = g.quarter?.toString() || '';
            quarter = raw.startsWith('Q') ? raw : raw ? `Q${raw}` : '';
            time = g.clock || '';
          } else if (isFinal) {
            quarter = 'FINAL';
          } else {
            const d = new Date(g.gameDate);
            const h = d.getHours() % 12 || 12;
            const m = d.getMinutes().toString().padStart(2, '0');
            const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
            quarter = `${h}:${m}`;
            time = ampm;
          }
          return {
            id: g.id,
            away: g.awayTeam?.abbreviation || '???',
            home: g.homeTeam?.abbreviation || '???',
            awayLogo: g.awayTeam?.logoUrl || null,
            homeLogo: g.homeTeam?.logoUrl || null,
            awayScore: g.awayScore || 0,
            homeScore: g.homeScore || 0,
            quarter,
            time,
            isLive,
          };
        });
        setLiveGames(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch games:', err);
    } finally {
      setGamesLoading(false);
    }
  }

  async function fetchPerformers() {
    try {
      const res = await fetch(`${API_BASE}/api/stats/today-performers`);
      const data = await res.json();
      if (data.success && data.performers) {
        setPerformers(data.performers);
      }
    } catch (err) {
      console.warn('Failed to fetch performers:', err);
    } finally {
      setPerformersLoading(false);
    }
  }

  async function fetchTrendingTakes() {
    try {
      const res = await fetch(`${API_BASE}/api/court/feed?type=foryou&limit=3`);
      const data = await res.json();
      if (data.takes && data.takes.length > 0) {
        setTrendingTakes(data.takes);
      }
    } catch (err) {
      console.warn('Failed to fetch trending takes:', err);
    } finally {
      setTakesLoading(false);
    }
  }

  async function fetchNews() {
    try {
      const res = await fetch(`${API_BASE}/api/news?limit=4`);
      const data = await res.json();
      if (data.success && data.articles) {
        setNewsArticles(data.articles);
      }
    } catch (err) {
      console.warn('Failed to fetch news:', err);
    } finally {
      setNewsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>BASKTBALL</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
        }
      >
        {/* Live Bar */}
        {liveGames.some(g => g.isLive) && (
          <View style={styles.liveBar}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBarText}>
              {liveGames.filter(g => g.isLive).length} GAME{liveGames.filter(g => g.isLive).length !== 1 ? 'S' : ''} LIVE NOW
            </Text>
          </View>
        )}

        {/* League Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueTabs}
        >
          {LEAGUES.map((league) => {
            const isActive = selectedLeague === league.id;
            return (
              <TouchableOpacity
                key={league.id}
                style={[styles.leagueTab, isActive && styles.leagueTabActive]}
                onPress={() => setSelectedLeague(league.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.leagueTabText, isActive && styles.leagueTabTextActive]}>
                  {league.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Today's Scores */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S GAMES</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/scores')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {gamesLoading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginVertical: 20 }} />
        ) : liveGames.length === 0 ? (
          <Text style={styles.emptyText}>No games today</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {liveGames.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/game/${game.id}?league=${selectedLeague}`)}
              >
                <View style={styles.gameCardHeader}>
                  <Text style={[styles.gameStatus, game.quarter === 'FINAL' ? styles.gameFinal : game.isLive ? styles.gameLive : styles.gameFinal]}>
                    {game.isLive ? `${game.quarter} ${game.time}` : `${game.quarter} ${game.time}`}
                  </Text>
                  {game.isLive && <View style={styles.gameLiveDot} />}
                </View>
                <View style={styles.gameTeamRow}>
                  {game.awayLogo ? (
                    <Image source={{ uri: game.awayLogo }} style={styles.teamLogo} />
                  ) : null}
                  <Text style={styles.teamAbbr}>{game.away}</Text>
                  <Text style={styles.teamScore}>{game.awayScore}</Text>
                </View>
                <View style={styles.gameTeamRow}>
                  {game.homeLogo ? (
                    <Image source={{ uri: game.homeLogo }} style={styles.teamLogo} />
                  ) : null}
                  <Text style={styles.teamAbbr}>{game.home}</Text>
                  <Text style={[styles.teamScore, game.homeScore > game.awayScore && styles.teamScoreWinning]}>
                    {game.homeScore}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Top Performers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP PERFORMERS</Text>
        </View>

        {performersLoading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginVertical: 20 }} />
        ) : performers.length === 0 ? (
          <Text style={styles.emptyText}>No performers yet today</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {performers.map((player, index) => (
              <TouchableOpacity
                key={`${player.playerId}-${index}`}
                style={styles.playerCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/player/${player.playerId}`)}
              >
                {player.imageUrl ? (
                  <Image source={{ uri: player.imageUrl }} style={styles.playerHeadshot} />
                ) : (
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitials}>{getInitials(player.name)}</Text>
                  </View>
                )}
                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                <Text style={styles.playerTeam}>{player.team}</Text>
                <View style={styles.playerStatsRow}>
                  <View style={styles.playerStat}>
                    <Text style={styles.playerStatValue}>{player.points}</Text>
                    <Text style={styles.playerStatLabel}>PTS</Text>
                  </View>
                  <View style={styles.playerStat}>
                    <Text style={styles.playerStatValue}>{player.rebounds}</Text>
                    <Text style={styles.playerStatLabel}>REB</Text>
                  </View>
                  <View style={styles.playerStat}>
                    <Text style={styles.playerStatValue}>{player.assists}</Text>
                    <Text style={styles.playerStatLabel}>AST</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Trending Takes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRENDING TAKES</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/court')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {takesLoading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginVertical: 20 }} />
        ) : trendingTakes.length === 0 ? (
          <Text style={styles.emptyText}>No takes yet — be the first!</Text>
        ) : (
          trendingTakes.map((take) => {
            const displayName = take.author?.displayName || take.author?.name || 'Anonymous';
            return (
              <View key={take.id} style={styles.takeCard}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/take/${take.id}`)}>
                <View style={styles.takeHeader}>
                  {(take.author?.avatarUrl || take.author?.image) ? (
                    <Image source={{ uri: (take.author.avatarUrl || take.author.image)! }} style={styles.takeAvatarImg} />
                  ) : (
                    <View style={styles.takeAvatar}>
                      <Text style={styles.takeAvatarText}>{displayName.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.takeUserInfo}>
                    <Text style={styles.takeUser}>{displayName}</Text>
                    <Text style={styles.takeHandle}>{timeAgo(take.createdAt)}</Text>
                  </View>
                </View>
                <LinkifiedText
                  text={extractFirstUrl(take.content) ? stripFirstUrl(take.content) : take.content}
                  style={styles.takeText}
                />
                </TouchableOpacity>
                {(take.mediaUrls?.length ?? 0) > 0 ? (
                  <View style={{ marginTop: 8 }}><ImageGrid urls={take.mediaUrls!} /></View>
                ) : take.mediaUrl ? (
                  <AutoImage source={{ uri: take.mediaUrl }} style={{ marginTop: 8 }} />
                ) : null}
                {/* Link Preview (same component used on court page) */}
                <LinkPreview content={take.content} />
                <View style={styles.takeActions}>
                  <View style={styles.takeAction}>
                    <Ionicons name="flame-outline" size={16} color={Colors.orange} />
                    <Text style={styles.takeActionCount}>{take.fireCount}</Text>
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.takeActionCount}>{take.brickCount ?? 0}</Text>
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.takeActionCount}>{take.replyCount}</Text>
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.takeActionCount}>{take.repostCount ?? 0}</Text>
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="search" size={14} color={colors.textTertiary} />
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="flag-outline" size={14} color={colors.textTertiary} />
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                  </View>
                  <View style={styles.takeAction}>
                    <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.takeActionCount, { color: colors.textTertiary, fontSize: 12 }]}>{take.viewCount ?? 0}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Latest News */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LATEST NEWS</Text>
          <TouchableOpacity onPress={() => router.push('/news')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {newsLoading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginVertical: 20 }} />
        ) : newsArticles.length > 0 ? (
          newsArticles.map((article, index) => (
            <TouchableOpacity
              key={`${article.id}-${index}`}
              style={styles.newsItem}
              activeOpacity={0.7}
              onPress={() => router.push(`/article/${article.id}` as never)}
            >
              {article.imageUrl ? (
                <Image source={{ uri: article.imageUrl }} style={styles.newsImage} />
              ) : (
                <View style={styles.newsImageFallback}>
                  <Ionicons name="basketball-outline" size={28} color={colors.textTertiary} />
                </View>
              )}
              <View style={styles.newsContent}>
                <View style={[styles.newsBadge, { backgroundColor: leagueBadgeColor(article.league) }]}>
                  <Text style={styles.newsBadgeText}>{article.league?.toUpperCase() || 'NBA'}</Text>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>{article.title}</Text>
                <Text style={styles.newsMeta}>{article.source} &middot; {timeAgo(article.pubDate)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.newsEmpty}>No news available</Text>
        )}

        <View style={styles.bottomSpacer} />
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
    paddingLeft: 72, // FloatingMenu (top-left)
    paddingRight: 64, // ThemeToggleFAB (top-right)
    paddingVertical: 12,
  },
  headerLogo: {
    fontFamily: Fonts.anton,
    fontSize: 24,
    color: colors.text,
    letterSpacing: 2,
  },
  notifButton: {
    position: 'relative',
    padding: 4,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Live Bar
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
    marginRight: 8,
  },
  liveBarText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.red,
    letterSpacing: 1,
  },
  // League Tabs
  leagueTabs: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  leagueTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  leagueTabActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  leagueTabText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  leagueTabTextActive: {
    color: '#FFFFFF',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
    letterSpacing: 1.5,
  },
  seeAll: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.orange,
  },
  // Horizontal Scroll
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  // Game Cards
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    width: 150,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameStatus: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  gameLive: {
    color: Colors.red,
  },
  gameFinal: {
    color: colors.textSecondary,
  },
  gameLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    marginLeft: 6,
  },
  gameTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamLogo: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: 'contain' as const,
  },
  teamAbbr: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  teamScore: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: colors.textSecondary,
  },
  teamScoreWinning: {
    color: colors.text,
  },
  // Player Cards
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerHeadshot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playerInitials: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.orange,
  },
  playerName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  playerTeam: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  playerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  playerStat: {
    alignItems: 'center',
  },
  playerStatValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: colors.text,
  },
  playerStatLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  // Take Cards
  takeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  takeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  takeAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: colors.surface,
  },
  takeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  takeAvatarText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.orange,
  },
  takeUserInfo: {
    flex: 1,
  },
  takeUser: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  takeHandle: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textSecondary,
  },
  takeText: {
    fontFamily: Fonts.barlow,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  takeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  takeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  takeActionCount: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: colors.textSecondary,
  },
  // News Items
  newsItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  newsImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  newsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: Colors.blue,
  },
  newsBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  newsMeta: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  newsEmpty: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  });
}
