import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface SegmentControlProps {
  options: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function SegmentControl({ options, activeIndex, onChange }: SegmentControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isActive = index === activeIndex;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.darkerGray,
    borderRadius: 8,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: Colors.orange,
  },
  label: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: Colors.white,
  },
});
