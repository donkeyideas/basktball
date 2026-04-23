import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';
import { AutoImage } from '@/components/feed/AutoImage';
import { ImageGrid } from '@/components/feed/ImageGrid';

const PROFILE_SEGMENTS = ['TAKES', 'REPLIES', 'CHALLENGES', 'PREDICTIONS', 'AGING', 'BOOKMARKS'];

interface Take {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
  createdAt: string;
  parentId?: string | null;
  mediaUrl?: string | null;
  mediaUrls?: string[];
  author?: {
    name: string | null;
    displayName: string | null;
  };
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
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { user, isAdmin, logout, refreshProfile } = useAuth();
  const { edit } = useLocalSearchParams();
  const [selectedSegment, setSelectedSegment] = useState('TAKES');
  const [takes, setTakes] = useState<Take[]>([]);
  const [bookmarks, setBookmarks] = useState<Take[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [agingTakes, setAgingTakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserTakes();
      refreshProfile();
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserTakes(),
        refreshProfile(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  // Re-fetch takes when screen comes back into focus (e.g. after posting a reply)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchUserTakes();
    }, [user?.id])
  );

  useEffect(() => {
    if (edit === 'true' && user) openEditModal();
  }, [edit]);

  useEffect(() => {
    if (selectedSegment === 'BOOKMARKS' && user?.id) fetchBookmarks();
    if (selectedSegment === 'CHALLENGES' && user?.name) fetchChallenges();
    if (selectedSegment === 'PREDICTIONS' && user?.name) fetchPredictions();
    if (selectedSegment === 'AGING' && user?.name) fetchAgingTakes();
  }, [selectedSegment, user?.id, user?.name]);

