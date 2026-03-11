import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface SectionTitleProps {
  title: string;
}

export function SectionTitle({ title }: SectionTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.anton,
    fontSize: 15,
    letterSpacing: 1,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
});
