import { useCallback, useEffect, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged, reload, sendEmailVerification } from '@react-native-firebase/auth';

export interface EmailVerificationStatus {
  /** `null` while there is no signed-in associate, or the status has not loaded yet. */
  emailVerified: boolean | null;
  isLoading: boolean;
  /** Re-sends the verification e-mail to the current associate. */
  resend: () => Promise<void>;
  /** Reloads the current user from Firebase Auth — call after the associate taps "já verifiquei" in the Perfil pendency banner. */
  refresh: () => Promise<void>;
}

/**
 * Task 4.4d — exposes the signed-in associate's e-mail verification state.
 * This is the hook the Perfil agent should consume to sinalizar a pendência
 * (see this agent's final report, `API_EMAIL_PENDENTE`) — Perfil does not
 * need to touch Firebase Auth directly for this.
 */
export function useEmailVerificationStatus(): EmailVerificationStatus {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(getApp());
    return onAuthStateChanged(auth, (user) => {
      setEmailVerified(user ? user.emailVerified : null);
      setIsLoading(false);
    });
  }, []);

  const resend = useCallback(async () => {
    const user = getAuth(getApp()).currentUser;
    if (!user) return;
    await sendEmailVerification(user);
  }, []);

  const refresh = useCallback(async () => {
    const user = getAuth(getApp()).currentUser;
    if (!user) return;
    await reload(user);
    // Re-read currentUser rather than trust the pre-reload `user` reference, in case it's a snapshot.
    setEmailVerified(getAuth(getApp()).currentUser?.emailVerified ?? null);
  }, []);

  return { emailVerified, isLoading, resend, refresh };
}
