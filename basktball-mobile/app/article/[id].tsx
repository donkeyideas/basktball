import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';

const API_BASE = 'https://www.basktball.com';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  pubDate: string;
  source: string;
  league: string;
  imageUrl: string | null;
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    async function loadArticle() {
      try {
        const res = await fetch(`${API_BASE}/api/news?limit=50`);
        const data = await res.json();
        if (data.success && data.articles) {
          const found = data.articles.find((a: NewsArticle) => a.id === id);
          if (found) {
            setArticle(found);
            // Try to get richer content
            if (!found.content) {
              fetch(`${API_BASE}/api/news/scrape?url=${encodeURIComponent(found.link)}`)
                .then(r => r.json())
                .then(d => {
                  if (d.success && d.content) {
                    setArticle(prev => prev ? { ...prev, content: d.content } : prev);
                  }
                })
                .catch(() => {});
            }
          } else {
            setError('Article not found');
          }
        } else {
          setError('Failed to load news');
        }
      } catch {
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NEWS</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NEWS</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Text style={{ color: Colors.textTertiary, fontSize: 16 }}>{error || 'Article not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: Colors.orange, fontSize: 14, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const paragraphs = (article.content || article.description).split('\n\n').filter(p => p.trim());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEWS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero image */}
        {article.imageUrl && (
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* League badge + date */}
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: leagueBadgeColor(article.league) }]}>
              <Text style={styles.badgeText}>{article.league?.toUpperCase() || 'NBA'}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(article.pubDate)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Source */}
          <Text style={styles.sourceText}>
            via <Text style={{ fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{article.source}</Text>
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Article content */}
          {paragraphs.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>{paragraph}</Text>
          ))}

          {/* Read full article button */}
          <TouchableOpacity
            style={styles.readButton}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(article.link)}
          >
            <Text style={styles.readButtonText}>READ FULL ARTICLE</Text>
            <Ionicons name="open-outline" size={16} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.readButtonSource}>at {article.source}</Text>
        </View>
      </ScrollView>
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
  scrollContent: { paddingBottom: 40 },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 220,
    backgroundColor: Colors.darkGray,
  },
  content: { padding: 20 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: Fonts.monoBold, fontSize: 11,
    color: Colors.white, letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: Fonts.mono, fontSize: 12,
    color: Colors.textTertiary,
  },
  title: {
    fontFamily: Fonts.barlowBold, fontWeight: '700' as const,
    fontSize: 26, lineHeight: 34,
    color: Colors.white, marginBottom: 12,
  },
  sourceText: {
    fontSize: 14, color: Colors.textTertiary, marginBottom: 20,
  },
  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20,
  },
  paragraph: {
    fontSize: 16, lineHeight: 26,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    fontFamily: Fonts.barlow,
  },
  readButton: {
    backgroundColor: Colors.orange,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  readButtonText: {
    color: Colors.black,
    fontFamily: Fonts.barlowBold, fontWeight: '700' as const,
    fontSize: 15, letterSpacing: 1,
  },
  readButtonSource: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 12, marginTop: 8,
    fontFamily: Fonts.barlow,
  },
});
