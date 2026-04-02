import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';

const API_BASE = 'https://www.basktball.com';

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

export default function NewsScreen() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      const res = await fetch(`${API_BASE}/api/news?limit=20`);
      const data = await res.json();
      if (data.success && data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.warn('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LATEST NEWS</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LATEST NEWS</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.newsItem}
            activeOpacity={0.7}
            onPress={() => router.push(`/article/${item.id}` as never)}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
            ) : (
              <View style={styles.newsImageFallback}>
                <Ionicons name="basketball-outline" size={28} color={Colors.textTertiary} />
              </View>
            )}
            <View style={styles.newsContent}>
              <View style={[styles.newsBadge, { backgroundColor: leagueBadgeColor(item.league) }]}>
                <Text style={styles.newsBadgeText}>{item.league?.toUpperCase() || 'NBA'}</Text>
              </View>
              <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.newsMeta}>{item.source} &middot; {timeAgo(item.pubDate)}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkGray,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold, fontWeight: '700' as const, fontSize: 20,
    color: Colors.white, letterSpacing: 2,
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  newsItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  newsImage: {
    width: 80, height: 80, borderRadius: 10,
    marginRight: 12, backgroundColor: Colors.darkGray,
  },
  newsImageFallback: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: Colors.darkGray,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  newsContent: { flex: 1, justifyContent: 'center' },
  newsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginBottom: 4,
  },
  newsBadgeText: {
    fontFamily: Fonts.monoBold, fontSize: 12,
    color: Colors.white, letterSpacing: 0.5,
  },
  newsTitle: {
    fontFamily: Fonts.barlowSemiBold, fontWeight: '600' as const, fontSize: 14,
    color: Colors.white, lineHeight: 20, marginBottom: 4,
  },
  newsMeta: {
    fontFamily: Fonts.barlow, fontSize: 12, color: Colors.textTertiary,
  },
});
