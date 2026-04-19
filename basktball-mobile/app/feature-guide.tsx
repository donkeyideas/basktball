import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FEATURE_GUIDES, type FeatureGuide } from '@/lib/constants/featureGuides';

export default function FeatureGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();

  const startIndex = Math.max(0, Math.min(parseInt(indexParam || '0', 10) || 0, FEATURE_GUIDES.length - 1));
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(idx);
  }, [screenWidth]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  }), [screenWidth]);

  function renderVariantHeader(guide: FeatureGuide) {
    const cardBase = { backgroundColor: colors.surface, borderColor: colors.border };
    switch (guide.variant) {
      case 'court':
        return (
          <View style={[styles.headerCardCourt, cardBase]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{guide.title}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
          </View>
        );
      case 'fire':
        return (
          <View style={[styles.headerCardFire, cardBase]}>
            <View style={styles.fireHeader}>
              <Text style={styles.fireLabel}>FEATURE</Text>
              <Text style={styles.fireTitle}>{guide.title}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
            </View>
          </View>
        );
      case 'challenge':
        return (
          <View style={[styles.headerCardChallenge, { backgroundColor: colors.surface }]}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeLabel}>HEAD-TO-HEAD</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: Colors.courtWood }]}>{guide.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
            </View>
          </View>
        );
      case 'poll':
        return (
          <View style={[styles.headerCardPoll, { backgroundColor: colors.surface }]}>
            <View style={styles.pollHeader}>
              <Text style={styles.pollLabel}>{guide.title}</Text>
              <Text style={styles.pollTag}>VOTE</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
            </View>
          </View>
        );
      case 'score':
        return (
          <View style={[styles.headerCardScore, cardBase]}>
            <View style={[styles.scoreHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
              <Text style={styles.scoreTitle}>{guide.title}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
            </View>
          </View>
        );
      case 'tool':
        return (
          <View style={[styles.headerCardTool, { backgroundColor: colors.surface }]}>
            <View style={styles.toolHeader}>
              <Ionicons name="build-outline" size={14} color={Colors.courtWood} />
              <Text style={styles.toolLabel}>TOOL</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{guide.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
            </View>
          </View>
        );
      case 'standard':
      default:
        return (
          <View style={[styles.headerCardStandard, cardBase]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{guide.title}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{guide.description}</Text>
          </View>
        );
    }
  }

  const renderPage = useCallback(({ item: guide, index }: { item: FeatureGuide; index: number }) => {
    const isLast = index === FEATURE_GUIDES.length - 1;
    const isFirst = index === 0;

    return (
      <View style={{ flex: 1, width: screenWidth }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Variant header card */}
          {renderVariantHeader(guide)}

          {/* Title + tagline */}
          <Text style={[styles.featureTitle, { color: colors.text }]}>{guide.title}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{guide.tagline}</Text>

          {/* How It Works */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
          {guide.howItWorks.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{i + 1}.</Text>
              <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
            </View>
          ))}

          {/* Highlights */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={styles.sectionTitle}>HIGHLIGHTS</Text>
          {guide.highlights.map((item, i) => (
            <View key={i} style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.orange} style={{ marginTop: 2 }} />
              <Text style={[styles.highlightText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}

          {/* Example */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.exampleLabel, { color: colors.textTertiary }]}>EXAMPLE</Text>
            <Text style={[styles.exampleTitle, { color: colors.text }]}>{guide.exampleTitle}</Text>
            <Text style={[styles.exampleContent, { color: colors.textSecondary }]}>{guide.exampleContent}</Text>
          </View>

          {/* CTA Button */}
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push(guide.route as never)}
          >
            <Text style={styles.ctaText}>Open {guide.title}</Text>
          </Pressable>

          {/* Swipe hint */}
          {!isLast && !isFirst && (
            <Text style={[styles.swipeHint, { color: colors.textTertiary }]}>SWIPE FOR MORE</Text>
          )}
          {isFirst && FEATURE_GUIDES.length > 1 && (
            <Text style={[styles.swipeHint, { color: colors.textTertiary }]}>SWIPE LEFT FOR NEXT</Text>
          )}
          {isLast && FEATURE_GUIDES.length > 1 && (
            <Text style={[styles.swipeHint, { color: colors.textTertiary }]}>SWIPE RIGHT FOR PREVIOUS</Text>
          )}
        </ScrollView>
      </View>
    );
  }, [screenWidth, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>FEATURES</Text>
        <Text style={[styles.pageIndicator, { color: colors.textTertiary }]}>
          {currentIndex + 1} / {FEATURE_GUIDES.length}
        </Text>
      </View>

      {/* Horizontal pager */}
      <FlatList
        ref={flatListRef}
        data={FEATURE_GUIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleScrollEnd}
        keyExtractor={(item) => item.title}
        renderItem={renderPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.anton,
    fontSize: 20,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  pageIndicator: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --- Variant header cards ---
  headerCardCourt: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.orange,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCardFire: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fireHeader: {
    backgroundColor: Colors.orange,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fireLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fireTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.white,
  },
  headerCardChallenge: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.courtWood,
  },
  challengeHeader: {
    backgroundColor: 'rgba(200,159,108,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.courtWood,
  },
  challengeLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.courtWood,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerCardPoll: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.blue,
  },
  pollHeader: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.blue,
  },
  pollLabel: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pollTag: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.white,
    backgroundColor: Colors.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  headerCardScore: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreHeader: {
    backgroundColor: Colors.darkerGray,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreTitle: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.green,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerCardReceipt: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.green,
  },
  receiptStamp: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.white,
    backgroundColor: Colors.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerCardTool: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(200,159,108,0.3)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.courtWood,
  },
  toolHeader: {
    backgroundColor: 'rgba(200,159,108,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,159,108,0.15)',
  },
  toolLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.courtWood,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerCardStandard: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.orange,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // --- Feature detail sections ---
  featureTitle: {
    fontFamily: Fonts.anton,
    fontSize: 28,
    color: Colors.textPrimary,
    marginTop: 20,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: Fonts.barlow,
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  stepNumber: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.orange,
    minWidth: 18,
  },
  stepText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  highlightText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  exampleCard: {
    backgroundColor: Colors.darkGray,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
  },
  exampleLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  exampleTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  exampleContent: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  ctaButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.orange,
  },
  ctaText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  swipeHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 16,
  },
});
