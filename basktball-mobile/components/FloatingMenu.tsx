import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';

// The menu replaces the bottom tab bar, so only show it on tab routes.
// Detail/sub-screens already have their own back button for navigation.
const TAB_ROUTES = [
  '/',
  '/scores',
  '/court',
  '/search',
  '/profile',
  '/features',
  '/tools',
  '/stats/ask',
  '/share/take',
  '/notifications',
  '/settings',
];

function shouldShowOnRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return TAB_ROUTES.includes(pathname);
}

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  matchPaths: string[]; // paths considered "active"
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: 'home-outline', route: '/(tabs)/', matchPaths: ['/', '/index'] },
  {
    label: 'Scores',
    icon: 'basketball-outline',
    route: '/(tabs)/scores',
    matchPaths: ['/scores'],
  },
  {
    label: 'Court',
    icon: 'chatbubbles-outline',
    route: '/(tabs)/court',
    matchPaths: ['/court'],
  },
  {
    label: 'Search',
    icon: 'search-outline',
    route: '/(tabs)/search',
    matchPaths: ['/search'],
  },
  {
    label: 'Tools',
    icon: 'build-outline',
    route: '/tools',
    matchPaths: ['/tools'],
  },
  {
    label: 'Profile',
    icon: 'person-outline',
    route: '/(tabs)/profile',
    matchPaths: ['/profile'],
  },
];

export default function FloatingMenu() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const styles = React.useMemo(() => makeStyles(colors, insets.top), [colors, insets.top]);

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);

  function closeMenu(after?: () => void) {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      after?.();
    });
  }

  function navigate(route: string) {
    closeMenu(() => router.push(route as any));
  }

  if (!shouldShowOnRoute(pathname)) return null;

  return (
    <>
      {/* Floating menu button (top-left) */}
      <TouchableOpacity
        style={styles.menuButton}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Side drawer */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => closeMenu()}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerLogo}>BASKTBALL</Text>
            <TouchableOpacity onPress={() => closeMenu()} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.navSection}>
            {NAV_ITEMS.map((item) => {
              const active = item.matchPaths.some(
                (p) => pathname === p || pathname?.startsWith(p + '/')
              );
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
                  activeOpacity={0.7}
                  onPress={() => navigate(item.route)}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={active ? Colors.orange : colors.text}
                  />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => navigate('/stats/ask')}
            >
              <Ionicons name="sparkles-outline" size={22} color={colors.text} />
              <Text style={styles.navLabel}>Ask the Lab</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => navigate('/share/take')}
            >
              <Ionicons name="share-social-outline" size={22} color={colors.text} />
              <Text style={styles.navLabel}>Take Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.featuresBtn, { marginTop: 6 }]}
              activeOpacity={0.7}
              onPress={() => navigate('/features')}
            >
              <Ionicons name="sparkles" size={18} color={Colors.orange} />
              <Text style={styles.featuresLabel}>FEATURES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => navigate('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <Text style={styles.navLabel}>Notifications</Text>
            </TouchableOpacity>

            {user ? (
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => navigate('/settings')}
              >
                <Ionicons name="settings-outline" size={22} color={colors.text} />
                <Text style={styles.navLabel}>Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => navigate('/(auth)/login')}
              >
                <Ionicons name="log-in-outline" size={22} color={colors.text} />
                <Text style={styles.navLabel}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const makeStyles = (colors: any, topInset: number) =>
  StyleSheet.create({
    menuButton: {
      position: 'absolute',
      top: topInset + 8,
      left: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      zIndex: 999,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 280,
      backgroundColor: colors.surface,
      paddingTop: topInset + 16,
      paddingHorizontal: 16,
      paddingBottom: 24,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      display: 'flex',
      flexDirection: 'column',
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    drawerLogo: {
      fontFamily: Fonts.anton,
      fontSize: 22,
      color: colors.text,
      letterSpacing: 1.5,
    },
    navSection: { flex: 1 },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 4,
    },
    navItemActive: {
      backgroundColor:
        Platform.OS === 'ios' ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.15)',
    },
    navLabel: {
      fontFamily: Fonts.barlowSemiBold,
      fontWeight: '600',
      fontSize: 16,
      color: colors.text,
    },
    navLabelActive: { color: Colors.orange, fontWeight: '700' },
    featuresBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.25)',
      backgroundColor: 'rgba(255,107,53,0.08)',
      marginBottom: 4,
    },
    featuresLabel: {
      fontFamily: Fonts.barlowBold,
      fontWeight: '700',
      fontSize: 14,
      color: Colors.orange,
      letterSpacing: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    themeRow: {
      marginTop: 'auto',
      paddingTop: 12,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    themeLabel: {
      fontFamily: Fonts.barlowSemiBold,
      fontWeight: '600',
      fontSize: 15,
      color: colors.text,
    },
    sectionHeading: {
      fontFamily: Fonts.anton,
      fontSize: 11,
      letterSpacing: 2,
      color: Colors.orange,
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 8,
    },
    navLabelFlex: { flex: 1 },
    newPill: {
      backgroundColor: Colors.orange,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 3,
    },
    newPillText: {
      fontFamily: Fonts.mono,
      fontSize: 9,
      color: '#fff',
      letterSpacing: 1.5,
      fontWeight: '700' as const,
    },
  });
