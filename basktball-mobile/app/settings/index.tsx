import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Share,
  Linking,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { api } from '@/lib/api/client';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const API_BASE = 'https://www.basktball.com';

interface NbaTeam {
  abbreviation: string;
  name: string;
  logoUrl?: string;
}

export default function SettingsScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const { isDark, colors, setDarkMode: setThemeDark } = useTheme();
  const [gameAlerts, setGameAlerts] = useState(true);
  const [socialActivity, setSocialActivity] = useState(true);
  const [newsUpdates, setNewsUpdates] = useState(false);

  // Modals
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLinkedAccounts, setShowLinkedAccounts] = useState(false);
  const [showFavoriteTeams, setShowFavoriteTeams] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Favorite teams state
  const [allTeams, setAllTeams] = useState<NbaTeam[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [savingTeams, setSavingTeams] = useState(false);

  // Blocked users state
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; name: string; displayName: string | null; avatarUrl: string | null }[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Load persisted preferences
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('pref_gameAlerts'),
      AsyncStorage.getItem('pref_socialActivity'),
      AsyncStorage.getItem('pref_newsUpdates'),
    ]).then(([ga, sa, nu]) => {
      if (ga !== null) setGameAlerts(ga === 'true');
      if (sa !== null) setSocialActivity(sa === 'true');
      if (nu !== null) setNewsUpdates(nu === 'true');
    });
  }, []);

  function persistToggle(key: string, value: boolean, setter: (v: boolean) => void) {
    setter(value);
    AsyncStorage.setItem(key, String(value));
  }

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, takes, and activity will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/mobile/account');
              await logout();
              router.replace('/(auth)/login');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/mobile/auth/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  async function openFavoriteTeams() {
    setSelectedTeams(user?.favoriteTeams || []);
    setShowFavoriteTeams(true);
    if (allTeams.length === 0) {
      try {
        const res = await fetch(`${API_BASE}/api/teams?league=nba`);
        const data = await res.json();
        if (data.success && data.teams) {
          setAllTeams(data.teams.map((t: any) => ({
            abbreviation: t.abbreviation,
            name: t.name,
            logoUrl: t.logoUrl || '',
          })));
        }
      } catch {
        Alert.alert('Error', 'Failed to load teams');
      }
    }
  }

  function toggleTeam(abbr: string) {
    setSelectedTeams(prev => {
      if (prev.includes(abbr)) return prev.filter(t => t !== abbr);
      if (prev.length >= 5) {
        Alert.alert('Limit', 'You can select up to 5 favorite teams');
        return prev;
      }
      return [...prev, abbr];
    });
  }

  async function saveFavoriteTeams() {
    setSavingTeams(true);
    try {
      await api.patch('/mobile/profile', { favoriteTeams: selectedTeams });
      await refreshProfile();
      setShowFavoriteTeams(false);
      Alert.alert('Saved', 'Favorite teams updated');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save teams');
    } finally {
      setSavingTeams(false);
    }
  }

  async function openBlockedUsers() {
    setShowBlockedUsers(true);
    setLoadingBlocked(true);
    try {
      const data: any = await api.get('/mobile/users/blocked');
      setBlockedUsers(data.blockedUsers || []);
    } catch {
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoadingBlocked(false);
    }
  }

  async function handleUnblock(userId: string, name: string) {
    Alert.alert(`Unblock ${name}?`, 'You will be able to see their content again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await api.post(`/mobile/users/${userId}/block`, {});
            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
          } catch {
            Alert.alert('Error', 'Failed to unblock user');
          }
        },
      },
    ]);
  }

  function handleRateApp() {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.basktball.app');
  }

  async function handleShareApp() {
    await Share.share({
      message: 'Check out Basktball - the ultimate basketball app! Download at https://basktball.com',
      title: 'Basktball',
    });
  }

  function handleHelpSupport() {
    Linking.openURL('mailto:info@donkeyideas.com?subject=Basktball App Support');
  }

  function renderMenuItem(
    icon: IoniconsName,
    label: string,
    onPress?: () => void,
    options?: {
      rightElement?: React.ReactNode;
      isDestructive?: boolean;
    }
  ) {
    const { rightElement, isDestructive } = options || {};
    return (
      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: colors.border }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress && !rightElement}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons
            name={icon}
            size={20}
            color={isDestructive ? colors.red : colors.textSecondary}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuLabel, { color: colors.text }, isDestructive && styles.menuLabelDestructive]}>
            {label}
          </Text>
        </View>
        {rightElement || (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  }

  function renderSwitch(value: boolean, onValueChange: (v: boolean) => void) {
    return (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: 'rgba(255,107,53,0.4)' }}
        thumbColor={value ? Colors.orange : '#666'}
      />
    );
  }

  const linkedProviders = user?.accounts?.map(a => a.provider) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {/* Spacer — FloatingMenu's hamburger button overlays this position */}
        <View style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ACCOUNT</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderMenuItem('person-outline', 'Edit Profile', () => router.push('/(tabs)/profile?edit=true'))}
          {renderMenuItem('lock-closed-outline', 'Change Password', () => setShowChangePassword(true))}
          {renderMenuItem('link-outline', 'Linked Accounts', () => setShowLinkedAccounts(true))}
          {renderMenuItem('ban-outline' as IoniconsName, 'Blocked Users', openBlockedUsers)}
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>PREFERENCES</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderMenuItem('heart-outline', 'Favorite Teams', openFavoriteTeams)}
          {renderMenuItem('moon-outline', 'Dark Mode', undefined, {
            rightElement: renderSwitch(isDark, (v) => setThemeDark(v)),
          })}
        </View>

        {/* Notifications Section */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>NOTIFICATIONS</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderMenuItem('basketball-outline', 'Game Alerts', undefined, {
            rightElement: renderSwitch(gameAlerts, (v) => persistToggle('pref_gameAlerts', v, setGameAlerts)),
          })}
          {renderMenuItem('people-outline', 'Social Activity', undefined, {
            rightElement: renderSwitch(socialActivity, (v) => persistToggle('pref_socialActivity', v, setSocialActivity)),
          })}
          {renderMenuItem('newspaper-outline', 'News Updates', undefined, {
            rightElement: renderSwitch(newsUpdates, (v) => persistToggle('pref_newsUpdates', v, setNewsUpdates)),
          })}
        </View>

        {/* About Section */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderMenuItem('star-outline', 'Rate App', handleRateApp)}
          {renderMenuItem('share-outline', 'Share App', handleShareApp)}
          {renderMenuItem('shield-checkmark-outline', 'Privacy Policy', () => router.push('/legal/privacy'))}
          {renderMenuItem('document-text-outline', 'Terms of Service', () => router.push('/legal/terms'))}
          {renderMenuItem('help-circle-outline', 'Help & Support', handleHelpSupport)}
        </View>

        {/* Danger Zone Section */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>DANGER ZONE</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderMenuItem('log-out-outline', 'Logout', handleLogout, { isDestructive: true })}
          {renderMenuItem('trash-outline', 'Delete Account', handleDeleteAccount, { isDestructive: true })}
        </View>

        {/* Version */}
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>BASKTBALL v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? (
                  <ActivityIndicator color={Colors.orange} size="small" />
                ) : (
                  <Text style={styles.modalSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholderTextColor={Colors.textTertiary}
                placeholder="Enter current password"
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor={Colors.textTertiary}
                placeholder="At least 8 characters"
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={Colors.textTertiary}
                placeholder="Confirm new password"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Linked Accounts Modal */}
      <Modal visible={showLinkedAccounts} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowLinkedAccounts(false)}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Linked Accounts</Text>
              <View style={{ width: 50 }} />
            </View>
            {linkedProviders.length === 0 ? (
              <Text style={styles.emptyText}>No linked accounts</Text>
            ) : (
              linkedProviders.map((provider) => (
                <View key={provider} style={styles.linkedItem}>
                  <Ionicons
                    name={provider === 'google' ? 'logo-google' : 'link-outline'}
                    size={22}
                    color={Colors.orange}
                  />
                  <Text style={styles.linkedText}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                </View>
              ))
            )}
            <Text style={styles.linkedHint}>
              {user?.email ? `Signed in as ${user.email}` : ''}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Blocked Users Modal */}
      <Modal visible={showBlockedUsers} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowBlockedUsers(false)}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Blocked Users</Text>
              <View style={{ width: 50 }} />
            </View>
            {loadingBlocked ? (
              <ActivityIndicator color={Colors.orange} style={{ marginTop: 20 }} />
            ) : blockedUsers.length === 0 ? (
              <Text style={styles.emptyText}>No blocked users</Text>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.linkedItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkedText}>{item.displayName || item.name}</Text>
                      <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textTertiary }}>@{item.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(item.id, item.displayName || item.name)}
                      style={{ backgroundColor: 'rgba(255,107,53,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 }}
                    >
                      <Text style={{ fontFamily: Fonts.barlowSemiBold, fontWeight: '600', fontSize: 13, color: Colors.orange }}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Favorite Teams Modal */}
      <Modal visible={showFavoriteTeams} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFavoriteTeams(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Favorite Teams</Text>
              <TouchableOpacity onPress={saveFavoriteTeams} disabled={savingTeams}>
                {savingTeams ? (
                  <ActivityIndicator color={Colors.orange} size="small" />
                ) : (
                  <Text style={styles.modalSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.teamHint}>Select up to 5 teams ({selectedTeams.length}/5)</Text>
            {allTeams.length === 0 ? (
              <ActivityIndicator color={Colors.orange} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={allTeams}
                keyExtractor={(item) => item.abbreviation}
                renderItem={({ item }) => {
                  const isSelected = selectedTeams.includes(item.abbreviation);
                  return (
                    <TouchableOpacity
                      style={[styles.teamItem, isSelected && styles.teamItemSelected]}
                      onPress={() => toggleTeam(item.abbreviation)}
                    >
                      {item.logoUrl ? (
                        <Image source={{ uri: item.logoUrl }} style={styles.teamItemLogo} contentFit="contain" />
                      ) : (
                        <View style={[styles.teamItemLogo, { backgroundColor: Colors.darkGray }]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamItemName}>{item.name}</Text>
                        <Text style={styles.teamItemAbbr}>{item.abbreviation}</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSelected ? Colors.orange : Colors.textTertiary}
                      />
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
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
    backgroundColor: Colors.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.white,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionLabel: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    backgroundColor: Colors.darkGray,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: Colors.white,
  },
  menuLabelDestructive: {
    color: Colors.red,
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 32,
  },
  versionText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.darkGray,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalCancel: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.white,
    letterSpacing: 1,
  },
  modalSave: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.orange,
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalInput: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: Colors.white,
    backgroundColor: Colors.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 20,
  },
  // Linked Accounts
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkedText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.white,
    flex: 1,
  },
  linkedHint: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 16,
    textAlign: 'center',
  },
  // Favorite Teams
  teamHint: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  teamItemSelected: {
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  teamItemLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  teamItemName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 15,
    color: Colors.white,
  },
  teamItemAbbr: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