  async function fetchUserTakes() {
    try {
      const data = await api.get<{ takes: Take[] }>(`/mobile/users/${user?.id}/takes?limit=50&replies=true`);
      setTakes(data.takes || []);
    } catch (err) {
      console.warn('Failed to fetch user takes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookmarks() {
    try {
      const data = await api.get<{ takes: Take[] }>('/mobile/bookmarks');
      setBookmarks(data.takes || []);
    } catch {
      setBookmarks([]);
    }
  }

  async function fetchChallenges() {
    try {
      const data = await api.get<{ challenges: any[] }>(`/users/${user?.name}/challenges`);
      setChallenges(data.challenges || []);
    } catch {
      setChallenges([]);
    }
  }

  async function fetchPredictions() {
    try {
      const data = await api.get<{ predictions: any[] }>(`/users/${user?.name}/predictions`);
      setPredictions(data.predictions || []);
    } catch {
      setPredictions([]);
    }
  }

  async function fetchAgingTakes() {
    try {
      const data = await api.get<{ agingTakes: any[] }>(`/users/${user?.name}/aging-takes`);
      setAgingTakes(data.agingTakes || []);
    } catch {
      setAgingTakes([]);
    }
  }

  function openEditModal() {
    setEditName(user?.displayName || user?.name || '');
    setEditBio(user?.bio || '');
    setShowEditModal(true);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await api.patch('/mobile/profile', {
        displayName: editName.trim(),
        bio: editBio.trim(),
      });
      Alert.alert('Saved', 'Profile updated successfully.');
      setShowEditModal(false);
      refreshProfile();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setUploadingAvatar(true);
      try {
        await api.post('/mobile/profile/avatar', {
          image: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
        });
        await refreshProfile();
        Alert.alert('Success', 'Profile picture updated!');
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to upload image');
      } finally {
        setUploadingAvatar(false);
      }
    }
  }

  const displayName = user?.displayName || user?.name || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();
  const handle = user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, '')}` : '@user';

  function getFilteredTakes() {
    switch (selectedSegment) {
      case 'REPLIES':
        return takes.filter(t => t.parentId);
      case 'BOOKMARKS':
        return bookmarks;
      default:
        return takes.filter(t => !t.parentId);
    }
  }

  function renderTakeItem(item: Take) {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.takeCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/take/${item.id}`)}
      >
        {item.content ? <Text style={styles.takeText}>{item.content}</Text> : null}
        {(item.mediaUrls?.length ?? 0) > 0 ? (
          <View style={{ marginBottom: 8 }}><ImageGrid urls={item.mediaUrls!} /></View>
        ) : item.mediaUrl ? (
          <AutoImage source={{ uri: item.mediaUrl }} style={{ marginBottom: 8 }} />
        ) : null}
        <View style={styles.takeActions}>
          <View style={styles.takeAction}>
            <Ionicons name="flame-outline" size={16} color={Colors.orange} />
            <Text style={[styles.takeActionCount, styles.fireCount]}>{item.fireCount}</Text>
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.takeActionCount}>{item.brickCount}</Text>
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.takeActionCount}>{item.replyCount}</Text>
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.takeActionCount}>{item.repostCount ?? 0}</Text>
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="search" size={14} color={colors.textTertiary} />
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="flag-outline" size={14} color={colors.textTertiary} />
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          </View>
          <View style={styles.takeAction}>
            <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.takeActionCount, { color: colors.textTertiary, fontSize: 12 }]}>{item.viewCount ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  const filteredTakes = getFilteredTakes();

  // Not logged in - show login prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
        </View>
        <View style={styles.loginPrompt}>
          <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.loginPromptTitle}>Sign in to view your profile</Text>
          <Text style={styles.loginPromptSubtitle}>Post takes, follow players, and join the conversation</Text>
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>Don't have an account? Create one</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} colors={[Colors.orange]} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.avatarUrl || user?.image ? (
            <Image source={{ uri: user.avatarUrl || user.image }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileHandle}>{handle}</Text>
          {user?.bio ? <Text style={styles.profileBio}>{user.bio}</Text> : null}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat} activeOpacity={0.7}>
              <Text style={styles.statValue}>{user?.takeCount ?? 0}</Text>
              <Text style={styles.statLabel}>Takes</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat} activeOpacity={0.7}>
              <Text style={styles.statValue}>{(user?.followerCount ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.stat} activeOpacity={0.7}>
              <Text style={styles.statValue}>{user?.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={openEditModal}>
            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
          </TouchableOpacity>

          {/* Admin Dashboard Button - hidden for production builds */}
        </View>

        {/* Segment Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentRow}>
          {PROFILE_SEGMENTS.map((seg) => (
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
        </ScrollView>

        {/* Content */}
        {loading ? (
          <ActivityIndicator color={Colors.orange} style={{ marginTop: 30 }} />
        ) : selectedSegment === 'CHALLENGES' ? (
          challenges.length === 0 ? (
            <Text style={styles.emptyText}>No challenges yet</Text>
          ) : (
            challenges.map((c: any) => (
              <TouchableOpacity key={c.id} style={styles.takeCard} activeOpacity={0.7} onPress={() => router.push(`/challenge/${c.id}` as never)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 12, color: c.status === 'COMPLETED' ? '#22C55E' : Colors.orange, textTransform: 'uppercase' }}>{c.status}</Text>
                  <Text style={{ fontFamily: Fonts.mono, fontSize: 12, color: colors.textTertiary }}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={styles.takeText}>{c.topic}</Text>
                <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary }}>
                  {c.challenger?.displayName || c.challenger?.name} vs {c.challenged?.displayName || c.challenged?.name}
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : selectedSegment === 'PREDICTIONS' ? (
          predictions.length === 0 ? (
            <Text style={styles.emptyText}>No predictions yet</Text>
          ) : (
            predictions.map((p: any) => (
              <TouchableOpacity key={p.id} style={styles.takeCard} activeOpacity={0.7} onPress={() => p.take && router.push(`/take/${p.take.id}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 12, color: p.status === 'RECEIPT' ? '#22C55E' : p.status === 'BUST' ? '#EF4444' : colors.textSecondary, textTransform: 'uppercase' }}>{p.status}</Text>
                </View>
                <Text style={styles.takeText}>{p.claim}</Text>
                {p.result && <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textTertiary }}>{p.result}</Text>}
              </TouchableOpacity>
            ))
          )
        ) : selectedSegment === 'AGING' ? (
          agingTakes.length === 0 ? (
            <Text style={styles.emptyText}>No aging takes yet</Text>
          ) : (
            agingTakes.map((at: any) => (
              <TouchableOpacity key={at.id} style={styles.takeCard} activeOpacity={0.7} onPress={() => router.push(`/take/${at.take?.id}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontFamily: Fonts.barlowBold, fontWeight: '700', fontSize: 12, color: at.status === 'AGED' ? '#EAB308' : at.status === 'AGING' ? '#3B82F6' : colors.textTertiary, textTransform: 'uppercase' }}>{at.status}</Text>
                </View>
                <Text style={styles.takeText}>{at.take?.content}</Text>
                <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textTertiary }}>
                  Revisit: {new Date(at.revisitDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : filteredTakes.length === 0 ? (
          <Text style={styles.emptyText}>
            {selectedSegment === 'BOOKMARKS' ? 'No bookmarks yet' : 'No takes yet'}
          </Text>
        ) : (
          filteredTakes.map((item) => renderTakeItem(item))
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editContainer}>
            <View style={styles.editHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.editCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={Colors.orange} size="small" />
                ) : (
                  <Text style={styles.editSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            {/* Avatar Picker */}
            <TouchableOpacity onPress={pickImage} style={styles.editAvatarContainer} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <View style={styles.editAvatar}>
                  <ActivityIndicator color={Colors.orange} />
                </View>
              ) : user?.avatarUrl || user?.image ? (
                <Image source={{ uri: user.avatarUrl || user.image }} style={styles.editAvatar} />
              ) : (
                <View style={[styles.editAvatar, styles.editAvatarPlaceholder]}>
                  <Text style={styles.editAvatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={14} color={colors.text} />
              </View>
            </TouchableOpacity>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Display Name</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={colors.textTertiary}
                placeholder="Your display name"
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Bio</Text>
              <TextInput
                style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholderTextColor={colors.textTertiary}
                placeholder="Tell us about yourself"
                multiline
                maxLength={160}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 72,
    paddingRight: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 24,
    color: colors.text,
    letterSpacing: 2,
  },
  settingsButton: {
    padding: 4,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.orange,
    backgroundColor: colors.surface,
  },
  avatarText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 28,
    color: Colors.orange,
  },
  profileName: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 22,
    color: colors.text,
    marginBottom: 2,
  },
  profileHandle: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  profileBio: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 20,
    color: colors.text,
  },
  statLabel: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  editButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  editButtonText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
    letterSpacing: 1,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    gap: 8,
  },
  adminButtonText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  segment: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentActive: {
    borderBottomColor: Colors.orange,
  },
  segmentText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: colors.text,
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
  },
  takeCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  takeText: {
    fontFamily: Fonts.barlow,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  takeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  takeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  takeActionCount: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: colors.textSecondary,
  },
  fireCount: {
    color: Colors.orange,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    gap: 8,
  },
  logoutText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 15,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 30,
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loginPromptTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 22,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 16,
  },
  loginButtonText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  signupLink: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.orange,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  editContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  editCancel: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: colors.textSecondary,
  },
  editTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: colors.text,
    letterSpacing: 1,
  },
  editSave: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.orange,
  },
  editField: {
    marginBottom: 20,
  },
  editLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  editInput: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editAvatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  editAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarPlaceholder: {
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  editAvatarInitials: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 28,
    color: Colors.orange,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  });
}
