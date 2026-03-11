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
  gameId: string | null;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    avatarUrl: string | null;
    role: string;
  };
  poll: Poll | null;
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
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(24);

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

  useEffect(() => {
    fetchFeed();
  }, [selectedSegment]);

  // Refresh feed when navigating back (e.g. after replying from take detail)
  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [selectedSegment])
  );

  async function fetchFeed() {
    if (!refreshing) setLoading(true);
    try {
      const typeMap: Record<string, string> = {
        'FOR YOU': 'foryou',
        'FOLLOWING': 'following',
        'LIVE': 'live',
      };
      const type = typeMap[selectedSegment] || 'foryou';
      // Use api client to send JWT token so server can return user-specific data
      // Cache-bust to ensure fresh data (polls, new takes)
      const data = await api.get<{ takes: any[] }>(`/court/feed?type=${type}&limit=20&_t=${Date.now()}`);
      if (data.takes) {
        // Map userReaction field to userFired/userBricked booleans
        const mapped = data.takes.map((t: any) => ({
          ...t,
          userFired: t.userReaction === 'FIRE',
          userBricked: t.userReaction === 'BRICK',
        }));
        setTakes(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  function resetCompose() {
    setComposeText('');
    setShowPoll(false);
    setPollOptions(['', '']);
    setPollDuration(24);
  }

  async function handlePost() {
    if (!composeText.trim()) return;
    if (composeText.length > 280) {
      showAlert('Too Long', 'Takes must be 280 characters or less.');
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
      <TouchableOpacity
        style={styles.takeCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/take/${item.id}`)}
      >
        {/* Header */}
        <View style={styles.takeHeader}>
          {item.author?.image || item.author?.avatarUrl ? (
            <Image
              source={{ uri: item.author.image || item.author.avatarUrl! }}
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
            </View>
            <Text style={styles.takeHandle}>{timeAgo(item.createdAt)}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={() => {
            const isOwner = user?.id === item.author?.id;
            const btns: { text: string; style?: 'default' | 'destructive' | 'cancel'; onPress?: () => void }[] = [];
            if (isOwner) {
              btns.push({ text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) });
            } else {
              btns.push({ text: 'Report', style: 'destructive', onPress: () => showAlert('Reported', 'Thank you for reporting.') });
            }
            btns.push({ text: 'Cancel', style: 'cancel' });
            showAlert('Options', undefined, btns);
          }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Text style={styles.takeText}>{item.content}</Text>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}

        {/* Poll */}
        {item.poll && item.poll.options.length > 0 && (
          <View style={styles.pollContainer}>
            {item.poll.options.map((option) => {
              const pct = item.poll!.totalVotes > 0 ? Math.round((option.voteCount / item.poll!.totalVotes) * 100) : 0;
              return (
                <View key={option.id} style={styles.pollOption}>
                  <View style={[styles.pollBar, { width: `${pct}%` }]} />
                  <View style={styles.pollOptionContent}>
                    <Text style={styles.pollOptionText}>{option.text}</Text>
                    <Text style={styles.pollOptionPct}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.pollFooter}>
              <Text style={styles.pollFooterText}>{item.poll.totalVotes} votes</Text>
              <Text style={styles.pollFooterText}>
                {(() => {
                  if (!item.poll!.endsAt) return 'Open poll';
                  const hoursLeft = Math.max(0, Math.ceil((new Date(item.poll!.endsAt).getTime() - Date.now()) / 3600000));
                  return hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d left` : `${hoursLeft}h left`;
                })()}
              </Text>
            </View>
          </View>
        )}

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
          <View style={styles.takeAction}>
            <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.takeActionCount, { color: colors.textTertiary, fontSize: 11 }]}>{item.viewCount ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedSegment === 'LIVE' ? 'No live game takes right now' : 'No takes yet — be the first!'}
            </Text>
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
      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.composeContainer}>
            <View style={styles.composeHeader}>
              <TouchableOpacity onPress={() => { setShowCompose(false); resetCompose(); }}>
                <Text style={styles.composeCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.composeTitle}>New Take</Text>
              <TouchableOpacity
                style={[styles.composePostBtn, (!composeText.trim() || posting) && styles.composePostBtnDisabled]}
                disabled={!composeText.trim() || posting}
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
              maxLength={280}
              value={composeText}
              onChangeText={setComposeText}
              autoFocus
            />
            <Text style={styles.charCount}>{composeText.length}/280</Text>

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
            ) : (
              <TouchableOpacity style={styles.pollToggle} onPress={() => setShowPoll(true)}>
                <Ionicons name="bar-chart-outline" size={18} color={Colors.orange} />
                <Text style={styles.pollToggleText}>Add Poll</Text>
              </TouchableOpacity>
            )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontFamily: Fonts.barlowBold, fontSize: 24, color: colors.text, letterSpacing: 2 },
  segmentRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 10, padding: 3, marginBottom: 12 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: Colors.orange },
  segmentText: { fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: colors.textSecondary, letterSpacing: 1 },
  segmentTextActive: { color: '#FFFFFF' },
  emptyText: { fontFamily: Fonts.barlow, fontSize: 14, color: colors.textTertiary, textAlign: 'center', marginTop: 40 },
  feedList: { paddingBottom: 100 },
  takeCard: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  takeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  takeAvatarImg: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: colors.surface },
  takeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  takeAvatarText: { fontFamily: Fonts.barlowBold, fontSize: 18, color: Colors.orange },
  takeUserInfo: { flex: 1 },
  takeNameRow: { flexDirection: 'row', alignItems: 'center' },
  takeUser: { fontFamily: Fonts.barlowBold, fontSize: 15, color: colors.text },
  verifiedIcon: { marginLeft: 4 },
  takeHandle: { fontFamily: Fonts.barlow, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  moreButton: { padding: 4 },
  takeText: { fontFamily: Fonts.barlow, fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange },
  pollContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  pollOption: { position: 'relative', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pollBar: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: colors.borderLight },
  pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  pollOptionText: { fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary, flex: 1 },
  pollOptionPct: { fontFamily: Fonts.mono, fontSize: 12, color: colors.textSecondary, marginLeft: 8 },
  pollFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  pollFooterText: { fontFamily: Fonts.barlow, fontSize: 12, color: colors.textTertiary },
  takeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  takeAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  takeActionCount: { fontFamily: Fonts.mono, fontSize: 12, color: colors.textSecondary },
  fireCount: { color: Colors.orange },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  composeContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 280, maxHeight: '85%' },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  composeCancel: { fontFamily: Fonts.barlow, fontSize: 16, color: colors.textSecondary },
  composeTitle: { fontFamily: Fonts.barlowBold, fontSize: 18, color: colors.text, letterSpacing: 1 },
  composePostBtn: { backgroundColor: Colors.orange, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20 },
  composePostBtnDisabled: { opacity: 0.4 },
  composePostText: { fontFamily: Fonts.barlowBold, fontSize: 14, color: '#FFFFFF' },
  composeInput: { fontFamily: Fonts.barlow, fontSize: 17, color: colors.text, minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontFamily: Fonts.mono, fontSize: 12, color: colors.textTertiary, textAlign: 'right', marginTop: 8 },
  pollToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  pollToggleText: { fontFamily: Fonts.barlowSemiBold, fontSize: 14, color: Colors.orange },
  pollBuilder: { marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  pollBuilderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pollBuilderTitle: { fontFamily: Fonts.barlowBold, fontSize: 12, color: colors.textSecondary, letterSpacing: 1 },
  pollOptionInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  pollOptionField: { flex: 1, fontFamily: Fonts.barlow, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  addOptionText: { fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange },
  pollDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  pollDurationLabel: { fontFamily: Fonts.barlow, fontSize: 12, color: colors.textSecondary },
  durationChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  durationChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  durationChipText: { fontFamily: Fonts.barlowSemiBold, fontSize: 12, color: colors.textSecondary },
  durationChipTextActive: { color: '#FFFFFF' },
  // Themed alert modal
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  alertBox: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: colors.border },
  alertTitle: { fontFamily: Fonts.barlowBold, fontSize: 18, color: colors.text, textAlign: 'center', letterSpacing: 0.5, marginBottom: 8 },
  alertMessage: { fontFamily: Fonts.barlow, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertButtons: { gap: 8, marginTop: 4 },
  alertButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  alertButtonDefault: { backgroundColor: Colors.orange },
  alertButtonDestructive: { backgroundColor: '#EF4444' },
  alertButtonCancel: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  alertButtonText: { fontFamily: Fonts.barlowBold, fontSize: 15, color: '#FFFFFF' },
  alertButtonTextDestructive: { color: '#FFFFFF' },
  alertButtonTextCancel: { color: colors.textSecondary },
  });
}
