import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';

interface ChallengeUser {
  id: string;
  displayName: string | null;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
  challengeWins: number;
  challengeLosses: number;
}

interface ChallengeTake {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
    image: string | null;
  };
}

interface Challenge {
  id: string;
  topic: string;
  status: string;
  votesChallenger: number;
  votesChallenged: number;
  expiresAt: string;
  createdAt: string;
  challenger: ChallengeUser;
  challenged: ChallengeUser;
  winner: { id: string; displayName: string | null; name: string | null } | null;
  challengerTake: ChallengeTake | null;
  challengedTake: ChallengeTake | null;
  userVote: { votedForId: string } | null;
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' };
    case 'ACTIVE': return { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' };
    case 'VOTING': return { bg: 'rgba(234,179,8,0.15)', color: '#EAB308' };
    case 'COMPLETED': return { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' };
    case 'EXPIRED': return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' };
    case 'DECLINED': return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' };
    default: return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };
  }
}

function UserAvatar({ user, size = 48 }: { user: { avatarUrl: string | null; image: string | null; displayName: string | null; name: string | null }; size?: number }) {
  const src = user.avatarUrl || user.image;
  if (src) {
    return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>
        {(user.displayName || user.name || '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<{ challenge: Challenge }>(`/court/challenges/${id}`)
      .then((data) => setChallenge(data.challenge))
      .catch((err) => setError(err.message || 'Failed to load challenge'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAccept() {
    setActionLoading(true);
    try {
      const data = await api.post<{ challenge: Challenge }>(`/court/challenges/${id}/accept`, {});
      setChallenge((prev) => prev ? { ...prev, ...data.challenge, userVote: prev.userVote } : prev);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept challenge');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecline() {
    Alert.alert('Decline Challenge', 'Are you sure you want to decline?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await api.post(`/court/challenges/${id}/decline`, {});
            setChallenge((prev) => prev ? { ...prev, status: 'DECLINED' } : prev);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to decline');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  async function handleVote(votedForId: string) {
    setActionLoading(true);
    try {
      const data = await api.post<{ challenge: { votesChallenger: number; votesChallenged: number; status: string } }>(`/court/challenges/${id}/vote`, { votedForId });
      setChallenge((prev) => prev ? {
        ...prev,
        votesChallenger: data.challenge.votesChallenger,
        votesChallenged: data.challenge.votesChallenged,
        status: data.challenge.status,
        userVote: { votedForId },
      } : prev);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to vote');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePostResponse() {
    if (!responseText.trim() || !challenge) return;
    setPosting(true);
    try {
      // Post a take
      const takeData = await api.post<{ take: { id: string } }>('/court/takes', {
        content: responseText.trim(),
        tags: ['challenge'],
      });
      // Link the take to the challenge
      const side = user?.id === challenge.challenger.id ? 'challenger' : 'challenged';
      await api.post(`/court/challenges/${id}/link-take`, {
        takeId: takeData.take.id,
        side,
      });
      setResponseText('');
      // Refresh challenge data
      const refreshed = await api.get<{ challenge: Challenge }>(`/court/challenges/${id}`);
      setChallenge(refreshed.challenge);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post response');
    } finally {
      setPosting(false);
    }
  }

  const currentUserId = user?.id;
  const isChallenged = challenge && currentUserId === challenge.challenged.id;
  const isChallenger = challenge && currentUserId === challenge.challenger.id;
  const isParticipant = isChallenged || isChallenger;
  const canAcceptDecline = isChallenged && challenge?.status === 'OPEN';
  const canVote = challenge &&
    (challenge.status === 'ACTIVE' || challenge.status === 'VOTING') &&
    !challenge.userVote &&
    !isParticipant &&
    !!user;

  const totalVotes = challenge ? challenge.votesChallenger + challenge.votesChallenged : 0;
  const challengerPct = totalVotes > 0 ? Math.round((challenge!.votesChallenger / totalVotes) * 100) : 50;
  const challengedPct = totalVotes > 0 ? 100 - challengerPct : 50;

  const statusInfo = challenge ? getStatusColor(challenge.status) : { bg: '', color: '' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={Colors.orange} size="large" style={{ marginTop: 60 }} />}

        {error && (
          <Text style={{ color: Colors.red, textAlign: 'center', marginTop: 40, fontSize: 15, fontFamily: Fonts.barlow }}>
            {error}
          </Text>
        )}

        {challenge && (
          <>
            {/* Status + Topic */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.topRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>{challenge.status}</Text>
                </View>
                <Text style={styles.timeText}>{timeAgo(challenge.createdAt)}</Text>
              </View>
              <Text style={[styles.topic, { color: colors.text }]}>{challenge.topic}</Text>
              {challenge.status === 'OPEN' && (
                <Text style={styles.expiresText}>
                  Expires {new Date(challenge.expiresAt).toLocaleString()}
                </Text>
              )}
            </View>

            {/* VS Section */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.vsContainer}>
                <TouchableOpacity
                  style={styles.userSide}
                  onPress={() => router.push(`/user/${challenge.challenger.id}` as never)}
                >
                  <UserAvatar user={challenge.challenger} size={52} />
                  <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                    {challenge.challenger.displayName || challenge.challenger.name}
                  </Text>
                  <Text style={styles.record}>
                    {challenge.challenger.challengeWins}W - {challenge.challenger.challengeLosses}L
                  </Text>
                </TouchableOpacity>

                <View style={styles.vsBadge}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <TouchableOpacity
                  style={styles.userSide}
                  onPress={() => router.push(`/user/${challenge.challenged.id}` as never)}
                >
                  <UserAvatar user={challenge.challenged} size={52} />
                  <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                    {challenge.challenged.displayName || challenge.challenged.name}
                  </Text>
                  <Text style={styles.record}>
                    {challenge.challenged.challengeWins}W - {challenge.challenged.challengeLosses}L
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Vote Progress */}
            {totalVotes > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.voteHeader}>
                  <Text style={styles.votePct}>{challengerPct}%</Text>
                  <Text style={styles.voteCount}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</Text>
                  <Text style={[styles.votePct, { color: Colors.blue }]}>{challengedPct}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${challengerPct}%`, backgroundColor: Colors.orange, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }]} />
                  <View style={[styles.progressFill, { width: `${challengedPct}%`, backgroundColor: Colors.blue, borderTopRightRadius: 3, borderBottomRightRadius: 3 }]} />
                </View>
              </View>
            )}

            {/* Winner Banner */}
            {challenge.status === 'COMPLETED' && challenge.winner && (
              <View style={[styles.card, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' }]}>
                <Text style={{ color: '#22C55E', fontFamily: Fonts.barlowBold, fontSize: 16, textAlign: 'center' }}>
                  Winner: {challenge.winner.displayName || challenge.winner.name}
                </Text>
              </View>
            )}

            {/* Linked Takes */}
            {(challenge.challengerTake || challenge.challengedTake) && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.sectionLabel}>TAKES</Text>
                {challenge.challengerTake && (
                  <TouchableOpacity
                    style={[styles.linkedTake, { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.15)' }]}
                    onPress={() => router.push(`/take/${challenge.challengerTake!.id}` as never)}
                  >
                    <Text style={{ color: Colors.orange, fontFamily: Fonts.barlowBold, fontSize: 12, marginBottom: 4 }}>
                      {challenge.challengerTake.author.displayName || challenge.challengerTake.author.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: Fonts.barlow, fontSize: 14, lineHeight: 20 }}>
                      {challenge.challengerTake.content}
                    </Text>
                  </TouchableOpacity>
                )}
                {challenge.challengedTake && (
                  <TouchableOpacity
                    style={[styles.linkedTake, { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.15)', marginTop: 8 }]}
                    onPress={() => router.push(`/take/${challenge.challengedTake!.id}` as never)}
                  >
                    <Text style={{ color: Colors.blue, fontFamily: Fonts.barlowBold, fontSize: 12, marginBottom: 4 }}>
                      {challenge.challengedTake.author.displayName || challenge.challengedTake.author.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: Fonts.barlow, fontSize: 14, lineHeight: 20 }}>
                      {challenge.challengedTake.content}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Accept / Decline for challenged user */}
              {canAcceptDecline && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#22C55E', flex: 1 }]}
                    onPress={handleAccept}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>Accept Challenge</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', flex: 1 }]}
                    onPress={handleDecline}
                    disabled={actionLoading}
                  >
                    <Text style={[styles.actionBtnText, { color: Colors.red }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Waiting message */}
              {isChallenger && challenge.status === 'OPEN' && (
                <View style={styles.statusMessage}>
                  <Text style={styles.statusMessageText}>
                    Waiting for {challenge.challenged.displayName || challenge.challenged.name} to respond...
                  </Text>
                </View>
              )}

              {/* Participant response area - post a take for this challenge */}
              {isParticipant && (challenge.status === 'ACTIVE' || challenge.status === 'VOTING') && (
                <View>
                  {/* Show who needs to respond */}
                  {isChallenger && !challenge.challengerTake && (
                    <Text style={[styles.statusMessageText, { textAlign: 'center', marginBottom: 10, color: Colors.orange }]}>
                      Post your take to make your case
                    </Text>
                  )}
                  {isChallenged && !challenge.challengedTake && (
                    <Text style={[styles.statusMessageText, { textAlign: 'center', marginBottom: 10, color: Colors.orange }]}>
                      Post your response take
                    </Text>
                  )}
                  {((isChallenger && !challenge.challengerTake) || (isChallenged && !challenge.challengedTake)) && (
                    <View>
                      <TextInput
                        style={[styles.responseInput, { color: colors.text, borderColor: colors.border }]}
                        placeholder="Share your take on this challenge..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={responseText}
                        onChangeText={setResponseText}
                        multiline
                        maxLength={500}
                      />
                      <TouchableOpacity
                        style={[styles.actionBtn, {
                          backgroundColor: responseText.trim() ? Colors.orange : 'rgba(255,107,53,0.3)',
                          marginTop: 8,
                        }]}
                        onPress={handlePostResponse}
                        disabled={posting || !responseText.trim()}
                      >
                        {posting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.actionBtnText}>Post Response</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Both takes posted - waiting for community votes */}
                  {((isChallenger && challenge.challengerTake) || (isChallenged && challenge.challengedTake)) && (
                    <View style={styles.statusMessage}>
                      <Text style={[styles.statusMessageText, { color: Colors.green }]}>
                        Your take is posted! Waiting for community votes.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Vote buttons */}
              {canVote && (
                <View>
                  <Text style={[styles.statusMessageText, { textAlign: 'center', marginBottom: 12 }]}>Cast your vote</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', flex: 1 }]}
                      onPress={() => handleVote(challenge.challenger.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color={Colors.orange} size="small" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: Colors.orange }]}>
                          {challenge.challenger.displayName || challenge.challenger.name}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', flex: 1 }]}
                      onPress={() => handleVote(challenge.challenged.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color={Colors.blue} size="small" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: Colors.blue }]}>
                          {challenge.challenged.displayName || challenge.challenged.name}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Already voted */}
              {challenge.userVote && (
                <View style={styles.statusMessage}>
                  <Text style={styles.statusMessageText}>
                    You voted for{' '}
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      {challenge.userVote.votedForId === challenge.challenger.id
                        ? challenge.challenger.displayName || challenge.challenger.name
                        : challenge.challenged.displayName || challenge.challenged.name}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Not logged in */}
              {!user && (challenge.status === 'ACTIVE' || challenge.status === 'VOTING') && (
                <View style={styles.statusMessage}>
                  <Text style={styles.statusMessageText}>Sign in to vote on this challenge</Text>
                </View>
              )}

              {/* Declined */}
              {challenge.status === 'DECLINED' && (
                <View style={styles.statusMessage}>
                  <Text style={styles.statusMessageText}>This challenge was declined</Text>
                </View>
              )}

              {/* Expired */}
              {challenge.status === 'EXPIRED' && (
                <View style={styles.statusMessage}>
                  <Text style={styles.statusMessageText}>This challenge expired without a winner</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.anton,
    fontSize: 18,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  topic: {
    fontFamily: Fonts.anton,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  expiresText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  userSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 14,
    textAlign: 'center',
  },
  record: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  vsBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontFamily: Fonts.anton,
    fontSize: 13,
    color: Colors.orange,
    letterSpacing: 1,
  },
  voteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  votePct: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: Colors.orange,
  },
  voteCount: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
  },
  sectionLabel: {
    fontFamily: Fonts.anton,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 10,
  },
  linkedTake: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 15,
    color: '#fff',
  },
  statusMessage: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  statusMessageText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  responseInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontFamily: Fonts.barlow,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
