import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
  } catch {
    // No native push capability (dev client without credentials, simulator,
    // etc. — task 9.1 provisions the real APNs/FCM credentials separately).
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
