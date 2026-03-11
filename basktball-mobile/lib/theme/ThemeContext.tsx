import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  // Accent colors stay the same
  orange: string;
  orangeBright: string;
  green: string;
  red: string;
  yellow: string;
  blue: string;
}

const DarkTheme: ThemeColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceAlt: '#0A0A0A',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  textTertiary: 'rgba(255,255,255,0.3)',
  textMuted: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  orange: '#FF6B35',
  orangeBright: '#FF8C5A',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#3B82F6',
};

const LightTheme: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#EBEBEB',
  text: '#111111',
  textSecondary: 'rgba(0,0,0,0.55)',
  textTertiary: 'rgba(0,0,0,0.35)',
  textMuted: 'rgba(0,0,0,0.15)',
  border: 'rgba(0,0,0,0.1)',
  borderLight: 'rgba(0,0,0,0.05)',
  orange: '#FF6B35',
  orangeBright: '#FF8C5A',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#3B82F6',
};

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: DarkTheme,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('pref_darkMode').then((val) => {
      if (val !== null) setIsDark(val === 'true');
    });
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('pref_darkMode', String(next));
  }

  function setDarkMode(dark: boolean) {
    setIsDark(dark);
    AsyncStorage.setItem('pref_darkMode', String(dark));
  }

  const colors = isDark ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
