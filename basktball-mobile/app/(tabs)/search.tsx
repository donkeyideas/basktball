import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

const API_BASE = 'https://www.basktball.com';

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  sourceLogo?: string;
  league?: string;
  imageUrl?: string;
}

interface SearchUser {
  id: string;
  name: string;
  displayName?: string;
  image: string | null;
  avatarUrl?: string | null;
  takeCount?: number;
  followerCount?: number;
}

interface SearchTake {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface PlayerResult {
  id: string;
  name: string;
  headshotUrl?: string;
  team?: { name: string; abbreviation: string };
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUser[]>([]);
  const [searchResults, setSearchResults] = useState<{ takes: SearchTake[]; users: SearchUser[] } | null>(null);
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchNews();
    fetchSuggestedUsers();
  }, []);

  async function fetchNews() {
    try {
      const res = await fetch(`${API_BASE}/api/news?limit=10`);
      const data = await res.json();
      if (data.articles) setNews(data.articles);
    } catch (err) {
      console.warn('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  async function fetchSuggestedUsers() {
    try {
      const res = await fetch(`${API_BASE}/api/court/suggested-users`);
      const data = await res.json();
      if (data.users) setSuggestedUsers(data.users);
    } catch (err) {
      console.warn('Failed to fetch suggested users:', err);
    }
  }

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setPlayerResults([]);
      return;
    }
    setSearching(true);
    try {
      // Search takes/users and players in parallel
      const [searchRes, playerRes] = await Promise.all([
        fetch(`${API_BASE}/api/mobile/search?q=${encodeURIComponent(query)}&limit=10`),
        fetch(`${API_BASE}/api/players?q=${encodeURIComponent(query)}`),
      ]);
      const searchData = await searchRes.json();
      setSearchResults({
        takes: searchData.takes || [],
        users: searchData.users || [],
      });
      const playerData = await playerRes.json();
      setPlayerResults(playerData.players || []);
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => performSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, performSearch]);

  const isSearching = searchQuery.trim().length > 0;

  function renderNewsSection() {
    return (
      <>
        <View style={styles.sectionHeader}>
          <Ionicons name="newspaper-outline" size={18} color={Colors.orange} />
          <Text style={styles.sectionTitle}>LATEST NEWS</Text>
        </View>

        {news.length === 0 ? (
          <Text style={styles.emptyText}>No news available right now</Text>
        ) : (
          news.map((article, index) => (
            <TouchableOpacity
              key={`${article.id}-${index}`}
              style={styles.newsItem}
              activeOpacity={0.7}
              onPress={() => router.push(`/article/${article.id}` as never)}
            >
              {article.imageUrl ? (
                <Image source={{ uri: article.imageUrl }} style={styles.newsImage} />
              ) : (
                <View style={styles.newsImagePlaceholder}>
                  <Ionicons name="basketball" size={24} color={colors.textTertiary} />
                </View>
              )}
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle} numberOfLines={2}>{article.title}</Text>
                <View style={styles.newsMeta}>
                  <Text style={styles.newsSource}>{article.source}</Text>
                  <Text style={styles.newsTime}>{timeAgo(article.pubDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Ionicons name="people" size={18} color={Colors.orange} />
              <Text style={styles.sectionTitle}>SUGGESTED USERS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {suggestedUsers.map((u) => (
                <TouchableOpacity key={u.id} style={styles.userCard} activeOpacity={0.7} onPress={() => router.push(`/user/${u.id}`)}>
                  {u.image || u.avatarUrl ? (
                    <Image source={{ uri: (u.image || u.avatarUrl)! }} style={styles.userAvatar} />
                  ) : (
                    <View style={styles.userAvatarFallback}>
                      <Text style={styles.userInitials}>
                        {(u.displayName || u.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.userName} numberOfLines={1}>{u.displayName || u.name}</Text>
                  <Text style={styles.userMeta}>
                    {u.followerCount ?? 0} followers
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </>
    );
  }

  function renderSearchResults() {
    if (searching) {
      return <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />;
    }
    if (!searchResults) return null;

    const hasPlayers = playerResults.length > 0;
    const hasUsers = searchResults.users.length > 0;
    const hasTakes = searchResults.takes.length > 0;

    if (!hasPlayers && !hasUsers && !hasTakes) {
      return <Text style={styles.emptyText}>No results found</Text>;
    }

    return (
      <>
        {/* Players */}
        {hasPlayers && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="basketball" size={18} color={Colors.orange} />
              <Text style={styles.sectionTitle}>PLAYERS</Text>
            </View>
            {playerResults.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.resultRow}
                activeOpacity={0.7}
                onPress={() => router.push(`/player/${p.id}`)}
              >
                {p.headshotUrl ? (
                  <Image source={{ uri: p.headshotUrl }} style={styles.resultAvatar} />
                ) : (
                  <View style={styles.resultAvatarFallback}>
                    <Text style={styles.resultInitial}>{p.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{p.name}</Text>
                  <Text style={styles.resultSub}>{p.team?.name || 'NBA'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Users */}
        {hasUsers && (
          <>
            <View style={[styles.sectionHeader, hasPlayers && { marginTop: 16 }]}>
              <Ionicons name="people" size={18} color={Colors.orange} />
              <Text style={styles.sectionTitle}>USERS</Text>
            </View>
            {searchResults.users.map((u) => (
              <TouchableOpacity key={u.id} style={styles.resultRow} activeOpacity={0.7} onPress={() => router.push(`/user/${u.id}`)}>
                {u.image ? (
                  <Image source={{ uri: u.image }} style={styles.resultAvatar} />
                ) : (
                  <View style={styles.resultAvatarFallback}>
                    <Text style={styles.resultInitial}>{(u.name || '?').charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{u.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Takes */}
        {hasTakes && (
          <>
            <View style={[styles.sectionHeader, (hasPlayers || hasUsers) && { marginTop: 16 }]}>
              <Ionicons name="chatbubbles" size={18} color={Colors.orange} />
              <Text style={styles.sectionTitle}>TAKES</Text>
            </View>
            {searchResults.takes.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.takeResult}
                activeOpacity={0.7}
                onPress={() => router.push(`/take/${t.id}`)}
              >
                <Text style={styles.takeAuthor}>{t.author?.name || 'Anonymous'}</Text>
                <Text style={styles.takeContent} numberOfLines={2}>{t.content}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SEARCH</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players, teams, takes..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />
        ) : isSearching ? (
          renderSearchResults()
        ) : (
          renderNewsSection()
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
    paddingLeft: 72,
    paddingRight: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 24,
    color: colors.text,
    letterSpacing: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
    letterSpacing: 1.5,
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 30,
  },
  // News
  newsItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  newsImage: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  newsImagePlaceholder: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
    lineHeight: 19,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  newsSource: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.orange,
  },
  newsTime: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Horizontal user cards
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    width: 130,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  userAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  userInitials: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.orange,
  },
  userName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  userMeta: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Search results
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  resultAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultInitial: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.orange,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
  },
  resultSub: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Take results
  takeResult: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  takeAuthor: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.orange,
    marginBottom: 4,
  },
  takeContent: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  });
}
