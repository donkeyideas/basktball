import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// -- Mock Data --

interface MenuItem {
  label: string;
  icon: IoniconsName;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Inventory', icon: 'layers-outline' },
      { label: 'Suppliers', icon: 'business-outline' },
      { label: 'Logistics', icon: 'airplane-outline', badge: '3' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Customers', icon: 'people-outline' },
      { label: 'Content', icon: 'document-text-outline' },
      { label: 'Moderation', icon: 'shield-checkmark-outline', badge: '5' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Analytics', icon: 'bar-chart-outline' },
      { label: 'Settings', icon: 'settings-outline' },
    ],
  },
];

export default function MoreScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, index) => {
              const isLast = index === section.items.length - 1;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Placeholder navigation
                  }}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={Colors.orange}
                      />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.textTertiary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>BASKTBALL Admin v1.0.0</Text>
        <Text style={styles.versionSubtext}>Build 2026.03.05</Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 16,
    color: Colors.white,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Badge
  badge: {
    backgroundColor: Colors.orange,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.white,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 13,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  versionSubtext: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },

  bottomSpacer: {
    height: 20,
  },
});
