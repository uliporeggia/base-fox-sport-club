import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  deleteUser,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  type ActionCodeSettings,
} from '@react-native-firebase/auth';
import { getAssociate } from '../../data/associatesRepository';
import type { EmailLinkCompletionResult, SendLoginLinkResult } from './types';

/**
 * Exported (read-only use elsewhere in this module, e.g. `logout.ts`) so the
 * key string lives in exactly one place — logout needs to clear this same
 * pending-e-mail entry, not just sign out of Firebase Auth (task 8.8).
 */
export const PENDING_EMAIL_KEY = 'auth.email_link.pending_email';

/**
 * `url` must be an authorized domain in the Firebase Auth console and wired
 * to a Universal Link (iOS) / App Link (Android) that reopens this app —
 * infra setup outside this agent's file scope (reported in NOTAS/PRECISO_DE_TERCEIRO).
 */
const ACTION_CODE_SETTINGS: ActionCodeSettings = {
  url: 'https://basefox.club/finishSignIn',
  handleCodeInApp: true,
  iOS: { bundleId: 'club.basefox.app' },
  android: { packageName: 'club.basefox.app', installApp: false },
};

/**
 * Task 4.5a — login por link de e-mail, terceiro caminho de entrada. Sends
 * the link without revealing whether the e-mail has an account (Firebase's
 * behavior already matches the spec here: it always "succeeds").
 */
export async function sendLoginLink(email: string): Promise<SendLoginLinkResult> {
  const auth = getAuth(getApp());
  try {
    await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
    await AsyncStorage.setItem(PENDING_EMAIL_KEY, email).catch(() => undefined);
    return { status: 'sent' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'unknown_error' };
  }
}

/**
 * Completes the login-by-link flow once the deep link is opened.
 * `emailOverride` lets the caller supply the e-mail again when the link was
 * opened on a device that never called `sendLoginLink` (no pending e-mail in
 * AsyncStorage) — otherwise the stored one is used.
 */
export async function completeEmailLinkSignIn(
  url: string,
  emailOverride?: string,
): Promise<EmailLinkCompletionResult> {
  const auth = getAuth(getApp());

  if (!isSignInWithEmailLink(auth, url)) {
    return { status: 'error', message: 'not_an_email_sign_in_link' };
  }

  const email = emailOverride ?? (await AsyncStorage.getItem(PENDING_EMAIL_KEY).catch(() => null));
  if (!email) {
    return { status: 'needs_email' };
  }

  try {
    const credential = await signInWithEmailLink(auth, email, url);
    await AsyncStorage.removeItem(PENDING_EMAIL_KEY).catch(() => undefined);

    // Spec: "E-mail sem conta" — login by link must never silently create an
    // account. Firebase's signInWithEmailLink *does* create a Firebase Auth
    // user for an e-mail that never requested access, so the associate
    // document (created only by the real cadastro paths) is the source of
    // truth for whether this was a legitimate account.
    const associate = await getAssociate(credential.user.uid);
    if (!associate) {
      await deleteUser(credential.user).catch(() => undefined);
      return { status: 'no_account' };
    }

    return { status: 'signed_in' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'unknown_error' };
  }
}
