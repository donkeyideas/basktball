import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';
import { GifPicker } from '@/components/feed/GifPicker';
import { MentionAutocomplete } from '@/components/feed/MentionAutocomplete';

const API_BASE = 'https://www.basktball.com';

// Routes where the FAB should NOT appear
const HIDDEN_ROUTES = [
  '/onboarding',
  '/login',
  '/signup',
  '/court', // Court has its own FAB with feed-refresh logic
];

function shouldHideOnRoute(pathname: string | null): boolean {
  if (!pathname) return true;
  return HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export default function ComposeFAB() {
  const { colors } = useTheme();
  const { token, refreshProfile } = useAuth();
  const pathname = usePathname();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(24);
  const [composeMediaUrl, setComposeMediaUrl] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);

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
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }

  function requireAuth(): boolean {
    if (!token) {
      showAlert('Sign In Required', 'Please sign in to post a take.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return false;
    }
    return true;
  }

  function resetCompose() {
    setComposeText('');
    setShowPoll(false);
    setPollOptions(['', '']);
    setPollDuration(24);
    setComposeMediaUrl(null);
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
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Needed', 'Please allow photo access to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileSize = asset.fileSize || 0;

      setUploading(true);
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) {
        showAlert('Error', 'Please sign in again.');
        setUploading(false);
        return;
      }

      // Get presigned upload URL
      const presignRes = await fetch(`${API_BASE}/api/mobile/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ contentType: mimeType, fileSize }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get upload URL');
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      // Upload file to R2
      const blob = await fetch(uri).then((r) => r.blob());
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      setComposeMediaUrl(publicUrl);
    } catch (err: any) {
      showAlert('Upload Error', err?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  }

  async function handlePost() {
    if (!composeText.trim()) return;
    if (composeText.length > 2000) {
      showAlert('Too Long', 'Takes must be 2,000 characters or less.');
      return;
    }
    if (showPoll) {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        showAlert('Poll Error', 'You need at least 2 options for a poll.');
        return;
      }
    }
    setPosting(true);
    try {
      const body: any = { content: composeText.trim() };
      if (composeMediaUrl) {
        body.mediaUrl = composeMediaUrl;
      }
      if (showPoll) {
        body.pollOptions = pollOptions.filter((o) => o.trim().length > 0);
        body.pollDuration = pollDuration;
      }
      await api.post('/mobile/takes', body);
      resetCompose();
      setShowCompose(false);
      refreshProfile();
      showAlert('Posted!', 'Your take is live on Court.', [
        { text: 'View on Court', onPress: () => router.push('/(tabs)/court') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to post take.');
    } finally {
      setPosting(false);
    }
  }

  if (shouldHideOnRoute(pathname)) return null;

  return (
    <>
      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
          if (requireAuth()) setShowCompose(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.composeContainer}>
            <View style={styles.composeHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowCompose(false);
                  resetCompose();
                }}
              >
                <Text style={styles.composeCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.composeTitle}>New Take</Text>
              <TouchableOpacity
                style={[
                  styles.composePostBtn,
                  (!composeText.trim() || posting || uploading) && styles.composePostBtnDisabled,
                ]}
                disabled={!composeText.trim() || posting || uploading}
                onPress={handlePost}
              >
                {posting ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={styles.composePostText}>Post</Text>
                )}
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

              {/* GIF Preview */}
              {composeMediaUrl && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
                    <ExpoImage
                      source={{ uri: composeMediaUrl }}
                      style={{ width: 160, height: 120, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setComposeMediaUrl(null)}
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
                </View>
              )}

              {/* Uploading indicator */}
              {uploading && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ActivityIndicator size="small" color={Colors.orange} />
                  <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary }}>Uploading image...</Text>
                </View>
              )}

              {/* GIF / IMG / Poll Toolbar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowGifPicker(!showGifPicker)}
                  disabled={!!composeMediaUrl || uploading}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: showGifPicker ? Colors.orange : 'rgba(255,107,53,0.3)',
                    borderRadius: 6,
                    backgroundColor: showGifPicker ? 'rgba(255,107,53,0.15)' : 'transparent',
                    opacity: (composeMediaUrl || uploading) ? 0.4 : 1,
                  }}
                >
                  <Text style={{ fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange, fontWeight: '600' }}>GIF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleImagePick}
                  disabled={!!composeMediaUrl || uploading}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: 'rgba(255,107,53,0.3)',
                    borderRadius: 6,
                    opacity: (composeMediaUrl || uploading) ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="image-outline" size={14} color={Colors.orange} />
                  <Text style={{ fontFamily: Fonts.barlowSemiBold, fontSize: 13, color: Colors.orange, fontWeight: '600' }}>IMG</Text>
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

              {/* Poll Builder */}
              {showPoll ? (
                <View style={styles.pollBuilder}>
                  <View style={styles.pollBuilderHeader}>
                    <Text style={styles.pollBuilderTitle}>POLL</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowPoll(false);
                        setPollOptions(['', '']);
                      }}
                    >
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
                        <TouchableOpacity
                          onPress={() =>
                            setPollOptions(pollOptions.filter((_, idx) => idx !== i))
                          }
                        >
                          <Ionicons name="remove-circle-outline" size={20} color={Colors.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {pollOptions.length < 4 && (
                    <TouchableOpacity
                      style={styles.addOptionBtn}
                      onPress={() => setPollOptions([...pollOptions, ''])}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={Colors.orange} />
                      <Text style={styles.addOptionText}>Add option</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.pollDurationRow}>
                    <Text style={styles.pollDurationLabel}>Duration:</Text>
                    {[1, 6, 24, 72].map((hrs) => (
                      <TouchableOpacity
                        key={hrs}
                        style={[
                          styles.durationChip,
                          pollDuration === hrs && styles.durationChipActive,
                        ]}
                        onPress={() => setPollDuration(hrs)}
                      >
                        <Text
                          style={[
                            styles.durationChipText,
                            pollDuration === hrs && styles.durationChipTextActive,
                          ]}
                        >
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
                  setComposeMediaUrl(gifUrl);
                  setShowGifPicker(false);
                }}
                onClose={() => setShowGifPicker(false)}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed alert modal */}
      <Modal visible={alertConfig.visible} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            {alertConfig.message ? (
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            ) : null}
            <View style={styles.alertButtons}>
              {alertConfig.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.alertButton,
                    btn.style === 'destructive'
                      ? styles.alertButtonDestructive
                      : btn.style === 'cancel'
                        ? styles.alertButtonCancel
                        : styles.alertButtonDefault,
                  ]}
                  onPress={() => {
                    dismissAlert();
                    btn.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      btn.style === 'destructive'
                        ? styles.alertButtonTextDestructive
                        : btn.style === 'cancel'
                          ? styles.alertButtonTextCancel
                          : null,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    // Bottom offset accounts for tab bar (~85 iOS / 65 Android) plus a small gap
    fab: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 36 : 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: Colors.orange,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      zIndex: 1000,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    composeContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      minHeight: 280,
      maxHeight: '85%',
    },
    composeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    composeCancel: { fontFamily: Fonts.barlow, fontSize: 16, color: colors.textSecondary },
    composeTitle: {
      fontFamily: Fonts.barlowBold,
      fontWeight: '700',
      fontSize: 18,
      color: colors.text,
      letterSpacing: 1,
    },
    composePostBtn: {
      backgroundColor: Colors.orange,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 20,
    },
    composePostBtnDisabled: { opacity: 0.4 },
    composePostText: {
      fontFamily: Fonts.barlowBold,
      fontWeight: '700',
      fontSize: 14,
      color: '#FFFFFF',
    },
    composeInput: {
      fontFamily: Fonts.barlow,
      fontSize: 17,
      color: colors.text,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    charCount: {
      fontFamily: Fonts.mono,
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'right',
      marginTop: 8,
    },
    pollBuilder: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    pollBuilderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    pollBuilderTitle: {
      fontFamily: Fonts.barlowBold,
      fontWeight: '700',
      fontSize: 13,
      color: colors.textSecondary,
      letterSpacing: 1,
    },
    pollOptionInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    pollOptionField: {
      flex: 1,
      fontFamily: Fonts.barlow,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
    addOptionText: {
      fontFamily: Fonts.barlowSemiBold,
      fontWeight: '600',
      fontSize: 13,
      color: Colors.orange,
    },
    pollDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    pollDurationLabel: { fontFamily: Fonts.barlow, fontSize: 13, color: colors.textSecondary },
    durationChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    durationChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
    durationChipText: {
      fontFamily: Fonts.barlowSemiBold,
      fontWeight: '600',
      fontSize: 13,
      color: colors.textSecondary,
    },
    durationChipTextActive: { color: '#FFFFFF' },
    alertOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    alertBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 320,
      borderWidth: 1,
      borderColor: colors.border,
    },
    alertTitle: {
      fontFamily: Fonts.barlowBold,
      fontWeight: '700',
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    alertMessage: {
      fontFamily: Fonts.barlow,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    alertButtons: { gap: 8, marginTop: 4 },
    alertButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    alertButtonDefault: { backgroundColor: Colors.orange },
    alertButtonDestructive: { backgroundColor: '#EF4444' },
    alertButtonCancel: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    alertButtonText: {
      fontFamily: Fonts.barlowBold,
      fontWeight: '700',
      fontSize: 15,
      color: '#FFFFFF',
    },
    alertButtonTextDestructive: { color: '#FFFFFF' },
    alertButtonTextCancel: { color: colors.textSecondary },
  });
