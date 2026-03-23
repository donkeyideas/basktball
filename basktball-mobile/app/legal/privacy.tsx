import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';

const LAST_UPDATED = 'March 1, 2026';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.intro}>
          Your privacy matters to us. This Privacy Policy explains how BASKTBALL
          ("we", "us", or "our") collects, uses, and protects your personal
          information when you use our mobile application.
        </Text>

        {/* Information We Collect */}
        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly to us when you create an
          account, including your name, email address, and username. We also
          collect information automatically when you use the app, including:
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Account information (name, email, username, password)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Profile information (avatar, bio, favorite teams and players)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Device information (model, operating system, unique identifiers)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Usage data (features accessed, interactions, time spent)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Location data (if you grant permission, for localized content)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Content you create (takes, replies, profile information)
        </Text>

        {/* How We Use Your Information */}
        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.body}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Provide, maintain, and improve the BASKTBALL app experience
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Personalize content, including scores, stats, and news based on your favorite teams
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Send push notifications for game alerts, social activity, and updates you have opted into
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Analyze usage patterns to improve app performance and features
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Detect, prevent, and address technical issues and abuse
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Communicate with you about updates, security alerts, and support
        </Text>

        {/* Data Sharing */}
        <Text style={styles.sectionTitle}>Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information to third parties. We may share
          your information in the following limited circumstances:
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} With service providers who assist us in operating the app (hosting, analytics, push notifications)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} With other users (public profile information, takes, and interactions)
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} When required by law or to respond to legal process
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} To protect the rights, safety, and property of BASKTBALL, our users, or the public
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} With your consent or at your direction
        </Text>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.body}>
          We implement industry-standard security measures to protect your
          personal information from unauthorized access, alteration, disclosure,
          or destruction. This includes encryption of data in transit and at
          rest, secure authentication, regular security audits, and access
          controls. However, no method of electronic transmission or storage is
          100% secure, and we cannot guarantee absolute security.
        </Text>

        {/* Your Rights */}
        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.body}>
          You have the following rights regarding your personal data:
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Access: Request a copy of the personal data we hold about you
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Correction: Request correction of inaccurate personal data
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Deletion: Request deletion of your account and associated data
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Portability: Request your data in a machine-readable format
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Opt-out: Manage notification preferences and data collection settings within the app
        </Text>
        <Text style={styles.body}>
          BASKTBALL is not intended for children under the age of 13. We do not
          knowingly collect personal information from children under 13.
        </Text>

        {/* Contact Us */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions or concerns about this Privacy Policy or our
          data practices, please contact us at:
        </Text>
        <Text style={styles.contactText}>privacy@basktball.com</Text>

        {/* Last Updated */}
        <View style={styles.updatedRow}>
          <Text style={styles.updatedText}>Last updated: {LAST_UPDATED}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 20,
    color: Colors.white,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  intro: {
    fontFamily: Fonts.barlow,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.orange,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  body: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingLeft: 12,
    marginBottom: 4,
  },
  contactText: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.orange,
    marginTop: 8,
  },
  updatedRow: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  updatedText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
});
