import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

// Small floating theme-toggle pinned to the top-right of every page.
// Hidden only on auth/onboarding (where chrome is intentionally minimal).
const HIDDEN_ROUTES = ['/onboarding', '/login', '/signup'];

export default function ThemeToggleFAB() {
  const { colors, isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!pathname || HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          top: insets.top + 8,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.8}
      onPress={toggleTheme}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={20}
        color={Colors.orange}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 998,
  },
});
