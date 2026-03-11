import React from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function AdminHeader() {
  return (
    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <Text style={styles.headerTitle}>BASKTBALL</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
    </SafeAreaView>
  );
}

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <AdminHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.orange,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'grid' : ('grid-outline' as IoniconsName)}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'cube' : ('cube-outline' as IoniconsName)}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'pricetag' : ('pricetag-outline' as IoniconsName)}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: 'Finance',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'cash' : ('cash-outline' as IoniconsName)}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={
                  focused
                    ? 'ellipsis-horizontal'
                    : ('ellipsis-horizontal-outline' as IoniconsName)
                }
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  headerSafeArea: {
    backgroundColor: Colors.darkerGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 11,
    color: Colors.white,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: Fonts.anton,
    fontSize: 20,
    color: Colors.white,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 36,
  },
  tabBar: {
    backgroundColor: '#0A0A0A',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: Fonts.barlowSemiBold,
    letterSpacing: 0.5,
  },
});
