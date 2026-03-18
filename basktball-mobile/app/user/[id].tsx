import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
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

interface UserProfile {
  id: string;
  name: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  image: string | null;
  location: string | null;
  role: string;
  takeCount: number;
  followerCount: number;
}

interface UserTake {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  createdAt: string;
  tags: string[];
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const PROFILE_TABS = ['TAKES', 'CHALLENGES', 'PREDICTIONS', 'AGING'];

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [takes, setTakes] = useState<UserTake[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [agingTakes, setAgingTakes] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('TAKES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  async function fetchProfile() {
    if (!id) return;
    try {
      const [profileRes, takesRes] = await Promise.all([
        fetch(`${API_BASE}/api/mobile/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/api/mobile/users/${id}/takes?limit=20`),
      ]);
      const profileData = await profileRes.json();
      const takesData = await takesRes.json();
      if (profileData.user) {
        setProfile(profileData.user);
        setIsFollowing(!!profileData.isFollowing);
        setIsSelf(!!profileData.isSelf);
      } else {
        setError(true);
      }
      if (takesData.takes) setTakes(takesData.takes);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profile?.name) return;
    if (selectedTab === 'CHALLENGES') fetchChallenges();
    if (selectedTab === 'PREDICTIONS') fetchPredictions();
    if (selectedTab === 'AGING') fetchAgingTakes();
  }, [selectedTab, profile?.name]);

