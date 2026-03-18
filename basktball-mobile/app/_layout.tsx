import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        setShowOnboarding(seen !== 'true');
      } catch {
        setShowOnboarding(false);
      }
      setOnboardingChecked(true);
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error:', fontError);
      SplashScreen.hideAsync();
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && onboardingChecked) {
      SplashScreen.hideAsync();
      if (showOnboarding) {
        // Navigate to onboarding after layout mounts
        setTimeout(() => router.replace('/onboarding'), 0);
      }
    }
  }, [fontsLoaded, onboardingChecked, showOnboarding]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!onboardingChecked) {
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
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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

function PushNotificationRegistrar() {
  const { user, api } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function registerPush() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        await api.post('/mobile/notifications/register-device', {
          token: tokenData.data,
          platform,
        });
      } catch (err) {
        console.log('Push registration failed:', err);
      }
    }

    registerPush();
  }, [user]);

  // Handle notification tap
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.takeId) {
        router.push(`/take/${data.takeId}` as never);
      }
    });
    return () => subscription.remove();
  }, []);

  return null;
}

function RootLayoutNav() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PushNotificationRegistrar />
        <ThemedStack />
      </ThemeProvider>
    </AuthProvider>
  );
}
