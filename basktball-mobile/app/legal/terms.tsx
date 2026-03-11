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

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TERMS OF SERVICE</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.intro}>
          Welcome to BASKTBALL. By accessing or using our mobile application, you
          agree to be bound by these Terms of Service. Please read them
          carefully before using the app.
        </Text>

        {/* Acceptance of Terms */}
        <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
        <Text style={styles.body}>
          By creating an account or using the BASKTBALL application, you agree to
          these Terms of Service and our Privacy Policy. If you do not agree to
          these terms, you must not use the app. We reserve the right to update
          these terms at any time, and continued use of the app after changes
          constitutes acceptance of the revised terms.
        </Text>

        {/* User Accounts */}
        <Text style={styles.sectionTitle}>User Accounts</Text>
        <Text style={styles.body}>
          To access certain features, you must create an account. You are
          responsible for:
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Maintaining the confidentiality of your account credentials
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} All activity that occurs under your account
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Providing accurate and complete registration information
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Notifying us immediately of any unauthorized use of your account
        </Text>
        <Text style={styles.body}>
          You must be at least 13 years of age to create an account. We reserve
          the right to suspend or terminate accounts that violate these terms.
        </Text>

        {/* Acceptable Use */}
        <Text style={styles.sectionTitle}>Acceptable Use</Text>
        <Text style={styles.body}>
          You agree to use BASKTBALL in a lawful and respectful manner. You must
          not:
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Post content that is harmful, threatening, abusive, defamatory, or otherwise objectionable
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Harass, bully, or intimidate other users
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Impersonate any person or entity, or falsely claim affiliation with any person or entity
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Use the app to distribute spam, malware, or unauthorized advertising
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Attempt to gain unauthorized access to other accounts, systems, or networks
        </Text>
        <Text style={styles.bullet}>
          {'\u2022'} Use automated means (bots, scrapers) to access the app without our written permission
        </Text>

        {/* Content & Intellectual Property */}
        <Text style={styles.sectionTitle}>Content & Intellectual Property</Text>
        <Text style={styles.body}>
          All content, trademarks, logos, and intellectual property displayed in
          the app are owned by BASKTBALL or our licensors. NBA and team logos,
          player images, and statistics are used under license and remain the
          property of their respective owners.
        </Text>
        <Text style={styles.body}>
          By posting takes, replies, or other user-generated content, you grant
          BASKTBALL a non-exclusive, royalty-free, worldwide license to use,
          display, reproduce, and distribute that content within the app. You
          retain ownership of your original content.
        </Text>

        {/* Limitation of Liability */}
        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.body}>
          BASKTBALL is provided "as is" and "as available" without warranties of
          any kind, either express or implied. We do not guarantee that the app
          will be uninterrupted, error-free, or free of harmful components.
        </Text>
        <Text style={styles.body}>
          To the maximum extent permitted by law, BASKTBALL and its officers,
          directors, employees, and agents shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from
          your use of the app, including but not limited to loss of data,
          profits, or goodwill.
        </Text>

        {/* Governing Law */}
        <Text style={styles.sectionTitle}>Governing Law</Text>
        <Text style={styles.body}>
          These Terms of Service shall be governed by and construed in
          accordance with the laws of the State of Delaware, United States,
          without regard to its conflict of law provisions. Any disputes arising
          from these terms shall be resolved in the state or federal courts
          located in Delaware.
        </Text>

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.body}>
          If you have any questions about these Terms of Service, please
          contact us at:
        </Text>
        <Text style={styles.contactText}>legal@basktball.com</Text>

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
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
});
