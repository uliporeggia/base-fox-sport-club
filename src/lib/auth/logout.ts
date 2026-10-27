import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { PENDING_EMAIL_KEY } from './emailLink';

/**
 * Task 8.8 — encerra a sessão e limpa os dados locais de autenticação.
 * Does NOT touch the device's push-token registration (`devices`
 * collection) or the membership "last known value" cache — those are
 * owned by other modules (push, membership gate) and cleared by their own
 * logout hooks. Never throws: a failed AsyncStorage cleanup should not
 * block the associate from actually signing out.
 */
export async function signOutCurrentUser(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_EMAIL_KEY).catch(() => undefined);
  await signOut(getAuth(getApp()));
}
