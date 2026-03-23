import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

function LetterIcon({ letter, color, focused }: { letter: string; color: string; focused: boolean }) {
  return (
    <Text style={[styles.letterIcon, { color, fontWeight: focused ? '800' : '600' }]}>
      {letter}
    </Text>
  );
}

export default function TabLayout() {
  const { isDark, colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surfaceAlt, borderTopColor: colors.border }],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <LetterIcon letter="H" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scores"
        options={{
          title: 'Scores',
          tabBarIcon: ({ color, focused }) => (
            <LetterIcon letter="S" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="court"
        options={{
          title: 'Court',
          tabBarIcon: ({ focused }) => (
            <LetterIcon letter="C" color={Colors.orange} focused={focused || true} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <LetterIcon letter="?" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <LetterIcon letter="P" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0A0A0A',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  letterIcon: {
    fontSize: 22,
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    textAlign: 'center',
  },
});
