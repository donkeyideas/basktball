import { useEffect, useCallback, useRef, useState } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HAS_RATED: 'review_hasRated',
  DISMISSED: 'review_dismissed',
  SESSION_COUNT: 'review_sessionCount',
  LAST_PROMPT_DATE: 'review_lastPromptDate',
  FIRST_OPEN_DATE: 'review_firstOpenDate',
};

const MIN_SESSIONS = 5;
const MIN_DAYS_SINCE_INSTALL = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 60;

async function shouldPrompt(): Promise<boolean> {
  try {
    const pairs = await AsyncStorage.multiGet([
      KEYS.HAS_RATED,
      KEYS.DISMISSED,
      KEYS.SESSION_COUNT,
      KEYS.LAST_PROMPT_DATE,
      KEYS.FIRST_OPEN_DATE,
    ]);
    const vals = Object.fromEntries(pairs);

    if (vals[KEYS.HAS_RATED] === 'true') return false;
    if (vals[KEYS.DISMISSED] === 'true') return false;

    const sessions = parseInt(vals[KEYS.SESSION_COUNT] || '0', 10);
    if (sessions < MIN_SESSIONS) return false;

    const now = Date.now();
    const firstOpenStr = vals[KEYS.FIRST_OPEN_DATE];
    const firstOpen = firstOpenStr ? parseInt(firstOpenStr, 10) : now;
    if ((now - firstOpen) / 86_400_000 < MIN_DAYS_SINCE_INSTALL) return false;

    const lastPromptStr = vals[KEYS.LAST_PROMPT_DATE];
    if (lastPromptStr) {
      const daysSince = (now - parseInt(lastPromptStr, 10)) / 86_400_000;
      if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function incrementSession() {
  try {
    const pairs = await AsyncStorage.multiGet([
      KEYS.SESSION_COUNT,
      KEYS.FIRST_OPEN_DATE,
    ]);
    const vals = Object.fromEntries(pairs);

    const sessions = parseInt(vals[KEYS.SESSION_COUNT] || '0', 10) + 1;
    await AsyncStorage.setItem(KEYS.SESSION_COUNT, String(sessions));

    if (!vals[KEYS.FIRST_OPEN_DATE]) {
      await AsyncStorage.setItem(KEYS.FIRST_OPEN_DATE, String(Date.now()));
    }
  } catch {}
}

export function useAppReview() {
  const [showModal, setShowModal] = useState(false);
  const prompted = useRef(false);

  useEffect(() => {
    incrementSession();
  }, []);

  const tryPromptReview = useCallback(async () => {
    if (prompted.current) return;
    const ready = await shouldPrompt();
    if (!ready) return;

    prompted.current = true;
    await AsyncStorage.setItem(KEYS.LAST_PROMPT_DATE, String(Date.now()));
    setShowModal(true);
  }, []);

  const handleRate = useCallback(async () => {
    setShowModal(false);
    await AsyncStorage.setItem(KEYS.HAS_RATED, 'true');
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
    }
  }, []);

  const handleMaybeLater = useCallback(() => {
    setShowModal(false);
    // Will be eligible again after MIN_DAYS_BETWEEN_PROMPTS
  }, []);

  const handleNoThanks = useCallback(async () => {
    setShowModal(false);
    await AsyncStorage.setItem(KEYS.DISMISSED, 'true');
  }, []);

  return { showModal, tryPromptReview, handleRate, handleMaybeLater, handleNoThanks };
}
