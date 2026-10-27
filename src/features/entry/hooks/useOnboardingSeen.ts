import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = 'entry.onboarding_seen';

export interface OnboardingSeenState {
  /** `null` while the AsyncStorage read is in flight — callers should hold off on any routing decision until this resolves. */
  hasSeenOnboarding: boolean | null;
  /** Persists the "seen" flag (both on completion and on skip — task 4.2). Best-effort: a storage failure still lets the visitor proceed. */
  markOnboardingSeen: () => Promise<void>;
}

/** Task 4.2 — onboarding (01) is shown once; AsyncStorage remembers it across app restarts. */
export function useOnboardingSeen(): OnboardingSeenState {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then((value) => {
        if (!cancelled) setHasSeenOnboarding(value === 'true');
      })
      .catch(() => {
        if (!cancelled) setHasSeenOnboarding(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    setHasSeenOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } catch {
      // Best-effort — worst case the onboarding is shown again next launch.
    }
  }, []);

  return { hasSeenOnboarding, markOnboardingSeen };
}
