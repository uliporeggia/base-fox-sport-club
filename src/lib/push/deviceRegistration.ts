import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { registerDevice, removeDevice } from '../../data/devicesRepository';
import type { DevicePlatform } from '../../data/types';
import { getStoredDeviceToken, setStoredDeviceToken, clearStoredDeviceToken } from './storage';

function currentPlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * Pulls this device's Expo push token and upserts it into `devices`
 * (task 9.6), caching the token locally so it can be removed again later
 * (logout, task 9.6; the Perfil toggle, task 9.4a) without a native round
 * trip. Returns `null` if the token can't be obtained (e.g. no OS permission
 * yet, or running where push isn't supported) — callers treat that as "push
 * stays off for now", never as a crash.
 */
export async function registerCurrentDevice(associateId: string): Promise<string | null> {
  try {
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!token) return null;
    await registerDevice(associateId, token, currentPlatform());
    await setStoredDeviceToken(token);
    return token;
  } catch (error) {
    // Falhar aqui é legítimo e não pode derrubar o RSVP: acontece em
    // simulador, em dev client sem credenciais, ou sem rede no instante da
    // chamada. O que NÃO é aceitável é falhar em silêncio — foi assim que o
    // push ficou quebrado sem ninguém notar até alguém olhar `devices` no
    // Firestore e ver a coleção vazia. Quem engole um erro deve ao menos
    // contar que engoliu.
    Sentry.captureException(error, { tags: { source: 'push.registerCurrentDevice' } });
    return null;
  }
}

/**
 * Removes this device's token from `devices` — called on logout (task 9.6)
 * and when the Perfil notifications toggle is switched off (task 9.4a).
 * Never touches `notifications`: the inbox stays intact either way.
 */
export async function clearDeviceRegistration(): Promise<void> {
  const token = await getStoredDeviceToken();
  if (token) {
    await removeDevice(token);
  }
  await clearStoredDeviceToken();
}
