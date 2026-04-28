import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';
import { LinkPreview, extractFirstUrl, stripFirstUrl } from '@/components/content/LinkPreview';
import { LinkifiedText } from '@/components/content/LinkifiedText';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { GifPicker } from '@/components/feed/GifPicker';
import { MentionAutocomplete } from '@/components/feed/MentionAutocomplete';
import { AutoImage } from '@/components/feed/AutoImage';
import { ImageGrid } from '@/components/feed/ImageGrid';
import { uploadImage } from '@/lib/upload/imageUpload';

const API_BASE = 'https://www.basktball.com';
const SEGMENTS = ['FOR YOU', 'FOLLOWING', 'LIVE'];

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  position: number;
}

interface Poll {
  id: string;
  totalVotes: number;
  endsAt: string | null;
  options: PollOption[];
  userVotedOptionId?: string | null;
}

interface Take {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
  createdAt: string;
  tags: string[];
  mediaUrl?: string | null;
  mediaUrls?: string[];
  linkPreview?: {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    videoEmbedUrl: string | null;
    videoProvider: string | null;
  } | null;
  gameId: string | null;
  quarter?: string | null;
  gameClock?: string | null;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    avatarUrl: string | null;
    role: string;
    streakType?: 'HOT' | 'COLD' | 'NEUTRAL';
    streakCount?: number;
  };
  poll: Poll | null;
  prediction?: { status: string; claim: string; result?: string | null } | null;
  statCheck?: { overallStatus: string; claims: unknown } | null;
  agingTake?: { revisitDate: string; status: string; resurfacedAt?: string | null } | null;
  userFired?: boolean;
  userBricked?: boolean;
  userBookmarked?: boolean;
  userReposted?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}

