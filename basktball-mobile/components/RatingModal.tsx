import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

interface RatingModalProps {
  visible: boolean;
  onRate: () => void;
  onMaybeLater: () => void;
  onNoThanks: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function RatingModal({ visible, onRate, onMaybeLater, onNoThanks }: RatingModalProps) {
  const { colors } = useTheme();
  const [selectedStars, setSelectedStars] = useState(0);
  const [step, setStep] = useState<'ask' | 'stars'>('ask');

  function handleEnjoy() {
    setStep('stars');
  }

  function handleStarPress(star: number) {
    setSelectedStars(star);
    setTimeout(() => {
      onRate();
      setStep('ask');
      setSelectedStars(0);
    }, 400);
  }

  function handleDismiss() {
    setStep('ask');
    setSelectedStars(0);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {step === 'ask' ? (
            <>
              <View style={[styles.logoRow]}>
                <View style={[styles.logoBadge, { backgroundColor: colors.orange }]}>
                  <Text style={styles.logoText}>B</Text>
                </View>
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                Enjoying Basktball?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your feedback helps us improve the app for basketball fans everywhere.
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.orange }]}
                onPress={handleEnjoy}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Yes, I love it!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => { handleDismiss(); onMaybeLater(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  Maybe later
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { handleDismiss(); onNoThanks(); }}
                activeOpacity={0.7}
                style={styles.dismissLink}
              >
                <Text style={[styles.dismissText, { color: colors.textTertiary }]}>
                  No thanks
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Rate Basktball
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Tap a star to rate us on the {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}.
              </Text>

              <View style={styles.starsRow}>
                {STARS.map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarPress(star)}
                    activeOpacity={0.7}
                    style={styles.starTouch}
                  >
                    <Text style={[
                      styles.star,
                      { color: star <= selectedStars ? colors.orange : colors.textMuted },
                    ]}>
                      {star <= selectedStars ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => { handleDismiss(); onMaybeLater(); }}
                activeOpacity={0.7}
                style={styles.dismissLink}
              >
                <Text style={[styles.dismissText, { color: colors.textTertiary }]}>
                  Not now
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: 20,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Anton',
    fontSize: 28,
    color: '#FFFFFF',
    marginTop: 2,
  },
  title: {
    fontFamily: 'Anton',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dismissLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 14,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  starTouch: {
    padding: 6,
  },
  star: {
    fontSize: 40,
  },
});
