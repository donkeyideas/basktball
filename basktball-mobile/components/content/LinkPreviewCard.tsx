import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Fonts } from '@/constants/Colors';

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  videoEmbedUrl: string | null;
  videoProvider: string | null;
}

interface LinkPreviewCardProps {
  preview: LinkPreviewData;
}

export function LinkPreviewCard({ preview }: LinkPreviewCardProps) {
  const hasVideo = !!preview.videoEmbedUrl;

  if (!preview.title && !preview.description && !preview.image && !hasVideo) return null;

  const handlePress = () => {
    Linking.openURL(preview.url);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {preview.image && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: preview.image }}
            style={styles.image}
            contentFit="cover"
          />
          {hasVideo && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Show play button even without image for platforms like Instagram */}
      {!preview.image && hasVideo && (
        <View style={styles.noImagePlayContainer}>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          <Text style={styles.tapToPlay}>Tap to open</Text>
        </View>
      )}

      {(preview.title || preview.description || preview.siteName) && (
        <View style={styles.textArea}>
          {preview.siteName && (
            <Text style={styles.siteName} numberOfLines={1}>
              {preview.siteName}
            </Text>
          )}
          {preview.title && (
            <Text style={styles.title} numberOfLines={2}>
              {preview.title}
            </Text>
          )}
          {preview.description && (
            <Text style={styles.description} numberOfLines={2}>
              {preview.description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginVertical: 6,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,53,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 3,
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
  textArea: {
    padding: 10,
  },
  siteName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  title: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 3,
  },
  description: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
});
