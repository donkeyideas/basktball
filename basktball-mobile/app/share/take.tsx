import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Linking,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';
import { takeCardImageUrl, takeCardShareUrl, type TakeCardSeed } from '@/lib/config/webRoutes';

type Theme = 'light' | 'dark' | 'orange';
type Template = 'stat-line' | 'comparison' | 'hot-take' | 'quote' | 'ranking';
type Tone = 'analytical' | 'hot-take' | 'short';

const TEMPLATES: { id: Template; label: string; tag: string }[] = [
  { id: 'stat-line', label: 'Stat Line', tag: 'STAT LINE' },
  { id: 'comparison', label: 'Comparison', tag: 'COMPARISON' },
  { id: 'hot-take', label: 'Hot Take', tag: 'HOT TAKE' },
  { id: 'quote', label: 'Quote', tag: 'QUOTE' },
  { id: 'ranking', label: 'Ranking', tag: 'RANKING' },
];

const TONES: { id: Tone; label: string }[] = [
  { id: 'analytical', label: 'ANALYTICAL' },
  { id: 'hot-take', label: 'HOT TAKE' },
  { id: 'short', label: 'SHORT' },
];

export default function TakeCardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<Record<string, string>>();

  const [theme, setTheme] = useState<Theme>((params.theme as Theme) || 'orange');
  const [template, setTemplate] = useState<Template>(
    (params.template as Template) || 'stat-line',
  );
  const [num, setNum] = useState(params.num || '19');
  const [unit, setUnit] = useState(params.unit || 'REBOUNDS');
  const [headline, setHeadline] = useState(params.headline || '');
  const [context, setContext] = useState(
    params.context ||
      "Nikola Jokić grabbed 19 boards in Denver's win over the Lakers — his 15th career triple-double vs LAL.",
  );
  const [meta, setMeta] = useState(params.meta || 'DEN 121  LAL 108');
  const [handle] = useState(params.handle || 'basktball');
  const [avatar] = useState((params.avatar || 'BB').toUpperCase().slice(0, 2));
  const [tone, setTone] = useState<Tone>('analytical');
  const [caption, setCaption] = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [includeLink, setIncludeLink] = useState(true);
  const [showFields, setShowFields] = useState(false);

  const seed: TakeCardSeed = useMemo(
    () => ({
      template,
      theme,
      tag: TEMPLATES.find((t) => t.id === template)?.tag,
      num,
      unit,
      headline,
      context,
      meta,
      handle,
      avatar,
    }),
    [template, theme, num, unit, headline, context, meta, handle, avatar],
  );

  const imageUrl = useMemo(() => takeCardImageUrl(seed), [seed]);
  const shareUrl = useMemo(() => takeCardShareUrl(seed), [seed]);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [imageUrl]);

  useEffect(() => {
    let cancelled = false;
    setCaptionLoading(true);
    api
      .post<{ caption?: string }>('/card/caption', {
        tone,
        template,
        num,
        unit,
        headline,
        context,
        meta,
      })
      .then((d) => {
        if (!cancelled) setCaption(d.caption || fallbackCaption({ num, unit, headline, context }, tone));
      })
      .catch(() => {
        if (!cancelled) setCaption(fallbackCaption({ num, unit, headline, context }, tone));
      })
      .finally(() => {
        if (!cancelled) setCaptionLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // refetch only when tone or template changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone, template]);

  const tweetText = useMemo(() => {
    const parts = [caption];
    if (includeLink) parts.push(shareUrl);
    return parts.filter(Boolean).join(' ');
  }, [caption, includeLink, shareUrl]);

  const onPostX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    Linking.openURL(url).catch(() => {});
  };

  const onShare = async () => {
    try {
      await Share.share({
        title: headline || `${num} ${unit}`,
        message: includeLink ? `${caption}\n${shareUrl}` : caption,
        url: shareUrl,
      });
    } catch {
      /* user dismissed */
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        {/* Spacer — FloatingMenu's hamburger button overlays this position */}
        <View style={styles.headerBtn} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>TAKE CARD</Text>
        <TouchableOpacity onPress={onShare} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Card preview */}
        <View style={[styles.previewWrap, { borderColor: colors.border }]}>
          <View style={styles.canvasLabel}>
            <Text style={[styles.canvasLabelText, { color: colors.textSecondary }]}>
              PREVIEW · 4:5
            </Text>
            <Text style={styles.savedTag}>● AUTO-SAVED</Text>
          </View>
          <View style={[styles.canvas, { backgroundColor: isDark ? '#050505' : '#E8E2D5' }]}>
            {!imageError && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="contain"
                onLoadStart={() => {
                  setImageLoading(true);
                  setImageError(false);
                }}
                onLoad={() => {
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                transition={150}
              />
            )}
            {imageLoading && !imageError && (
              <View style={styles.imageLoading}>
                <ActivityIndicator color={Colors.orange} />
                <Text style={[styles.imageLoadingText, { color: colors.textSecondary }]}>
                  Generating card…
                </Text>
              </View>
            )}
            {imageError && (
              <View style={styles.imageErrorBox}>
                <Ionicons name="cloud-offline-outline" size={32} color={Colors.orange} />
                <Text style={[styles.imageErrorTitle, { color: colors.text }]}>
                  Card service not reachable
                </Text>
                <Text style={[styles.imageErrorBody, { color: colors.textSecondary }]}>
                  The OG image route at{'\n'}
                  <Text style={styles.imageErrorMono}>{imageUrl.replace(/^https?:\/\//, '').split('?')[0]}</Text>
                  {'\n'}returned an error. Deploy your latest web changes, or set{' '}
                  <Text style={styles.imageErrorMono}>EXPO_PUBLIC_API_BASE</Text> to a dev server with the new routes.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Template */}
        <Text style={[styles.ctrlLabel, { color: colors.textSecondary }]}>TEMPLATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {TEMPLATES.map((t) => {
            const active = template === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  active && styles.chipActive,
                ]}
                onPress={() => setTemplate(t.id)}
              >
                <Text style={[styles.chipText, { color: colors.text }, active && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Theme */}
        <Text style={[styles.ctrlLabel, { color: colors.textSecondary }]}>THEME</Text>
        <View style={styles.swatchRow}>
          {(['light', 'dark', 'orange'] as Theme[]).map((th) => {
            const active = theme === th;
            return (
              <TouchableOpacity
                key={th}
                style={[
                  styles.swatch,
                  th === 'light' && styles.swatchLight,
                  th === 'dark' && styles.swatchDark,
                  th === 'orange' && styles.swatchOrange,
                  active && styles.swatchActive,
                ]}
                onPress={() => setTheme(th)}
                activeOpacity={0.8}
              >
                <Text style={styles.swatchLabel}>
                  {th === 'light' ? 'LIGHT' : th === 'dark' ? 'DARK' : 'BRAND'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Edit text toggle */}
        <TouchableOpacity
          style={[styles.editToggle, { borderColor: colors.border }]}
          onPress={() => setShowFields((v) => !v)}
        >
          <Text style={[styles.editToggleText, { color: colors.text }]}>
            {showFields ? 'HIDE TEXT FIELDS −' : 'EDIT TEXT FIELDS +'}
          </Text>
        </TouchableOpacity>

        {showFields && (
          <View style={[styles.fieldsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {template === 'stat-line' && (
              <>
                <Field label="Big Number" value={num} onChange={setNum} colors={colors} />
                <Field label="Unit (REBOUNDS)" value={unit} onChange={(v) => setUnit(v.toUpperCase())} colors={colors} />
              </>
            )}
            {(template === 'hot-take' || template === 'quote') && (
              <Field label="Headline" value={headline} onChange={setHeadline} colors={colors} multiline />
            )}
            {template === 'comparison' && (
              <Field
                label="Left | Right (JOKIC | EMBIID)"
                value={headline}
                onChange={setHeadline}
                colors={colors}
              />
            )}
            {template === 'ranking' && (
              <Field
                label="Items separated by | (max 5)"
                value={headline}
                onChange={setHeadline}
                colors={colors}
                multiline
              />
            )}
            <Field label="Context paragraph" value={context} onChange={setContext} colors={colors} multiline />
            <Field label="Meta line" value={meta} onChange={setMeta} colors={colors} />
          </View>
        )}

        {/* Caption */}
        <Text style={[styles.ctrlLabel, { color: colors.textSecondary }]}>CAPTION · AI-DRAFTED</Text>
        <View style={[styles.captionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={captionLoading ? 'Generating…' : caption}
            onChangeText={setCaption}
            multiline
            style={[styles.captionInput, { color: colors.text }]}
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.toneRow}>
            {TONES.map((t) => {
              const active = tone === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.toneChip,
                    { borderColor: colors.border },
                    active && styles.toneChipActive,
                  ]}
                  onPress={() => setTone(t.id)}
                >
                  <Text style={[styles.toneChipText, { color: colors.textSecondary }, active && styles.toneChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Link toggle */}
        <TouchableOpacity
          style={[styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setIncludeLink((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={styles.linkRowText}>
            <Text style={[styles.linkRowTitle, { color: colors.text }]}>Include link back to app</Text>
            <Text style={[styles.linkRowSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {shareUrl.replace(/^https?:\/\//, '')}
            </Text>
          </View>
          <View style={[styles.toggleTrack, includeLink && styles.toggleTrackOn]}>
            <View style={[styles.toggleKnob, includeLink && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>

        {/* Action buttons */}
        <TouchableOpacity style={styles.btnPostX} onPress={onPostX} activeOpacity={0.85}>
          <View style={styles.xMark}>
            <Text style={styles.xMarkText}>X</Text>
          </View>
          <Text style={styles.btnPostXText}>POST ON X</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btnSec, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={onShare}>
            <Text style={[styles.btnSecText, { color: colors.text }]}>SHARE…</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSec, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => Linking.openURL(imageUrl).catch(() => {})}
          >
            <Text style={[styles.btnSecText, { color: colors.text }]}>OPEN PNG</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  colors: { background: string; surface: string; text: string; textSecondary: string; border: string };
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        style={[fieldStyles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function fallbackCaption(
  input: { num?: string; unit?: string; headline?: string; context?: string },
  tone: Tone,
): string {
  const base =
    input.context ||
    [input.num, input.unit, input.headline].filter(Boolean).join(' ').trim() ||
    'A wild stat from basktball.';
  if (tone === 'short') return base.split(/[.!]/)[0].slice(0, 120);
  if (tone === 'hot-take') return `Hot take: ${base}`;
  return base;
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: Fonts.barlow,
    fontSize: 13,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.anton, fontSize: 18, letterSpacing: 1.5 },
  scroll: { padding: 16, paddingBottom: 0 },
  previewWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  canvasLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  canvasLabelText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  savedTag: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.orange,
    letterSpacing: 1.5,
  },
  canvas: {
    aspectRatio: 4 / 5,
    backgroundColor: '#050505',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageLoadingText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  imageErrorBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageErrorTitle: {
    fontFamily: Fonts.anton,
    fontSize: 15,
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: 'center',
  },
  imageErrorBody: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  imageErrorMono: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.orange,
  },
  ctrlLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  chipsRow: { gap: 8, paddingBottom: 4, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  chipText: { fontFamily: Fonts.barlowBold, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: '#0a0a0a' },
  swatchRow: { flexDirection: 'row', gap: 14, marginBottom: 16, marginTop: 4 },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  swatchLight: { backgroundColor: '#f5f1ea' },
  swatchDark: { backgroundColor: '#0a0a0a', borderColor: '#333' },
  swatchOrange: { backgroundColor: Colors.orange },
  swatchActive: { borderColor: Colors.orange },
  swatchLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(0,0,0,0.55)',
    letterSpacing: 1,
  },
  editToggle: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  editToggleText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  fieldsBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  captionBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  captionInput: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 64,
    padding: 0,
    textAlignVertical: 'top',
  },
  toneRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  toneChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 5,
  },
  toneChipActive: { borderColor: Colors.orange },
  toneChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  toneChipTextActive: { color: Colors.orange },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  linkRowText: { flex: 1 },
  linkRowTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '600',
    fontSize: 14,
  },
  linkRowSub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: Colors.orange },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  toggleKnobOn: { transform: [{ translateX: 20 }], backgroundColor: '#0a0a0a' },
  btnPostX: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  xMark: {
    width: 26,
    height: 26,
    backgroundColor: '#000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xMarkText: { color: '#fff', fontFamily: Fonts.anton, fontSize: 14 },
  btnPostXText: {
    color: '#000',
    fontFamily: Fonts.barlowBold,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 2,
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  btnSec: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