  async function fetchChallenges() {
    try {
      const res = await fetch(`${API_BASE}/api/users/${profile?.name}/challenges`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch { setChallenges([]); }
  }

  async function fetchPredictions() {
    try {
      const res = await fetch(`${API_BASE}/api/users/${profile?.name}/predictions`);
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch { setPredictions([]); }
  }

  async function fetchAgingTakes() {
    try {
      const res = await fetch(`${API_BASE}/api/users/${profile?.name}/aging-takes`);
      const data = await res.json();
      setAgingTakes(data.agingTakes || []);
    } catch { setAgingTakes([]); }
  }

  async function handleFollow() {
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to follow users.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    setFollowLoading(true);
    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setProfile((prev) =>
      prev ? { ...prev, followerCount: prev.followerCount + (wasFollowing ? -1 : 1) } : prev
    );
    try {
      await api.post(`/mobile/users/${id}/follow`, {});
    } catch {
      // Revert on failure
      setIsFollowing(wasFollowing);
      setProfile((prev) =>
        prev ? { ...prev, followerCount: prev.followerCount + (wasFollowing ? 1 : -1) } : prev
      );
    } finally {
      setFollowLoading(false);
    }
  }

  const avatarUri = profile?.avatarUrl || profile?.image || null;
  const displayName = profile?.displayName || profile?.name || '';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: Colors.orange }]}>
              <Text style={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.handle, { color: colors.textSecondary }]}>@{profile.name}</Text>
          {profile.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
          ) : null}
          {profile.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.location, { color: colors.textTertiary }]}>{profile.location}</Text>
            </View>
          ) : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.takeCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Takes</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.followerCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Followers</Text>
            </View>
          </View>

          {/* Follow Button */}
          {!isSelf && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing && styles.followBtnActive,
              ]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? Colors.orange : '#fff'} />
              ) : (
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {PROFILE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: selectedTab === tab ? Colors.orange : 'transparent' }}
            >
              <Text style={{ fontFamily: Fonts.barlowSemiBold, fontSize: 13, letterSpacing: 1, color: selectedTab === tab ? colors.text : colors.textTertiary }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {selectedTab === 'TAKES' && (
          <>
            {takes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No takes yet</Text>
            ) : (
              takes.map((take) => (
                <TouchableOpacity
                  key={take.id}
                  style={[styles.takeRow, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/take/${take.id}`)}
                >
                  <Text style={[styles.takeContent, { color: colors.text }]}>{take.content}</Text>
                  {take.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {take.tags.map((tag) => (
                        <Text key={tag} style={styles.tag}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                  <View style={styles.takeActions}>
                    <View style={styles.takeAction}>
                      <Ionicons name="flame-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.takeActionCount, { color: colors.textTertiary }]}>{take.fireCount}</Text>
                    </View>
                    <View style={styles.takeAction}>
                      <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.takeActionCount, { color: colors.textTertiary }]}>{take.replyCount}</Text>
                    </View>
                    <Text style={[styles.takeTime, { color: colors.textTertiary }]}>{timeAgo(take.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {selectedTab === 'CHALLENGES' && (
          <>
            {challenges.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No challenges yet</Text>
            ) : (
              challenges.map((c: any) => (
                <TouchableOpacity key={c.id} style={[styles.takeRow, { borderBottomColor: colors.border }]} activeOpacity={0.7} onPress={() => router.push(`/challenge/${c.id}` as never)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontFamily: Fonts.barlowBold, fontSize: 11, color: c.status === 'COMPLETED' ? '#22C55E' : Colors.orange, textTransform: 'uppercase' as const }}>{c.status}</Text>
                    <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: colors.textTertiary }}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={[styles.takeContent, { color: colors.text }]}>{c.topic}</Text>
                  <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textTertiary }}>
                    {c.challenger?.displayName || c.challenger?.name} vs {c.challenged?.displayName || c.challenged?.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {selectedTab === 'PREDICTIONS' && (
          <>
            {predictions.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No predictions yet</Text>
            ) : (
              predictions.map((p: any) => (
                <TouchableOpacity key={p.id} style={[styles.takeRow, { borderBottomColor: colors.border }]} activeOpacity={0.7} onPress={() => p.take && router.push(`/take/${p.take.id}`)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontFamily: Fonts.barlowBold, fontSize: 11, color: p.status === 'RECEIPT' ? '#22C55E' : p.status === 'BUST' ? '#EF4444' : colors.textTertiary, textTransform: 'uppercase' as const }}>{p.status}</Text>
                  </View>
                  <Text style={[styles.takeContent, { color: colors.text }]}>{p.claim}</Text>
                  {p.result && <Text style={{ fontFamily: Fonts.barlow, fontSize: 12, color: colors.textTertiary }}>{p.result}</Text>}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {selectedTab === 'AGING' && (
          <>
            {agingTakes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No aging takes yet</Text>
            ) : (
              agingTakes.map((at: any) => (
                <TouchableOpacity key={at.id} style={[styles.takeRow, { borderBottomColor: colors.border }]} activeOpacity={0.7} onPress={() => router.push(`/take/${at.take?.id}`)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontFamily: Fonts.barlowBold, fontSize: 11, color: at.status === 'AGED' ? '#EAB308' : at.status === 'AGING' ? '#3B82F6' : colors.textTertiary, textTransform: 'uppercase' as const }}>{at.status}</Text>
                  </View>
                  <Text style={[styles.takeContent, { color: colors.text }]}>{at.take?.content}</Text>
                  <Text style={{ fontFamily: Fonts.barlow, fontSize: 12, color: colors.textTertiary }}>
                    Revisit: {new Date(at.revisitDate).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Fonts.barlowBold,
      fontSize: 18,
      letterSpacing: 1,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    profileSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
    avatarFallback: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: Fonts.barlowBold,
      fontSize: 32,
      color: '#fff',
    },
    displayName: {
      fontFamily: Fonts.barlowBold,
      fontSize: 22,
      marginBottom: 4,
    },
    handle: {
      fontFamily: Fonts.barlow,
      fontSize: 14,
      marginBottom: 10,
    },
    bio: {
      fontFamily: Fonts.barlow,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
    },
    location: {
      fontFamily: Fonts.barlow,
      fontSize: 13,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 24,
    },
    stat: { alignItems: 'center' },
    statValue: {
      fontFamily: Fonts.barlowBold,
      fontSize: 20,
    },
    statLabel: {
      fontFamily: Fonts.barlow,
      fontSize: 12,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 32,
    },
    followBtn: {
      marginTop: 20,
      paddingHorizontal: 40,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: Colors.orange,
      minWidth: 120,
      alignItems: 'center',
    },
    followBtnActive: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.orange,
    },
    followBtnText: {
      fontFamily: Fonts.barlowBold,
      fontSize: 15,
      color: '#fff',
      letterSpacing: 0.5,
    },
    followBtnTextActive: {
      color: Colors.orange,
    },
    divider: {
      height: 1,
      marginHorizontal: 16,
    },
    takesHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    takesTitle: {
      fontFamily: Fonts.barlowBold,
      fontSize: 13,
      letterSpacing: 1.5,
    },
    emptyText: {
      fontFamily: Fonts.barlow,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 32,
    },
    takeRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    takeContent: {
      fontFamily: Fonts.barlow,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 6,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    tag: {
      fontFamily: Fonts.barlowSemiBold,
      fontSize: 11,
      color: Colors.orange,
      backgroundColor: 'rgba(255,107,53,0.12)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      textTransform: 'uppercase',
    },
    takeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    takeAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    takeActionCount: {
      fontFamily: Fonts.mono,
      fontSize: 12,
    },
    takeTime: {
      fontFamily: Fonts.barlow,
      fontSize: 12,
      marginLeft: 'auto',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontFamily: Fonts.barlow,
      fontSize: 16,
      color: colors.textTertiary,
    },
  });
}
