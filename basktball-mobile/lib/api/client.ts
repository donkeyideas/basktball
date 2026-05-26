import * as SecureStore from 'expo-secure-store';

// Default points at production. For local dev testing, set EXPO_PUBLIC_API_BASE
// (e.g. http://192.168.1.152:3000) in basktball-mobile/.env and restart Expo.
const API_HOST =
  process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '') || 'https://www.basktball.com';
const API_BASE = `${API_HOST}/api`;

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

// Callback for auto-logout on expired/invalid tokens
let onAuthExpired: (() => void) | null = null;

export function setOnAuthExpired(callback: () => void) {
  onAuthExpired = callback;
}

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = await getToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));

    // Auto-logout on expired/invalid token (401 from authenticated requests)
    if (response.status === 401 && token) {
      onAuthExpired?.();
    }

    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T = unknown>(endpoint: string) => apiClient<T>(endpoint),
  post: <T = unknown>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'POST', body }),
  patch: <T = unknown>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'PATCH', body }),
  delete: <T = unknown>(endpoint: string) =>
    apiClient<T>(endpoint, { method: 'DELETE' }),
};
