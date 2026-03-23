import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface AvatarProps {
  name: string;
  size?: number;
  imageUrl?: string;
  showBorder?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, size = 40, imageUrl, showBorder = false }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = imageUrl && !imageError;
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);
  const borderWidth = showBorder ? 2 : 0;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor: showBorder ? Colors.orange : 'transparent',
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: size - borderWidth * 2,
              height: size - borderWidth * 2,
              borderRadius: (size - borderWidth * 2) / 2,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size - borderWidth * 2,
              height: size - borderWidth * 2,
              borderRadius: (size - borderWidth * 2) / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    color: Colors.orange,
  },
});
