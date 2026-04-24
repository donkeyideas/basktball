import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';
import { GifPicker } from './GifPicker';
import { MentionAutocomplete } from './MentionAutocomplete';
import { uploadImage } from '@/lib/upload/imageUpload';

const MAX_CHARS = 280;
const DURATION_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '1 day', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
];

interface ComposeTakeProps {
  onSubmit: (data: {
    content: string;
    pollOptions?: string[];
    pollDuration?: number;
    mediaUrls?: string[];
  }) => void;
  onCancel: () => void;
  userName?: string;
  apiBase?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ComposeTake({ onSubmit, onCancel, userName, apiBase = 'https://www.basktball.com' }: ComposeTakeProps) {
  const [content, setContent] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(24);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = content.trim().length === 0 && mediaUrls.length === 0;
  const validPollOptions = pollOptions.filter((o) => o.trim().length > 0);
  const pollValid = !showPoll || validPollOptions.length >= 2;
  const canSubmit = !isEmpty && !isOverLimit && pollValid && !uploading;

  const displayName = userName || 'User';
  const initials = getInitials(displayName);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const data: { content: string; pollOptions?: string[]; pollDuration?: number; mediaUrls?: string[] } = {
      content: content.trim(),
    };
    if (showPoll && validPollOptions.length >= 2) {
      data.pollOptions = validPollOptions.map((o) => o.trim());
      data.pollDuration = pollDuration;
    }
    if (mediaUrls.length > 0) data.mediaUrls = mediaUrls;
    onSubmit(data);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    // Detect @mention trigger
    const mentionMatch = val.match(/@([a-zA-Z0-9_]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (handle: string) => {
    const atIndex = content.lastIndexOf('@');
    if (atIndex === -1) return;
    const newContent = content.slice(0, atIndex) + `@${handle} `;
    setContent(newContent);
    setShowMentions(false);
  };

  const handleImagePick = async () => {
    if (uploading || mediaUrls.length >= 20) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload images.');
      return;
    }

    const remaining = 20 - mediaUrls.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    setUploadingCount(result.assets.length);
    const newUrls: string[] = [];

    for (const asset of result.assets) {
      try {
        const { publicUrl } = await uploadImage(
          asset.uri,
          asset.mimeType || 'image/jpeg',
          asset.fileSize || 0,
        );
        newUrls.push(publicUrl);
      } catch (err) {
        Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not upload image.');
        break;
      }
    }

    if (newUrls.length > 0) {
      setMediaUrls((prev) => [...prev, ...newUrls].slice(0, 20));
    }
    setUploading(false);
    setUploadingCount(0);
  };

  const removeImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const removeOption = (index: number) => {
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    }
  };

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === pollDuration)?.label || '1 day';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.6}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postButton, !canSubmit && styles.postButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={!canSubmit}
        >
          <Text style={[styles.postButtonText, !canSubmit && styles.postButtonTextDisabled]}>
            POST TAKE
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        <View style={styles.composeArea}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="What's your take?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={MAX_CHARS + 20}
              value={content}
              onChangeText={handleContentChange}
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </View>

        {/* Upload progress */}
        {uploading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8 }}>
            <ActivityIndicator size="small" color={Colors.orange} />
            <Text style={{ fontFamily: Fonts.barlow, fontSize: 13, color: Colors.textTertiary }}>
              Uploading {uploadingCount > 1 ? `${uploadingCount} images` : 'image'}...
            </Text>
          </View>
        )}

        {/* Media preview grid */}
        {mediaUrls.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {mediaUrls.map((url, i) => (
              <View key={url} style={{ width: mediaUrls.length === 1 ? '100%' : '48%', height: mediaUrls.length === 1 ? 200 : 120, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <TouchableOpacity
                  onPress={() => removeImage(i)}
                  style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Mention autocomplete */}
        <MentionAutocomplete
          query={mentionQuery}
          onSelect={handleMentionSelect}
          visible={showMentions}
          apiBase={apiBase}
        />

        {/* Poll Creation UI */}
        {showPoll && (
          <View style={pollCreateStyles.container}>
            <View style={pollCreateStyles.header}>
              <Text style={pollCreateStyles.title}>POLL OPTIONS</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPoll(false);
                  setPollOptions(['', '']);
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="close-circle-outline" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {pollOptions.map((opt, i) => (
              <View key={i} style={pollCreateStyles.optionRow}>
                <TextInput
                  style={pollCreateStyles.optionInput}
                  placeholder={`Option ${i + 1}${i < 2 ? ' (required)' : ''}`}
                  placeholderTextColor={Colors.textTertiary}
                  value={opt}
                  onChangeText={(val) => updateOption(i, val)}
                  maxLength={80}
                />
                {i >= 2 && (
                  <TouchableOpacity
                    onPress={() => removeOption(i)}
                    style={pollCreateStyles.removeBtn}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="close" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <View style={pollCreateStyles.footer}>
              {pollOptions.length < 4 && (
                <TouchableOpacity
                  onPress={addOption}
                  style={pollCreateStyles.addBtn}
                  activeOpacity={0.7}
                >
                  <Text style={pollCreateStyles.addBtnText}>+ ADD OPTION</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowDurationPicker(!showDurationPicker)}
                style={pollCreateStyles.durationBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={pollCreateStyles.durationText}>{durationLabel}</Text>
                <Ionicons
                  name={showDurationPicker ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            {showDurationPicker && (
              <View style={pollCreateStyles.durationPicker}>
                {DURATION_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      pollCreateStyles.durationOption,
                      pollDuration === d.value && pollCreateStyles.durationOptionActive,
                    ]}
                    onPress={() => {
                      setPollDuration(d.value);
                      setShowDurationPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        pollCreateStyles.durationOptionText,
                        pollDuration === d.value && pollCreateStyles.durationOptionTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* GIF Picker */}
      {showGifPicker && (
        <GifPicker
          onSelect={(gifUrl) => {
            setMediaUrls([gifUrl]);
            setShowGifPicker(false);
          }}
          onClose={() => setShowGifPicker(false)}
        />
      )}

      <View style={styles.bottomBar}>
        <View style={styles.attachments}>
          <TouchableOpacity
            onPress={() => setShowGifPicker(!showGifPicker)}
            activeOpacity={0.7}
            disabled={mediaUrls.length > 0 || uploading}
          >
            <Text style={[styles.attachIcon, showGifPicker && styles.attachIconActive, (mediaUrls.length > 0 || uploading) && styles.attachIconDisabled]}>GIF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePick} activeOpacity={0.7} disabled={mediaUrls.length >= 20 || uploading}>
            <Text style={[styles.attachIcon, (mediaUrls.length >= 20 || uploading) && styles.attachIconDisabled]}>
              IMG{mediaUrls.length > 0 ? ` ${mediaUrls.length}/20` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!showPoll) {
                setShowPoll(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.attachIcon,
                showPoll && styles.attachIconActive,
              ]}
            >
              POLL
            </Text>
          </TouchableOpacity>
          <Text style={styles.attachIcon}>TAG</Text>
        </View>

        <Text
          style={[
            styles.charCounter,
            isOverLimit && styles.charCounterOver,
            charCount > MAX_CHARS * 0.9 && !isOverLimit && styles.charCounterWarning,
          ]}
        >
          {charCount}/{MAX_CHARS}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  postButton: {
    backgroundColor: Colors.orange,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(255,107,53,0.3)',
  },
  postButtonText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 1,
  },
  postButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  scrollArea: {
    flex: 1,
  },
  composeArea: {
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    fontFamily: Fonts.barlow,
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 120,
    padding: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachments: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachIcon: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.orange,
    letterSpacing: 0.5,
    marginRight: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  attachIconActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: Colors.orange,
  },
  attachIconDisabled: {
    opacity: 0.3,
  },
  charCounter: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textTertiary,
  },
  charCounterWarning: {
    color: Colors.yellow,
  },
  charCounterOver: {
    color: Colors.red,
  },
});

const pollCreateStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.orange,
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  optionInput: {
    flex: 1,
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  removeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  addBtnText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.orange,
    letterSpacing: 0.3,
  },
  durationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  durationPicker: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 4,
  },
  durationOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  durationOptionActive: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  durationOptionText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  durationOptionTextActive: {
    color: Colors.orange,
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
  },
});
