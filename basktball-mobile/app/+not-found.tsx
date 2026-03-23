import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.black,
  },
  title: {
    fontFamily: Fonts.anton,
    fontSize: 64,
    color: Colors.orange,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.barlow,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: Colors.orange,
  },
  linkText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700' as const,
    fontSize: 14,
    color: Colors.white,
  },
});
