import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors, Fonts } from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';

const API_BASE = 'https://www.basktball.com';

function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function LoginScreen() {
  const { login, loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      // Generate a unique session ID for this auth attempt
      const sid = generateSessionId();

      // Open Chrome Custom Tab for Google auth
      await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/mobile-auth?scheme=basktball&sid=${sid}`,
        'basktball://auth'
      );

      // When Custom Tab closes (user taps X), check if auth completed
      // The web page stores the token server-side, keyed by session ID
      const res = await fetch(`${API_BASE}/api/mobile/auth/retrieve?sid=${sid}`);
      const data = await res.json();

      if (data.found && data.token && data.user) {
        await loginWithToken(data.token, data.user);
        router.replace('/(tabs)');
      } else {
        // User closed without completing auth
        setGoogleLoading(false);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not complete Google sign-in.');
      setGoogleLoading(false);
    }
  }

  async function handleAppleLogin() {
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received');
      }

      // Send to our backend for verification
      const res = await fetch(`${API_BASE}/api/mobile/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName: credential.fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Apple sign-in failed');
      }

      await loginWithToken(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - do nothing
      } else {
        Alert.alert('Error', err.message || 'Could not complete Apple sign-in.');
      }
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Text style={styles.logo}>BASKTBALL</Text>

          {/* Heading */}
          <Text style={styles.heading}>SIGN IN</Text>

          {/* Apple Sign-In (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.appleButton}
              activeOpacity={0.7}
              onPress={handleAppleLogin}
              disabled={appleLoading}
            >
              {appleLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color="#fff" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.7}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#333" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#333" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.signInButtonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          {/* Create Account Link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.bottomLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logo: {
    fontFamily: Fonts.anton,
    fontSize: 42,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 40,
  },
  heading: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 28,
    color: Colors.orange,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 32,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appleButtonText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 10,
  },
  googleButtonText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textTertiary,
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: Colors.white,
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.orange,
  },
  signInButton: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 18,
    color: Colors.white,
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bottomLink: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.orange,
  },
});
