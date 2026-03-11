import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, active ? styles.active : styles.inactive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  inactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.orange,
  },
  label: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: Colors.white,
  },
  labelInactive: {
    color: Colors.orange,
  },
});
