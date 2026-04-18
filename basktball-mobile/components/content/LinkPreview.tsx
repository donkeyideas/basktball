import { memo, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { Colors, Fonts } from '@/constants/Colors';

interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  url: string;
}

// Detect direct GIF URLs (GIPHY media links, etc.)
function extractGifUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('giphy.com') && u.pathname.includes('/giphy.gif')) {
      return url.split('?')[0];
    }
    if ((u.hostname === 'giphy.com' || u.hostname === 'www.giphy.com') && u.pathname.startsWith('/gifs/')) {
      const match = u.pathname.match(/\/gifs\/(?:.*-)?([a-zA-Z0-9]+)$/);
      if (match) return `https://media.giphy.com/media/${match[1]}/giphy.gif`;
    }
    if (u.pathname.endsWith('.gif')) return url;
  } catch { /* ignore */ }
  return null;
}

const URL_REGEX = /https?:\/\/[^\s<>"\])}]+/gi;

const ogCache = new Map<string, OgData>();

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

export function stripFirstUrl(text: string): string {
  const url = extractFirstUrl(text);
  if (!url) return text;
  return text.replace(url, '').replace(/\n{2,}$/g, '').trimEnd();
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function extractOgFromHtml(html: string, baseUrl: URL): OgData {
  function getMeta(property: string): string | null {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeHtmlEntities(m[1]);
    }
    return null;
  }

  let title = getMeta('og:title') ?? getMeta('twitter:title');
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch?.[1]) title = decodeHtmlEntities(titleMatch[1].trim());
  }

  const description = getMeta('og:description') ?? getMeta('twitter:description') ?? getMeta('description');

  let image = getMeta('og:image') ?? getMeta('twitter:image');
  if (image && !image.startsWith('http')) {
    try {
      image = new URL(image, baseUrl.origin).href;
    } catch {
      image = null;
    }
  }

  const siteName = getMeta('og:site_name');

  let favicon: string | null = null;
  const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']*)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i);
  if (iconMatch?.[1]) {
    favicon = iconMatch[1];
    if (!favicon.startsWith('http')) {
      try {
        favicon = new URL(favicon, baseUrl.origin).href;
      } catch {
        favicon = `${baseUrl.origin}/favicon.ico`;
      }
    }
  } else {
    favicon = `${baseUrl.origin}/favicon.ico`;
  }

  return {
    title: title || null,
    description: description || null,
    image: image || null,
    siteName: siteName || null,
    favicon,
    url: baseUrl.href,
  };
}

// ---- YouTube helpers ----

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com' || u.hostname === 'm.youtube.com') && u.pathname === '/watch') {
      return u.searchParams.get('v');
    }
    const pathMatch = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?&]+)/);
    if (pathMatch && u.hostname.includes('youtube.com')) {
      return pathMatch[2];
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split(/[?/]/)[0] || null;
    }
  } catch { /* ignore */ }
  return null;
}

async function fetchYouTubeOg(url: string, videoId: string): Promise<OgData | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;

    const data = await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      title: data.title || null,
      description: data.author_name ? `Video by ${data.author_name}` : null,
      image: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      siteName: 'YouTube',
      favicon: 'https://www.youtube.com/favicon.ico',
      url,
    };
  } catch {
    return {
      title: null,
      description: null,
      image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      siteName: 'YouTube',
      favicon: 'https://www.youtube.com/favicon.ico',
      url,
    };
  }
}

function isTwitterUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === 'twitter.com' || h === 'www.twitter.com' || h === 'x.com' || h === 'www.x.com';
  } catch { return false; }
}

async function fetchOgData(url: string): Promise<OgData | null> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    const ytId = extractYouTubeId(url);
    if (ytId) return fetchYouTubeOg(url, ytId);

    if (isTwitterUrl(url)) {
      return {
        title: 'Post on X',
        description: null,
        image: null,
        siteName: 'X (Twitter)',
        favicon: 'https://abs.twimg.com/favicons/twitter.3.ico',
        url,
      };
    }

    // Instagram blocks scraping — return fallback
    try {
      const h = new URL(url).hostname;
      if (h.includes('instagram.com')) {
        return {
          title: 'Instagram Post',
          description: null,
          image: null,
          siteName: 'Instagram',
          favicon: 'https://www.instagram.com/favicon.ico',
          url,
        };
      }
      if (h.includes('tiktok.com')) {
        return {
          title: 'TikTok Video',
          description: null,
          image: null,
          siteName: 'TikTok',
          favicon: 'https://www.tiktok.com/favicon.ico',
          url,
        };
      }
    } catch { /* ignore */ }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BasktballBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) return null;

    const text = await res.text();
    const html = text.slice(0, 50 * 1024);

    const og = extractOgFromHtml(html, parsed);
    return og.title || og.description || og.image ? og : null;
  } catch {
    return null;
  }
}

