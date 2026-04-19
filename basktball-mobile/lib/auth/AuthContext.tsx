import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { api } from '../api/client';
import { setOnAuthExpired } from '../api/client';

type User = {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  image?: string;
  avatarUrl?: string;
  role: 'USER' | 'PREMIUM' | 'MODERATOR' | 'EDITOR' | 'ADMIN';
  bio?: string;
  location?: string;
  favoriteTeams?: string[];
  accounts?: Array<{ provider: string }>;
  takeCount?: number;
  followerCount?: number;
  followingCount?: number;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  isLoading: true,
  isAdmin: false,
  login: async () => {},
  loginWithToken: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'EDITOR';

  // Auto-logout when server says token is expired/invalid
  const handleAuthExpired = useCallback(() => {
    SecureStore.deleteItemAsync('auth_token');
    SecureStore.deleteItemAsync('auth_user');
    setToken(null);
    setUser(null);
    Alert.alert('Session Expired', 'Please log in again.');
  }, []);

  useEffect(() => {
    setOnAuthExpired(handleAuthExpired);
    loadStoredAuth();
  }, [handleAuthExpired]);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await SecureStore.getItemAsync('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Token invalid or expired
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>('/mobile/auth/login', {
      email,
      password,
    });
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function loginWithToken(authToken: string, userData: User) {
    await SecureStore.setItemAsync('auth_token', authToken);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }

  async function register(name: string, email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>('/mobile/auth/register', {
      name,
      email,
      password,
    });
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function refreshProfile() {
    try {
      const data = await api.get<{ profile: User }>('/mobile/profile');
      if (data.profile) {
        setUser(data.profile);
        await SecureStore.setItemAsync('auth_user', JSON.stringify(data.profile));
      }
    } catch {
      // Silently fail - user will see stale data until next login
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, login, loginWithToken, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
