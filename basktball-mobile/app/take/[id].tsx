import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';

const API_BASE = 'https://www.basktball.com';

interface Author {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  avatarUrl: string | null;
  role: string;
}

interface TakeData {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  repostCount: number;
  viewCount?: number;
  createdAt: string;
  tags: string[];
  author: Author;
  poll?: {
    id: string;
    totalVotes: number;
    endsAt: string | null;
    options: Array<{ id: string; text: string; voteCount: number; position: number }>;
  } | null;
}

interface TakeDetail extends TakeData {
  replies?: TakeData[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function formatCount(count: number): string {
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

export default function TakeDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [take, setTake] = useState<TakeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTake();
  }, [id]);

  async function fetchTake() {
    try {
      const data = await api.get<{ take: TakeDetail }>(`/court/takes/${id}`);
      if (data.take) {
        setTake(data.take);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to fetch take:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function requireAuth(): boolean {
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to do that.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return false;
    }
    return true;
  }

  async function handleReply() {
    if (!replyText.trim() || !id) return;
    if (!requireAuth()) return;
    setSubmitting(true);
    try {
      await api.post('/mobile/takes', { content: replyText.trim(), parentId: id });
      setReplyText('');
      fetchTake();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReaction(takeId: string, type: 'FIRE' | 'BRICK') {
    if (!requireAuth()) return;
    try {
      await api.post(`/mobile/takes/${takeId}/react`, { type });
      fetchTake();
    } catch {
      // silently fail
    }
  }

  async function handleRepost(takeId: string) {
    if (!requireAuth()) return;
    try {
      await api.post(`/mobile/takes/${takeId}/repost`, {});
      fetchTake();
    } catch {
      // silently fail
    }
  }

  async function handleBookmark(takeId: string) {
    if (!requireAuth()) return;
    try {
      await api.post(`/mobile/takes/${takeId}/bookmark`, {});
      Alert.alert('Done', 'Bookmark toggled.');
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TAKE</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error || !take) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TAKE</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Take not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTake}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function renderTakeCard(item: TakeData, isMainTake: boolean) {
    const displayName = item.author?.displayName || item.author?.name || 'Anonymous';
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <View style={[styles.takeCard, isMainTake && styles.mainTakeCard]}>
        {/* Author Row */}
        <TouchableOpacity
          style={styles.takeAuthorRow}
          activeOpacity={0.7}
          onPress={() => item.author?.id && router.push(`/user/${item.author.id}`)}
        >
          {item.author?.image || item.author?.avatarUrl ? (
            <Image
              source={{ uri: item.author.image || item.author.avatarUrl! }}
              style={[styles.takeAvatarImg, isMainTake && styles.mainTakeAvatarImg]}
            />
          ) : (
            <View style={[styles.takeAvatar, isMainTake && styles.mainTakeAvatar]}>
              <Text style={[styles.takeAvatarText, isMainTake && styles.mainTakeAvatarText]}>
                {initial}
              </Text>
            </View>
          )}
          <View style={styles.takeAuthorInfo}>
            <Text style={[styles.takeAuthorName, isMainTake && styles.mainTakeAuthorName]}>
              {displayName}
            </Text>
            <Text style={styles.takeHandle}>{timeAgo(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {/* Take Text */}
        <Text style={[styles.takeText, isMainTake && styles.mainTakeText]}>
          {item.content}
        </Text>

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
            </View>
          </View>
        )}

        {/* Reactions Row */}
        <View style={styles.reactionsRow}>
          <TouchableOpacity style={styles.reactionItem} activeOpacity={0.7} onPress={() => handleReaction(item.id, 'FIRE')}>
            <Ionicons name="flame-outline" size={isMainTake ? 20 : 16} color={Colors.orange} />
            <Text style={[styles.reactionCount, styles.fireCount]}>{formatCount(item.fireCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem} activeOpacity={0.7} onPress={() => handleReaction(item.id, 'BRICK')}>
            <Ionicons name="square-outline" size={isMainTake ? 20 : 16} color={colors.textTertiary} />
            <Text style={styles.reactionCount}>{formatCount(item.brickCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={isMainTake ? 20 : 16} color={colors.textTertiary} />
            <Text style={styles.reactionCount}>{formatCount(item.replyCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem} activeOpacity={0.7} onPress={() => handleRepost(item.id)}>
            <Ionicons name="repeat-outline" size={isMainTake ? 20 : 16} color={colors.textTertiary} />
            <Text style={styles.reactionCount}>{formatCount(item.repostCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionItem} activeOpacity={0.7} onPress={() => handleBookmark(item.id)}>
            <Ionicons name="bookmark-outline" size={isMainTake ? 20 : 16} color={colors.textTertiary} />
          </TouchableOpacity>
          {isMainTake && (
            <View style={styles.reactionItem}>
              <Ionicons name="eye-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.reactionCount, { fontSize: 11 }]}>{formatCount(item.viewCount ?? 0)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  const replies = take.replies || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TAKE</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Take */}
          {renderTakeCard(take, true)}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Replies Header */}
          <View style={styles.repliesHeader}>
            <Text style={styles.repliesTitle}>REPLIES</Text>
            <Text style={styles.repliesCount}>{replies.length}</Text>
          </View>

          {/* Reply Cards */}
          {replies.length === 0 ? (
            <Text style={styles.emptyText}>No replies yet</Text>
          ) : (
            replies.map((reply) => (
              <View key={reply.id}>
                {renderTakeCard(reply, false)}
                <View style={styles.replyDivider} />
              </View>
            ))
          )}
        </ScrollView>

        {/* Compose Reply Bar */}
        <View style={styles.composeBar}>
          <View style={styles.composeInputWrapper}>
            <TextInput
              style={styles.composeInput}
              placeholder="Drop your reply..."
              placeholderTextColor={colors.textTertiary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={280}
            />
          </View>
          <TouchableOpacity
            style={[styles.replyButton, (!replyText.trim() || submitting) && styles.replyButtonDisabled]}
            disabled={!replyText.trim() || submitting}
            activeOpacity={0.7}
            onPress={handleReply}
          >
            {submitting ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={[styles.replyButtonText, !replyText.trim() && styles.replyButtonTextDisabled]}>
                Reply
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 20,
    color: colors.text,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  errorText: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 20,
  },
  // Take Card
  takeCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mainTakeCard: {
    paddingVertical: 16,
  },
  takeAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  takeAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: colors.surface,
  },
  mainTakeAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  takeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mainTakeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.orange,
    borderWidth: 0,
  },
  takeAvatarText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  mainTakeAvatarText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  takeAuthorInfo: {
    flex: 1,
  },
  takeAuthorName: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: colors.text,
  },
  mainTakeAuthorName: {
    fontSize: 16,
  },
  takeHandle: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textTertiary,
  },
  takeText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  mainTakeText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 13,
    color: Colors.orange,
  },
  // Poll
  pollContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pollOption: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.12)',
  },
  pollBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pollOptionText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  pollOptionPct: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  pollFooter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pollFooterText: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reactionCount: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
  },
  fireCount: {
    color: Colors.orange,
  },
  // Divider
  divider: {
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  replyDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  // Replies Header
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  repliesTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: Colors.orange,
    letterSpacing: 2,
  },
  repliesCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // Compose Bar
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    gap: 10,
  },
  composeInputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  composeInput: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.text,
    maxHeight: 80,
  },
  replyButton: {
    backgroundColor: Colors.orange,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  replyButtonDisabled: {
    backgroundColor: 'rgba(255,107,53,0.3)',
  },
  replyButtonText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  replyButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  });
}