// ---- Video embed detection ----

interface VideoEmbed {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitch';
  embedUrl: string;
}

const YT_PLAYER_BASE_URL = 'https://lonelycpp.github.io';

function buildYouTubeHtml(videoId: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;overflow:hidden}body{background:#000}#player{width:100vw;height:100vh}</style>
</head><body>
<div id="player"></div>
<script>
var tag=document.createElement('script');
tag.src='https://www.youtube.com/iframe_api';
document.head.appendChild(tag);
function onYouTubeIframeAPIReady(){
new YT.Player('player',{
videoId:'${videoId}',
playerVars:{playsinline:1,autoplay:1,rel:0,modestbranding:1,fs:1,origin:'${YT_PLAYER_BASE_URL}'},
events:{onReady:function(e){e.target.playVideo()}}
});}
</script>
</body></html>`;
}

function detectVideoEmbed(url: string): VideoEmbed | null {
  const ytId = extractYouTubeId(url);
  if (ytId) return { platform: 'youtube', embedUrl: ytId };

  try {
    const u = new URL(url);
    const tiktokMatch = u.pathname.match(/\/@[^/]+\/video\/(\d+)/);
    if (u.hostname.includes('tiktok.com') && tiktokMatch) {
      return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}` };
    }
    const instaPost = u.pathname.match(/\/(?:reels?|p)\/([A-Za-z0-9_-]+)/);
    if (u.hostname.includes('instagram.com') && instaPost) {
      return { platform: 'instagram', embedUrl: `https://www.instagram.com/p/${instaPost[1]}/embed` };
    }
    const twitchClip = url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/) || u.pathname.match(/\/clip\/([A-Za-z0-9_-]+)/);
    if (u.hostname.includes('twitch.tv') && twitchClip) {
      return { platform: 'twitch', embedUrl: `https://clips.twitch.tv/embed?clip=${twitchClip[1]}&parent=localhost` };
    }
  } catch { /* ignore */ }
  return null;
}

// Injected JS to measure actual embed content height and send it back to RN
const MEASURE_HEIGHT_JS = `
(function(){
  var last=0;
  function send(){
    var h=Math.max(document.documentElement.scrollHeight||0,document.body.scrollHeight||0);
    if(h>50&&h!==last){last=h;window.ReactNativeWebView.postMessage(JSON.stringify({type:'resize',height:h}));}
  }
  if(window.MutationObserver){new MutationObserver(send).observe(document.documentElement,{childList:true,subtree:true,attributes:true});}
  setInterval(send,500);
  send();
})();true;
`;

interface LinkPreviewProps {
  content: string;
}

