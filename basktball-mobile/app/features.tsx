import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FEATURE_GUIDES, type FeatureItem } from '@/lib/constants/featureGuides';

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const dataFeatures = FEATURE_GUIDES.filter((f) => f.category === 'data');
  const socialFeatures = FEATURE_GUIDES.filter((f) => f.category === 'social');
  const toolsFeatures = FEATURE_GUIDES.filter((f) => f.category === 'tools');

  function handleNav(feature: FeatureItem) {
    const globalIndex = FEATURE_GUIDES.indexOf(feature as any);
    router.push(`/feature-guide?index=${globalIndex}` as never);
  }

  function renderCard(feature: FeatureItem) {
    switch (feature.variant) {
      case 'court':
        return (
          <Pressable key={feature.title} style={styles.cardCourt} onPress={() => handleNav(feature)}>
            <Text style={styles.cardName}>{feature.title}</Text>
            <Text style={styles.cardDesc}>{feature.description}</Text>
            <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
          </Pressable>
        );

      case 'fire':
        return (
          <Pressable key={feature.title} style={styles.cardFire} onPress={() => handleNav(feature)}>
            <View style={styles.fireHeader}>
              <Text style={styles.fireLabel}>FEATURE</Text>
              <Text style={styles.fireTitle}>{feature.title}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardDesc}>{feature.description}</Text>
              <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
            </View>
          </Pressable>
        );

      case 'challenge':
        return (
          <Pressable key={feature.title} style={styles.cardChallenge} onPress={() => handleNav(feature)}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeLabel}>HEAD-TO-HEAD</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardNameLight}>{feature.title}</Text>
              <Text style={styles.cardDesc}>{feature.description}</Text>
              <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
            </View>
          </Pressable>
        );

      case 'poll':
        return (
          <Pressable key={feature.title} style={styles.cardPoll} onPress={() => handleNav(feature)}>
            <View style={styles.pollHeader}>
              <Text style={styles.pollLabel}>{feature.title}</Text>
              <Text style={styles.pollTag}>VOTE</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardDesc}>{feature.description}</Text>
              <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
            </View>
          </Pressable>
        );

      case 'score':
        return (
          <Pressable key={feature.title} style={styles.cardScore} onPress={() => handleNav(feature)}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>{feature.title}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardDesc}>{feature.description}</Text>
              <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
            </View>
          </Pressable>
        );

      case 'tool':
        return (
          <Pressable key={feature.title} style={styles.cardTool} onPress={() => handleNav(feature)}>
            <View style={styles.toolHeader}>
              <Ionicons name="build-outline" size={14} color={Colors.courtWood} />
              <Text style={styles.toolLabel}>TOOL</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{feature.title}</Text>
              <Text style={styles.cardDesc}>{feature.description}</Text>
              <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
            </View>
          </Pressable>
        );

      case 'standard':
      default:
        return (
          <Pressable key={feature.title} style={styles.cardStandard} onPress={() => handleNav(feature)}>
            <Text style={styles.cardName}>{feature.title}</Text>
            <Text style={styles.cardDesc}>{feature.description}</Text>
            <Text style={styles.tapHint}>TAP TO LEARN MORE</Text>
          </Pressable>
        );
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FEATURES</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>What is BASKTBALL?</Text>
        <Text style={styles.introText}>
          BASKTBALL is the ultimate basketball platform. Live scores, standings, stats, news, powerful analytics tools, and a social court where fans post takes, debate, and vote. Everything basketball, all in one place.
        </Text>

        {/* Live Basketball Data */}
        <View style={styles.divider} />
        <View style={styles.categoryHeader}>
          <Ionicons name="basketball-outline" size={18} color={Colors.green} />
          <Text style={[styles.sectionTitle, { color: Colors.green, marginBottom: 0 }]}>Live Basketball</Text>
        </View>
        <Text style={styles.categoryDesc}>Real-time scores, standings, schedules, stats, and news across NBA, WNBA, and NCAA.</Text>
        {dataFeatures.map((f) => renderCard(f))}

        {/* The Court */}
        <View style={styles.divider} />
        <View style={styles.categoryHeader}>
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.orange} />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>The Court</Text>
        </View>
        <Text style={styles.categoryDesc}>The social hub for basketball fans. Post takes, vote, create polls, and debate.</Text>
        {socialFeatures.map((f) => renderCard(f))}

        {/* Tools */}
        <View style={styles.divider} />
        <View style={styles.categoryHeader}>
          <Ionicons name="build-outline" size={18} color={Colors.courtWood} />
          <Text style={[styles.sectionTitle, { color: Colors.courtWood, marginBottom: 0 }]}>Powerful Tools</Text>
        </View>
        <Text style={styles.categoryDesc}>Free analytics tools: compare players, predict games, optimize fantasy lineups, and more.</Text>
        {toolsFeatures.map((f) => renderCard(f))}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontFamily: Fonts.anton,
    fontSize: 16,
    color: Colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryDesc: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 18,
    marginBottom: 12,
  },
  introText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },

  // --- Court (main feed) ---
  cardCourt: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.orange,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // --- Fire & Brick ---
  cardFire: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
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
    fontSize: 15,
    color: Colors.white,
  },

  // --- Challenge ---
  cardChallenge: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.courtWood,
  },
  challengeHeader: {
    backgroundColor: 'rgba(200,159,108,0.15)',
    paddingVertical: 6,
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

  // --- Poll ---
  cardPoll: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
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
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },

  // --- Score ---
  cardScore: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
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

  // --- Tool ---
  cardTool: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
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

  // --- Standard ---
  cardStandard: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange,
  },

  // --- Shared ---
  cardBody: {
    padding: 14,
  },
  cardName: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardNameLight: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.courtWood,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tapHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
});
