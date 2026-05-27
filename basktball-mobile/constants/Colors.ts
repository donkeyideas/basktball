import { Platform } from 'react-native';

export const Colors = {
  orange: '#FF5E1A',
  orangeBright: '#FF8C5A',
  black: '#0D0D0D',
  darkGray: '#1A1A1A',
  darkerGray: '#0A0A0A',
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  courtWood: '#C89F6C',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#3B82F6',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  textTertiary: 'rgba(255,255,255,0.3)',
  textMuted: 'rgba(255,255,255,0.15)',
} as const;

// System font: SF Pro on iOS, Roboto on Android (same as Twitter/Instagram/Facebook)
const systemFont = Platform.select({ ios: 'System', default: 'sans-serif' })!;

export const Fonts = {
  anton: 'Anton',
  barlow: systemFont,
  barlowMedium: systemFont,
  barlowSemiBold: systemFont,
  barlowBold: systemFont,
  mono: 'RobotoMono',
  monoBold: 'RobotoMono-Bold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

const tintColor = '#FF6B35';

export default {
  light: {
    text: '#fff',
    background: '#0D0D0D',
    tint: tintColor,
    tabIconDefault: 'rgba(255,255,255,0.35)',
    tabIconSelected: tintColor,
  },
  dark: {
    text: '#fff',
    background: '#0D0D0D',
    tint: tintColor,
    tabIconDefault: 'rgba(255,255,255,0.35)',
    tabIconSelected: tintColor,
  },
};