export const LinkPreview = memo(function LinkPreview({ content }: LinkPreviewProps) {
  const [ogData, setOgData] = useState<OgData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [embedHeight, setEmbedHeight] = useState(500);
  const shimmerAnim = useMemo(() => new Animated.Value(0), []);

  const url = extractFirstUrl(content);
  const videoEmbed = url ? detectVideoEmbed(url) : null;

  useEffect(() => {
    if (!loading) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loading, shimmerAnim]);

  useEffect(() => {
    if (!url) return;
    if (extractGifUrl(url)) return;

    const cached = ogCache.get(url);
    if (cached) {
      setOgData(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchOgData(url).then((data) => {
      if (cancelled) return;
      if (data) {
        ogCache.set(url, data);
        setOgData(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [url]);

  if (!url) return null;

  // GIF URLs: render image directly
  const gifUrl = extractGifUrl(url);
  if (gifUrl) {
    return (
      <View style={styles.card}>
        <Image source={{ uri: gifUrl }} style={{ width: '100%', height: 250 }} contentFit="contain" />
      </View>
    );
  }

  // Only hide on error for non-video embeds; video embeds show a play button regardless
  if (error && !videoEmbed) {
    // Fallback: show a minimal domain card so there's always a preview
    const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
    return (
      <Pressable style={styles.card} onPress={() => Linking.openURL(url)}>
        <View style={styles.info}>
          <Text style={styles.siteName} numberOfLines={1}>{domain.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={1}>{url}</Text>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });
    return (
      <View style={styles.skeleton}>
        <Animated.View style={[styles.skeletonImg, { opacity }]} />
        <View style={styles.skeletonInfo}>
          <Animated.View style={[styles.skeletonLine, { width: '60%', opacity }]} />
          <Animated.View style={[styles.skeletonLine, { width: '80%', opacity }]} />
          <Animated.View style={[styles.skeletonLine, { width: '40%', opacity }]} />
        </View>
      </View>
    );
  }

  // Build effective OG data — fallback when fetch fails for video embeds
  const platformNames: Record<string, string> = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', twitch: 'Twitch' };
  const effectiveOgData = ogData ?? (error && videoEmbed ? {
    title: `Watch on ${platformNames[videoEmbed.platform] || 'Video'}`,
    description: null,
    image: null,
    siteName: platformNames[videoEmbed.platform] || null,
    favicon: null,
    url: url,
  } : null);

  if (!effectiveOgData) return null;

  // If playing, show embedded video via WebView
  if (videoEmbed && playing) {
    const isVertical = videoEmbed.platform === 'tiktok' || videoEmbed.platform === 'instagram';

    if (videoEmbed.platform === 'youtube') {
      return (
        <View style={styles.videoContainer}>
          <WebView
            source={{ html: buildYouTubeHtml(videoEmbed.embedUrl), baseUrl: YT_PLAYER_BASE_URL }}
            style={[styles.videoWebView, { height: 220 }]}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled={false}
            nestedScrollEnabled={false}
            bounces={false}
          />
        </View>
      );
    }

    // Instagram/TikTok: dynamically measure embed content height
    return (
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: videoEmbed.embedUrl }}
          style={[styles.videoWebView, { height: embedHeight }]}
          injectedJavaScript={MEASURE_HEIGHT_JS}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'resize' && msg.height > 0) {
                setEmbedHeight(Math.min(msg.height, 800));
              }
            } catch {}
          }}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      </View>
    );
  }

  const displayDomain = (() => {
    try {
      return new URL(effectiveOgData.url).hostname.replace(/^www\./, '');
    } catch {
      return effectiveOgData.url;
    }
  })();

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        if (videoEmbed) {
          setPlaying(true);
        } else {
          Linking.openURL(effectiveOgData.url);
        }
      }}
    >
      {effectiveOgData.image && !imgError && (
        <View>
          <Image
            source={{ uri: effectiveOgData.image }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImgError(true)}
          />
          {videoEmbed && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <View style={styles.playTriangle} />
              </View>
            </View>
          )}
        </View>
      )}
      {/* Play button for video embeds without image */}
      {!effectiveOgData.image && videoEmbed && !playing && (
        <View style={styles.noImagePlayContainer}>
          <View style={styles.playButton}>
            <View style={styles.playTriangle} />
          </View>
          <Text style={styles.tapToPlay}>Tap to play</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.siteRow}>
          {effectiveOgData.favicon && (
            <Image
              source={{ uri: effectiveOgData.favicon }}
              style={styles.favicon}
              contentFit="contain"
            />
          )}
          <Text style={styles.siteName} numberOfLines={1}>
            {effectiveOgData.siteName || displayDomain}
          </Text>
        </View>
        {effectiveOgData.title && (
          <Text style={styles.title} numberOfLines={2}>
            {effectiveOgData.title}
          </Text>
        )}
        {effectiveOgData.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {effectiveOgData.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  info: {
    padding: 10,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  siteName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 3,
  },
  desc: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  skeleton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
  },
  skeletonImg: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonLine: {
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  skeletonInfo: {
    padding: 12,
  },
  videoContainer: {
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoWebView: {
    backgroundColor: '#000',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  noImagePlayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tapToPlay: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
});
