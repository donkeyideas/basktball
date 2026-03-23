import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

type BadgeType = 'live' | 'final' | 'scheduled' | 'custom';

interface BadgeProps {
  type: BadgeType;
  label?: string;
  color?: string;
}

const BADGE_CONFIG: Record<Exclude<BadgeType, 'custom'>, { bg: string; text: string; label: string }> = {
  live: { bg: Colors.red, text: Colors.white, label: 'LIVE' },
  final: { bg: 'rgba(255,255,255,0.12)', text: Colors.textSecondary, label: 'FINAL' },
  scheduled: { bg: 'rgba(59,130,246,0.15)', text: Colors.blue, label: 'SCHEDULED' },
};

export function Badge({ type, label, color }: BadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (type === 'live') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [type, pulseAnim]);

  const config = type === 'custom'
    ? { bg: color ?? Colors.orange, text: Colors.white, label: label ?? '' }
    : BADGE_CONFIG[type];

  const displayLabel = label ?? config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      {type === 'live' && (
        <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
      )}
      <Text style={[styles.label, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
    marginRight: 5,
  },
  label: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
