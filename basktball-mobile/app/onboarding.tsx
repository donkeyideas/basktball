import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface FeatureItem {
  icon: IoniconsName;
  iconBg: string;
  iconColor: string;
  name: string;
  desc: string;
}

interface OnboardingPage {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle?: string;
  mainIcon: IoniconsName;
  mainIconColor: string;
  mainIconBg: string;
  mainIconBorder: string;
  features?: FeatureItem[];
  leagues?: { label: string; color: string; borderColor: string }[];
  stats?: { value: string; label: string }[];
}

const PAGES: OnboardingPage[] = [
  {
    id: 'scores',
    tag: 'LIVE SCORES',
    tagColor: Colors.orange,
    title: 'EVERY GAME.\nLIVE.',
    subtitle:
      'Track real-time scores across NBA, WNBA, NCAA Men\'s & Women\'s, EuroLeague, and international basketball — all in one place.',
    mainIcon: 'basketball-outline',
    mainIconColor: Colors.orange,
    mainIconBg: 'rgba(255,107,53,0.12)',
    mainIconBorder: 'rgba(255,107,53,0.25)',
    leagues: [
      { label: 'NBA', color: Colors.orange, borderColor: 'rgba(255,107,53,0.2)' },
      { label: 'WNBA', color: Colors.yellow, borderColor: 'rgba(245,158,11,0.2)' },
      { label: 'NCAA', color: Colors.blue, borderColor: 'rgba(59,130,246,0.2)' },
      { label: 'EURO', color: Colors.green, borderColor: 'rgba(16,185,129,0.2)' },
    ],
  },
  {
    id: 'news',
    tag: 'NEWS & DATA',
    tagColor: Colors.blue,
    title: 'STAY INFORMED.\nGO DEEP.',
    subtitle:
      'Breaking basketball news, full player stat breakdowns, career stats, game logs, and head-to-head comparisons.',
    mainIcon: 'stats-chart-outline',
    mainIconColor: Colors.blue,
    mainIconBg: 'rgba(59,130,246,0.1)',
    mainIconBorder: 'rgba(59,130,246,0.2)',
    stats: [
      { value: '27.4', label: 'PPG' },
      { value: '8.1', label: 'RPG' },
      { value: '7.3', label: 'APG' },
      { value: '52%', label: 'FG%' },
    ],
  },
  {
    id: 'court1',
    tag: 'THE COURT',
    tagColor: Colors.red,
    title: 'YOUR COURT. YOUR TAKES.',
    mainIcon: 'flame-outline',
    mainIconColor: Colors.red,
    mainIconBg: 'rgba(239,68,68,0.1)',
    mainIconBorder: 'rgba(239,68,68,0.2)',
    features: [
      {
        icon: 'flame',
        iconBg: 'rgba(255,107,53,0.12)',
        iconColor: Colors.orange,
        name: 'Fire & Brick',
        desc: 'Agree or disagree with takes. Reactions drive streaks and predictions.',
      },
      {
        icon: 'trophy',
        iconBg: 'rgba(245,158,11,0.12)',
        iconColor: Colors.yellow,
        name: 'Hot Streak',
        desc: 'Earn fire or ice badges based on your fire-to-brick ratio.',
      },
      {
        icon: 'receipt',
        iconBg: 'rgba(16,185,129,0.12)',
        iconColor: Colors.green,
        name: 'Receipts',
        desc: 'Post predictions — AI detects them. After the game: RECEIPT or BUST.',
      },
      {
        icon: 'time',
        iconBg: 'rgba(59,130,246,0.12)',
        iconColor: Colors.blue,
        name: 'Courtside',
        desc: 'Tag takes with quarter & game clock during live games.',
      },
    ],
  },
  {
    id: 'court2',
    tag: 'THE COURT',
    tagColor: '#9b59b6',
    title: 'FACT-CHECK. CHALLENGE. REVISIT.',
    mainIcon: 'shield-checkmark-outline',
    mainIconColor: '#9b59b6',
    mainIconBg: 'rgba(155,89,182,0.1)',
    mainIconBorder: 'rgba(155,89,182,0.2)',
    features: [
      {
        icon: 'search',
        iconBg: 'rgba(59,130,246,0.12)',
        iconColor: Colors.blue,
        name: 'Stat Check',
        desc: 'AI fact-checks statistical claims. Verdict: Verified, False, or Unverifiable.',
      },
      {
        icon: 'flag',
        iconBg: 'rgba(239,68,68,0.12)',
        iconColor: Colors.red,
        name: 'Challenge',
        desc: 'Flag a take to start a head-to-head debate. Community votes the winner.',
      },
      {
        icon: 'hourglass',
        iconBg: 'rgba(155,89,182,0.12)',
        iconColor: '#9b59b6',
        name: 'Aging Takes',
        desc: 'Set a revisit date. When it arrives, the take resurfaces for re-evaluation.',
      },
    ],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLastPage = currentIndex === PAGES.length - 1;

  const handleComplete = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (isLastPage) {
      handleComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderPage = ({ item }: { item: OnboardingPage }) => {
    const hasFeatures = !!item.features;
    return (
    <View style={styles.page}>
      {/* Main icon */}
      <View style={[styles.iconArea, hasFeatures && { marginBottom: 10 }]}>
        <View
          style={[
            styles.iconCircle,
            hasFeatures && { width: 70, height: 70, borderRadius: 35 },
            {
              backgroundColor: item.mainIconBg,
              borderColor: item.mainIconBorder,
            },
          ]}
        >
          <Ionicons name={item.mainIcon} size={hasFeatures ? 30 : 44} color={item.mainIconColor} />
        </View>
      </View>

      {/* Tag */}
      <View style={[styles.tag, { backgroundColor: `${item.tagColor}1A` }]}>
        <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, hasFeatures && { fontSize: 26, lineHeight: 30, marginBottom: 4 }]}>{item.title}</Text>

      {/* Subtitle */}
      {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}

      {/* League pills */}
      {item.leagues && (
        <View style={styles.leagueRow}>
          {item.leagues.map((league) => (
            <View
              key={league.label}
              style={[
                styles.leaguePill,
                {
                  backgroundColor: `${league.color}15`,
                  borderColor: league.borderColor,
                },
              ]}
            >
              <Text style={[styles.leaguePillText, { color: league.color }]}>
                {league.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Stat cards */}
      {item.stats && (
        <View style={styles.statsRow}>
          {item.stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Feature list */}
      {item.features && (
        <View style={styles.featuresList}>
          {item.features.map((feature) => (
            <View key={feature.name} style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: feature.iconBg }]}>
                <Ionicons name={feature.icon} size={16} color={feature.iconColor} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Skip */}
      {!isLastPage && (
        <TouchableOpacity style={styles.skipButton} onPress={handleComplete} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Page counter */}
      <Text style={styles.pageLabel}>{currentIndex + 1} / {PAGES.length}</Text>

      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom */}
      <View style={styles.bottomArea}>
        <View style={styles.dotsRow}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {isLastPage ? 'GET STARTED' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  skipButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  pageLabel: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600' as const,
  },
  page: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  iconArea: {
    marginBottom: 20,
    position: 'relative',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 13,
    fontFamily: Fonts.barlowBold,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  title: {
    color: Colors.white,
    fontSize: 38,
    fontFamily: Fonts.anton,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
    letterSpacing: 1.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontFamily: Fonts.barlow,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 290,
  },
  leagueRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  leaguePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  leaguePillText: {
    fontSize: 13,
    fontFamily: Fonts.barlowBold,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 65,
  },
  statValue: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: Fonts.barlowBold,
    fontWeight: '700' as const,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginTop: 2,
  },
  featuresList: {
    marginTop: 8,
    width: '100%',
    maxWidth: 310,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureName: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.barlowBold,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontFamily: Fonts.barlow,
    lineHeight: 20,
    marginTop: 2,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: Colors.orange,
    width: 20,
  },
  nextButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.barlowBold,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
});
