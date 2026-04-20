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

function extractTweetId(url: string): string | null {
  try {
    const m = new URL(url).pathname.match(/\/status\/(\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
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

    // Instagram: try oEmbed, then HTML scraping for og:image
    if (parsed.hostname.includes('instagram.com')) {
      let title = 'Instagram Post';
      let description: string | null = null;
      let image: string | null = null;

      // Try oEmbed API first
      try {
        const oRes = await fetch(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&maxwidth=480`);
        if (oRes.ok) {
          const d = await oRes.json() as { title?: string; author_name?: string; thumbnail_url?: string };
          title = d.title || d.author_name || title;
          description = d.author_name ? `@${d.author_name}` : null;
          image = d.thumbnail_url || null;
        }
      } catch { /* continue */ }

      // If no thumbnail from oEmbed, try scraping og:image from HTML
      if (!image) {
        try {
          const htmlRes = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
              Accept: 'text/html',
            },
          });
          if (htmlRes.ok) {
            const html = (await htmlRes.text()).slice(0, 50000);
            const og = extractOgFromHtml(html, parsed);
            if (og.image) image = og.image;
            if (!description && og.title) title = og.title;
          }
        } catch { /* ignore */ }
      }

      return {
        title,
        description,
        image,
        siteName: 'Instagram',
        favicon: 'https://www.instagram.com/favicon.ico',
        url,
      };
    }

    // TikTok: try oEmbed, then HTML scraping for thumbnail
    if (parsed.hostname.includes('tiktok.com')) {
      let title = 'TikTok Video';
      let description: string | null = null;
      let image: string | null = null;

      try {
        const oRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        if (oRes.ok) {
          const d = await oRes.json() as { title?: string; author_name?: string; thumbnail_url?: string };
          title = d.title || title;
          description = d.author_name ? `@${d.author_name}` : null;
          image = d.thumbnail_url || null;
        }
      } catch { /* continue */ }

      if (!image) {
        try {
          const htmlRes = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
              Accept: 'text/html',
            },
          });
          if (htmlRes.ok) {
            const html = (await htmlRes.text()).slice(0, 50000);
            const og = extractOgFromHtml(html, parsed);
            if (og.image) image = og.image;
            if (!description && og.title) title = og.title;
          }
        } catch { /* ignore */ }
      }

      return {
        title,
        description,
        image,
        siteName: 'TikTok',
        favicon: 'https://www.tiktok.com/favicon.ico',
        url,
      };
    }

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
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitch' | 'twitter';
  embedUrl: string;
}

// Base URL for YouTube IFrame API — must be a real third-party domain so
// the WebView origin matches the `origin` playerVar YouTube checks.
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

function buildTwitterEmbedHtml(tweetId: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}body{background:#1a1a1a;display:flex;justify-content:center;min-height:100vh}</style>
</head><body><div id="tweet"></div>
<script src="https://platform.twitter.com/widgets.js"></script>
<script>
twttr.ready(function(twttr){
  twttr.widgets.createTweet('${tweetId}',document.getElementById('tweet'),{
    theme:'dark',dnt:true,align:'center'
  }).then(function(el){
    if(el){
      setTimeout(function(){
        var h=document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',height:h}));
      },500);
      setTimeout(function(){
        var h=document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',height:h}));
      },2000);
    }
  });
});
</script></body></html>`;
}

/**
 * Wraps an embed URL inside a tall iframe (2000px) so the embed gets
 * plenty of room to lay out. The outer RN View clips at the desired
 * height so only the header + video are visible, avoiding the Android
 * issue where direct loading squishes content.
 */
function buildEmbedWrapper(embedUrl: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:transparent}
iframe{width:100%;height:2000px;border:none}
</style></head><body>
<iframe src="${embedUrl}" scrolling="no" allowfullscreen
 allow="autoplay;encrypted-media" referrerpolicy="no-referrer-when-downgrade"></iframe>
<script>
window.addEventListener('message',function(e){
  try{
    var d=typeof e.data==='string'?JSON.parse(e.data):e.data;
    if(d&&d.details&&d.details.height){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',height:Math.ceil(d.details.height)}));
    }
  }catch(ex){}
});
</script></body></html>`;
}

function detectVideoEmbed(url: string): VideoEmbed | null {
  const ytId = extractYouTubeId(url);
  if (ytId) return { platform: 'youtube', embedUrl: ytId };

  try {
    const u = new URL(url);
    // TikTok
    const tiktokMatch = u.pathname.match(/\/@[^/]+\/video\/(\d+)/);
    if (u.hostname.includes('tiktok.com') && tiktokMatch) {
      return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}` };
    }
    if (u.hostname === 'vm.tiktok.com') {
      const shortId = u.pathname.replace(/^\//, '').split('/')[0];
      if (shortId) return { platform: 'tiktok', embedUrl: url };
    }
    // Instagram
    const instaReel = u.pathname.match(/\/reels?\/([A-Za-z0-9_-]+)/);
    const instaPost = u.pathname.match(/\/p\/([A-Za-z0-9_-]+)/);
    if (u.hostname.includes('instagram.com') && (instaReel || instaPost)) {
      const id = instaReel ? instaReel[1] : instaPost![1];
      const type = instaReel ? 'reel' : 'p';
      return { platform: 'instagram', embedUrl: `https://www.instagram.com/${type}/${id}/embed/` };
    }
    // Twitch clips
    const twitchClip = url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/) || u.pathname.match(/\/clip\/([A-Za-z0-9_-]+)/);
    if (u.hostname.includes('twitch.tv') && twitchClip) {
      return { platform: 'twitch', embedUrl: `https://clips.twitch.tv/embed?clip=${twitchClip[1]}&parent=localhost` };
    }
    // Twitter/X
    const tweetId = extractTweetId(url);
    if (isTwitterUrl(url) && tweetId) {
      return { platform: 'twitter', embedUrl: tweetId };
    }
  } catch { /* ignore */ }
  return null;
}


interface LinkPreviewProps {
  content: string;
}

export const LinkPreview = memo(function LinkPreview({ content }: LinkPreviewProps) {
  const url = extractFirstUrl(content);
  const videoEmbed = url ? detectVideoEmbed(url) : null;

  // Initialize loading=true if we have a non-cached, non-GIF URL to fetch.
  // This prevents a flash of null on the first render before useEffect fires.
  const [ogData, setOgData] = useState<OgData | null>(() => {
    if (url) {
      const cached = ogCache.get(url);
      if (cached) return cached;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (!url || extractGifUrl(url)) return false;
    return !ogCache.has(url);
  });
  const [error, setError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [embedHeight, setEmbedHeight] = useState<number | null>(null);
  const shimmerAnim = useMemo(() => new Animated.Value(0), []);

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

  // Fallback domain card when OG fetch fails for non-video URLs
  if (error && !videoEmbed) {
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
  const platformNames: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitch: 'Twitch',
    twitter: 'X (Twitter)',
  };
  const effectiveOgData = ogData ?? (error && videoEmbed ? {
    title: `Watch on ${platformNames[videoEmbed.platform] || 'Video'}`,
    description: null,
    image: null,
    siteName: platformNames[videoEmbed.platform] || null,
    favicon: null,
    url: url,
  } : null);

  // Twitter/X: render native embed immediately (no play button)
  if (videoEmbed?.platform === 'twitter') {
    const handleTweetHeight = (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'height' && data.height > 100 && data.height < 800) {
          setEmbedHeight(data.height);
        }
      } catch {}
    };
    return (
      <View style={[styles.videoContainer, { height: embedHeight || 350 }]}>
        <WebView
          source={{ html: buildTwitterEmbedHtml(videoEmbed.embedUrl) }}
          style={{ flex: 1, backgroundColor: '#1a1a1a' }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          originWhitelist={['*']}
          mixedContentMode="always"
          scrollEnabled={false}
          onMessage={handleTweetHeight}
          userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        />
      </View>
    );
  }

  if (!effectiveOgData) return null;

  // If playing, show embedded video via WebView
  if (videoEmbed && playing) {
    const handleHeightMessage = (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if ((data.type === 'height' || data.type === 'resize') && data.height > 150 && data.height < 800) {
          setEmbedHeight(data.height);
        }
      } catch {}
    };

    // YouTube: use IFrame API with third-party baseUrl for proper origin matching
    if (videoEmbed.platform === 'youtube') {
      return (
        <View style={styles.videoContainer}>
          <WebView
            source={{ html: buildYouTubeHtml(videoEmbed.embedUrl), baseUrl: YT_PLAYER_BASE_URL }}
            style={styles.videoWebView}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled={false}
          />
        </View>
      );
    }

    // Instagram �� iframe wrapper, outer View clips below video
    if (videoEmbed.platform === 'instagram') {
      const clipHeight = embedHeight || 480;
      return (
        <View style={[styles.videoContainer, { height: clipHeight }]}>
          <WebView
            source={{ html: buildEmbedWrapper(videoEmbed.embedUrl) }}
            style={{ flex: 1, backgroundColor: '#000' }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled={false}
            onMessage={handleHeightMessage}
            userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          />
        </View>
      );
    }

    // TikTok — iframe wrapper, outer View clips below video
    if (videoEmbed.platform === 'tiktok') {
      const clipHeight = embedHeight || 500;
      return (
        <View style={[styles.videoContainer, { height: clipHeight }]}>
          <WebView
            source={{ html: buildEmbedWrapper(videoEmbed.embedUrl) }}
            style={{ flex: 1, backgroundColor: '#000' }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled={false}
            userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            onMessage={handleHeightMessage}
          />
        </View>
      );
    }

    // Twitch — load embed URL directly
    if (videoEmbed.platform === 'twitch') {
      return (
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: videoEmbed.embedUrl }}
            style={{ height: 220, backgroundColor: '#000' }}
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
      {effectiveOgData.image && !imgError ? (
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
      ) : videoEmbed ? (
        <View style={styles.noImagePlayContainer}>
          <View style={styles.playButton}>
            <View style={styles.playTriangle} />
          </View>
          <Text style={styles.tapToPlay}>Tap to play</Text>
        </View>
      ) : null}
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
    height: 220,
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
