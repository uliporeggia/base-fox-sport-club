import { getApp } from '@react-native-firebase/app';
import { getAuth, EmailAuthProvider, linkWithCredential } from '@react-native-firebase/auth';
import type { SetPasswordResult } from './types';

function firebaseErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  return null;
}

/**
 * Task 8.7a — the Perfil "linha de senha" action for an associate who signed
 * up via Strava or via login-by-link and has no password credential yet.
 * Follows the pattern already used for linking a provider to an existing
 * Firebase Auth user: `EmailAuthProvider.credential` + `linkWithCredential`
 * (never `createUserWithEmailAndPassword`, which would create a *second*
 * account instead of adding a credential to this one).
 *
 * Trocar uma senha já existente fica fora desta versão (design.md "Perfil:
 * edição mínima de nome e foto") — this function only ever ADDS a password
 * credential, never replaces one.
 */
export async function setPasswordForCurrentUser(password: string): Promise<SetPasswordResult> {
  const user = getAuth(getApp()).currentUser;
  if (!user || !user.email) {
    return { status: 'error', message: 'no_signed_in_user_or_email' };
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await linkWithCredential(user, credential);
    return { status: 'set' };
  } catch (error) {
    const code = firebaseErrorCode(error);
    if (code === 'auth/requires-recent-login') {
      return { status: 'requires_recent_login' };
    }
    if (code === 'auth/provider-already-linked' || code === 'auth/email-already-in-use') {
      return { status: 'already_has_password' };
    }
    return { status: 'error', message: error instanceof Error ? error.message : 'unknown_error' };
  }
}

/**
 * Whether the signed-in associate already has a `password` credential
 * linked — Firebase Auth's `providerData` carries one entry per linked
 * provider. Used by the Perfil "linha de senha" to decide between
 * "Definir uma senha" (active) and "Alterar senha" (travado, fora desta
 * versão).
 *
 * Known imprecision (reported in this agent's final report,
 * SENHA_RECENT_LOGIN/NOTAS): Firebase also reports `providerId: 'password'`
 * for an account that only ever signed in via e-mail link, even though no
 * password was ever set. That associate sees the travado state here even
 * though `setPasswordForCurrentUser` would be the right action for them —
 * a limitation of what the client SDK exposes, not of this function.
 * `false` when nobody is signed in.
 */
export function currentUserHasPassword(): boolean {
  const user = getAuth(getApp()).currentUser;
  if (!user) return false;
  return user.providerData.some((info) => info.providerId === 'password');
}
