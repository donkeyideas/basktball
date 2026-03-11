import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface LiveBarProps {
  count: number;
  onPress?: () => void;
}

export function LiveBar({ count, onPress }: LiveBarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
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
      ]),
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [pulseAnim]);

  if (count <= 0) {
    return null;
  }

  const label = count === 1 ? '1 GAME LIVE NOW' : `${count} GAMES LIVE NOW`;

  return (
    <TouchableOpacity
      style={styles.bar}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.orange,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  text: {
    fontFamily: Fonts.barlowBold,
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 1.5,
  },
});
