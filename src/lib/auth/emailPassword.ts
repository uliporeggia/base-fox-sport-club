import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from '@react-native-firebase/auth';
import { createAssociate } from '../../data/associatesRepository';
import type { LogInResult, SignUpResult } from './types';

function firebaseErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  return null;
}

export interface SignUpWithEmailInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Task 4.3 — cadastro por e-mail e senha. Creates the Firebase Auth user,
 * sets `displayName`, creates the `associates/{uid}` document (member_number
 * is filled in server-side, see associatesRepository.createAssociate), and
 * sends the verification e-mail (4.4d).
 */
export async function signUpWithEmail({ name, email, password }: SignUpWithEmailInput): Promise<SignUpResult> {
  const auth = getAuth(getApp());
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await createAssociate(credential.user.uid, { name, email });
    await sendEmailVerification(credential.user).catch(() => undefined);
    return { status: 'created' };
  } catch (error) {
    if (firebaseErrorCode(error) === 'auth/email-already-in-use') {
      return { status: 'email_in_use' };
    }
    return { status: 'error', message: error instanceof Error ? error.message : 'unknown_error' };
  }
}

export interface LogInWithEmailInput {
  email: string;
  password: string;
}

const INVALID_CREDENTIAL_CODES = new Set([
  'auth/user-not-found',
  'auth/wrong-password',
  'auth/invalid-credential',
  'auth/invalid-email',
]);

/** Task 4.5 — login por e-mail e senha, with a generic "invalid credentials" message (does not reveal which field is wrong). */
export async function logInWithEmail({ email, password }: LogInWithEmailInput): Promise<LogInResult> {
  const auth = getAuth(getApp());
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { status: 'signed_in' };
  } catch (error) {
    const code = firebaseErrorCode(error);
    if (code && INVALID_CREDENTIAL_CODES.has(code)) {
      return { status: 'invalid_credentials' };
    }
    return { status: 'error', message: error instanceof Error ? error.message : 'unknown_error' };
  }
}
