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
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { takeCardImageUrl, takeCardShareUrl, type TakeCardSeed } from '@/lib/config/webRoutes';

type Theme = 'light' | 'dark' | 'orange';
type Template = 'stat-line' | 'comparison' | 'hot-take' | 'quote' | 'ranking';
type Tone = 'analytical' | 'hot-take' | 'short';

type CardSuggestion = {
  id: string;
  league: 'nba' | 'wnba' | 'ncaam' | 'ncaaw';
  leagueLabel: string;
  template: Template;
  theme: Theme;
  tag: string;
  seed: {
    template?: string;
    theme?: string;
    tag?: string;
    headline?: string;
    context?: string;
    meta?: string;
    num?: string;
    unit?: string;
  };
};

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
  const { token } = useAuth();
  const params = useLocalSearchParams<Record<string, string>>();

  // Same auth gate Court uses for posting takes. Users can freely browse and
  // edit the card preview, but any action that publishes / saves requires login.
  const requireAuth = (): boolean => {
    if (token) return true;
    Alert.alert(
      'Sign In to Share',
      'Create an account or sign in to post and share your take cards.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login' as never) },
      ],
    );
    return false;
  };

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
  const [showFields, setShowFields] = useState(true);

  // Auto-populated suggestion deck (refreshed by server cron 3×/day from ESPN news).
  const [suggestions, setSuggestions] = useState<CardSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSuggestionsLoading(true);
    api
      .get<{ suggestions: CardSuggestion[] }>('/cards/suggestions')
      .then((d) => {
        if (!cancelled && d?.suggestions?.length) {
          const seen = new Set<string>();
          const unique = d.suggestions.filter((s: CardSuggestion) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          });
          setSuggestions(unique);
        }
      })
      .catch(() => {
        /* silent — suggestions are optional UI */
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applySuggestion = (s: CardSuggestion) => {
    const seed = s.seed;
    if (seed.template) setTemplate(seed.template as Template);
    if (seed.theme) setTheme(seed.theme as Theme);
    if (seed.headline !== undefined) setHeadline(seed.headline);
    if (seed.context !== undefined) setContext(seed.context);
    if (seed.meta !== undefined) setMeta(seed.meta);
    if (seed.num !== undefined) setNum(seed.num);
    if (seed.unit !== undefined) setUnit(seed.unit);
  };

  // Per-template starter content. Shown the moment a template is picked so the
  // preview always has something meaningful — the user edits in place.
  const templateStarter = (id: Template): { headline?: string; num?: string; unit?: string; context?: string } => {
    switch (id) {
      case 'stat-line':
        return { num: '19', unit: 'REBOUNDS', context: "Nikola Jokić grabbed 19 boards in Denver's win over the Lakers — his 15th career triple-double vs LAL." };
      case 'comparison':
        return { headline: 'JOKIĆ | EMBIID', context: 'Head-to-head this season. Jokić 31.4/13.2/10.8 on 64% TS. Embiid 29.1/10.4/4.2 on 61% TS in 8 fewer games.' };
      case 'hot-take':
        return { headline: 'JOKIĆ IS THE BEST PASSING BIG EVER', context: 'A center averaging 10+ assists through 65 games while shooting 57% from the field. That has never happened.' };
      case 'quote':
        return { headline: '"BEST PLAYER ALIVE."', context: "— Joel Embiid on Nikola Jokić after the Sixers vs Nuggets matchup, March 2026." };
      case 'ranking':
        return { headline: 'JOKIĆ | SGA | LUKA | TATUM | GIANNIS', context: 'MVP race standings through April. Voter ballots due May 5.' };
      default:
        return {};
    }
  };

  const onPickTemplate = (id: Template) => {
    setTemplate(id);
    const starter = templateStarter(id);
    if (id === 'stat-line') {
      if (starter.num) setNum(starter.num);
      if (starter.unit) setUnit(starter.unit);
    } else if (starter.headline) {
      setHeadline(starter.headline);
    }
    if (starter.context) setContext(starter.context);
  };

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
      // Explicit so production (which may still cache the old default) shows
      // the right brand even before the latest deploy lands.
      brand: 'BASKTBALL.COM',
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
    if (!requireAuth()) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    Linking.openURL(url).catch(() => {});
  };

  const onPostFacebook = () => {
    if (!requireAuth()) return;
    // Facebook sharer scrapes the shared URL and pulls the OG image from /share/take meta.
    const fbCaption = caption.slice(0, 280);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(fbCaption)}`;
    Linking.openURL(url).catch(() => {});
  };

  const onPostReddit = () => {
    if (!requireAuth()) return;
    const title = (caption || `${num} ${unit}`).slice(0, 300);
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    Linking.openURL(url).catch(() => {});
  };

  const onPostInstagram = async () => {
    if (!requireAuth()) return;
    // Instagram has no public post-URL API. Best UX: try to open the IG app
    // (so the user can paste/share manually); fall back to the native share
    // sheet (which still lists IG as a destination on most phones).
    try {
      const canOpen = await Linking.canOpenURL('instagram://app');
      if (canOpen) {
        await Linking.openURL('instagram://app');
        return;
      }
    } catch {
      /* fall through */
    }
    await onShare();
  };

  const onShare = async () => {
    if (!requireAuth()) return;
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

  // Whole-screen auth gate: same pattern as the Profile tab. Card creation
  // requires an account so attributions ("@handle / shared by") match a real
  // user. Without a token we render a Sign In prompt instead of the editor.
  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <View style={styles.headerBtn} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>TAKE CARD</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.authGate}>
          <View style={styles.authAvatar}>
            <Ionicons name="person" size={56} color={colors.textSecondary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Sign in to create a Take Card</Text>
          <Text style={[styles.authSub, { color: colors.textSecondary }]}>
            Build shareable stat cards, post directly to X, Instagram, Facebook, and Reddit.
          </Text>
          <TouchableOpacity
            style={styles.authPrimaryBtn}
            onPress={() => router.push('/(auth)/login' as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.authPrimaryText}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup' as never)} hitSlop={10}>
            <Text style={styles.authSecondaryText}>Don't have an account? Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
                cachePolicy="none"
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

        {/* Auto-populated suggestion deck */}
        {(suggestionsLoading || suggestions.length > 0) && (
          <>
            <View style={styles.suggHeader}>
              <Text style={[styles.ctrlLabel, { color: colors.textSecondary }]}>TODAY'S CARDS</Text>
              <Text style={[styles.suggSub, { color: colors.textTertiary }]}>
                FROM ESPN · TAP TO LOAD
              </Text>
            </View>
            {suggestionsLoading && suggestions.length === 0 ? (
              <View style={[styles.suggLoading, { backgroundColor: colors.surface }]}>
                <ActivityIndicator color={Colors.orange} size="small" />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggRow}
              >
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.suggCard,
                      s.theme === 'light' && styles.suggCardLight,
                      s.theme === 'dark' && styles.suggCardDark,
                      s.theme === 'orange' && styles.suggCardOrange,
                    ]}
                    onPress={() => applySuggestion(s)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.suggCardHead}>
                      <Text
                        style={[
                          styles.suggLeague,
                          s.theme === 'orange' ? styles.suggOnLight : null,
                          s.theme === 'light' ? styles.suggOnLight : null,
                        ]}
                      >
                        {s.leagueLabel}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.suggHeadline,
                        s.theme === 'orange' ? styles.suggOnLight : null,
                        s.theme === 'light' ? styles.suggOnLight : null,
                      ]}
                      numberOfLines={4}
                    >
                      {s.seed.headline}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}

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
                onPress={() => onPickTemplate(t.id)}
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

        {/* Action buttons — X joins the row of 3 (4 across, equal sizing) */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialBtn, styles.socialX]} onPress={onPostX} activeOpacity={0.85}>
            <Ionicons name="logo-x" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.socialIG]} onPress={onPostInstagram} activeOpacity={0.85}>
            <Ionicons name="logo-instagram" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.socialFB]} onPress={onPostFacebook} activeOpacity={0.85}>
            <Ionicons name="logo-facebook" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.socialReddit]} onPress={onPostReddit} activeOpacity={0.85}>
            <Ionicons name="logo-reddit" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

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
  suggHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  suggSub: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  suggLoading: {
    height: 110,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  suggRow: { gap: 10, paddingBottom: 4, marginBottom: 16 },
  suggCard: {
    width: 200,
    minHeight: 130,
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  suggCardLight: { backgroundColor: '#F5F1EA' },
  suggCardDark: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  suggCardOrange: { backgroundColor: Colors.orange },
  suggCardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  suggLeague: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#fff',
    opacity: 0.85,
    fontWeight: '700',
  },
  suggOnLight: { color: '#0a0a0a' },
  suggHeadline: {
    fontFamily: Fonts.anton,
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 18,
    color: '#fff',
  },
  socialRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  socialX: { backgroundColor: '#0a0a0a' },
  socialIG: { backgroundColor: '#E4405F' },
  socialFB: { backgroundColor: '#1877F2' },
  socialReddit: { backgroundColor: '#FF4500' },
  authGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  authAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(120,120,120,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  authTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '800',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  authSub: {
    fontFamily: Fonts.barlow,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  authPrimaryBtn: {
    backgroundColor: Colors.orange,
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 12,
    marginBottom: 18,
  },
  authPrimaryText: {
    color: '#fff',
    fontFamily: Fonts.barlowBold,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 2,
  },
  authSecondaryText: {
    color: Colors.orange,
    fontFamily: Fonts.barlow,
    fontSize: 14,
  },
  socialBtnText: {
    color: '#fff',
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.2,
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