export default function CourtScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { token, user, refreshProfile } = useAuth();
  const [selectedSegment, setSelectedSegment] = useState('FOR YOU');
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);
  const [composeMediaUrls, setComposeMediaUrls] = useState<string[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(24);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Themed alert modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons: { text: string; style?: 'default' | 'destructive' | 'cancel'; onPress?: () => void }[];
  }>({ visible: false, title: '', buttons: [] });

  function showAlert(
    title: string,
    message?: string,
    buttons?: { text: string; style?: 'default' | 'destructive' | 'cancel'; onPress?: () => void }[]
  ) {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  }

  function dismissAlert() {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }

  // Modal state for Age and Challenge
  const [ageModal, setAgeModal] = useState<{ takeId: string; days: string } | null>(null);
  const [challengeModal, setChallengeModal] = useState<{ takeId: string; authorId: string; topic: string } | null>(null);
  const [statCheckLoading, setStatCheckLoading] = useState<string | null>(null);

  // Report & Block state
  const [reportModal, setReportModal] = useState<{ takeId: string; authorName: string } | null>(null);

  const REPORT_REASONS = [
    { key: 'SPAM', label: 'Spam' },
    { key: 'HARASSMENT', label: 'Harassment or Bullying' },
    { key: 'OFFENSIVE', label: 'Offensive Content' },
    { key: 'MISINFORMATION', label: 'Misinformation' },
    { key: 'OTHER', label: 'Other' },
  ];

  async function handleReport(takeId: string, reason: string) {
    setReportModal(null);
    try {
      await api.post(`/mobile/takes/${takeId}/report`, { reason });
      showAlert('Reported', 'Thank you for reporting. We will review this content.');
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to submit report.');
    }
  }

  async function handleBlockUser(userId: string, userName: string) {
    if (!requireAuth()) return;
    showAlert(`Block ${userName}?`, 'They won\'t be able to see your content and you won\'t see theirs. They won\'t be notified.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/mobile/users/${userId}/block`, {});
            // Remove blocked user's takes from feed
            setTakes(prev => prev.filter(t => t.author?.id !== userId));
            showAlert('Blocked', `${userName} has been blocked.`);
          } catch (err: any) {
            showAlert('Error', err?.message || 'Failed to block user.');
          }
        },
      },
    ]);
  }

  async function handleStatCheck(takeId: string) {
    setStatCheckLoading(takeId);
    try {
      const res: any = await api.post(`/court/takes/${takeId}/stat-check`, {});
      if (res.statCheck) {
        setTakes(prev => prev.map(t => t.id === takeId ? { ...t, statCheck: res.statCheck } : t));
        showAlert('Stat Check', `Result: ${res.statCheck.overallStatus}`);
      }
    } catch (err: any) {
      showAlert('Error', err?.message || 'Stat check is not available right now.');
    } finally {
      setStatCheckLoading(null);
    }
  }

  async function submitChallenge() {
    if (!challengeModal || !challengeModal.topic.trim()) return;
    try {
      await api.post('/court/challenges', {
        topic: challengeModal.topic.trim(),
        challengedId: challengeModal.authorId,
      });
      setChallengeModal(null);
      showAlert('Challenge Sent', 'Your challenge has been sent!');
    } catch (err: any) {
      setChallengeModal(null);
      showAlert('Error', err?.message || 'Failed to send challenge.');
    }
  }

  async function submitAge() {
    if (!ageModal) return;
    const days = parseInt(ageModal.days, 10);
    if (!days || days < 1) return;
    const takeId = ageModal.takeId;
    const revisitDate = new Date(Date.now() + days * 86400000).toISOString();
    setAgeModal(null);
    try {
      const res: any = await api.post(`/court/takes/${takeId}/age`, { revisitDate });
      if (res.agingTake) {
        setTakes(prev => prev.map(t => t.id === takeId ? { ...t, agingTake: res.agingTake } : t));
      }
      showAlert('Aged', `This take will resurface in ${days} days.`);
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to age this take.');
    }
  }

  useEffect(() => {
    fetchFeed();
  }, [selectedSegment]);

  // Refresh feed when navigating back (e.g. after replying from take detail)
  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [selectedSegment])
  );

  function mapTakes(raw: any[]): Take[] {
    return raw.map((t: any) => ({
      ...t,
      userFired: t.userReaction === 'FIRE',
      userBricked: t.userReaction === 'BRICK',
      poll: t.poll ? {
        ...t.poll,
        userVotedOptionId: t.poll.votes?.[0]?.optionId || null,
      } : null,
    }));
  }

  async function fetchFeed() {
    if (!refreshing) setLoading(true);
    try {
      const typeMap: Record<string, string> = {
        'FOR YOU': 'foryou',
        'FOLLOWING': 'following',
        'LIVE': 'live',
      };
      const type = typeMap[selectedSegment] || 'foryou';
      const data = await api.get<{ takes: any[]; nextCursor: string | null }>(`/court/feed?type=${type}&limit=20&_t=${Date.now()}`);
      if (data.takes) {
        setTakes(mapTakes(data.takes));
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.warn('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const typeMap: Record<string, string> = {
        'FOR YOU': 'foryou',
        'FOLLOWING': 'following',
        'LIVE': 'live',
      };
      const type = typeMap[selectedSegment] || 'foryou';
      const data = await api.get<{ takes: any[]; nextCursor: string | null }>(`/court/feed?type=${type}&limit=20&cursor=${nextCursor}`);
      if (data.takes && data.takes.length > 0) {
        setTakes(prev => [...prev, ...mapTakes(data.takes)]);
        setNextCursor(data.nextCursor || null);
      } else {
        setNextCursor(null);
      }
    } catch (err) {
      console.warn('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed();
  }, [selectedSegment]);

  function requireAuth(): boolean {
    if (!token) {
      showAlert('Sign In Required', 'Please sign in to do that.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return false;
    }
    return true;
  }

  async function handleFire(takeId: string) {
    if (!requireAuth()) return;
    setTakes(prev =>
      prev.map(t => {
        if (t.id !== takeId) return t;
        const wasFired = t.userFired;
        return {
          ...t,
          userFired: !wasFired,
          fireCount: wasFired ? t.fireCount - 1 : t.fireCount + 1,
          ...(wasFired ? {} : t.userBricked ? { userBricked: false, brickCount: t.brickCount - 1 } : {}),
        };
      })
    );
    try {
      await api.post(`/mobile/takes/${takeId}/react`, { type: 'FIRE' });
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to react.');
      fetchFeed();
    }
  }

  async function handleBrick(takeId: string) {
    if (!requireAuth()) return;
    setTakes(prev =>
      prev.map(t => {
        if (t.id !== takeId) return t;
        const wasBricked = t.userBricked;
        return {
          ...t,
          userBricked: !wasBricked,
          brickCount: wasBricked ? t.brickCount - 1 : t.brickCount + 1,
          ...(wasBricked ? {} : t.userFired ? { userFired: false, fireCount: t.fireCount - 1 } : {}),
        };
      })
    );
    try {
      await api.post(`/mobile/takes/${takeId}/react`, { type: 'BRICK' });
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to react.');
      fetchFeed();
    }
  }

  async function handleBookmark(takeId: string) {
    if (!requireAuth()) return;
    setTakes(prev =>
      prev.map(t => t.id === takeId ? { ...t, userBookmarked: !t.userBookmarked } : t)
    );
    try {
      await api.post(`/mobile/takes/${takeId}/bookmark`, {});
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to bookmark.');
      fetchFeed();
    }
  }

  async function handleRepost(takeId: string) {
    if (!requireAuth()) return;
    setTakes(prev =>
      prev.map(t => {
        if (t.id !== takeId) return t;
        const was = t.userReposted;
        return { ...t, userReposted: !was, repostCount: was ? t.repostCount - 1 : t.repostCount + 1 };
      })
    );
    try {
      await api.post(`/mobile/takes/${takeId}/repost`, {});
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to repost.');
      fetchFeed();
    }
  }

  async function handleDelete(takeId: string) {
    showAlert('Delete Take', 'Are you sure you want to delete this take?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/mobile/takes/${takeId}`);
            setTakes(prev => prev.filter(t => t.id !== takeId));
            refreshProfile();
          } catch (err: any) {
            showAlert('Error', err?.message || 'Failed to delete take.');
          }
        }
      },
    ]);
  }

  async function handlePollVote(takeId: string, optionId: string) {
    if (!requireAuth()) return;
    // Optimistic update
    setTakes(prev => prev.map(t => {
      if (t.id !== takeId || !t.poll || t.poll.userVotedOptionId) return t;
      return {
        ...t,
        poll: {
          ...t.poll,
          userVotedOptionId: optionId,
          totalVotes: t.poll.totalVotes + 1,
          options: t.poll.options.map(o =>
            o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
          ),
        },
      };
    }));
    try {
      await api.post(`/court/takes/${takeId}/poll`, { optionId });
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to vote.');
      fetchFeed();
    }
  }

  function resetCompose() {
    setComposeText('');
    setShowPoll(false);
    setPollOptions(['', '']);
    setPollDuration(24);
    setComposeMediaUrls([]);
    setShowGifPicker(false);
    setShowMentions(false);
    setMentionQuery('');
  }

  function handleComposeTextChange(val: string) {
    setComposeText(val);
    const mentionMatch = val.match(/@([a-zA-Z0-9_]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }

  function handleMentionSelect(handle: string) {
    const atIndex = composeText.lastIndexOf('@');
    if (atIndex === -1) return;
    const newContent = composeText.slice(0, atIndex) + `@${handle} `;
    setComposeText(newContent);
    setShowMentions(false);
  }

  async function handleImagePick() {
    if (composeMediaUrls.length >= 20) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Needed', 'Please allow photo access to attach images.');
        return;
      }
      const remaining = 20 - composeMediaUrls.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const newUrls: string[] = [];
      for (const asset of result.assets) {
        try {
          const { publicUrl } = await uploadImage(
            asset.uri,
            asset.mimeType || 'image/jpeg',
            asset.fileSize || 0,
          );
          newUrls.push(publicUrl);
        } catch (err: any) {
          showAlert('Upload Error', err?.message || 'Failed to upload image.');
          break;
        }
      }
      if (newUrls.length > 0) {
        setComposeMediaUrls(prev => [...prev, ...newUrls].slice(0, 20));
      }
    } catch (err: any) {
      showAlert('Upload Error', err?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  }

  async function handlePost() {
    if (!composeText.trim() && composeMediaUrls.length === 0) return;
    if (composeText.length > 2000) {
      showAlert('Too Long', 'Takes must be 2,000 characters or less.');
      return;
    }
    // Validate poll if enabled
    if (showPoll) {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        showAlert('Poll Error', 'You need at least 2 options for a poll.');
        return;
      }
    }
    setPosting(true);
    try {
      const body: any = { content: composeText.trim() };
      if (composeMediaUrls.length > 0) {
        body.mediaUrls = composeMediaUrls;
      }
      if (showPoll) {
        body.pollOptions = pollOptions.filter(o => o.trim().length > 0);
        body.pollDuration = pollDuration;
      }
      await api.post('/mobile/takes', body);
      resetCompose();
      setShowCompose(false);
      // Small delay to ensure poll creation is fully committed on the server
      await new Promise(r => setTimeout(r, 500));
      await fetchFeed();
      refreshProfile();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to post take.');
    } finally {
      setPosting(false);
    }
  }

  function renderTake({ item }: { item: Take }) {
    const displayName = item.author?.displayName || item.author?.name || 'Anonymous';
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <View style={styles.takeCard}>
        {/* Header — tappable to navigate */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/take/${item.id}`)}>
        <View style={styles.takeHeader}>
          {item.author?.avatarUrl || item.author?.image ? (
            <Image
              source={{ uri: (item.author.avatarUrl || item.author.image)! }}
              style={styles.takeAvatarImg}
            />
          ) : (
            <View style={styles.takeAvatar}>
              <Text style={styles.takeAvatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.takeUserInfo}>
            <View style={styles.takeNameRow}>
              <Text style={styles.takeUser}>{displayName}</Text>
              {item.author?.role === 'MODERATOR' || item.author?.role === 'ADMIN' ? (
                <Ionicons name="checkmark-circle" size={14} color={Colors.orange} style={styles.verifiedIcon} />
              ) : null}
              {item.author?.streakType === 'HOT' && (item.author?.streakCount ?? 0) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 4 }}>
                  <Ionicons name="flame" size={14} color={Colors.orange} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.orange, fontFamily: 'RobotoMono_400Regular' }}>{item.author.streakCount}</Text>
                </View>
              )}
              {item.author?.streakType === 'COLD' && (item.author?.streakCount ?? 0) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 4 }}>
                  <Ionicons name="snow" size={14} color="#3B82F6" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6', fontFamily: 'RobotoMono_400Regular' }}>{item.author.streakCount}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Text style={styles.takeHandle}>{timeAgo(item.createdAt)}</Text>
              {item.statCheck && item.statCheck.overallStatus !== 'PENDING' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.textTertiary }}>&#183;</Text>
                  <Ionicons name="search" size={11} color={item.statCheck.overallStatus === 'VERIFIED' ? '#22C55E' : item.statCheck.overallStatus === 'FALSE' ? '#EF4444' : '#9CA3AF'} />
                  <Text style={{
                    fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
                    color: item.statCheck.overallStatus === 'VERIFIED' ? '#22C55E' : item.statCheck.overallStatus === 'FALSE' ? '#EF4444' : '#9CA3AF',
                  }}>
                    {item.statCheck.overallStatus === 'VERIFIED' ? 'Verified' : item.statCheck.overallStatus === 'FALSE' ? 'False' : 'Unverifiable'}
                  </Text>
                </View>
              )}
              {item.prediction && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.textTertiary }}>&#183;</Text>
                  <Ionicons
                    name={item.prediction.status === 'RECEIPT' ? 'checkmark-circle' : item.prediction.status === 'BUST' ? 'close-circle' : 'time'}
                    size={11}
                    color={item.prediction.status === 'RECEIPT' ? '#22C55E' : item.prediction.status === 'BUST' ? '#EF4444' : '#FBBF24'}
                  />
                  <Text style={{
                    fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
                    color: item.prediction.status === 'RECEIPT' ? '#22C55E' : item.prediction.status === 'BUST' ? '#EF4444' : '#FBBF24',
                  }}>
                    {item.prediction.status === 'RECEIPT' ? 'Receipt' : item.prediction.status === 'BUST' ? 'Bust' : 'Prediction'}
                  </Text>
                </View>
              )}
              {item.agingTake && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.textTertiary }}>&#183;</Text>
                  <Ionicons name="hourglass" size={11} color={item.agingTake.status === 'AGED' ? '#A855F7' : '#FBBF24'} />
                  <Text style={{
                    fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
                    color: item.agingTake.status === 'AGED' ? '#A855F7' : '#FBBF24',
                  }}>
                    {item.agingTake.status === 'AGED' ? 'Aged' : (() => {
                      const days = Math.max(0, Math.ceil((new Date(item.agingTake!.revisitDate).getTime() - Date.now()) / 86400000));
                      return days > 0 ? `${days}d` : 'Due';
                    })()}
                  </Text>
                </View>
              )}
              {item.gameClock && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.textTertiary }}>&#183;</Text>
                  <Ionicons name="timer" size={11} color="#3B82F6" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6', fontFamily: 'RobotoMono_400Regular' }}>
                    {item.quarter ? `Q${item.quarter} ` : ''}{item.gameClock}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={() => {
            const isOwner = user?.id === item.author?.id;
            const btns: { text: string; style?: 'default' | 'destructive' | 'cancel'; onPress?: () => void }[] = [];
            if (isOwner) {
              btns.push({ text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) });
            } else {
              btns.push({
                text: 'Report',
                style: 'destructive',
                onPress: () => setReportModal({ takeId: item.id, authorName: item.author?.displayName || item.author?.name || 'this user' }),
              });
              btns.push({
                text: 'Block User',
                style: 'destructive',
                onPress: () => handleBlockUser(item.author.id!, item.author?.displayName || item.author?.name || 'this user'),
              });
            }
            btns.push({ text: 'Cancel', style: 'cancel' });
            showAlert('Options', undefined, btns);
          }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <LinkifiedText
          text={extractFirstUrl(item.content) ? stripFirstUrl(item.content) : item.content}
          style={styles.takeText}
        />
        </TouchableOpacity>

        {/* Media Images */}
        {(item.mediaUrls?.length ?? 0) > 0 ? (
          <ImageGrid urls={item.mediaUrls!} />
        ) : item.mediaUrl ? (
          <AutoImage source={{ uri: item.mediaUrl }} />
        ) : null}

        {/* Link Preview (client-side) */}
        <LinkPreview content={item.content} />

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}

        {/* Poll */}
        {item.poll && item.poll.options.length > 0 && (() => {
          const hasVoted = !!item.poll!.userVotedOptionId;
          const pollEnded = item.poll!.endsAt ? new Date(item.poll!.endsAt) < new Date() : false;
          const showResults = hasVoted || pollEnded;
          return (
            <View style={styles.pollContainer}>
              {item.poll!.options.map((option) => {
                const pct = item.poll!.totalVotes > 0 ? Math.round((option.voteCount / item.poll!.totalVotes) * 100) : 0;
                const isVoted = item.poll!.userVotedOptionId === option.id;
                if (showResults) {
                  return (
                    <View key={option.id} style={[styles.pollOption, isVoted && styles.pollOptionVoted]}>
                      <View style={[styles.pollBar, { width: `${pct}%` }, isVoted && styles.pollBarVoted]} />
                      <View style={styles.pollOptionContent}>
                        <Text style={[styles.pollOptionText, isVoted && styles.pollOptionTextVoted]}>{option.text}</Text>
                        <Text style={[styles.pollOptionPct, isVoted && styles.pollOptionTextVoted]}>{pct}%</Text>
                      </View>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.pollOptionTappable}
                    activeOpacity={0.7}
                    onPress={() => handlePollVote(item.id, option.id)}
                  >
                    <Text style={styles.pollOptionTappableText}>{option.text}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.pollFooter}>
                <Text style={styles.pollFooterText}>{item.poll!.totalVotes} votes</Text>
                <Text style={styles.pollFooterText}>
                  {(() => {
                    if (!item.poll!.endsAt) return 'Open poll';
                    const hoursLeft = Math.max(0, Math.ceil((new Date(item.poll!.endsAt).getTime() - Date.now()) / 3600000));
                    return hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d left` : `${hoursLeft}h left`;
                  })()}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Actions */}
        <View style={styles.takeActions}>
          <TouchableOpacity style={styles.takeAction} onPress={() => handleFire(item.id)}>
            <Ionicons name={item.userFired ? 'flame' : 'flame-outline'} size={18} color={Colors.orange} />
            <Text style={[styles.takeActionCount, styles.fireCount]}>{item.fireCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.takeAction} onPress={() => handleBrick(item.id)}>
            <Ionicons name={item.userBricked ? 'square' : 'square-outline'} size={18} color={item.userBricked ? '#EF4444' : colors.textSecondary} />
            <Text style={[styles.takeActionCount, item.userBricked && { color: '#EF4444' }]}>{item.brickCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.takeAction} onPress={() => router.push(`/take/${item.id}`)}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.takeActionCount}>{item.replyCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.takeAction} onPress={() => handleRepost(item.id)}>
            <Ionicons name={item.userReposted ? 'repeat' : 'repeat-outline'} size={18} color={item.userReposted ? '#22C55E' : colors.textSecondary} />
            <Text style={[styles.takeActionCount, item.userReposted && { color: '#22C55E' }]}>{item.repostCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.takeAction} onPress={() => handleBookmark(item.id)}>
            <Ionicons name={item.userBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={item.userBookmarked ? Colors.orange : colors.textSecondary} />
          </TouchableOpacity>
          {!item.statCheck && (
            <TouchableOpacity style={styles.takeAction} onPress={() => handleStatCheck(item.id)} disabled={statCheckLoading === item.id}>
              {statCheckLoading === item.id ? (
                <ActivityIndicator size="small" color={Colors.orange} />
              ) : (
                <Ionicons name="search" size={16} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          )}
          {user && user.id !== item.author?.id && (
            <TouchableOpacity style={styles.takeAction} onPress={() => setChallengeModal({ takeId: item.id, authorId: item.author.id!, topic: '' })}>
              <Ionicons name="flag-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          {!item.agingTake && (
            <TouchableOpacity style={styles.takeAction} onPress={() => setAgeModal({ takeId: item.id, days: '7' })}>
              <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          <View style={styles.takeAction}>
            <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.takeActionCount, { color: colors.textTertiary, fontSize: 12 }]}>{item.viewCount ?? 0}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>THE COURT</Text>
      </View>

      <View style={styles.segmentRow}>
        {SEGMENTS.map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[styles.segment, selectedSegment === seg && styles.segmentActive]}
            onPress={() => setSelectedSegment(seg)}
          >
            <Text style={[styles.segmentText, selectedSegment === seg && styles.segmentTextActive]}>
              {seg}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={takes}
          keyExtractor={(item) => item.id}
          renderItem={renderTake}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedSegment === 'LIVE' ? 'No live game takes right now' : 'No takes yet — be the first!'}
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={Colors.orange} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {
        if (requireAuth()) setShowCompose(true);
      }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.composeContainer}>
            <View style={styles.composeHeader}>
              <TouchableOpacity onPress={() => { setShowCompose(false); resetCompose(); }}>
                <Text style={styles.composeCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.composeTitle}>New Take</Text>
              <TouchableOpacity
                style={[styles.composePostBtn, ((!composeText.trim() && composeMediaUrls.length === 0) || posting || uploading) && styles.composePostBtnDisabled]}
                disabled={(!composeText.trim() && composeMediaUrls.length === 0) || posting || uploading}
                onPress={handlePost}
              >
                {posting ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.composePostText}>Post</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.composeInput}
              placeholder="What's your take?"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={2000}
              value={composeText}
              onChangeText={handleComposeTextChange}
              autoFocus
            />

            {/* Mention autocomplete */}
            <MentionAutocomplete
              query={mentionQuery}
              onSelect={handleMentionSelect}
              visible={showMentions}
              apiBase={API_BASE}
            />

            <Text style={styles.charCount}>{composeText.length}/2000</Text>

            {/* Media Preview Grid */}
            {composeMediaUrls.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {composeMediaUrls.map((url, i) => (
                  <View key={url} style={{ width: composeMediaUrls.length === 1 ? '100%' : '48%', height: composeMediaUrls.length === 1 ? 160 : 100, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <ExpoImage
                      source={{ uri: url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setComposeMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Uploading indicator */}
            {uploading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
                <ActivityIndicator size="small" color={Colors.orange} />
                <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary }}>Uploading image...</Text>
              </View>
            )}

            {/* GIF / IMG / Poll Toolbar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setShowGifPicker(!showGifPicker)}
                disabled={composeMediaUrls.length > 0 || uploading}
                style={{
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: showGifPicker ? Colors.orange : 'rgba(255,107,53,0.3)',
                  borderRadius: 6,
                  backgroundColor: showGifPicker ? 'rgba(255,107,53,0.15)' : 'transparent',
                  opacity: (composeMediaUrls.length > 0 || uploading) ? 0.4 : 1,
                }}
              >
                <Text style={{ fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange, fontWeight: '600' }}>GIF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImagePick}
                disabled={composeMediaUrls.length >= 20 || uploading}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: 'rgba(255,107,53,0.3)',
                  borderRadius: 6,
                  opacity: (composeMediaUrls.length >= 20 || uploading) ? 0.4 : 1,
                }}
              >
                <Ionicons name="image-outline" size={14} color={Colors.orange} />
                <Text style={{ fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange, fontWeight: '600' }}>
                  IMG{composeMediaUrls.length > 0 ? ` ${composeMediaUrls.length}/20` : ''}
                </Text>
              </TouchableOpacity>

              {!showPoll && (
                <TouchableOpacity
                  onPress={() => setShowPoll(true)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: 'rgba(255,107,53,0.3)',
                    borderRadius: 6,
                  }}
                >
                  <Ionicons name="bar-chart-outline" size={14} color={Colors.orange} />
                  <Text style={{ fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange, fontWeight: '600' }}>Poll</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Poll Toggle & Builder */}
            {showPoll ? (
              <View style={styles.pollBuilder}>
                <View style={styles.pollBuilderHeader}>
                  <Text style={styles.pollBuilderTitle}>POLL</Text>
                  <TouchableOpacity onPress={() => { setShowPoll(false); setPollOptions(['', '']); }}>
                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                {pollOptions.map((opt, i) => (
                  <View key={i} style={styles.pollOptionInput}>
                    <TextInput
                      style={styles.pollOptionField}
                      placeholder={`Option ${i + 1}`}
                      placeholderTextColor={colors.textTertiary}
                      maxLength={80}
                      value={opt}
                      onChangeText={(text) => {
                        const updated = [...pollOptions];
                        updated[i] = text;
                        setPollOptions(updated);
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity onPress={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>
                        <Ionicons name="remove-circle-outline" size={20} color={Colors.red} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {pollOptions.length < 4 && (
                  <TouchableOpacity style={styles.addOptionBtn} onPress={() => setPollOptions([...pollOptions, ''])}>
                    <Ionicons name="add-circle-outline" size={18} color={Colors.orange} />
                    <Text style={styles.addOptionText}>Add option</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.pollDurationRow}>
                  <Text style={styles.pollDurationLabel}>Duration:</Text>
                  {[1, 6, 24, 72].map((hrs) => (
                    <TouchableOpacity
                      key={hrs}
                      style={[styles.durationChip, pollDuration === hrs && styles.durationChipActive]}
                      onPress={() => setPollDuration(hrs)}
                    >
                      <Text style={[styles.durationChipText, pollDuration === hrs && styles.durationChipTextActive]}>
                        {hrs < 24 ? `${hrs}h` : `${hrs / 24}d`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            </ScrollView>

            {/* GIF Picker */}
            {showGifPicker && (
              <GifPicker
                onSelect={(gifUrl) => {
                  setComposeMediaUrls([gifUrl]);
                  setShowGifPicker(false);
                }}
                onClose={() => setShowGifPicker(false)}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Age Take Modal */}
      <Modal visible={!!ageModal} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>AGE THIS TAKE</Text>
            <Text style={styles.alertMessage}>Set a revisit date. This take will resurface for the community to re-evaluate.</Text>
            <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>Revisit in how many days?</Text>
            <TextInput
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16, fontFamily: Fonts.barlow, marginBottom: 20 }}
              keyboardType="number-pad"
              value={ageModal?.days || ''}
              onChangeText={(val) => setAgeModal(prev => prev ? { ...prev, days: val.replace(/[^0-9]/g, '') } : null)}
              placeholder="7"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonCancel, { paddingHorizontal: 24, minHeight: 44 }]}
                onPress={() => setAgeModal(null)}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextCancel]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonDefault, { paddingHorizontal: 24, minHeight: 44, opacity: !ageModal?.days || parseInt(ageModal?.days) < 1 ? 0.5 : 1 }]}
                onPress={submitAge}
                disabled={!ageModal?.days || parseInt(ageModal?.days) < 1}
              >
                <Text style={styles.alertButtonText}>Age It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Challenge Modal */}
      <Modal visible={!!challengeModal} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>CHALLENGE</Text>
            <Text style={styles.alertMessage}>Challenge this user to a head-to-head debate. The community votes on who wins.</Text>
            <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>What&apos;s the debate topic?</Text>
            <TextInput
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, fontFamily: Fonts.barlow, marginBottom: 20 }}
              value={challengeModal?.topic || ''}
              onChangeText={(val) => setChallengeModal(prev => prev ? { ...prev, topic: val } : null)}
              placeholder="e.g. LeBron vs Jordan, Best PG..."
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonCancel, { paddingHorizontal: 24, minHeight: 44 }]}
                onPress={() => setChallengeModal(null)}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextCancel]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonDefault, { paddingHorizontal: 24, minHeight: 44, opacity: !challengeModal?.topic?.trim() ? 0.5 : 1 }]}
                onPress={submitChallenge}
                disabled={!challengeModal?.topic?.trim()}
              >
                <Text style={styles.alertButtonText}>Send Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={!!reportModal} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>REPORT CONTENT</Text>
            <Text style={styles.alertMessage}>Why are you reporting this take?</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                onPress={() => reportModal && handleReport(reportModal.takeId, r.key)}
              >
                <Text style={{ fontFamily: Fonts.barlow, fontSize: 15, color: colors.text }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.alertButton, styles.alertButtonCancel, { marginTop: 16, alignSelf: 'center', paddingHorizontal: 32 }]}
              onPress={() => setReportModal(null)}
            >
              <Text style={[styles.alertButtonText, styles.alertButtonTextCancel]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Themed Alert Modal */}
      <Modal visible={alertConfig.visible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={dismissAlert}
        >
          <TouchableOpacity activeOpacity={1} style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            {alertConfig.message ? (
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            ) : null}
            <View style={styles.alertButtons}>
              {alertConfig.buttons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.alertButton,
                    btn.style === 'destructive' && styles.alertButtonDestructive,
                    btn.style === 'cancel' && styles.alertButtonCancel,
                    btn.style !== 'destructive' && btn.style !== 'cancel' && styles.alertButtonDefault,
                  ]}
                  onPress={() => {
                    dismissAlert();
                    btn.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      btn.style === 'destructive' && styles.alertButtonTextDestructive,
                      btn.style === 'cancel' && styles.alertButtonTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingLeft: 72, paddingRight: 16, paddingVertical: 12 },
  headerTitle: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 24, color: colors.text, letterSpacing: 2 },
  segmentRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 10, padding: 3, marginBottom: 12 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: Colors.orange },
  segmentText: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: colors.textSecondary, letterSpacing: 1 },
  segmentTextActive: { color: '#FFFFFF' },
  emptyText: { fontFamily: Fonts.barlow, fontSize: 14, color: colors.textTertiary, textAlign: 'center', marginTop: 40 },
  feedList: { paddingBottom: 100 },
  takeCard: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  takeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  takeAvatarImg: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: colors.surface },
  takeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  takeAvatarText: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 18, color: Colors.orange },
  takeUserInfo: { flex: 1 },
  takeNameRow: { flexDirection: 'row', alignItems: 'center' },
  takeUser: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 15, color: colors.text },
  verifiedIcon: { marginLeft: 4 },
  takeHandle: { fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  moreButton: { padding: 4 },
  takeText: { fontFamily: Fonts.barlow, fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: Colors.orange },
  pollContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  pollOption: { position: 'relative', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pollBar: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: colors.borderLight },
  pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  pollOptionText: { fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary, flex: 1 },
  pollOptionPct: { fontFamily: Fonts.mono, fontSize: 13, color: colors.textSecondary, marginLeft: 8 },
  pollOptionVoted: { borderLeftWidth: 3, borderLeftColor: Colors.orange },
  pollBarVoted: { backgroundColor: 'rgba(255,107,53,0.2)' },
  pollOptionTextVoted: { color: Colors.orange, fontFamily: Fonts.barlowSemiBold, fontWeight: '600' },
  pollOptionTappable: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 },
  pollOptionTappableText: { fontFamily: Fonts.barlow, fontSize: 14, color: colors.text },
  pollFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  pollFooterText: { fontFamily: Fonts.barlow, fontSize: 13, color: colors.textTertiary },
  takeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  takeAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  takeActionCount: { fontFamily: Fonts.mono, fontSize: 13, color: colors.textSecondary },
  fireCount: { color: Colors.orange },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  composeContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 280, maxHeight: '85%' },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  composeCancel: { fontFamily: Fonts.barlow, fontSize: 16, color: colors.textSecondary },
  composeTitle: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 18, color: colors.text, letterSpacing: 1 },
  composePostBtn: { backgroundColor: Colors.orange, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20 },
  composePostBtnDisabled: { opacity: 0.4 },
  composePostText: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 14, color: '#FFFFFF' },
  composeInput: { fontFamily: Fonts.barlow, fontSize: 17, color: colors.text, minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontFamily: Fonts.mono, fontSize: 13, color: colors.textTertiary, textAlign: 'right', marginTop: 8 },
  pollToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  pollToggleText: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 14, color: Colors.orange },
  pollBuilder: { marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  pollBuilderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pollBuilderTitle: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 13, color: colors.textSecondary, letterSpacing: 1 },
  pollOptionInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  pollOptionField: { flex: 1, fontFamily: Fonts.barlow, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  addOptionText: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: Colors.orange },
  pollDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  pollDurationLabel: { fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary },
  durationChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  durationChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  durationChipText: { fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: colors.textSecondary },
  durationChipTextActive: { color: '#FFFFFF' },
  // Themed alert modal
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  alertBox: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: colors.border },
  alertTitle: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 18, color: colors.text, textAlign: 'center', letterSpacing: 0.5, marginBottom: 8 },
  alertMessage: { fontFamily: Fonts.barlow, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertButtons: { gap: 8, marginTop: 4 },
  alertButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  alertButtonDefault: { backgroundColor: Colors.orange },
  alertButtonDestructive: { backgroundColor: '#EF4444' },
  alertButtonCancel: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  alertButtonText: { fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 15, color: '#FFFFFF' },
  alertButtonTextDestructive: { color: '#FFFFFF' },
  alertButtonTextCancel: { color: colors.textSecondary },
  });
}
