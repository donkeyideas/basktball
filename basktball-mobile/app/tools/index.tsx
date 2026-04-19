import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

const TOOLS = [
  {
    title: 'Advanced Metrics',
    description: 'Deep dive into PER, TS%, VORP, and other advanced analytics.',
    icon: 'analytics-outline' as const,
    route: '/tools/metrics',
    number: '01',
    tags: ['ADVANCED', 'ANALYTICS'],
  },
  {
    title: 'Game Predictor',
    description: 'AI-powered game predictions using historical data and current form.',
    icon: 'flash-outline' as const,
    route: '/tools/predictor',
    number: '02',
    tags: ['AI', 'PREDICTIONS'],
  },
  {
    title: 'Fantasy Optimizer',
    description: 'Maximize your fantasy lineup with smart player recommendations.',
    icon: 'star-outline' as const,
    route: '/tools/fantasy',
    number: '03',
    tags: ['FANTASY', 'OPTIMIZE'],
  },
  {
    title: 'Draft Analyzer',
    description: 'Historical draft data and prospect analysis for upcoming drafts.',
    icon: 'document-text-outline' as const,
    route: '/tools/draft',
    number: '04',
    tags: ['DRAFT', 'PROSPECTS'],
  },
];

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TOOLS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heroTitle}>POWERFUL TOOLS</Text>
        <View style={styles.heroLine} />
        <Text style={styles.heroSubtitle}>
          Free analytics tools for basketball fans. No signup required.
        </Text>

        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.title}
              style={styles.card}
              onPress={() => router.push(tool.route as never)}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Ionicons name={tool.icon} size={20} color={Colors.orange} />
                </View>
                <Text style={styles.cardNumber}>{tool.number}</Text>
              </View>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDesc}>{tool.description}</Text>
              <View style={styles.tagRow}>
                {tool.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>{tag}</Text>
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  heroTitle: {
    fontFamily: Fonts.anton,
    fontSize: 28,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 16,
  },
  heroLine: {
    width: 40,
    height: 3,
    backgroundColor: Colors.orange,
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 2,
  },
  heroSubtitle: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumber: {
    fontFamily: Fonts.anton,
    fontSize: 32,
    color: 'rgba(255,255,255,0.06)',
    letterSpacing: 2,
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
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.orange,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    overflow: 'hidden',
    letterSpacing: 1,
  },
});
