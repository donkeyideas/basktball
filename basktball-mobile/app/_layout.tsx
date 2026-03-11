import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function getNavTheme(isDark: boolean) {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: '#FF6B35',
      background: isDark ? '#0D0D0D' : '#F5F5F5',
      card: isDark ? '#0A0A0A' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#111111',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
      notification: '#FF6B35',
    },
  };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    BarlowCondensed: require('../assets/fonts/BarlowCondensed-Regular.ttf'),
    'BarlowCondensed-Medium': require('../assets/fonts/BarlowCondensed-Medium.ttf'),
    'BarlowCondensed-SemiBold': require('../assets/fonts/BarlowCondensed-SemiBold.ttf'),
    'BarlowCondensed-Bold': require('../assets/fonts/BarlowCondensed-Bold.ttf'),
    RobotoMono: require('../assets/fonts/RobotoMono-Regular.ttf'),
    'RobotoMono-Bold': require('../assets/fonts/RobotoMono-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      // Fonts failed to load - continue with system fonts
      console.warn('Font loading error:', fontError);
      SplashScreen.hideAsync();
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <RootLayoutNav />;
}

function ThemedStack() {
  const { isDark, colors } = useTheme();
  return (
    <NavThemeProvider value={getNavTheme(isDark)}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(admin)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="game/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="player/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="take/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="settings/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="legal/privacy"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="legal/terms"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="notifications"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="news"
            options={{ headerShown: false }}
          />
        </Stack>
    </NavThemeProvider>
  );
}

function RootLayoutNav() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </AuthProvider>
  );
}
